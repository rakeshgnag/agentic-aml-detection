import type { RiskFlagCandidate } from "../persistence/repository.js";
import type { DetectionTransaction } from "./rapid-fund-movement.js";

export interface RepeatedTransfersConfiguration {
  minimumTransfers: number;
  timeWindowHours: number;
}

export const repeatedTransfersPrototypeConfiguration = {
  minimumTransfers: 3,
  timeWindowHours: 24,
} satisfies RepeatedTransfersConfiguration;

const millisecondsPerHour = 60 * 60 * 1000;

interface TimestampedTransaction extends DetectionTransaction {
  currency: string | null;
  timestampMilliseconds: number;
}

function normalizeTransactions(
  transactions: Array<DetectionTransaction & { currency: string | null }>,
): TimestampedTransaction[] {
  const seenIds = new Set<string>();
  return transactions
    .map((transaction) => {
      if (
        !transaction.id.trim() ||
        seenIds.has(transaction.id) ||
        !transaction.occurredAt ||
        !transaction.senderId?.trim() ||
        !transaction.receiverId?.trim() ||
        !transaction.currency?.trim()
      ) {
        throw new Error(
          "Repeated-transfer analysis encountered missing or duplicate transaction data.",
        );
      }
      seenIds.add(transaction.id);

      const timestampMilliseconds = Date.parse(transaction.occurredAt);
      if (
        !Number.isFinite(timestampMilliseconds) ||
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
          transaction.occurredAt,
        ) ||
        new Date(timestampMilliseconds).toISOString() !== transaction.occurredAt
      ) {
        throw new Error(
          `Repeated-transfer analysis encountered an invalid timestamp for transaction ${transaction.id}.`,
        );
      }

      return { ...transaction, timestampMilliseconds };
    })
    .sort(
      (left, right) =>
        left.timestampMilliseconds - right.timestampMilliseconds ||
        left.id.localeCompare(right.id),
    );
}

export function detectRepeatedTransfers(
  transactions: Array<DetectionTransaction & { currency: string | null }>,
  generatedAt: string,
  configuration: RepeatedTransfersConfiguration =
    repeatedTransfersPrototypeConfiguration,
): RiskFlagCandidate[] {
  if (
    !Number.isSafeInteger(configuration.minimumTransfers) ||
    configuration.minimumTransfers < 2
  ) {
    throw new Error("Repeated-transfer minimum must be an integer of at least 2.");
  }
  if (
    !Number.isFinite(configuration.timeWindowHours) ||
    configuration.timeWindowHours <= 0
  ) {
    throw new Error("Repeated-transfer time window must be a positive number.");
  }

  const maximumWindowMilliseconds =
    configuration.timeWindowHours * millisecondsPerHour;
  const ordered = normalizeTransactions(transactions);
  const groups = new Map<string, TimestampedTransaction[]>();

  for (const transaction of ordered) {
    const groupKey = JSON.stringify([
      transaction.senderId,
      transaction.receiverId,
      transaction.currency,
    ]);
    const group = groups.get(groupKey) ?? [];
    group.push(transaction);
    groups.set(groupKey, group);
  }

  const flags: RiskFlagCandidate[] = [];
  const emittedEvidence = new Set<string>();
  for (const group of groups.values()) {
    for (let startIndex = 0; startIndex < group.length; startIndex += 1) {
      const first = group[startIndex]!;
      const evidence: TimestampedTransaction[] = [];
      for (let nextIndex = startIndex; nextIndex < group.length; nextIndex += 1) {
        const next = group[nextIndex]!;
        if (
          next.timestampMilliseconds - first.timestampMilliseconds >
          maximumWindowMilliseconds
        ) {
          break;
        }
        evidence.push(next);
      }

      if (evidence.length < configuration.minimumTransfers) {
        continue;
      }

      const transactionIds = evidence.map(({ id }) => id);
      const evidenceKey = JSON.stringify([...transactionIds].sort());
      if (emittedEvidence.has(evidenceKey)) {
        continue;
      }
      emittedEvidence.add(evidenceKey);

      flags.push({
        ruleId: "repeated-transfers.v1",
        category: "repeated_transfers",
        explanation:
          `${evidence.length} same-direction transfers between the same sender and receiver in the configured window have varying or repeated amounts and the same currency. This is an indicator for human review, not a conclusion.`,
        generatedAt,
        ruleParametersJson: JSON.stringify({
          ruleId: "repeated-transfers.v1",
          minimumTransfers: configuration.minimumTransfers,
          timeWindowHours: configuration.timeWindowHours,
          timeWindowBoundary: "inclusive",
          grouping: "sender_receiver_direction_and_exact_currency",
          amountConstraint: "none",
          currencyConstraint: "exact_match",
          analysisScope: "all_persisted_imports",
          windowGrouping: "sliding_window_anchored_at_each_transfer",
        }),
        supportingTransactionIds: transactionIds,
      });
    }
  }

  return flags.sort((left, right) =>
    left.supportingTransactionIds.join("\u0000").localeCompare(
      right.supportingTransactionIds.join("\u0000"),
    ),
  );
}
