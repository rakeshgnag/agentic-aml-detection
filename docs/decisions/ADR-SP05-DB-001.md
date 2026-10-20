# ADR-SP05-DB-001: Minimum SQLite persistence schema and migrations

**Status:** Proposed — awaiting review
**Decision scope:** SP-05 schema and migration decisions for approved story
US-012
**Project owner direction:** The project owner approved the four design
directions below for recording. This record is still proposed and awaits
repository review; no approval by another reviewer is implied.

## Context

SP-05, “Implement approved persistence records and startup loading,” maps to
approved user story US-012. US-012 requires accepted transactions, flags and
evidence, cases, and audit events to remain inspectable after restart. Startup
must load saved flags without rerunning detection or replacing them.

The approved Data Model outlines the entities and relationships but leaves
exact DDL, field constraints, and migration details open. The existing
SP-04 database initializer opens the SQLite database configured by
`AML_DATABASE_PATH`; it does not initialize the application schema.

## Decisions proposed for repository review

The project owner approved these four directions for recording:

1. Use the proposed six-table schema and a required-versus-optional field
   approach.
2. Preserve original timestamp text, use normalized timestamps according to
   the future CSV contract, and store accepted row count as an integer.
3. Enforce foreign keys, require supporting evidence for saved flags, and
   make case status changes plus their audit events atomic.
4. Use numbered SQL migrations tracked with SQLite `PRAGMA user_version`,
   applied transactionally.

The decision record itself remains proposed until reviewed and recorded
through the repository's human-review process.

## Proposed schema outline

This outline follows the approved Data Model's terminology and is not final
field-level DDL. Required and optional fields must be reconciled against the
Data Model and API Contract before implementation.

| Table | Proposed contents |
|---|---|
| `accepted_import` | Internal ID, acceptance timestamp, accepted row count stored as an integer. |
| `transaction` | Internal ID, import reference, optional source transaction ID, original timestamp text, normalized timestamp as defined by the future CSV contract, sender and receiver references, amount representation, and currency. |
| `risk_flag` | Internal ID, rule category, explanation, generation timestamp, and a provisional rule-parameter snapshot. |
| `flag_evidence` | Flag and transaction references, with provisional evidence-order metadata. |
| `case_record` | Internal ID, unique flag reference, status, creation timestamp, and update timestamp. |
| `audit_event` | Internal ID, case reference, timestamp, action, actor label, and optional previous/new status pair. |

The Data Model proposes a composite key for
`flag_evidence(flag_id, transaction_id)` and a unique
`case_record.flag_id` to enforce at most one case per flag. No uniqueness
constraint for source transaction IDs and no deletion cascade are proposed.

## Approved behavior and implementation consequences

- Enforce SQLite foreign keys for database connections. The persistence
  implementation must also ensure each saved flag has one or more supporting
  evidence references; foreign keys alone do not enforce a minimum number of
  related rows.
- Preserve the exact case statuses `Pending`, `Reviewed`, and `Escalated`.
  A real status change and its corresponding audit event must commit
  atomically. Selecting the current status is a no-op and creates no
  status-change event.
- Apply numbered SQL migrations transactionally and track the schema
  version using `PRAGMA user_version`. Startup must not drop and recreate
  tables.
- Initialize schema and load persisted records without running detection,
  regenerating flags, or replacing saved flags.
- Persist accepted records and review data using the database configured by
  `AML_DATABASE_PATH`; do not move or overwrite any existing user database.

## Unresolved items retained

This decision does not resolve:

- Exact field-level nullability or other DDL details; reconcile those against
  the Data Model and API Contract before implementation.
- CSV columns or semantics, timestamp parsing or timezone behavior, the
  normalized timestamp representation, amount/currency semantics, or whether
  an otherwise valid empty CSV is accepted.
- Duplicate source transaction ID behavior or multiple-import behavior.
- Detection thresholds, matching semantics, rule-parameter snapshot format,
  or threshold-dependent outcomes.
- Evidence-order behavior beyond its provisional presentation role.
- Audit actor-label values, action vocabulary, additional audited actions,
  or whether case creation generates an audit event.
- Retention, deletion, cascade behavior, backup, or recovery.
- Indexes, ID-generation details, or performance targets.

## References

- `docs/contracts/data-model.md` — proposed entities, fields, relationships,
  persistence behavior, and open decisions.
- `docs/contracts/api-contract.md` — case/status and audit behavior, proposed
  response details, and open decisions.
- `docs/contracts/user-stories.md` — approved US-012.
- `docs/architecture/technical-architecture.md` — persistence approach and
  local database configuration.
- `docs/planning/sprint-plan.md` — SP-05 scope and verification.
- `apps/api/src/persistence/database.ts` — SP-04 database initializer.

This record does not modify or replace any approved baseline. SP-05
implementation remains a separate task requiring its own authorization.
