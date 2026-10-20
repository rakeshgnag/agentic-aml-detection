import type Database from "better-sqlite3";
import {
  up as createInitialSchema,
  version as initialSchemaVersion,
} from "./migrations/001-initial-schema.js";

const migrations = [
  { version: initialSchemaVersion, up: createInitialSchema },
];

export function migrateDatabase(database: Database.Database): void {
  const foreignKeysEnabled = database.pragma("foreign_keys", {
    simple: true,
  });
  if (foreignKeysEnabled !== 1) {
    throw new Error("SQLite foreign-key enforcement must be enabled.");
  }

  const storedVersion: unknown = database.pragma("user_version", {
    simple: true,
  });
  if (typeof storedVersion !== "number" || !Number.isInteger(storedVersion)) {
    throw new Error("The SQLite database has an invalid schema version.");
  }
  let currentVersion = storedVersion;
  const latestVersion = migrations.at(-1)?.version ?? 0;

  if (currentVersion > latestVersion) {
    throw new Error(
      "The SQLite database schema version is newer than this application supports.",
    );
  }

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }
    if (migration.version !== currentVersion + 1) {
      throw new Error("SQLite migrations must be applied in version order.");
    }

    database.transaction(() => {
      migration.up(database);
      database.pragma(`user_version = ${migration.version}`);
    })();
    currentVersion = migration.version;
  }
}
