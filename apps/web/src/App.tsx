import { useEffect, useState } from "react";

type ConnectionState = "checking" | "connected" | "unavailable";
type UploadState = "idle" | "uploading" | "accepted" | "error";

interface ImportRowError {
  row?: number;
  field?: string;
  message?: string;
}

interface HealthResponse {
  status: "healthy";
}

interface ImportErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: {
      rowErrors?: ImportRowError[];
    };
  };
}

interface ImportSuccessResponse {
  importId: string;
  acceptedTransactionCount: number;
  generatedFlagCount: number;
}

function isHealthResponse(body: unknown): body is HealthResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    body.status === "healthy"
  );
}

function isImportSuccessResponse(body: unknown): body is ImportSuccessResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "importId" in body &&
    typeof body.importId === "string" &&
    "acceptedTransactionCount" in body &&
    typeof body.acceptedTransactionCount === "number" &&
    "generatedFlagCount" in body &&
    typeof body.generatedFlagCount === "number"
  );
}

function isImportErrorResponse(body: unknown): body is ImportErrorResponse {
  return typeof body === "object" && body !== null && "error" in body;
}

export default function App() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("checking");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [rowErrors, setRowErrors] = useState<ImportRowError[]>([]);

  async function checkBackend(signal?: AbortSignal): Promise<void> {
    setConnectionState("checking");

    try {
      const response = await fetch("/api/health", { signal });
      const body: unknown = await response.json();

      if (!response.ok || !isHealthResponse(body)) {
        throw new Error("Backend health check returned an unexpected response.");
      }

      setConnectionState("connected");
    } catch {
      if (!signal?.aborted) {
        setConnectionState("unavailable");
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    void checkBackend(controller.signal);
    return () => controller.abort();
  }, []);

  async function uploadCsv(): Promise<void> {
    if (!selectedFile) {
      setUploadState("error");
      setUploadMessage("Choose a CSV file before uploading.");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setUploadState("error");
      setUploadMessage("Choose a file with the .csv extension.");
      return;
    }

    setUploadState("uploading");
    setUploadMessage("");
    setRowErrors([]);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const body: unknown = await response.json();

      if (!response.ok) {
        const importError = isImportErrorResponse(body) ? body.error : undefined;
        setUploadState("error");
        setUploadMessage(
          importError?.message ??
            "The upload could not be processed. Try again later.",
        );
        setRowErrors(importError?.details?.rowErrors ?? []);
        return;
      }

      if (!isImportSuccessResponse(body)) {
        throw new Error("The import service returned an unexpected response.");
      }
      setUploadState("accepted");
      setUploadMessage(
        `Import ${body.importId} accepted: ${body.acceptedTransactionCount} transactions; ${body.generatedFlagCount} flags generated.`,
      );
    } catch {
      setUploadState("error");
      setUploadMessage(
        "Could not reach the import service. Check the backend connection and try again.",
      );
    }
  }

  const statusText = {
    checking: "Checking backend connection…",
    connected: "Backend connected",
    unavailable: "Backend unavailable. Start the API service and try again.",
  }[connectionState];

  return (
    <main className="page">
      <section className="status-card" aria-labelledby="page-title">
        <p className="eyebrow">Local educational prototype</p>
        <h1 id="page-title">AML Transaction Risk Review</h1>
        <p className="status-label">Backend connection</p>
        <p
          className={`connection-status connection-status--${connectionState}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-indicator" aria-hidden="true" />
          {statusText}
        </p>
        {connectionState === "unavailable" && (
          <button type="button" onClick={() => void checkBackend()}>
            Retry connection
          </button>
        )}
        <section className="import-section" aria-labelledby="import-title">
          <h2 id="import-title">Import synthetic transactions</h2>
          <p>
            CSV is supported for the MVP. Excel files are not accepted.
          </p>
          <label htmlFor="csv-file">CSV file</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setSelectedFile(event.currentTarget.files?.[0] ?? null);
              setUploadState("idle");
              setUploadMessage("");
              setRowErrors([]);
            }}
          />
          {selectedFile && (
            <p className="selected-file">Selected: {selectedFile.name}</p>
          )}
          <button
            type="button"
            onClick={() => void uploadCsv()}
            disabled={!selectedFile || uploadState === "uploading"}
          >
            {uploadState === "uploading" ? "Uploading…" : "Upload CSV"}
          </button>
          <p
            className={`upload-message upload-message--${uploadState}`}
            role="status"
            aria-live="polite"
          >
            {uploadMessage}
          </p>
          {rowErrors.length > 0 && (
            <ul className="upload-errors" aria-label="CSV row errors">
              {rowErrors.map((error, index) => (
                <li key={`${error.row ?? "file"}-${error.field ?? index}-${index}`}>
                  {error.row ? `Row ${error.row}: ` : ""}
                  {error.field ? `${error.field}: ` : ""}
                  {error.message ?? "Check this value."}
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}
