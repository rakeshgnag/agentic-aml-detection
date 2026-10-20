import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { detectRapidFundMovement } from "../src/detection/rapid-fund-movement.js";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import {
  loadPersistedRiskFlags,
  persistAcceptedImport,
  type AcceptedImportInput,
} from "../src/persistence/repository.js";

const generatedAt = "2026-10-21T00:00:00.000Z";

function transaction(
  id: string,
  occurredAt: string,
  senderId = "account-a",
  receiverId = "account-b",
  currency = "SYN",
) {
  return { id, occurredAt, senderId, receiverId, currency };
}

function acceptedImport(
  transactions: Array<{
    occurredAt: string;
    senderId: string;
    receiverId: string;
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
      amountDecimal: "100.00",
      currency: "SYN",
    })),
  };
}

function withDatabase(
  verify: (database: ReturnType<typeof openDatabase>) => void,
): void {
  const directory = mkdtempSync(join(tmpdir(), "aml-rapid-movement-"));
  const database = openDatabase(join(directory, "review.sqlite"));
  migrateDatabase(database);
  try {
    verify(database);
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("rapid movement flags linked transactions with human-review explanation and parameters", () => {
  const flags = detectRapidFundMovement(
    [
      transaction("tx-2", "2026-10-20T10:20:00.000Z", "account-b", "account-c"),
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "account-a", "account-b"),
    ],
    generatedAt,
  );

  assert.equal(flags.length, 1);
  assert.equal(flags[0]?.category, "rapid_fund_movement");
  assert.match(flags[0]!.explanation, /indicator for human review/);
  assert.deepEqual(flags[0]?.supportingTransactionIds, ["tx-1", "tx-2"]);
  assert.deepEqual(JSON.parse(flags[0]!.ruleParametersJson ?? "{}"), {
    ruleId: "rapid-fund-movement.v1",
    maximumGapMinutes: 30,
    timeWindowBoundary: "inclusive",
    minimumTransfers: 2,
    linkage: "previous.receiverId === next.senderId",
    amountConstraint: "none",
    currencyConstraint: "none",
    analysisScope: "all_persisted_imports",
  });
});

test("rapid movement does not flag an unlinked benign lookalike", () => {
  const flags = detectRapidFundMovement(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "account-a", "account-b"),
      transaction("tx-2", "2026-10-20T10:05:00.000Z", "account-c", "account-d"),
    ],
    generatedAt,
  );

  assert.deepEqual(flags, []);
});

test("rapid movement does not flag a linked transfer beyond the time window", () => {
  const flags = detectRapidFundMovement(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "account-a", "account-b"),
      transaction("tx-2", "2026-10-20T10:30:00.001Z", "account-b", "account-c"),
    ],
    generatedAt,
  );

  assert.deepEqual(flags, []);
});

test("rapid movement accepts just-under and exactly-at 30-minute gaps only", () => {
  const base = Date.parse("2026-10-20T10:00:00.000Z");
  const cases = [
    { gap: 29 * 60_000 + 59_999, expected: 1 },
    { gap: 30 * 60_000, expected: 1 },
    { gap: 30 * 60_000 + 1, expected: 0 },
  ];

  for (const { gap, expected } of cases) {
    const flags = detectRapidFundMovement(
      [
        transaction("tx-1", new Date(base).toISOString(), "account-a", "account-b"),
        transaction(
          "tx-2",
          new Date(base + gap).toISOString(),
          "account-b",
          "account-c",
        ),
      ],
      generatedAt,
    );
    assert.equal(flags.length, expected, `gap ${gap}ms`);
  }
});

test("rapid movement window can be configured without changing rule logic", () => {
  const flags = detectRapidFundMovement(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "account-a", "account-b"),
      transaction("tx-2", "2026-10-20T10:15:00.000Z", "account-b", "account-c"),
    ],
    generatedAt,
    { maximumGapMinutes: 10 },
  );

  assert.deepEqual(flags, []);
});

