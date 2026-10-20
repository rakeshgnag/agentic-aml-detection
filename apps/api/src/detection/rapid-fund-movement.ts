import type { RiskFlagCandidate } from "../persistence/repository.js";

export interface DetectionTransaction {
  id: string;
  occurredAt: string | null;
  senderId: string | null;
  receiverId: string | null;
}

export interface RapidFundMovementConfiguration {
  maximumGapMinutes: number;
}

export const rapidFundMovementPrototypeConfiguration = {
  maximumGapMinutes: 30,
} satisfies RapidFundMovementConfiguration;

const millisecondsPerMinute = 60_000;

function normalizeTransactions(
  transactions: DetectionTransaction[],
): Array<DetectionTransaction & { timestampMilliseconds: number }> {
  const seenIds = new Set<string>();
  const normalized = transactions.map((transaction) => {
    if (
      !transaction.id.trim() ||
      seenIds.has(transaction.id) ||
      !transaction.occurredAt ||
      !transaction.senderId?.trim() ||
      !transaction.receiverId?.trim()
    ) {
      throw new Error(
        "Rapid movement analysis encountered missing or duplicate transaction data.",
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
        `Rapid movement analysis encountered an invalid timestamp for transaction ${transaction.id}.`,
      );
    }

    return { ...transaction, timestampMilliseconds };
  });

  return normalized.sort(
    (left, right) =>
      left.timestampMilliseconds - right.timestampMilliseconds ||
      left.id.localeCompare(right.id),
  );
}

export function detectRapidFundMovement(
  transactions: DetectionTransaction[],
  generatedAt: string,
  configuration: RapidFundMovementConfiguration =
    rapidFundMovementPrototypeConfiguration,
): RiskFlagCandidate[] {
  if (
    !Number.isFinite(configuration.maximumGapMinutes) ||
    configuration.maximumGapMinutes <= 0
  ) {
    throw new Error("Rapid movement maximum gap must be a positive number.");
  }

  const maximumGapMilliseconds =
    configuration.maximumGapMinutes * millisecondsPerMinute;
  const ordered = normalizeTransactions(transactions);
  const flags: RiskFlagCandidate[] = [];

  for (let firstIndex = 0; firstIndex < ordered.length; firstIndex += 1) {
    const first = ordered[firstIndex]!;
    for (
      let nextIndex = firstIndex + 1;
      nextIndex < ordered.length;
      nextIndex += 1
    ) {
      const next = ordered[nextIndex]!;
      const elapsedMilliseconds =
        next.timestampMilliseconds - first.timestampMilliseconds;
      if (elapsedMilliseconds > maximumGapMilliseconds) {
        break;
      }
      if (first.receiverId !== next.senderId) {
        continue;
      }

      flags.push({
        ruleId: "rapid-fund-movement.v1",
        category: "rapid_fund_movement",
        explanation:
          "Two transactions show funds moving through a linked account within the configured time window. This is an indicator for human review, not a conclusion.",
        generatedAt,
        ruleParametersJson: JSON.stringify({
          ruleId: "rapid-fund-movement.v1",
          maximumGapMinutes: configuration.maximumGapMinutes,
          timeWindowBoundary: "inclusive",
          minimumTransfers: 2,
          linkage: "previous.receiverId === next.senderId",
          amountConstraint: "none",
          currencyConstraint: "none",
          analysisScope: "all_persisted_imports",
        }),
        supportingTransactionIds: [first.id, next.id],
      });
    }
  }

  return flags;
}
