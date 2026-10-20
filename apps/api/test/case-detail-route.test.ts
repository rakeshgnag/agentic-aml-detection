import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { initializeApp } from "../src/app.js";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import { persistRiskFlag } from "../src/persistence/repository.js";

async function withApp(
  databasePath: string,
  verify: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const database = openDatabase(databasePath);
  migrateDatabase(database);
  const app = initializeApp(database);
  const server = app.listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address() as AddressInfo;
    await verify(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    database.close();
  }
}

function createTempDatabasePath(): { directory: string; path: string } {
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-case-detail-"));
  return { directory, path: join(directory, "review.sqlite") };
}

function seedCase(
  databasePath: string,
  includeAuditEvent: boolean,
): void {
  const database = openDatabase(databasePath);
  try {
    migrateDatabase(database);
    database
      .prepare("INSERT INTO accepted_import (id) VALUES (?)")
      .run("import-synthetic");
    database
      .prepare(
        `INSERT INTO "transaction"
          (id, import_id, source_transaction_id)
         VALUES (?, ?, ?)`,
      )
      .run("transaction-synthetic", "import-synthetic", null);
    persistRiskFlag(database, {
      id: "flag-synthetic",
      category: "repeated_transfers",
      explanation: "Synthetic persisted flag explanation.",
      generatedAt: "2026-01-01T00:01:00Z",
      ruleParametersJson: JSON.stringify({ example: "synthetic" }),
      supportingTransactionIds: ["transaction-synthetic"],
    });
    database
      .prepare(
        `INSERT INTO case_record
          (id, flag_id, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        "case-synthetic",
        "flag-synthetic",
        "Escalated",
        "2026-01-01T00:02:00Z",
        "2026-01-01T00:03:00Z",
      );
    if (includeAuditEvent) {
      database
        .prepare(
          `INSERT INTO audit_event
            (id, case_id, occurred_at, action, actor_label, previous_status, new_status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          "event-synthetic",
          "case-synthetic",
          "2026-01-01T00:03:00Z",
          "status_change",
          "synthetic-reviewer",
          "Reviewed",
          "Escalated",
        );
    }
  } finally {
    database.close();
  }
}

test("GET /api/cases/:caseId returns case, linked flag evidence, and audit history", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    seedCase(path, true);
    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/cases/case-synthetic`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        case: {
          id: "case-synthetic",
          flagId: "flag-synthetic",
          status: "Escalated",
          createdAt: "2026-01-01T00:02:00Z",
          updatedAt: "2026-01-01T00:03:00Z",
        },
        flag: {
          id: "flag-synthetic",
          category: "repeated_transfers",
          explanation: "Synthetic persisted flag explanation.",
          generatedAt: "2026-01-01T00:01:00Z",
          ruleParameters: { example: "synthetic" },
          supportingTransactions: [
            {
              id: "transaction-synthetic",
              sourceTransactionId: null,
            },
          ],
        },
        auditEvents: [
          {
            id: "event-synthetic",
            occurredAt: "2026-01-01T00:03:00Z",
            action: "status_change",
            actorLabel: "synthetic-reviewer",
            previousStatus: "Reviewed",
            newStatus: "Escalated",
          },
        ],
      });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET /api/cases/:caseId returns an empty auditEvents array when no events exist", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    seedCase(path, false);
    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/cases/case-synthetic`);
      assert.equal(response.status, 200);
      const body = (await response.json()) as {
        auditEvents: unknown[];
      };
      assert.deepEqual(body.auditEvents, []);
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET /api/cases/:caseId returns 404 for a missing case", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/cases/not-found`);
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Case not found." });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("application initialization fails when persisted audit history cannot be read", () => {
  const { directory, path } = createTempDatabasePath();
  try {
    seedCase(path, false);
    const database = openDatabase(path);
    database.exec("DROP TABLE audit_event");
    assert.throws(
      () => initializeApp(database),
      /no such table: audit_event/,
    );
    database.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