test("rapid movement evaluates each consecutive linked pair in a longer chain", () => {
  const flags = detectRapidFundMovement(
    [
      transaction("tx-1", "2026-10-20T10:00:00.000Z", "account-a", "account-b"),
      transaction("tx-2", "2026-10-20T10:30:00.000Z", "account-b", "account-c"),
      transaction("tx-3", "2026-10-20T11:00:00.000Z", "account-c", "account-d"),
    ],
    generatedAt,
  );

  assert.deepEqual(
    flags.map(({ supportingTransactionIds }) => supportingTransactionIds),
    [
      ["tx-1", "tx-2"],
      ["tx-2", "tx-3"],
    ],
  );
});

test("rapid movement rejects missing or invalid transaction data", () => {
  assert.throws(
    () =>
      detectRapidFundMovement(
        [transaction("tx-1", "2026-10-20T10:00:00.000Z", "", "account-b")],
        generatedAt,
      ),
    /missing or duplicate transaction data/,
  );
  assert.throws(
    () =>
      detectRapidFundMovement(
        [transaction("tx-1", "not-a-timestamp")],
        generatedAt,
      ),
    /invalid timestamp/,
  );
  assert.throws(
    () =>
      detectRapidFundMovement(
        [
          transaction("tx-1", "2026-10-20T10:00:00.000Z"),
          transaction("tx-1", "2026-10-20T10:01:00.000Z"),
        ],
        generatedAt,
      ),
    /missing or duplicate transaction data/,
  );
});

test("rapid movement persists evidence atomically across imports and repeat runs are idempotent", () => {
  withDatabase((database) => {
    const first = persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T10:00:00.000Z",
          senderId: "account-a",
          receiverId: "account-b",
        },
      ]),
      detectRapidFundMovement,
    );
    assert.equal(first.generatedFlags.length, 0);

    const second = persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T10:20:00.000Z",
          senderId: "account-b",
          receiverId: "account-c",
        },
      ]),
      detectRapidFundMovement,
    );
    assert.equal(second.generatedFlags.length, 1);
    assert.equal(second.generatedFlags[0]?.supportingTransactions.length, 2);
    assert.equal(loadPersistedRiskFlags(database).length, 1);

    persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T12:00:00.000Z",
          senderId: "account-x",
          receiverId: "account-y",
        },
      ]),
      detectRapidFundMovement,
    );
    assert.equal(loadPersistedRiskFlags(database).length, 1);
    assert.equal(
      (
        database
          .prepare("SELECT COUNT(*) AS count FROM risk_flag")
          .get() as { count: number }
      ).count,
      1,
    );
  });
});

test("rapid movement analysis failure rolls back the accepted import", () => {
  withDatabase((database) => {
    assert.throws(() =>
      persistAcceptedImport(
        database,
        acceptedImport([
          {
            occurredAt: "2026-10-20T10:00:00.000Z",
            senderId: "account-a",
            receiverId: "account-b",
          },
        ]),
        () => {
          throw new Error("synthetic analysis failure");
        },
      ),
    );
    assert.equal(
      (
        database
          .prepare("SELECT COUNT(*) AS count FROM accepted_import")
          .get() as { count: number }
      ).count,
      0,
    );
    assert.equal(
      (
        database
          .prepare('SELECT COUNT(*) AS count FROM "transaction"')
          .get() as { count: number }
      ).count,
      0,
    );
  });
});

test("persisted rapid movement flags and supporting evidence load after reopen", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-rapid-reopen-"));
  const databasePath = join(directory, "review.sqlite");
  let database = openDatabase(databasePath);
  try {
    migrateDatabase(database);
    persistAcceptedImport(
      database,
      acceptedImport([
        {
          occurredAt: "2026-10-20T10:00:00.000Z",
          senderId: "account-a",
          receiverId: "account-b",
        },
        {
          occurredAt: "2026-10-20T10:20:00.000Z",
          senderId: "account-b",
          receiverId: "account-c",
        },
      ]),
      detectRapidFundMovement,
    );
    database.close();

    database = openDatabase(databasePath);
    migrateDatabase(database);
    const [flag] = loadPersistedRiskFlags(database);
    assert.equal(flag?.category, "rapid_fund_movement");
    assert.equal(flag?.supportingTransactions.length, 2);
    assert.equal(
      JSON.parse(flag?.ruleParametersJson ?? "{}").ruleId,
      "rapid-fund-movement.v1",
    );
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
