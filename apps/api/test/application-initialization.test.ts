import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { initializeApp } from "../src/app.js";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import { persistRiskFlag } from "../src/persistence/repository.js";

test("application initialization loads saved flags, evidence, cases, and audit after reopen", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-app-init-"));
  const databasePath = join(directory, "review.sqlite");

  try {
    const database = openDatabase(databasePath);
    migrateDatabase(database);
    database
      .prepare("INSERT INTO accepted_import (id) VALUES (?)")
      .run("import-synthetic");
    database
      .prepare(
        `INSERT INTO "transaction" (id, import_id, source_transaction_id)
         VALUES (?, ?, ?)`,
      )
      .run("transaction-synthetic", "import-synthetic", "source-synthetic");
    persistRiskFlag(database, {
      id: "flag-synthetic",
      category: "rapid_fund_movement",
      explanation: "Synthetic persisted explanation.",
      generatedAt: "2026-01-01T00:01:00Z",
      supportingTransactionIds: ["transaction-synthetic"],
    });
    database
      .prepare("INSERT INTO case_record (id, flag_id, status) VALUES (?, ?, ?)")
      .run("case-synthetic", "flag-synthetic", "Reviewed");
    database
      .prepare(
        `INSERT INTO audit_event
          (id, case_id, occurred_at, action, actor_label, previous_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        "event-synthetic",
        "case-synthetic",
        "2026-01-01T00:02:00Z",
        "status_change",
        "synthetic-reviewer",
        "Pending",
        "Reviewed",
      );
    database.close();

    const reopenedDatabase = openDatabase(databasePath);
    migrateDatabase(reopenedDatabase);
    try {
      const app = initializeApp(reopenedDatabase);
      const persistedReviewData = app.locals.persistedReviewData as {
        flags: Array<{
          id: string;
          supportingTransactions: Array<{ id: string }>;
        }>;
        cases: Array<{
          id: string;
          status: string;
          auditEvents: Array<{ id: string; newStatus: string | null }>;
        }>;
      };

      assert.deepEqual(persistedReviewData.flags, [
        {
          id: "flag-synthetic",
          category: "rapid_fund_movement",
          explanation: "Synthetic persisted explanation.",
          generatedAt: "2026-01-01T00:01:00Z",
          ruleParametersJson: null,
          supportingTransactions: [
            {
              id: "transaction-synthetic",
              sourceTransactionId: "source-synthetic",
            },
          ],
        },
      ]);
      assert.deepEqual(persistedReviewData.cases, [
        {
          id: "case-synthetic",
          flagId: "flag-synthetic",
          status: "Reviewed",
          createdAt: null,
          updatedAt: null,
          auditEvents: [
            {
              id: "event-synthetic",
              occurredAt: "2026-01-01T00:02:00Z",
              action: "status_change",
              actorLabel: "synthetic-reviewer",
              previousStatus: "Pending",
              newStatus: "Reviewed",
            },
          ],
        },
      ]);
      const flagCount = reopenedDatabase
        .prepare("SELECT COUNT(*) AS count FROM risk_flag")
        .get() as { count: number };
      assert.equal(flagCount.count, 1);
    } finally {
      reopenedDatabase.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("application initialization propagates persisted audit-read failures", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-app-audit-error-"));
  const database = openDatabase(join(directory, "review.sqlite"));

  try {
    migrateDatabase(database);
    database.exec("DROP TABLE audit_event");

    assert.throws(
      () => initializeApp(database),
      /no such table: audit_event/,
    );
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
