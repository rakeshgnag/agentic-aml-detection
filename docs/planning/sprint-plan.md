# Sprint Plan

**Project:** AML Transaction Risk Identification System
**Status:** Approved
**Version:** 0.1
**Planning horizon:** Four delivery days, organized as focused sessions of
approximately 1–2 hours. This is a sequencing target, not a commitment to
full-day availability or a guarantee that unresolved decisions can be closed
within four days.
**Approval gate:** Human approval of this plan is required before Development.
**Sources:** Approved User Stories, Data Model, API Contract, BRD, PRD, FRD,
NFR, Logical Architecture, and Technical Architecture.

## 1. Purpose, scope, assumptions, and exclusions

### Purpose and demonstrable outcome

Plan the smallest locally runnable educational prototype that supports a
synthetic CSV review journey: start a React/Vite/TypeScript frontend and
Node.js/Express/TypeScript backend; check API health; import and validate a
file; review summaries, filters, flags and evidence; manually create and
manage a case; and inspect the recorded status-change audit history.

The application must persist accepted transactions, generated flags and
explanations, supporting transaction references, cases, and audit events in
SQLite. It must load saved flags on startup without automatically rerunning
detection. During development, use Vite and Express as separate local
processes; for the local demo, prefer Express serving the built frontend so
the demo uses one application process. Configure the SQLite file with
`AML_DATABASE_PATH`, outside the repository, and exclude local database files
from version control.

### Scope and constraints

- Use synthetic transaction data only. Risk flags are indicators for human
  review, not proof of money laundering.
- Support rapid fund movement, repeated transfers, circular flows, and
  structuring-like patterns with understandable reasons and resolvable
  supporting transaction references.
- Validate the entire CSV before writes. Reject the whole file if its
  structure or any row is invalid; do not leave partial records.
- Commit an accepted import and its generated records in one database
  transaction. A database/analysis failure is an operation failure, never a
  successful import.
- Cases are created only by explicit human action. Preserve exactly
  `Pending`, `Reviewed`, and `Escalated`; any distinct-status transition is
  allowed. A same-status selection is a no-op with no status-change audit
  event. Commit an actual status change and its audit event atomically.
- Keep API response fields aligned with the approved Data Model before
  implementing endpoints. Avoid Prisma unless implementation demonstrates a
  concrete need. Do not choose the SQLite driver until the Node.js runtime
  version is pinned.
- Keep each work item focused on approximately 1–2 hours where practical.
  Split a task further rather than relaxing its acceptance criteria if it
  proves larger.

### Assumptions and exclusions

- The four-day sequence is a planning target, conditional on timely human
  decisions listed below. Do not silently substitute defaults. If a blocking
  decision remains open, stop or continue only with unblocked work and seek
  approval for a revised sequence.
- No application code, test suite, package commands, or local database is
  present at planning time. Select and document actual tooling/commands during
  the approved implementation work; do not treat example commands as
  verified.
- Authentication, multi-user roles, remote access, external AML services,
  real customer data, production deployment, regulatory/compliance claims,
  automated accusations, financial decisions, numeric risk probabilities,
  and automatic startup re-analysis are excluded.
- Backup, recovery, retention, deletion, performance targets, and test
  coverage targets are not invented here. Optional browser automation and
  other stretch work are deferred.

## 2. Work breakdown and recommended four-day execution order

Tasks are ordered by dependency. “Verify” describes a planned check; exact
commands are selected only after the project tooling exists and must be
recorded with actual results when run. A blocked task may not be implemented
by guessing an unresolved product decision.

### Day 1 — Minimal runnable application and health check

