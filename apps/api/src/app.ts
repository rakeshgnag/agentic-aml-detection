import express, {
  type ErrorRequestHandler,
  type Express,
} from "express";
import type Database from "better-sqlite3";
import { detectConfiguredRules } from "./detection/index.js";
import { parseAndValidateCsv, CsvValidationError } from "./imports/csv.js";
import { MultipartRequestError, readUploadedCsv } from "./imports/multipart.js";
import {
  loadPersistedCases,
  loadPersistedRiskFlags,
  persistAcceptedImport,
  type PersistedAuditEvent,
  type PersistedCase,
  type PersistedSupportingTransaction,
  type PersistedRiskFlag,
} from "./persistence/repository.js";

export interface PersistedReviewData {
  flags: PersistedRiskFlag[];
  cases: PersistedCase[];
}

export interface CaseDetailResponse {
  case: Omit<PersistedCase, "auditEvents">;
  flag: {
    id: string;
    category: string | null;
    explanation: string | null;
    generatedAt: string | null;
    ruleParameters: Record<string, unknown> | null;
    supportingTransactions: PersistedSupportingTransaction[];
  };
  auditEvents: PersistedAuditEvent[];
}

export function initializeApp(database: Database.Database): Express {
  const persistedReviewData: PersistedReviewData = {
    flags: loadPersistedRiskFlags(database),
    cases: loadPersistedCases(database),
  };
  const app = express();
  app.locals.persistedReviewData = persistedReviewData;

  app.post("/api/imports", async (request, response) => {
    try {
      const file = await readUploadedCsv(request);
      const transactions = parseAndValidateCsv(file);
      const acceptedAt = new Date().toISOString();
      const result = persistAcceptedImport(
        database,
        {
          acceptedAt,
          transactions,
        },
        detectConfiguredRules,
      );
      persistedReviewData.flags.push(...result.generatedFlags);

      response.status(201).json({
        importId: result.importId,
        acceptedTransactionCount: result.acceptedTransactionCount,
        generatedFlagCount: result.generatedFlags.length,
      });
    } catch (error) {
      if (error instanceof CsvValidationError) {
        response.status(error.statusCode).json({
          error: {
            code: error.statusCode === 413 ? "UPLOAD_LIMIT_EXCEEDED" : "INVALID_CSV",
            message: error.message,
            details: { rowErrors: error.rowErrors },
          },
        });
        return;
      }
      if (error instanceof MultipartRequestError) {
        response.status(error.statusCode).json({
          error: {
            code:
              error.statusCode === 413 ? "UPLOAD_LIMIT_EXCEEDED" : "INVALID_UPLOAD",
            message: error.message,
          },
        });
        return;
      }
      console.error(
        "CSV import failed:",
        error instanceof Error ? error.message : "Unknown persistence error",
      );
      response.status(500).json({
        error: {
          code: "IMPORT_FAILED",
          message: "The CSV could not be imported. No import was accepted.",
        },
      });
    }
  });

  app.get("/api/flags", (_request, response) => {
    try {
      const items = persistedReviewData.flags.map((flag) => {
        let ruleParameters: Record<string, unknown> | null = null;
        if (flag.ruleParametersJson !== null) {
          const parsed: unknown = JSON.parse(flag.ruleParametersJson);
          if (
            typeof parsed !== "object" ||
            parsed === null ||
            Array.isArray(parsed)
          ) {
            throw new Error("Stored rule parameters must be a JSON object.");
          }
          ruleParameters = parsed as Record<string, unknown>;
        }

        return {
          id: flag.id,
          category: flag.category,
          explanation: flag.explanation,
          generatedAt: flag.generatedAt,
          ruleParameters,
          supportingTransactions: flag.supportingTransactions.map(
            (transaction) => ({
              id: transaction.id,
              sourceTransactionId: transaction.sourceTransactionId,
            }),
          ),
        };
      });
      response.status(200).json({ items });
    } catch {
      console.error("Could not serialize persisted flag response.");
      response
        .status(500)
        .json({ error: "Persisted flag data could not be represented." });
    }
  });

  app.get("/api/cases/:caseId", (request, response) => {
    const persistedCase = persistedReviewData.cases.find(
      ({ id }) => id === request.params.caseId,
    );
    if (!persistedCase) {
      response.status(404).json({ error: "Case not found." });
      return;
    }

    const persistedFlag = persistedReviewData.flags.find(
      ({ id }) => id === persistedCase.flagId,
    );
    if (!persistedFlag || persistedFlag.supportingTransactions.length === 0) {
      console.error("Persisted case has no linked flag or supporting evidence.");
      response
        .status(500)
        .json({ error: "Persisted case data could not be represented." });
      return;
    }

    try {
      let ruleParameters: Record<string, unknown> | null = null;
      if (persistedFlag.ruleParametersJson !== null) {
        const parsed: unknown = JSON.parse(persistedFlag.ruleParametersJson);
        if (
          typeof parsed !== "object" ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          throw new Error("Stored rule parameters must be a JSON object.");
        }
        ruleParameters = parsed as Record<string, unknown>;
      }

      const { auditEvents, ...caseRecord } = persistedCase;
      const detail: CaseDetailResponse = {
        case: caseRecord,
        flag: {
          id: persistedFlag.id,
          category: persistedFlag.category,
          explanation: persistedFlag.explanation,
          generatedAt: persistedFlag.generatedAt,
          ruleParameters,
          supportingTransactions: persistedFlag.supportingTransactions,
        },
        auditEvents,
      };
      response.status(200).json(detail);
    } catch {
      console.error("Could not serialize persisted case detail response.");
      response
        .status(500)
        .json({ error: "Persisted case data could not be represented." });
    }
  });

  app.get("/api/health", (_request, response) => {
    response.status(200).json({ status: "healthy" });
  });

  app.use((_request, response) => {
    response.status(404).json({ error: "Not found" });
  });

  const handleUnexpectedError: ErrorRequestHandler = (
    error,
    _request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    console.error(
      "Unhandled request error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    response.status(500).json({ error: "An unexpected error occurred." });
  };

  app.use(handleUnexpectedError);
  return app;
}
