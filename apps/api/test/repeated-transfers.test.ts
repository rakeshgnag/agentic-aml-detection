import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { detectRepeatedTransfers } from "../src/detection/repeated-transfers.js";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import {
  loadPersistedRiskFlags,
  persistAcceptedImport,
  type AcceptedImportInput,
} from "../src/persistence/repository.js";

const generatedAt = "2026-10-21T00:00:00.000Z";
const hour = 60 * 60 * 1000;

function transaction(
  id: string,
  occurredAt: string,
  senderId = "sender-a",
  receiverId = "receiver-b",
  currency = "USD",
) {
  return { id, occurredAt, senderId, receiverId, currency };
}

function acceptedImport(
  transactions: Array<{
    occurredAt: string;
    senderId: string;
    receiverId: string;
    currency?: string;
    amountDecimal?: string;
  }>,
): AcceptedImportInput {
  return {
    acceptedAt: generatedAt,
    transactions: transactions.map((item, index) => ({
      sourceTransactionId: `synthetic-${index}`,
      sourceTimestampText: item.occurredAt,
      occurredAt: item.occurredAt,
      senderId: item.senderId,
      receiverId: item.receiverId,
      amountDecimal: item.amountDecimal ?? `${index + 1}.00`,
      currency: item.currency ?? "USD",
    })),
  };
}

function withDatabase(
  verify: (database: ReturnType<typeof openDatabase>) => void,
): void {
  const directory = mkdtempSync(join(tmpdir(), "aml-repeated-transfers-"));
  const database = openDatabase(join(directory, "review.sqlite"));
  migrateDatabase(database);
  try {
    verify(database);
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("repeated transfers flags same-direction records and reports rule parameters", () => {
  const flags = detectRepeatedTransfers(
    [
      transaction("tx-3", "2026-10-20T10:20:00.000Z"),
      transaction("tx-1", "2026-10-20T10:00:00.000Z"),
      transaction("tx-2", "2026-10-20T10:10:00.000Z"),
    ],
    generatedAt,
  );

  assert.equal(flags.length, 1);
  assert.equal(flags[0]?.ruleId, "repeated-transfers.v1");
  assert.equal(flags[0]?.category, "repeated_transfers");
  assert.match(flags[0]!.explanation, /indicator for human review/);
  assert.deepEqual(flags[0]?.supportingTransactionIds, ["tx-1", "tx-2", "tx-3"]);
  assert.deepEqual(JSON.parse(flags[0]!.ruleParametersJson ?? "{}"), {
    ruleId: "repeated-transfers.v1",
    minimumTransfers: 3,
    timeWindowHours: 24,
    timeWindowBoundary: "inclusive",
    grouping: "sender_receiver_direction_and_exact_currency",
    amountConstraint: "none",
    currencyConstraint: "exact_match",
    analysisScope: "all_persisted_imports",
    windowGrouping: "sliding_window_anchored_at_each_transfer",
  });
});

test("two matching transfers are below the minimum and three qualify", () => {
  const two = [
    transaction("tx-1", "2026-10-20T10:00:00.000Z"),
    transaction("tx-2", "2026-10-20T10:01:00.000Z"),
  ];
  assert.deepEqual(detectRepeatedTransfers(two, generatedAt), []);
  assert.equal(
    detectRepeatedTransfers(
      [...two, transaction("tx-3", "2026-10-20T10:02:00.000Z")],
      generatedAt,
    ).length,
    1,
  );
});

test("reverse-direction transfers do not contribute to the same group", () => {
  const flags = detectRepeatedTransfers(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z"),
      transaction("tx-2", "2026-10-20T10:01:00.000Z", "receiver-b", "sender-a"),
      transaction("tx-3", "2026-10-20T10:02:00.000Z"),
    ],
    generatedAt,
  );

  assert.deepEqual(flags, []);
});

test("an unlinked benign lookalike does not qualify", () => {
  const flags = detectRepeatedTransfers(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "sender-a", "receiver-b"),
      transaction("tx-2", "2026-10-20T10:01:00.000Z", "sender-a", "receiver-c"),
      transaction("tx-3", "2026-10-20T10:02:00.000Z", "sender-x", "receiver-b"),
    ],
    generatedAt,
  );

  assert.deepEqual(flags, []);
});

test("repeated-transfer window is inclusive at 24 hours and rejects beyond it", () => {
  const start = Date.parse("2026-10-20T10:00:00.000Z");
  const qualifyingTimes = [
    start,
    start + 12 * hour,
    start + 24 * hour,
  ];
  assert.equal(
    detectRepeatedTransfers(
      qualifyingTimes.map((timestamp, index) =>
        transaction(`tx-${index + 1}`, new Date(timestamp).toISOString()),
      ),
      generatedAt,
    ).length,
    1,
  );

  const outsideTimes = [
    start,
    start + 12 * hour,
    start + 24 * hour + 1,
  ];
  assert.deepEqual(
    detectRepeatedTransfers(
      outsideTimes.map((timestamp, index) =>
        transaction(`tx-${index + 1}`, new Date(timestamp).toISOString()),
      ),
      generatedAt,
    ),
    [],
  );
});

