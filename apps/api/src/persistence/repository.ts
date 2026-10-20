import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

const caseStatuses = ["Pending", "Reviewed", "Escalated"] as const;
type CaseStatus = (typeof caseStatuses)[number];

export interface NewRiskFlag {
  id: string;
  category: string;
  explanation: string;
  generatedAt: string;
  ruleParametersJson?: string | null;
  supportingTransactionIds: string[];
}

export interface RiskFlagCandidate {
  ruleId: string;
  category: string;
  explanation: string;
  generatedAt: string;
  ruleParametersJson?: string | null;
  supportingTransactionIds: string[];
}

export interface PersistedSupportingTransaction {
  id: string;
  sourceTransactionId: string | null;
}

export interface PersistedRiskFlag {
  id: string;
  category: string | null;
  explanation: string | null;
  generatedAt: string | null;
  ruleParametersJson: string | null;
  supportingTransactions: PersistedSupportingTransaction[];
}

export interface PersistedAuditEvent {
  id: string;
  occurredAt: string;
  action: string;
  actorLabel: string;
  previousStatus: CaseStatus | null;
  newStatus: CaseStatus | null;
}

export interface PersistedCase {
  id: string;
  flagId: string;
  status: CaseStatus;
  createdAt: string | null;
  updatedAt: string | null;
  auditEvents: PersistedAuditEvent[];
}

export interface AcceptedImportInput {
  acceptedAt: string;
  transactions: Array<{
    sourceTransactionId: string | null;
    sourceTimestampText: string;
    occurredAt: string;
    senderId: string;
    receiverId: string;
    amountDecimal: string;
    currency: string;
  }>;
}

export interface AcceptedImportResult {
  importId: string;
  acceptedTransactionCount: number;
  generatedFlags: PersistedRiskFlag[];
}

export interface AnalysisTransaction {
  id: string;
  occurredAt: string | null;
  senderId: string | null;
  receiverId: string | null;
  currency: string | null;
}

export type AcceptedImportAnalyzer = (
  transactions: AnalysisTransaction[],
  generatedAt: string,
) => RiskFlagCandidate[];

interface AnalysisTransactionRow {
  id: string;
  occurred_at: string | null;
  sender_id: string | null;
  receiver_id: string | null;
  currency: string | null;
  source_transaction_id: string | null;
}

interface RiskFlagRow {
  flag_id: string | null;
  category: string | null;
  explanation: string | null;
  generated_at: string | null;
  rule_parameters_json: string | null;
  transaction_id: string | null;
  source_transaction_id: string | null;
}

interface CaseRow {
  case_id: string | null;
  flag_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  event_id: string | null;
  event_occurred_at: string | null;
  action: string | null;
  actor_label: string | null;
  previous_status: string | null;
  new_status: string | null;
}

function requireText(value: string | null, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Persisted ${field} is missing or invalid.`);
  }
  return value;
}

function parseCaseStatus(value: string | null, field: string): CaseStatus {
  if (!caseStatuses.includes(value as CaseStatus)) {
    throw new Error(`Persisted ${field} is not a supported case status.`);
  }
  return value as CaseStatus;
}

export function persistRiskFlag(
  database: Database.Database,
  flag: NewRiskFlag,
): void {
  if (flag.supportingTransactionIds.length === 0) {
    throw new Error("A risk flag must include at least one supporting transaction.");
  }

  const save = database.transaction(() => {
    database
      .prepare(
        `INSERT INTO risk_flag
          (id, category, explanation, generated_at, rule_parameters_json)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        flag.id,
        flag.category,
        flag.explanation,
        flag.generatedAt,
        flag.ruleParametersJson ?? null,
      );

    const insertEvidence = database.prepare(
      `INSERT INTO flag_evidence (flag_id, transaction_id)
       VALUES (?, ?)`,
    );
    for (const transactionId of flag.supportingTransactionIds) {
      insertEvidence.run(flag.id, transactionId);
    }
  });

  save();
}

