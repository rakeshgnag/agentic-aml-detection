import type {
  AcceptedImportAnalyzer,
  RiskFlagCandidate,
} from "../persistence/repository.js";
import { detectRapidFundMovement } from "./rapid-fund-movement.js";
import { detectRepeatedTransfers } from "./repeated-transfers.js";

export const detectConfiguredRules: AcceptedImportAnalyzer = (
  transactions,
  generatedAt,
): RiskFlagCandidate[] => [
  ...detectRapidFundMovement(
    transactions.map(({ currency: _currency, ...transaction }) => transaction),
    generatedAt,
  ),
  ...detectRepeatedTransfers(transactions, generatedAt),
];
