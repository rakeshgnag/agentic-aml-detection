import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { initializeApp } from "../src/app.js";
import { maximumCsvBytes, maximumDataRows } from "../src/imports/csv.js";
import { openDatabase } from "../src/persistence/database.js";
import { migrateDatabase } from "../src/persistence/migrate.js";
import type Database from "better-sqlite3";

const header =
  "source_transaction_id,timestamp,sender_id,receiver_id,amount,currency";
const validRow =
  "source-1,2026-10-20T10:15:30+02:00,sender-1,receiver-1,125.50,USD";

interface TestContext {
  baseUrl: string;
  database: Database.Database;
}

async function withApp(
  verify: (context: TestContext) => Promise<void>,
  beforeListen?: (database: Database.Database) => void,
): Promise<void> {
  const directory = mkdtempSync(join(tmpdir(), "aml-import-route-"));
  const database = openDatabase(join(directory, "review.sqlite"));
  migrateDatabase(database);
  beforeListen?.(database);
  const server = initializeApp(database).listen(0, "127.0.0.1");

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address() as AddressInfo;
    await verify({
      baseUrl: `http://127.0.0.1:${address.port}`,
      database,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

async function uploadCsv(baseUrl: string, text: string): Promise<Response> {
  const formData = new FormData();
  formData.append(
    "file",
    new Blob([text], { type: "text/csv" }),
    "synthetic.csv",
  );
  return fetch(`${baseUrl}/api/imports`, { method: "POST", body: formData });
}

function count(database: Database.Database, table: string): number {
  return (
    database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
      count: number;
    }
  ).count;
}

test("POST /api/imports accepts UTF-8 BOM and quoted CSV and persists normalized rows", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const csv = `\uFEFF${header}\nsource-1,2026-10-20T10:15:30+02:00,"Sender, Inc","Receiver ""B""",+125.50,USD\n`;
    const response = await uploadCsv(baseUrl, csv);
    assert.equal(response.status, 201);
    const result = (await response.json()) as {
      importId: string;
      acceptedTransactionCount: number;
      generatedFlagCount: number;
    };
    assert.ok(result.importId);
    assert.equal(result.acceptedTransactionCount, 1);
    assert.equal(result.generatedFlagCount, 0);
    assert.equal(count(database, "accepted_import"), 1);
    assert.equal(count(database, '"transaction"'), 1);
    assert.equal(count(database, "risk_flag"), 0);

    const transaction = database
      .prepare(
        `SELECT source_transaction_id, source_timestamp_text, occurred_at,
                sender_id, receiver_id, amount_decimal, currency
         FROM "transaction"`,
      )
      .get() as Record<string, string | null>;
    assert.deepEqual(transaction, {
      source_transaction_id: "source-1",
      source_timestamp_text: "2026-10-20T10:15:30+02:00",
      occurred_at: "2026-10-20T08:15:30.000Z",
      sender_id: "Sender, Inc",
      receiver_id: 'Receiver "B"',
      amount_decimal: "+125.50",
      currency: "USD",
    });
    const importRow = database
      .prepare("SELECT accepted_row_count FROM accepted_import")
      .get() as { accepted_row_count: number };
    assert.equal(importRow.accepted_row_count, 1);
  });
});

test("POST /api/imports allows absent and duplicate source transaction IDs", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const csv = `${header}\n,2026-10-20T10:15:30Z,sender-1,receiver-1,1,USD\nsource-dup,2026-10-20T10:15:31Z,sender-2,receiver-2,-2,USD\nsource-dup,2026-10-20T10:15:32Z,sender-3,receiver-3,3,USD`;
    const response = await uploadCsv(baseUrl, csv);
    assert.equal(response.status, 201);
    assert.equal(count(database, '"transaction"'), 3);
    const ids = database
      .prepare(
        `SELECT source_transaction_id FROM "transaction" ORDER BY rowid`,
      )
      .all() as Array<{ source_transaction_id: string | null }>;
    assert.deepEqual(ids, [
      { source_transaction_id: null },
      { source_transaction_id: "source-dup" },
      { source_transaction_id: "source-dup" },
    ]);
    const internalIds = database
      .prepare(`SELECT id FROM "transaction"`)
      .all() as Array<{ id: string }>;
    assert.equal(new Set(internalIds.map(({ id }) => id)).size, 3);
  });
});

test("POST /api/imports rejects invalid rows without partially writing", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const csv = `${header}\n${validRow}\nsource-2,2026-10-20T10:15:30,sender-2,receiver-2,2,USD`;
    const response = await uploadCsv(baseUrl, csv);
    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { details: { rowErrors: Array<{ row?: number; field?: string }> } };
    };
    assert.ok(
      body.error.details.rowErrors.some(
        ({ row, field }) => row === 3 && field === "timestamp",
      ),
    );
    assert.equal(count(database, "accepted_import"), 0);
    assert.equal(count(database, '"transaction"'), 0);
  });
});

