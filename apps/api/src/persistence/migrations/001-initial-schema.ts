import type Database from "better-sqlite3";

export const version = 1;

export function up(database: Database.Database): void {
  database.exec(`
    CREATE TABLE accepted_import (
      id TEXT PRIMARY KEY,
      accepted_at TEXT,
      accepted_row_count INTEGER
    );

    CREATE TABLE "transaction" (
      id TEXT PRIMARY KEY,
      import_id TEXT NOT NULL REFERENCES accepted_import(id),
      source_transaction_id TEXT,
      source_timestamp_text TEXT,
      occurred_at TEXT,
      sender_id TEXT,
      receiver_id TEXT,
      amount_decimal TEXT,
      currency TEXT
    );

    CREATE TABLE risk_flag (
      id TEXT PRIMARY KEY,
      category TEXT,
      explanation TEXT,
      generated_at TEXT,
      rule_parameters_json TEXT
    );

    CREATE TABLE flag_evidence (
      flag_id TEXT NOT NULL REFERENCES risk_flag(id),
      transaction_id TEXT NOT NULL REFERENCES "transaction"(id),
      evidence_order INTEGER,
      PRIMARY KEY (flag_id, transaction_id)
    );

    CREATE TABLE case_record (
      id TEXT PRIMARY KEY,
      flag_id TEXT NOT NULL UNIQUE REFERENCES risk_flag(id),
      status TEXT NOT NULL
        CHECK (status IN ('Pending', 'Reviewed', 'Escalated')),
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE audit_event (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL REFERENCES case_record(id),
      occurred_at TEXT,
      action TEXT,
      actor_label TEXT,
      previous_status TEXT,
      new_status TEXT,
      CHECK (
        (previous_status IS NULL AND new_status IS NULL) OR
        (
          previous_status IS NOT NULL AND
          new_status IS NOT NULL AND
          previous_status <> new_status AND
          previous_status IN ('Pending', 'Reviewed', 'Escalated') AND
          new_status IN ('Pending', 'Reviewed', 'Escalated')
        )
      )
    );
  `);
}
