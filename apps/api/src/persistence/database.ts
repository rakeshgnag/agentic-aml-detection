import Database from "better-sqlite3";
import { lstatSync, mkdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = realpathSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../../../../"),
);

function isWithinDirectory(directory: string, candidate: string): boolean {
  const relativePath = relative(directory, candidate);
  return (
    relativePath === "" ||
    (relativePath !== ".." &&
      !relativePath.startsWith(`..${sep}`) &&
      !isAbsolute(relativePath))
  );
}

function validateDatabasePath(configuredPath: string | undefined): string {
  if (!configuredPath?.trim()) {
    throw new Error(
      "AML_DATABASE_PATH is required and must point to a database file outside the repository.",
    );
  }

  if (!isAbsolute(configuredPath)) {
    throw new Error(
      "AML_DATABASE_PATH must be an absolute path outside the repository.",
    );
  }

  const requestedPath = resolve(configuredPath);
  if (isWithinDirectory(repositoryRoot, requestedPath)) {
    throw new Error(
      "AML_DATABASE_PATH must point outside the repository.",
    );
  }

  return requestedPath;
}

export function openDatabase(
  configuredPath: string | undefined = process.env.AML_DATABASE_PATH,
): Database.Database {
  const requestedPath = validateDatabasePath(configuredPath);
  const parentPath = dirname(requestedPath);

  try {
    mkdirSync(parentPath, { recursive: true });

    const canonicalParent = realpathSync(parentPath);
    const databasePath = resolve(canonicalParent, basename(requestedPath));
    if (isWithinDirectory(repositoryRoot, databasePath)) {
      throw new Error(
        "AML_DATABASE_PATH must point outside the repository.",
      );
    }

    try {
      const existingPath = lstatSync(databasePath);
      if (existingPath.isSymbolicLink() || !existingPath.isFile()) {
        throw new Error(
          "AML_DATABASE_PATH must identify a regular database file.",
        );
      }
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
        throw error;
      }
    }

    const database = new Database(databasePath);
    database.pragma("foreign_keys = ON");
    if (database.pragma("foreign_keys", { simple: true }) !== 1) {
      database.close();
      throw new Error("Could not enable SQLite foreign-key enforcement.");
    }
    return database;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("AML_DATABASE_PATH") ||
        error.message === "AML_DATABASE_PATH must identify a regular database file.")
    ) {
      throw error;
    }

    throw new Error(
      "Could not initialize the SQLite database. Check the configured path, permissions, and database file.",
    );
  }
}
