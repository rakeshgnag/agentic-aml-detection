import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import {
  loadPersistedCases,
  loadPersistedRiskFlags,
  persistRiskFlag,
} from "../src/persistence/repository.js";

test("persists flags atomically and loads flags, evidence, cases, and audit after reopen", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-repository-"));
  const databasePath = join(directory, "review.sqlite");

  try {
    let database = openDatabase(databasePath);
    migrateDatabase(database);
    database
      .prepare(
        "INSERT INTO accepted_import (id, accepted_at, accepted_row_count) VALUES (?, ?, ?)",
      )
      .run("import-synthetic-1", "2026-01-01T00:00:00Z", 2);
    database
      .prepare(
        `INSERT INTO "transaction"
          (id, import_id, source_transaction_id, source_timestamp_text)
         VALUES (?, ?, ?, ?), (?, ?, ?, ?)`,
      )
      .run(
        "transaction-synthetic-1",
        "import-synthetic-1",
        "source-1",
        "synthetic-time-1",
        "transaction-synthetic-2",
        "import-synthetic-1",
        null,
        "synthetic-time-2",
      );

    persistRiskFlag(database, {
      id: "flag-synthetic-1",
      category: "rapid_fund_movement",
      explanation: "Synthetic test explanation.",
      generatedAt: "2026-01-01T00:01:00Z",
      supportingTransactionIds: [
        "transaction-synthetic-1",
        "transaction-synthetic-2",
      ],
    });
    persistRiskFlag(database, {
      id: "flag-synthetic-2",
      category: "repeated_transfers",
      explanation: "Synthetic no-audit case test.",
      generatedAt: "2026-01-01T00:01:30Z",
      supportingTransactionIds: ["transaction-synthetic-1"],
    });

    assert.throws(
      () =>
        persistRiskFlag(database, {
          id: "flag-rollback-test",
          category: "repeated_transfers",
          explanation: "Synthetic rollback test.",
          generatedAt: "2026-01-01T00:02:00Z",
          supportingTransactionIds: [
            "transaction-synthetic-1",
            "missing-transaction",
          ],
        }),
      /FOREIGN KEY constraint failed/,
    );
    assert.equal(
      database
        .prepare("SELECT id FROM risk_flag WHERE id = ?")
        .get("flag-rollback-test"),
      undefined,
    );
    assert.throws(
      () =>
        persistRiskFlag(database, {
          id: "flag-no-evidence",
          category: "circular_flows",
          explanation: "Synthetic evidence validation test.",
          generatedAt: "2026-01-01T00:03:00Z",
          supportingTransactionIds: [],
        }),
      /at least one supporting transaction/,
    );

    database
      .prepare(
        `INSERT INTO case_record (id, flag_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        "case-synthetic-1",
        "flag-synthetic-1",
        "Pending",
        "2026-01-01T00:04:00Z",
        "2026-01-01T00:04:00Z",
      );
    database
      .prepare(
        `INSERT INTO audit_event
          (id, case_id, occurred_at, action, actor_label, previous_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "event-synthetic-1",
        "case-synthetic-1",
        "2026-01-01T00:05:00Z",
        "status_change",
        "local-reviewer",
        "Pending",
        "Reviewed",
      );
    database
      .prepare(
        `INSERT INTO case_record (id, flag_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        "case-synthetic-2",
        "flag-synthetic-2",
        "Escalated",
        "2026-01-01T00:06:00Z",
        "2026-01-01T00:06:00Z",
      );
    database.close();

    database = openDatabase(databasePath);
    migrateDatabase(database);
    try {
      const persistedFlag = loadPersistedRiskFlags(database).find(
        ({ id }) => id === "flag-synthetic-1",
      );
      assert.deepEqual(persistedFlag, {
        id: "flag-synthetic-1",
        category: "rapid_fund_movement",
        explanation: "Synthetic test explanation.",
        generatedAt: "2026-01-01T00:01:00Z",
        ruleParametersJson: null,
        supportingTransactions: [
          {
            id: "transaction-synthetic-1",
            sourceTransactionId: "source-1",
          },
          {
            id: "transaction-synthetic-2",
            sourceTransactionId: null,
          },
        ],
      });
      const persistedCases = loadPersistedCases(database);
      assert.deepEqual(
        persistedCases.find(({ id }) => id === "case-synthetic-1"),
        {
          id: "case-synthetic-1",
          flagId: "flag-synthetic-1",
          status: "Pending",
          createdAt: "2026-01-01T00:04:00Z",
          updatedAt: "2026-01-01T00:04:00Z",
          auditEvents: [
            {
              id: "event-synthetic-1",
              occurredAt: "2026-01-01T00:05:00Z",
              action: "status_change",
              actorLabel: "local-reviewer",
              previousStatus: "Pending",
              newStatus: "Reviewed",
            },
          ],
        },
      );
      assert.deepEqual(
        persistedCases.find(({ id }) => id === "case-synthetic-2"),
        {
          id: "case-synthetic-2",
          flagId: "flag-synthetic-2",
          status: "Escalated",
          createdAt: "2026-01-01T00:06:00Z",
          updatedAt: "2026-01-01T00:06:00Z",
          auditEvents: [],
        },
      );
    } finally {
      database.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("rejects a second case for the same flag", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-case-constraint-"));
  const database = openDatabase(join(directory, "review.sqlite"));

  try {
    migrateDatabase(database);
    database
      .prepare(
        "INSERT INTO accepted_import (id) VALUES (?)",
      )
      .run("import-synthetic-1");
    database
      .prepare(
        'INSERT INTO "transaction" (id, import_id) VALUES (?, ?)',
      )
      .run("transaction-synthetic-1", "import-synthetic-1");
    persistRiskFlag(database, {
      id: "flag-synthetic-1",
      category: "structuring_like",
      explanation: "Synthetic case constraint test.",
      generatedAt: "2026-01-01T00:01:00Z",
      supportingTransactionIds: ["transaction-synthetic-1"],
    });
    const insertCase = database.prepare(
      "INSERT INTO case_record (id, flag_id, status) VALUES (?, ?, ?)",
    );
    insertCase.run("case-synthetic-1", "flag-synthetic-1", "Pending");
    assert.throws(
      () => insertCase.run("case-synthetic-2", "flag-synthetic-1", "Reviewed"),
      /UNIQUE constraint failed/,
    );
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