| Task | Stories / traceability | Depends on | Acceptance criteria | Verification |
|---|---|---|---|---|
| SP-01 Pin the Node.js runtime and record the selected version | US-012, US-023; Technical Architecture | Human decision | A specific runtime version is explicitly selected and documented for this prototype; no SQLite driver is selected before this. | Inspect the runtime/version declaration and confirm the local runtime matches it. |
| SP-02 Scaffold the minimal frontend and backend | US-023; FRD-020, NFR-001 | SP-01 | React + Vite + TypeScript frontend and Node.js + Express + TypeScript backend start locally; keep dependencies and layout minimal. | Start both development processes using documented commands; load the initial UI and confirm the API process starts. |
| SP-03 Implement and verify the health-check endpoint | US-023; FRD-020, NFR-001 | SP-02 | A local health endpoint returns an explicit healthy response; the frontend/API development arrangement is documented without claiming persistence exists. | Request the endpoint locally and verify the expected response; confirm a failed server is not shown as healthy. |

### Day 2 — SQLite foundation and CSV validation/import

| Task | Stories / traceability | Depends on | Acceptance criteria | Verification |
|---|---|---|---|---|
| SP-04 Select the SQLite driver and configure the local database | US-012; Technical Architecture | SP-01; explicit driver decision after runtime pin | Select a compatible driver only after SP-01. Read the database location from `AML_DATABASE_PATH`, keep the file outside the repository, and ignore local database/local-only configuration files. Do not add Prisma without a demonstrated need. | Start against a local path supplied through the setting; verify the file is outside the repository and ignored by version control. |
| SP-05 Implement approved persistence records and startup loading | US-012; Data Model; Technical Architecture | SP-04; review API fields against Data Model before endpoint implementation | Persist transactions, flags, explanations, evidence references, cases, and audit events as modeled. Reload persisted review data after restart; do not rerun or replace saved flags on startup. | Persist synthetic records, restart, and inspect the same records and evidence; verify startup did not regenerate flags. |
| SP-06 Resolve and approve CSV contract decisions | US-001, US-002; FRD-001–FRD-004 | Human decision; before CSV implementation | Obtain explicit decisions for required/optional columns, encoding/quoting, timestamp and currency/amount semantics, duplicate IDs, empty valid files, capacity limits, and oversized-file behavior. Do not fill these in within this plan. | Human review confirms a versioned CSV contract is available to implement; otherwise mark dependent work blocked. |
| SP-07 Validate CSV structure and every row | US-001; FRD-001–FRD-004; NFR-003, NFR-007, NFR-014 | SP-06 | Reject unsupported or structurally invalid input and identify each invalid row with actionable errors. Treat cells as data, not executable content. Validation finishes before persistence starts. | Use synthetic valid, malformed-structure, multiple-invalid-row, and unsupported-format inputs; verify row/file errors and no writes on rejection. |
| SP-08 Prepare import orchestration and failure handling | US-002, US-017; FRD-001–FRD-004; NFR-003, NFR-015 | SP-04–SP-07 | Prepare the server-side path from validated input through analysis and persistence. Do not return success until transactions and generated flags/evidence commit together; final acceptance wiring follows SP-17. A persistence failure must be surfaced, not shaped as success. | Exercise the failure path and verify it returns an operation failure; review the orchestration boundary for whole-file validation before writes. |

### Day 3 — Four deterministic rules and scenario verification

Each rule task depends on an explicitly approved rule definition, including
inputs, parameters, matching semantics, and comparison boundaries. Scenario
fixtures must cover positive, negative, benign-lookalike, and threshold
boundary cases. Until boundary semantics are approved, preserve the boundary
setup and mark its expected outcome **Pending**; do not assert a guessed
outcome or invent a threshold.