test("POST /api/imports reports invalid timestamp and decimal amount fields", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const csv = `${header}\nsource-1,2026-02-30T10:15:30Z,sender-1,receiver-1,1e3,USD`;
    const response = await uploadCsv(baseUrl, csv);
    assert.equal(response.status, 400);
    const body = (await response.json()) as {
      error: { details: { rowErrors: Array<{ field?: string }> } };
    };
    assert.deepEqual(
      body.error.details.rowErrors.map(({ field }) => field).sort(),
      ["amount", "timestamp"],
    );
    assert.equal(count(database, "accepted_import"), 0);
  });
});

test("POST /api/imports rejects missing, duplicate, and unexpected headers", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const cases = [
      `${header.replace(",currency", "")}\n${validRow}`,
      `${header},sender_id\n${validRow},duplicate`,
      `${header},unexpected\n${validRow},value`,
      `timestamp,source_transaction_id,sender_id,receiver_id,amount,currency\n2026-10-20T10:15:30Z,source-1,sender-1,receiver-1,1,USD`,
    ];
    for (const csv of cases) {
      const response = await uploadCsv(baseUrl, csv);
      assert.equal(response.status, 400);
      const body = (await response.json()) as {
        error: { details: { rowErrors: unknown[] } };
      };
      assert.ok(body.error.details.rowErrors.length > 0);
    }
    assert.equal(count(database, "accepted_import"), 0);
    assert.equal(count(database, '"transaction"'), 0);
  });
});

test("POST /api/imports rejects malformed, empty, and header-only CSV files", async () => {
  await withApp(async ({ baseUrl, database }) => {
    for (const csv of ["", `${header}\n`, `${header}\n"unterminated`]) {
      const response = await uploadCsv(baseUrl, csv);
      assert.equal(response.status, 400);
      const body = (await response.json()) as { error: { message: string } };
      assert.ok(body.error.message.length > 0);
    }
    assert.equal(count(database, "accepted_import"), 0);
    assert.equal(count(database, '"transaction"'), 0);
  });
});

test("POST /api/imports enforces file and data-row limits", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const oversized = `${header}\n${"x".repeat(maximumCsvBytes)}`;
    assert.equal((await uploadCsv(baseUrl, oversized)).status, 413);
    const tooManyRows = `${header}\n${Array.from(
      { length: maximumDataRows + 1 },
      (_, index) =>
        `source-${index},2026-10-20T10:15:30Z,sender,receiver,1,USD`,
    ).join("\n")}`;
    assert.equal((await uploadCsv(baseUrl, tooManyRows)).status, 413);
    assert.equal(count(database, "accepted_import"), 0);
    assert.equal(count(database, '"transaction"'), 0);
  });
});

test("POST /api/imports appends separate imports without replacing earlier rows", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const first = await uploadCsv(baseUrl, `${header}\n${validRow}`);
    const second = await uploadCsv(
      baseUrl,
      `${header}\nsource-2,2026-10-21T10:15:30Z,sender-2,receiver-2,2,USD`,
    );
    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(count(database, "accepted_import"), 2);
    assert.equal(count(database, '"transaction"'), 2);
    const importIds = database
      .prepare("SELECT id FROM accepted_import")
      .all() as Array<{ id: string }>;
    assert.equal(new Set(importIds.map(({ id }) => id)).size, 2);
  });
});

test("POST /api/imports detects linked transfers across imports and exposes new flags", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const first = await uploadCsv(
      baseUrl,
      `${header}\nsource-1,2026-10-20T10:00:00Z,synthetic-A,synthetic-B,125.50,USD`,
    );
    assert.equal(first.status, 201);
    assert.equal(
      ((await first.json()) as { generatedFlagCount: number })
        .generatedFlagCount,
      0,
    );

    const second = await uploadCsv(
      baseUrl,
      `${header}\nsource-2,2026-10-20T10:20:00Z,synthetic-B,synthetic-C,120.00,USD`,
    );
    assert.equal(second.status, 201);
    assert.equal(
      ((await second.json()) as { generatedFlagCount: number })
        .generatedFlagCount,
      1,
    );
    assert.equal(count(database, "accepted_import"), 2);
    assert.equal(count(database, '"transaction"'), 2);
    assert.equal(count(database, "risk_flag"), 1);

    const flagsResponse = await fetch(`${baseUrl}/api/flags`);
    assert.equal(flagsResponse.status, 200);
    const flags = (await flagsResponse.json()) as {
      items: Array<{
        id: string;
        category: string;
        explanation: string;
        ruleParameters: Record<string, unknown>;
        supportingTransactions: Array<{ id: string }>;
      }>;
    };
    assert.equal(flags.items.length, 1);
    assert.equal(flags.items[0]?.category, "rapid_fund_movement");
    assert.match(flags.items[0]!.explanation, /indicator for human review/);
    assert.equal(
      flags.items[0]?.ruleParameters.ruleId,
      "rapid-fund-movement.v1",
    );
    assert.equal(flags.items[0]?.supportingTransactions.length, 2);

    const third = await uploadCsv(
      baseUrl,
      `${header}\nsource-3,2026-10-20T12:00:00Z,synthetic-X,synthetic-Y,1,USD`,
    );
    assert.equal(third.status, 201);
    assert.equal(
      ((await third.json()) as { generatedFlagCount: number })
        .generatedFlagCount,
      0,
    );
    assert.equal(count(database, "risk_flag"), 1);
  });
});