export function persistAcceptedImport(
  database: Database.Database,
  input: AcceptedImportInput,
  analyze?: AcceptedImportAnalyzer,
): AcceptedImportResult {
  const importId = randomUUID();
  const transactionRows = input.transactions.map((transaction) => ({
    id: randomUUID(),
    ...transaction,
  }));
  const generatedFlags: PersistedRiskFlag[] = [];

  const save = database.transaction(() => {
    database
      .prepare(
        `INSERT INTO accepted_import (id, accepted_at, accepted_row_count)
         VALUES (?, ?, ?)`,
      )
      .run(importId, input.acceptedAt, transactionRows.length);

    const insertTransaction = database.prepare(
      `INSERT INTO "transaction"
        (id, import_id, source_transaction_id, source_timestamp_text,
         occurred_at, sender_id, receiver_id, amount_decimal, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const transaction of transactionRows) {
      insertTransaction.run(
        transaction.id,
        importId,
        transaction.sourceTransactionId,
        transaction.sourceTimestampText,
        transaction.occurredAt,
        transaction.senderId,
        transaction.receiverId,
        transaction.amountDecimal,
        transaction.currency,
      );
    }

    if (!analyze) {
      return;
    }

    const analysisRows = database
      .prepare(
        `SELECT id, occurred_at, sender_id, receiver_id, currency,
                source_transaction_id
         FROM "transaction"`,
      )
      .all() as AnalysisTransactionRow[];
    const transactionById = new Map(
      analysisRows.map((row) => [
        row.id,
        {
          id: row.id,
          sourceTransactionId: row.source_transaction_id,
        },
      ]),
    );
    const candidates = analyze(
      analysisRows.map((row) => ({
        id: row.id,
        occurredAt: row.occurred_at,
        senderId: row.sender_id,
        receiverId: row.receiver_id,
        currency: row.currency,
      })),
      input.acceptedAt,
    );
    const existingEvidenceKeys = new Set<string>();
    const existingRows = database
      .prepare(
        `SELECT f.id AS flag_id, f.category, f.rule_parameters_json,
                e.transaction_id
         FROM risk_flag AS f
         LEFT JOIN flag_evidence AS e ON e.flag_id = f.id
         WHERE f.category IN ('rapid_fund_movement', 'repeated_transfers')`,
      )
      .all() as Array<{
        flag_id: string;
        category: string;
        rule_parameters_json: string | null;
        transaction_id: string | null;
      }>;
    const existingEvidenceByFlag = new Map<
      string,
      { ruleId: string; transactionIds: string[] }
    >();
    for (const row of existingRows) {
      let parameters: unknown;
      try {
        parameters = JSON.parse(row.rule_parameters_json ?? "null");
      } catch {
        throw new Error(
          `Persisted flag ${row.flag_id} has invalid rule parameters.`,
        );
      }
      const ruleId =
        typeof parameters === "object" &&
        parameters !== null &&
        !Array.isArray(parameters) &&
        "ruleId" in parameters &&
        typeof parameters.ruleId === "string"
          ? parameters.ruleId
          : row.category === "rapid_fund_movement"
            ? "rapid-fund-movement.v1"
            : "repeated-transfers.v1";
      const evidence = existingEvidenceByFlag.get(row.flag_id) ?? {
        ruleId,
        transactionIds: [],
      };
      if (row.transaction_id !== null) {
        evidence.transactionIds.push(row.transaction_id);
      }
      existingEvidenceByFlag.set(row.flag_id, evidence);
    }
    for (const evidence of existingEvidenceByFlag.values()) {
      if (evidence.transactionIds.length === 0) {
        throw new Error("A persisted detection flag has no evidence.");
      }
      existingEvidenceKeys.add(
        JSON.stringify([
          evidence.ruleId,
          [...evidence.transactionIds].sort(),
        ]),
      );
    }

    const insertFlag = database.prepare(
      `INSERT INTO risk_flag
        (id, category, explanation, generated_at, rule_parameters_json)
       VALUES (?, ?, ?, ?, ?)`,
    );
    const insertEvidence = database.prepare(
      `INSERT INTO flag_evidence (flag_id, transaction_id)
       VALUES (?, ?)`,
    );
    for (const candidate of candidates) {
      if (
        !(
          (candidate.ruleId === "rapid-fund-movement.v1" &&
            candidate.category === "rapid_fund_movement") ||
          (candidate.ruleId === "repeated-transfers.v1" &&
            candidate.category === "repeated_transfers")
        )
      ) {
        throw new Error(
          "The accepted-import analyzer returned an unsupported rule category.",
        );
      }
      let candidateParameters: unknown;
      try {
        candidateParameters = JSON.parse(
          candidate.ruleParametersJson ?? "null",
        );
      } catch {
        throw new Error("The generated risk flag has invalid rule parameters.");
      }
      if (
        typeof candidateParameters !== "object" ||
        candidateParameters === null ||
        Array.isArray(candidateParameters) ||
        !("ruleId" in candidateParameters) ||
        candidateParameters.ruleId !== candidate.ruleId
      ) {
        throw new Error(
          "The generated risk flag parameters do not match its rule identifier.",
        );
      }
      if (candidate.supportingTransactionIds.length === 0) {
        throw new Error("A generated risk flag must include supporting evidence.");
      }
      const evidenceIds = [...new Set(candidate.supportingTransactionIds)];
      if (evidenceIds.length !== candidate.supportingTransactionIds.length) {
        throw new Error("A generated risk flag contains duplicate evidence.");
      }
      const evidenceKey = JSON.stringify([
        candidate.ruleId,
        [...evidenceIds].sort(),
      ]);
      if (existingEvidenceKeys.has(evidenceKey)) {
        continue;
      }

      const flagId = randomUUID();
      insertFlag.run(
        flagId,
        candidate.category,
        candidate.explanation,
        candidate.generatedAt,
        candidate.ruleParametersJson ?? null,
      );
      for (const transactionId of evidenceIds) {
        if (!transactionById.has(transactionId)) {
          throw new Error(
            "A generated risk flag references a transaction that is not persisted.",
          );
        }
        insertEvidence.run(flagId, transactionId);
      }

      generatedFlags.push({
        id: flagId,
        category: candidate.category,
        explanation: candidate.explanation,
        generatedAt: candidate.generatedAt,
        ruleParametersJson: candidate.ruleParametersJson ?? null,
        supportingTransactions: evidenceIds.map((id) => {
          const transaction = transactionById.get(id);
          if (!transaction) {
            throw new Error("Generated flag evidence could not be resolved.");
          }
          return transaction;
        }),
      });
      existingEvidenceKeys.add(evidenceKey);
    }
  });

  save();
  return {
    importId,
    acceptedTransactionCount: transactionRows.length,
    generatedFlags,
  };
}

export function loadPersistedRiskFlags(
  database: Database.Database,
): PersistedRiskFlag[] {
  const load = database.transaction(() => {
    const rows = database
      .prepare(
        `SELECT
           f.id AS flag_id,
           f.category,
           f.explanation,
           f.generated_at,
           f.rule_parameters_json,
           t.id AS transaction_id,
           t.source_transaction_id
         FROM risk_flag AS f
         LEFT JOIN flag_evidence AS e ON e.flag_id = f.id
         LEFT JOIN "transaction" AS t ON t.id = e.transaction_id`,
      )
      .all() as RiskFlagRow[];

    const flags = new Map<string, PersistedRiskFlag>();
    for (const row of rows) {
      const flagId = requireText(row.flag_id, "risk flag ID");
      let flag = flags.get(flagId);
      if (!flag) {
        flag = {
          id: flagId,
          category: row.category,
          explanation: row.explanation,
          generatedAt: row.generated_at,
          ruleParametersJson: row.rule_parameters_json,
          supportingTransactions: [],
        };
        flags.set(flagId, flag);
      }

      if (row.transaction_id === null) {
        throw new Error(`Persisted risk flag ${flagId} has no supporting evidence.`);
      }
      flag.supportingTransactions.push({
        id: row.transaction_id,
        sourceTransactionId: row.source_transaction_id,
      });
    }

    return [...flags.values()];
  });

  return load.deferred();
}

export function loadPersistedCases(
  database: Database.Database,
): PersistedCase[] {
  const load = database.transaction(() => {
    const rows = database
      .prepare(
        `SELECT
           c.id AS case_id,
           c.flag_id,
           c.status,
           c.created_at,
           c.updated_at,
           a.id AS event_id,
           a.occurred_at AS event_occurred_at,
           a.action,
           a.actor_label,
           a.previous_status,
           a.new_status
         FROM case_record AS c
         LEFT JOIN audit_event AS a ON a.case_id = c.id`,
      )
      .all() as CaseRow[];

    const cases = new Map<string, PersistedCase>();
    for (const row of rows) {
      const caseId = requireText(row.case_id, "case ID");
      let persistedCase = cases.get(caseId);
      if (!persistedCase) {
        persistedCase = {
          id: caseId,
          flagId: requireText(row.flag_id, "case flag ID"),
          status: parseCaseStatus(row.status, "case status"),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          auditEvents: [],
        };
        cases.set(caseId, persistedCase);
      }

      if (row.event_id === null) {
        continue;
      }

      const previousStatus =
        row.previous_status === null
          ? null
          : parseCaseStatus(row.previous_status, "previous audit status");
      const newStatus =
        row.new_status === null
          ? null
          : parseCaseStatus(row.new_status, "new audit status");
      if ((previousStatus === null) !== (newStatus === null)) {
        throw new Error(
          `Persisted audit event ${row.event_id} has an incomplete status pair.`,
        );
      }
      if (
        previousStatus !== null &&
        newStatus !== null &&
        previousStatus === newStatus
      ) {
        throw new Error(
          `Persisted audit event ${row.event_id} does not represent a status change.`,
        );
      }

      persistedCase.auditEvents.push({
        id: row.event_id,
        occurredAt: requireText(row.event_occurred_at, "audit event timestamp"),
        action: requireText(row.action, "audit event action"),
        actorLabel: requireText(row.actor_label, "audit event actor label"),
        previousStatus,
        newStatus,
      });
    }

    return [...cases.values()];
  });

  return load.deferred();
}