| Task | Stories / traceability | Depends on | Acceptance criteria | Verification |
|---|---|---|---|---|
| SP-09 Implement rapid fund movement rule | US-005; FRD-007, FRD-019; NFR-006 | SP-06; approved rapid-movement definition; normalized synthetic input | Implement only approved parameters and matching behavior; emit category, reason, and supporting transaction references; no score or accusation. | Evaluate the approved positive, negative, and benign-lookalike scenarios; confirm evidence resolves. Boundary setup/outcome follows the rule-definition gate. |
| SP-10 Add rapid-movement fixture and rule tests | US-013, US-018; FRD-019; NFR-005, NFR-012 | SP-09 | Record stable synthetic positive, negative, benign-lookalike, and boundary cases. Keep threshold-dependent boundary expected outcomes pending until approved. | Run the documented focused test command twice and compare scenario outcomes; record actual results without accuracy claims. |
| SP-11 Implement repeated transfers rule | US-006; FRD-008, FRD-019; NFR-006 | SP-06; approved repeated-transfer definition; normalized synthetic input | Implement only approved parameters and matching behavior; flag all supporting transfers with explanation and evidence. | Evaluate positive, negative, and benign-lookalike cases; resolve evidence references. Keep boundary result pending as needed. |
| SP-12 Add repeated-transfer fixture and rule tests | US-014, US-019; FRD-019; NFR-005, NFR-012 | SP-11 | Include positive, negative, benign-lookalike, and below/equal/above boundary setup where applicable; do not invent boundary outcomes. | Run focused tests repeatedly; verify deterministic results and evidence; report pending boundary assertions explicitly. |
| SP-13 Implement circular flows rule | US-007; FRD-009, FRD-019; NFR-006 | SP-06; approved circular-flow definition; normalized synthetic input | Implement only approved cycle matching and parameters; evidence references transactions forming the cycle. | Evaluate positive cycle, negative, and benign-lookalike cases; verify cycle evidence. Keep boundary result pending as needed. |
| SP-14 Add circular-flow fixture and rule tests | US-015, US-020; FRD-019; NFR-005, NFR-012 | SP-13 | Include positive, negative, benign-lookalike, and applicable boundary setups; boundary expectations remain pending until approved. | Run focused tests repeatedly; verify stable results and referenced cycle transactions; record unresolved boundary assertions. |
| SP-15 Implement structuring-like patterns rule | US-008; FRD-010, FRD-019; NFR-006 | SP-06; approved structuring-like definition and currency/amount semantics; normalized synthetic input | Implement only approved amount, count, time-window, and matching behavior; do not compare amounts across currencies. Emit explainable evidence. | Evaluate positive, negative, and benign-lookalike cases using approved semantics; keep boundary outcome pending until thresholds/precision/comparisons are approved. |
| SP-16 Add structuring-like fixture and rule tests | US-016, US-021; FRD-019; NFR-005, NFR-012 | SP-15 | Include positive, negative, benign-lookalike, and applicable below/equal/above boundary setups. Do not invent thresholds or expected boundary results. | Run focused tests repeatedly; verify evidence and deterministic scenarios; report boundary assertions as pending where unresolved. |

### Day 4 — Dashboard, cases, integration, tests, and demo

