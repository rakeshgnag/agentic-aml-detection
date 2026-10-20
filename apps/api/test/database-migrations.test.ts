import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";

test("initial migration creates the schema, enforces foreign keys, and survives reopen", () => {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-migration-"));
  const databasePath = join(directory, "review.sqlite");

  try {
    const database = openDatabase(databasePath);
    try {
      migrateDatabase(database);

      assert.equal(
        database.pragma("user_version", { simple: true }),
        1,
      );
      assert.equal(database.pragma("foreign_keys", { simple: true }), 1);

      const tables = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
        )
        .all()
        .map((row) => (row as { name: string }).name);
      assert.deepEqual(tables, [
        "accepted_import",
        "audit_event",
        "case_record",
        "flag_evidence",
        "risk_flag",
        "transaction",
      ]);

      database
        .prepare(
          "INSERT INTO accepted_import (id, accepted_at, accepted_row_count) VALUES (?, ?, ?)",
        )
        .run("import-synthetic-1", "2026-01-01T00:00:00Z", 1);
      database
        .prepare(
          'INSERT INTO "transaction" (id, import_id) VALUES (?, ?)',
        )
        .run("transaction-synthetic-1", "import-synthetic-1");

      assert.throws(
        () =>
          database
            .prepare(
              'INSERT INTO "transaction" (id, import_id) VALUES (?, ?)',
            )
            .run("txn-missing-import", "missing-import"),
        /FOREIGN KEY constraint failed/,
      );
    } finally {
      database.close();
    }

    const reopenedDatabase = openDatabase(databasePath);
    try {
      migrateDatabase(reopenedDatabase);
      assert.equal(
        reopenedDatabase.pragma("user_version", { simple: true }),
        1,
      );
      assert.deepEqual(
        reopenedDatabase
          .prepare(
            'SELECT id FROM "transaction" WHERE id = ?',
          )
          .get("transaction-synthetic-1"),
        { id: "transaction-synthetic-1" },
      );
    } finally {
      reopenedDatabase.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