test("amounts may vary, currency must match, and no currency conversion occurs", () => {
  const sameCurrency = [
    transaction("tx-1", "2026-10-20T10:00:00.000Z", "sender-a", "receiver-b", "USD"),
    transaction("tx-2", "2026-10-20T10:01:00.000Z", "sender-a", "receiver-b", "USD"),
    transaction("tx-3", "2026-10-20T10:02:00.000Z", "sender-a", "receiver-b", "USD"),
  ];
  assert.equal(detectRepeatedTransfers(sameCurrency, generatedAt).length, 1);

  const mixedCurrency = [
    transaction("tx-1", "2026-10-20T10:00:00.000Z", "sender-a", "receiver-b", "USD"),
    transaction("tx-2", "2026-10-20T10:01:00.000Z", "sender-a", "receiver-b", "EUR"),
    transaction("tx-3", "2026-10-20T10:02:00.000Z", "sender-a", "receiver-b", "USD"),
  ];
  assert.deepEqual(detectRepeatedTransfers(mixedCurrency, generatedAt), []);
});

test("sliding windows group qualifying transactions and deduplicate identical evidence", () => {
  const flags = detectRepeatedTransfers(
    [
      transaction("tx-1", "2026-10-20T00:00:00.000Z"),
      transaction("tx-2", "2026-10-20T01:00:00.000Z"),
      transaction("tx-3", "2026-10-20T02:00:00.000Z"),
      transaction("tx-4", "2026-10-20T03:00:00.000Z"),
    ],
    generatedAt,
  );

  assert.deepEqual(
    flags.map(({ supportingTransactionIds }) => supportingTransactionIds),
    [
      ["tx-1", "tx-2", "tx-3", "tx-4"],
      ["tx-2", "tx-3", "tx-4"],
    ],
  );
});

test("repeated-transfer window and minimum count can be configured", () => {
  const flags = detectRepeatedTransfers(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z"),
      transaction("tx-2", "2026-10-20T10:01:00.000Z"),
    ],
    generatedAt,
    { minimumTransfers: 2, timeWindowHours: 1 },
  );
  assert.equal(flags.length, 1);
  assert.throws(
    () =>
      detectRepeatedTransfers([], generatedAt, {
        minimumTransfers: 1,
        timeWindowHours: 1,
      }),
    /minimum must be an integer of at least 2/,
  );
});

test("repeated-transfer analysis rejects missing and invalid transaction data", () => {
  assert.throws(
    () =>
      detectRepeatedTransfers(
        [
          transaction("tx-1", "2026-10-20T10:00:00.000Z"),
          transaction("tx-2", "2026-10-20T10:01:00.000Z"),
          transaction("tx-3", "2026-10-20T10:02:00.000Z", "sender-a", "receiver-b", ""),
        ],
        generatedAt,
      ),
    /missing or duplicate transaction data/,
  );
  assert.throws(
    () =>
      detectRepeatedTransfers(
        [
          transaction("tx-1", "not-a-timestamp"),
          transaction("tx-2", "2026-10-20T10:01:00.000Z"),
          transaction("tx-3", "2026-10-20T10:02:00.000Z"),
        ],
        generatedAt,
      ),
    /invalid timestamp/,
  );
});

test("repeated transfers span imports, persist evidence, and remain idempotent", () => {
  withDatabase((database) => {
    const first = persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T10:00:00.000Z",
          senderId: "sender-a",
          receiverId: "receiver-b",
          amountDecimal: "1.00",
        },
        {
          occurredAt: "2026-10-20T10:10:00.000Z",
          senderId: "sender-a",
          receiverId: "receiver-b",
          amountDecimal: "20.00",
        },
      ]),
      (transactions, timestamp) => [
        ...detectRepeatedTransfers(transactions, timestamp),
      ],
    );
    assert.equal(first.generatedFlags.length, 0);

    const second = persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T10:20:00.000Z",
          senderId: "sender-a",
          receiverId: "receiver-b",
          amountDecimal: "300.00",
        },
      ]),
      (transactions, timestamp) => [
        ...detectRepeatedTransfers(transactions, timestamp),
      ],
    );
    assert.equal(second.generatedFlags.length, 1);
    assert.equal(second.generatedFlags[0]?.supportingTransactions.length, 3);
    assert.equal(loadPersistedRiskFlags(database).length, 1);

    persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T11:00:00.000Z",
          senderId: "unrelated",
          receiverId: "accounts",
        },
      ]),
      (transactions, timestamp) => [
        ...detectRepeatedTransfers(transactions, timestamp),
      ],
    );
    assert.equal(loadPersistedRiskFlags(database).length, 1);
  });
});