| Task | Stories / traceability | Depends on | Acceptance criteria | Verification |
|---|---|---|---|---|
| SP-17 Complete atomic CSV import with generated records | US-002, US-017; FRD-001–FRD-004; NFR-003, NFR-015 | SP-08–SP-16 | Validate the entire file first; then persist accepted import, transactions, generated flags, and evidence in one SQLite transaction. A failed write/analysis is failure with no partial submission. | Test valid import, invalid structure/rows, prior-data preservation, and write failure; inspect persisted records after each case. |
| SP-18 Reconcile API shapes and build dashboard summaries | US-003; FRD-005, FRD-016–FRD-018; NFR-009 | SP-05; API fields reviewed against Data Model; explicit multiple-import scope decision | Show accepted transaction count, distinct flags, all four category counts, and all three case-status counts; distinguish empty data, no matches, and failure. Do not pick a multiple-import policy without approval. | Compare API/UI values to synthetic persisted records for the approved dataset scope; verify zero counts and failure state. |
| SP-19 Implement approved filters | US-004; FRD-006; NFR-009 | SP-18; explicit currency semantics for amount filters; approved CSV timestamp semantics | Apply approved view-specific filters with AND and inclusive ranges; clearing restores the view. Do not compare amounts across currencies. Ordering/pagination remain open unless separately approved. | Exercise each applicable filter and combinations with synthetic records; verify no-results differs from empty data/failure; defer amount filter until currency decision. |
| SP-20 Present flags, explanations, and supporting evidence | US-009; FRD-011–FRD-012; NFR-004, NFR-011–NFR-012 | SP-05, SP-09–SP-16 | Show each flag's category, understandable reason, and resolvable supporting records; describe flags only as human-review indicators, without numeric probability or accusation. | Open synthetic flags for all categories and resolve every displayed evidence reference. |
| SP-21 Implement explicit case creation | US-010; FRD-013; NFR-008 | SP-20; Data Model/API response reconciliation | A human can create at most one case from a selected flag; new case starts `Pending`; duplicate creation is reported without creating another case. Case-creation audit remains optional unless explicitly approved. | Create a case, repeat the request, and inspect persisted state and the approved response/error behavior. |
| SP-22 Implement status changes and audit atomically | US-011, US-022; FRD-014–FRD-015; NFR-008, NFR-015–NFR-016 | SP-21; explicit actor-label/audit action decision for implementation | Accept exactly `Pending`, `Reviewed`, `Escalated`; allow all six distinct transitions. Same-status selection is a no-op with no status-change event. Commit a real change and required audit event atomically; write failure is not success. | Test all six transitions, three no-ops, and failure rollback; verify timestamp, action, actor label, previous/new status on committed changes. |
| SP-23 Complete accessible local UI journeys | US-024; NFR-013 | SP-07, SP-19–SP-22 | Primary import, filter, flag inspection, case, and status journeys work by keyboard; controls have visible focus and accessible labels. Make no claim of conformance to an unapproved standard. | Perform a keyboard-only walkthrough and inspect focus and accessible names. |
| SP-24 Integrate and demonstrate the end-to-end review journey | US-023; FRD-020; NFR-001 | SP-03, SP-17–SP-23; resolved decisions for included journeys | Demonstrate import, dashboard, filters, flag/evidence inspection, manual case creation, status update, and audit inspection through the local UI. This verifies integration and does not duplicate feature acceptance criteria. For demo, Express serves the built frontend in one application process. | Follow verified local setup/run instructions with the synthetic fixture; record actual observed outcome and any blockers. |
| SP-25 Complete automated test and failure checks | US-017–US-022; NFR-003–NFR-008, NFR-015–NFR-016 | Corresponding feature tasks SP-07–SP-22 | Tests cover import atomicity, each rule and evidence, cases, transitions/no-ops, audit atomicity, and operation failures; deterministic synthetic inputs only. Boundary outcomes unresolved by approval are marked pending, not passed. | Run the actual documented test command(s); record environment, result, and known pending cases. Repeat deterministic fixture checks. |
| SP-26 Write local demo and troubleshooting instructions | US-023; NFR-001–NFR-002, NFR-012 | SP-24–SP-25 | Document actual prerequisites, setup, development run, single-process demo, `AML_DATABASE_PATH` configuration without OS-specific assumptions, synthetic fixture use, tests, limitations, and safe interpretation. Do not claim unverified commands or production readiness. | Have a reviewer follow the documented steps from a clean local setup and record actual outcomes. |

## Decision and dependency gates

These remain open in the approved source documents. The Sprint Plan does not
choose their values; obtain human decisions and update the appropriate
approved contract/design through its own authorized review before dependent
implementation.