test("POST /api/imports detects repeated transfers across imports with varying amounts", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const first = await uploadCsv(
      baseUrl,
      `${header}\nsource-1,2026-10-20T10:00:00Z,synthetic-A,synthetic-B,1.00,USD\nsource-2,2026-10-20T10:10:00Z,synthetic-A,synthetic-B,20.00,USD`,
    );
    assert.equal(first.status, 201);
    assert.equal(
      ((await first.json()) as { generatedFlagCount: number })
        .generatedFlagCount,
      0,
    );

    const second = await uploadCsv(
      baseUrl,
      `${header}\nsource-3,2026-10-20T10:20:00Z,synthetic-A,synthetic-B,300.00,USD`,
    );
    assert.equal(second.status, 201);
    assert.equal(
      ((await second.json()) as { generatedFlagCount: number })
        .generatedFlagCount,
      1,
    );
    assert.equal(count(database, "risk_flag"), 1);

    const flagsResponse = await fetch(`${baseUrl}/api/flags`);
    assert.equal(flagsResponse.status, 200);
    const flags = (await flagsResponse.json()) as {
      items: Array<{
        category: string;
        ruleParameters: Record<string, unknown>;
        supportingTransactions: Array<{ id: string }>;
      }>;
    };
    assert.equal(flags.items.length, 1);
    assert.equal(flags.items[0]?.category, "repeated_transfers");
    assert.equal(
      flags.items[0]?.ruleParameters.ruleId,
      "repeated-transfers.v1",
    );
    assert.equal(flags.items[0]?.supportingTransactions.length, 3);
  });
});

test("POST /api/imports rolls back import metadata when a transaction insert fails", async () => {
  await withApp(
    async ({ baseUrl, database }) => {
      const response = await uploadCsv(
        baseUrl,
        `${header}\n${validRow}\nsource-2,2026-10-20T10:15:31Z,sender-2,receiver-2,2,USD`,
      );
      assert.equal(response.status, 500);
      assert.equal(count(database, "accepted_import"), 0);
      assert.equal(count(database, '"transaction"'), 0);
    },
    (database) => {
      database.exec(`
        CREATE TRIGGER reject_synthetic_transaction
        BEFORE INSERT ON "transaction"
        BEGIN
          SELECT RAISE(ABORT, 'synthetic write failure');
        END;
      `);
    },
  );
});

test("POST /api/imports rolls back transactions when flag persistence fails", async () => {
  await withApp(
    async ({ baseUrl, database }) => {
      const response = await uploadCsv(
        baseUrl,
        `${header}\nsource-1,2026-10-20T10:00:00Z,synthetic-A,synthetic-B,1,USD\nsource-2,2026-10-20T10:10:00Z,synthetic-B,synthetic-C,1,USD`,
      );
      assert.equal(response.status, 500);
      assert.equal(count(database, "accepted_import"), 0);
      assert.equal(count(database, '"transaction"'), 0);
      assert.equal(count(database, "risk_flag"), 0);
      assert.equal(count(database, "flag_evidence"), 0);
    },
    (database) => {
      database.exec(`
        CREATE TRIGGER reject_synthetic_flag
        BEFORE INSERT ON risk_flag
        BEGIN
          SELECT RAISE(ABORT, 'synthetic flag write failure');
        END;
      `);
    },
  );
});

test("POST /api/imports rejects requests that are not one multipart file", async () => {
  await withApp(async ({ baseUrl, database }) => {
    const response = await fetch(`${baseUrl}/api/imports`, {
      method: "POST",
      headers: { "content-type": "text/csv" },
      body: `${header}\n${validRow}`,
    });
    assert.equal(response.status, 400);
    assert.equal(count(database, "accepted_import"), 0);
  });
});
