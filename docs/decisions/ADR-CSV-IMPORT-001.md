# ADR-CSV-IMPORT-001: Synthetic CSV import contract

**Status:** Proposed — awaiting repository review and recording
**Scope:** Minimum CSV input and acceptance behavior for the local educational
prototype
**Project owner direction:** The project owner approved the decisions below
in conversation. This record has not completed repository review; no approval
by another reviewer is implied.

## Context

The approved FRD requires whole-file validation, actionable row errors, and
no partial persistence. The approved Data Model and API Contract leave CSV
columns and several parsing semantics open. The Sprint Plan assigns those
decisions to SP-06 before CSV validation/import implementation.

## Decisions proposed for repository review

1. Accept UTF-8 CSV, optionally with a UTF-8 BOM, standard quoted fields, and
   escaped double quotes. Headers are exact and case-sensitive:
   `source_transaction_id,timestamp,sender_id,receiver_id,amount,currency`.
   Reject missing, duplicate, or unexpected headers and malformed CSV.
2. Reject empty files and files containing only a header. Reject imports with
   more than 10,000 data rows or a file payload larger than 5 MiB.
3. Require nonblank `timestamp`, `sender_id`, `receiver_id`, `amount`, and
   `currency`. `source_transaction_id` is optional; blank values become SQL
   `NULL`, and duplicate source IDs are allowed. Assign each row a unique
   internal transaction ID.
4. Require timestamps in ISO 8601 form with an explicit timezone offset.
   Preserve the submitted timestamp text in `source_timestamp_text` and store
   the parsed instant normalized to UTC in `occurred_at`.
5. Require plain decimal notation for `amount`, allow signed values, and
   preserve the decimal text without binary floating-point conversion. Treat
   `currency` as a required opaque string; do not convert currencies.
6. Parse and validate the complete file before database writes. On any
   structural or row error, reject the entire file and return actionable
   row/column errors.
7. For a valid import, append a new accepted-import record and all
   transaction rows in one SQLite transaction. Do not replace earlier
   imports. `acceptedTransactionCount` is the number of committed transaction
   rows; `generatedFlagCount` is zero until detection is implemented.

## Implementation consequences

- Map CSV fields to the existing transaction model: `source_transaction_id`,
  `source_timestamp_text`, `occurred_at`, `sender_id`, `receiver_id`,
  `amount_decimal`, and `currency`. `import_id` references the new accepted
  import.
- Use server-generated opaque import and transaction IDs and a server
  acceptance timestamp.
- A failed insert rolls back the import row and every transaction row.
- This record does not authorize detection, cross-import analysis, or changes
  to other approved contracts.

## Decisions that remain open

- Whether multiple accepted imports are combined or one is selected for later
  dashboard, filtering, or detection analysis.
- Detection thresholds, matching semantics, and flag generation.
- Currency conversion or comparison behavior.
- Retention, deletion, cascade, backup, and recovery policy.
- Audit action vocabulary and actor-label policy.
- Production capacity or performance requirements beyond the local prototype
  limits in this record.

## References

- `docs/requirements/FRD.md` — FRD-001–FRD-004 and Section 5.1 import
  validation.
- `docs/contracts/data-model.md` — proposed accepted-import and transaction
  fields, atomic persistence, and unresolved CSV semantics.
- `docs/contracts/api-contract.md` — `POST /api/imports` and proposed result
  and error behavior.
- `docs/planning/sprint-plan.md` — SP-06 through SP-08.

This record captures project-owner direction for review. It does not amend
approved baseline documents or claim repository approval.