| Open decision | Work blocked until explicitly decided |
|---|---|
| Node.js runtime version | SP-01 completion; compatible SQLite driver selection in SP-04. |
| SQLite driver | SP-04 and dependent persistence work SP-05, SP-08, SP-17. Select only after the runtime is pinned. |
| CSV required/optional columns, encoding/quoting, timestamp/time-zone and amount/currency semantics | SP-06–SP-08, SP-17; any rule/filter relying on those inputs. |
| Empty but otherwise valid CSV behavior | Final acceptance behavior in SP-06–SP-08 and corresponding tests. |
| Duplicate transaction-ID behavior | CSV validation/normalization and persistence in SP-06–SP-08, SP-17. Do not add uniqueness behavior by assumption. |
| CSV size/row limits and oversized-file behavior | Upload handling and acceptance tests in SP-06–SP-08, SP-17. |
| Rule thresholds, windows, inputs, matching semantics, configuration, and boundary comparisons for each of the four patterns | SP-09–SP-16 and any import result relying on those rules. Boundary outcomes stay pending until approved. |
| Multiple-import behavior for analysis, dashboard counts, and lists | SP-08, SP-17–SP-19 and integrated demo scope. Do not combine, replace, or select imports by assumption. |
| Currency semantics and amount filtering/comparison | Structuring-like rule work SP-15–SP-16 and amount filters in SP-19. Never compare across currencies without an approved rule. |
| API response fields/nullability versus Data Model | Endpoint implementation in SP-08, SP-17–SP-22; reconcile before implementation as accepted in the contract caveat. |
| Audit actor-label value/format and additional action scope | SP-21–SP-22 where those details are required. Status-change audit fields and atomicity remain mandatory. |
| Audit retention, backup, recovery, deletion, and local data cleanup | No retention/deletion or recovery behavior may be implemented or claimed as settled; document limitations in SP-26. |
| Performance/resource workload and targets | No measurable performance claim or pass/fail target in SP-25–SP-26 until approved. |
| Ordering, pagination, exact error vocabulary, and test runner/coverage | Implement only if separately decided; do not add unapproved API behavior or coverage thresholds. |

## 4. Verification approach

- **Scaffold/health:** Verify the declared local runtime, frontend and API
  startup, and health endpoint manually. Record exact commands only after
  they are established and executed.
- **Persistence/import:** Use synthetic fixtures. Verify persisted records
  across restart, no automatic flag regeneration, all-row validation before
  writes, atomic commit/rollback, and visible failure on persistence errors.
- **Rules:** For each rule, verify positive, negative, benign-lookalike, and
  boundary setups; inspect category, explanation, and resolvable evidence.
  Mark boundary expected outcomes pending while rule semantics are open.
- **Dashboard/filters:** Compare displayed summaries and filtered records
  against the approved synthetic dataset and view semantics; do not run
  cross-currency amount comparisons.
- **Case/audit:** Verify exact statuses, all distinct transitions, no-op
  behavior, audit fields, atomic status/audit writes, and failure handling.
- **Integration/accessibility:** Walk through the local demo journey from the
  UI using the synthetic fixture and repeat primary actions with keyboard
  only.
- **Automated checks:** Select a test runner during implementation. Record
  executed commands and actual results; do not report planned or unrun checks
  as passed. Detailed test-plan/coverage exit criteria remain for the Test
  Plan stage.

## 5. Risk and dependency register

