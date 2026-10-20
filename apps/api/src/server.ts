import { initializeApp } from "./app.js";
import { openDatabase } from "./persistence/database.js";
import { migrateDatabase } from "./persistence/migrate.js";

const host = "127.0.0.1";
const port = 3001;

let database: ReturnType<typeof openDatabase> | undefined;
try {
  database = openDatabase();
  migrateDatabase(database);
} catch (error) {
  database?.close();
  console.error(
    error instanceof Error
      ? error.message
      : "Could not initialize the SQLite database.",
  );
  process.exit(1);
}

let app: ReturnType<typeof initializeApp>;
try {
  app = initializeApp(database);
} catch (error) {
  database.close();
  console.error(
    error instanceof Error
      ? error.message
      : "Could not load persisted review data.",
  );
  process.exit(1);
}

const server = app.listen(port, host, () => {
  console.log(`API listening at http://${host}:${port}`);
});

server.on("close", () => database?.close());

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error(`API server failed to start: ${error.message}`);
  process.exitCode = 1;
});
