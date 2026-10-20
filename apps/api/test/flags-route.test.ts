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
  const directory = mkdtempSync(join(tmpdir(), "aml-sp05-flags-route-"));
  return { directory, path: join(directory, "review.sqlite") };
}

test("GET /api/flags returns persisted flags with evidence and parsed parameters", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    const database = openDatabase(path);
    migrateDatabase(database);
    database
      .prepare("INSERT INTO accepted_import (id) VALUES (?)")
      .run("import-synthetic");
    database
      .prepare(
        `INSERT INTO "transaction"
          (id, import_id, source_transaction_id, source_timestamp_text)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        "transaction-synthetic",
        "import-synthetic",
        null,
        "synthetic-original-time",
      );
    persistRiskFlag(database, {
      id: "flag-synthetic",
      category: "rapid_fund_movement",
      explanation: "Synthetic transactions matched a configured rule.",
      generatedAt: "2026-01-01T00:01:00Z",
      ruleParametersJson: JSON.stringify({ configuredWindow: "synthetic" }),
      supportingTransactionIds: ["transaction-synthetic"],
    });
    database.close();

    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/flags`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        items: [
          {
            id: "flag-synthetic",
            category: "rapid_fund_movement",
            explanation: "Synthetic transactions matched a configured rule.",
            generatedAt: "2026-01-01T00:01:00Z",
            ruleParameters: { configuredWindow: "synthetic" },
            supportingTransactions: [
              {
                id: "transaction-synthetic",
                sourceTransactionId: null,
              },
            ],
          },
        ],
      });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET /api/flags returns an empty items array when no flags exist", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/flags`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { items: [] });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("GET /api/flags returns an error for invalid stored rule parameters", async () => {
  const { directory, path } = createTempDatabasePath();
  try {
    const database = openDatabase(path);
    migrateDatabase(database);
    database
      .prepare("INSERT INTO accepted_import (id) VALUES (?)")
      .run("import-synthetic");
    database
      .prepare('INSERT INTO "transaction" (id, import_id) VALUES (?, ?)')
      .run("transaction-synthetic", "import-synthetic");
    database
      .prepare(
        `INSERT INTO risk_flag
          (id, category, explanation, generated_at, rule_parameters_json)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        "flag-invalid",
        "circular_flows",
        "Synthetic invalid JSON fixture.",
        "2026-01-01T00:01:00Z",
        "{invalid-json",
      );
    database
      .prepare(
        "INSERT INTO flag_evidence (flag_id, transaction_id) VALUES (?, ?)",
      )
      .run("flag-invalid", "transaction-synthetic");
    database.close();

    await withApp(path, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/flags`);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), {
        error: "Persisted flag data could not be represented.",
      });
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