| Risk | Impact | Mitigation / response |
|---|---|---|
| Product decisions remain open | CSV, rules, summaries, amount filters, or audits could be implemented inconsistently. | Keep affected task IDs blocked; request explicit human decisions and approved source updates rather than inventing defaults. |
| Driver selected before runtime is pinned | Compatibility and persistence rework. | Enforce SP-01 before SP-04; avoid selecting Prisma or a driver prematurely. |
| Four-day target exceeds available short sessions | Partial prototype or rushed safeguards. | Prioritize the runnable scaffold and health check, then the dependency chain. Split 1–2-hour tasks; report actual capacity and seek a revised plan if needed. |
| Import atomicity spans validation, rules, and persistence | Partial records or success-shaped failure could corrupt review state. | Keep full acceptance orchestration gated until rules exist; test rollback and prior-data preservation. |
| Unresolved multi-import/currency semantics affect summaries and rules | Misleading counts or invalid comparisons. | Block affected dashboard/filter/rule tasks; never infer dataset selection or compare across currencies. |
| Local database or synthetic data is committed or mistaken for real evidence | Privacy and repository hygiene risk. | Keep `AML_DATABASE_PATH` outside the repository, ignore local database/configuration files, and inspect the final change set. |
| Flags could be interpreted as conclusions | Harmful overstatement or unsupported use. | Use neutral explanations, synthetic-only examples, clear human-review language, and no accusations, probabilities, or financial decisions. |
| Demo/test documentation could imply unverified behavior | Users may rely on nonexistent commands or capabilities. | Document only commands and outcomes actually verified; identify pending boundary decisions and limitations. |

## 6. Definition of done — local educational demo

- [ ] Plan approved before Development; all decisions required by the chosen
      implementation scope are explicitly resolved at their proper human
      gates.
- [ ] Frontend and backend run locally, health check works, and the
      development and one-process demo topologies are documented.
- [ ] SQLite persistence uses the approved driver selected after runtime
      pinning; database path is configured by `AML_DATABASE_PATH`, outside
      the repository, and local DB/config files are ignored.
- [ ] Synthetic CSV is validated in full before writes; invalid imports are
      wholly rejected with actionable row-level errors; accepted transactions
      and their generated records commit atomically; failed writes are shown
      as failures.
- [ ] Four approved deterministic rules provide explanations and supporting
      references; each has positive, negative, benign-lookalike, and boundary
      scenario coverage. Any boundary result not yet approved is explicitly
      pending and is not reported as passed.
- [ ] Dashboard, approved filters, and flag/evidence inspection distinguish
      empty state, no results, and operational failure; amount comparisons
      follow approved currency semantics only.
- [ ] Cases are human-created and persisted with exact statuses; distinct
      status changes and their audit events are atomic, while same-status
      selection creates no status-change event.
- [ ] Persisted flags/evidence, cases, and audit data load after restart;
      startup does not rerun detection or replace saved flags.
- [ ] Automated tests and accessible end-to-end demo journey are run and
      their actual results documented. Only synthetic data is used.
- [ ] Demo materials state that flags are indicators for human review, not
      proof; make no autonomous accusation, financial decision, numeric
      probability, real-world accuracy, production, or compliance claim.

## 7. Human review and approval

### Scope and dependency review checklist

- [ ] Confirm the four-day sequence and approximately 1–2-hour focused
      sessions are realistic for available capacity.
- [ ] Confirm the minimal React/Vite/TypeScript and
      Node.js/Express/TypeScript scaffold with health check is first.
- [ ] Confirm SQLite driver selection follows Node.js runtime pinning and
      `AML_DATABASE_PATH` stays outside the repository.
- [ ] Confirm CSV and detection decision gates remain open and dependent tasks
      are blocked until approved.
- [ ] Confirm multiple-import, currency, audit, retention/recovery/deletion,
      capacity, performance, and other listed decisions are not silently
      settled by this plan.
- [ ] Confirm whole-file rejection, atomic persistence, exact case statuses,
      status/audit atomicity, and same-status no-op are preserved.
- [ ] Confirm all four rules include positive, negative, benign-lookalike,
      and boundary scenarios, with threshold-dependent outcomes pending.
- [ ] Confirm synthetic-only data and human-review safeguards, with no
      autonomous accusation, financial decision, probability, or production
      claim.
- [ ] Confirm optional work is deferred and no Development begins before this
      plan is explicitly approved.

**Reviewer:** Rakesh
**Decision and date:** Approved, 2026-10-20.
**Requested changes:** None. Remaining open decisions listed in this plan are
implementation gates and are not resolved by this approval.
