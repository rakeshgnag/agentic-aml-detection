# User Stories

**Project:** AML Transaction Risk Identification System
**Version:** 0.2
**Status:** Approved
**Approval gate:** Review together with the Data Model and API Contract before
Sprint Plan work begins
**Review caveats accepted:** API response fields will be reconciled against
the Data Model before endpoint implementation; threshold-dependent boundary
outcomes remain pending until rule thresholds/semantics are approved; larger
stories will be subdivided into tasks during Sprint Planning.
**Sources:** Approved BRD, PRD, FRD, NFR, Logical Architecture, Technical
Architecture, and proposed contracts

> These are proposed, independently verifiable backlog items for the local
> educational MVP. They are not implementation evidence or approval. Keep
> work small enough for approximately 1–2-hour sessions where practical;
> the Sprint Plan must confirm actual capacity.

## Story inventory

| ID | Story | Priority | Dependencies |
|---|---|---|---|
| US-001 | Validate CSV structure and report actionable errors | Must | Approved CSV contract |
| US-002 | Accept a valid import atomically | Must | US-001; approved data/API contracts |
| US-003 | Display dashboard summaries and empty states | Must | US-002; multiple-import scope resolved before implementation |
| US-004 | Apply approved filters to transactions, flags, and cases | Must | US-003; currency semantics resolved before amount filtering |
| US-005 | Detect rapid fund movement in synthetic scenarios | Must | US-002; approved rapid-movement rule definition |
| US-006 | Detect repeated transfers in synthetic scenarios | Must | US-002; approved repeated-transfer rule definition |
| US-007 | Detect circular flows in synthetic scenarios | Must | US-002; approved circular-flow rule definition |
| US-008 | Detect structuring-like patterns in synthetic scenarios | Must | US-002; approved structuring-like rule definition |
| US-009 | Inspect flag explanations and supporting evidence | Must | US-005–US-008 |
| US-010 | Manually create one case from a flag | Must | US-009 |
| US-011 | Change case status and record its audit event | Must | US-010 |
| US-012 | Load persisted review data after restart | Must | Approved SQLite model; Node.js runtime/driver selection |
| US-013 | Add rapid-movement scenario fixture | Must | US-005; approved rapid-movement rule |
| US-014 | Add repeated-transfer scenario fixture | Must | US-006; approved repeated-transfer rule |
| US-015 | Add circular-flow scenario fixture | Must | US-007; approved circular-flow rule |
| US-016 | Add structuring-like scenario fixture | Must | US-008; approved structuring-like rule |
| US-017 | Verify import atomicity with automated tests | Must | US-001–US-002 |
| US-018 | Verify rapid-movement rule and evidence | Must | US-005, US-009, US-013 |
| US-019 | Verify repeated-transfer rule and evidence | Must | US-006, US-009, US-014 |
| US-020 | Verify circular-flow rule and evidence | Must | US-007, US-009, US-015 |
| US-021 | Verify structuring-like rule and evidence | Must | US-008, US-009, US-016 |
| US-022 | Verify case, status, and audit behavior | Must | US-010–US-011 |
| US-023 | Demonstrate the integrated local review journey | Must | US-001–US-012; implemented UI and local setup |
| US-024 | Complete primary journeys accessibly | Must | Implemented import, review, case, and status interfaces |

## Stories and acceptance criteria

### US-001 — Validate CSV structure and report actionable errors

**As a** local human reviewer, **I want** clear feedback when a synthetic CSV
is invalid, **so that** I can correct it before any of its records are
accepted.

**Sources:** BRD FR-001–FR-003, NFR-002–NFR-003, NFR-007; PRD Journey A and
“Import behavior”; FRD-001–FRD-004; NFR-003, NFR-007, NFR-014–NFR-015.

**Acceptance criteria**

1. Validate file structure and every row against the human-approved CSV
   contract before persistence begins.
2. For each invalid row, report its row and actionable issue; report
   file-level structural errors when a row number does not apply.
3. An invalid file or any invalid row rejects the entire submission; no
   transaction from it is passed to analysis or persisted.
4. Unsupported formats are rejected, and CSV cell contents are treated as
   data, not executable content.

**Out of scope:** CSV fields and semantics, duplicate IDs, file/row limits,
and oversized-file behavior until approved.

### US-002 — Accept a valid import atomically

**As a** local human reviewer, **I want** a wholly valid synthetic import
accepted as one operation, **so that** all its records are available
together or none are.

**Sources:** BRD FR-001–FR-003; PRD Journey A; FRD-001–FRD-004; NFR-003,
NFR-015.

**Acceptance criteria**

1. A valid CSV is analyzed and its accepted transactions, generated flags,
   and evidence links are committed together in one SQLite transaction.
2. Success is reported only after commit; a persistence/analysis failure is
   shown as failure and does not leave partial records from the submission.
3. A rejected submission does not alter previously accepted records.
4. The import result identifies this submission without deciding how
   multiple accepted imports are combined or selected.

**Out of scope:** Whether a valid empty CSV is accepted; multiple-import
analysis scope; rejected-attempt metadata; capacities.

### US-003 — Display dashboard summaries and empty states

**As a** local human reviewer, **I want** summary counts for the available
analysis dataset, **so that** I can understand what is available for review.

**Sources:** BRD FR-004, FR-014; PRD Journey B and Sections 5–6; FRD-005,
FRD-016–FRD-018; NFR-009.

**Acceptance criteria**

1. Show accepted transaction count, distinct flag count, flags by each of
   the four categories, and case counts for Pending, Reviewed, and Escalated,
   including zero counts.
2. Distinguish no accepted dataset, zero matches, and operational failure;
   do not fabricate counts or imply that no flags means no risk.
3. Rejected imports contribute no transactions or flags.
4. If summary retrieval fails, show failure rather than a success-shaped
   empty response.

**Out of scope:** Dataset aggregation/selection across multiple imports and
performance targets until approved.

### US-004 — Apply approved filters to transactions, flags, and cases

**As a** local human reviewer, **I want** to filter each review view using
its approved criteria, **so that** I can find relevant records.

**Sources:** BRD FR-010; PRD Journey B and Sections 5–6; FRD-006,
FRD-016–FRD-018; NFR-009.

**Acceptance criteria**

1. Expose applicable date, amount, rule-category, case-status, and
   transaction flagged/unflagged filters.
2. Combine active applicable filters with AND; range endpoints are
   inclusive. Follow all view-specific and linked-case behavior in FRD-006.
3. Clearing filters restores the current view; no matches show a no-results
   state distinct from empty data or failure.
4. Amount comparisons never cross currencies. Do not implement amount-range
   filtering until currency semantics and any necessary selection behavior
   are approved.

**Out of scope:** Multiple-import scope, ordering, pagination, timestamp
interpretation, and currency/amount semantics until approved.

### US-005 — Detect rapid fund movement in synthetic scenarios

**As a** local human reviewer, **I want** the approved rapid-movement rule
evaluated on accepted synthetic data, **so that** matching records can be
reviewed.

**Sources:** BRD FR-005, FR-015, FR-018; PRD “Risk indicators”; FRD-007,
FRD-019; NFR-006, NFR-012.

**Acceptance criteria**

1. The rule uses only its approved inputs and configurable definition.
2. The positive scenario produces the expected flag and supporting
   transactions when the approved conditions match.
3. The negative and benign-lookalike scenarios produce their approved
   outcomes when conditions are absent or fail.
4. The threshold-boundary scenario covers below, exactly at, and above each
   applicable approved boundary; expected outcomes are specified only after
   threshold and comparison semantics are approved.

### US-006 — Detect repeated transfers in synthetic scenarios

**As a** local human reviewer, **I want** the approved repeated-transfer
rule evaluated on accepted synthetic data, **so that** matching activity can
be reviewed.

**Sources:** BRD FR-006, FR-015, FR-018; PRD “Risk indicators”; FRD-008,
FRD-019; NFR-006, NFR-012.

**Acceptance criteria**

1. The rule uses only its approved inputs and configurable definition.
2. The positive scenario produces the expected flag and references all
   supporting transfers when approved conditions match.
3. Negative and benign-lookalike scenarios produce their approved outcomes.
4. The boundary scenario covers below, exactly at, and above every
   applicable approved boundary. Do not invent thresholds or equality
   outcomes.

### US-007 — Detect circular flows in synthetic scenarios

**As a** local human reviewer, **I want** the approved circular-flow rule
evaluated on accepted synthetic data, **so that** a qualifying cycle can be
reviewed.

**Sources:** BRD FR-007, FR-015, FR-018; PRD “Risk indicators”; FRD-009,
FRD-019; NFR-006, NFR-012.

**Acceptance criteria**

1. The rule uses only its approved inputs and configurable definition.
2. The positive cycle produces the expected flag referencing the
   transactions forming that cycle.
3. Negative and benign-lookalike scenarios produce their approved outcomes.
4. The boundary scenario covers below, exactly at, and above every
   applicable approved boundary; expected results await approved
   thresholds and comparison conventions.

### US-008 — Detect structuring-like patterns in synthetic scenarios

**As a** local human reviewer, **I want** the approved structuring-like rule
evaluated on accepted synthetic data, **so that** qualifying synthetic
activity can be reviewed.

**Sources:** BRD FR-008, FR-015, FR-018; PRD “Risk indicators”; FRD-010,
FRD-019; NFR-006, NFR-012.

**Acceptance criteria**

1. The rule uses only its approved inputs and configurable definition.
2. The positive scenario produces the expected flag with supporting
   transactions when approved conditions match.
3. Negative and benign-lookalike scenarios produce their approved outcomes.
4. The boundary scenario covers below, exactly at, and above each
   applicable approved boundary; do not invent thresholds, windows, or
   equality behavior.

### US-009 — Inspect flag explanations and supporting evidence

**As a** local human reviewer, **I want** every flag to explain its rule
match and link to supporting transactions, **so that** I can independently
assess the indicator.

**Sources:** BRD FR-009, NFR-004, NFR-011–NFR-012; PRD “Risk indicators”
and “Safe interpretation”; FRD-011–FRD-012; NFR-004, NFR-011–NFR-012.

**Acceptance criteria**

1. Each flag exposes its category, understandable reason, and resolvable
   supporting transaction references.
2. Persisted flag and evidence details load after restart; startup does not
   rerun detection or replace them.
3. Display no numeric risk score/probability; describe flags only as
   indicators for human review, never proof or an accusation.

### US-010 — Manually create one case from a flag

**As a** local human reviewer, **I want** to create a case only for a flag I
select, **so that** case creation remains my decision.

**Sources:** BRD FR-011–FR-013; PRD Journey C; FRD-013, FRD-015, FRD-018.

**Acceptance criteria**

1. Detection does not create cases. Explicit creation links a case to the
   selected flag and initializes it to `Pending`.
2. At most one case exists per flag; a repeated create attempt adds none and
   reports the conflict.
3. Case creation and any recorded audit event that is adopted in the
   approved contract persist consistently; case-creation audit itself is
   not currently an approved mandatory event.
4. Failed writes are shown as failures, not successful creation.

### US-011 — Change case status and record audit event

**As a** local human reviewer, **I want** to manage case status and inspect
its history, **so that** review remains human-controlled and traceable.

**Sources:** BRD FR-012–FR-013, NFR-008; PRD Journey C; FRD-014–FRD-015,
FRD-018; NFR-008, NFR-015–NFR-016.

**Acceptance criteria**

1. Only `Pending`, `Reviewed`, and `Escalated` are accepted.
2. The six permitted transitions are Pending→Reviewed, Pending→Escalated,
   Reviewed→Pending, Reviewed→Escalated, Escalated→Pending, and
   Escalated→Reviewed.
3. Selecting the current status is a no-op and creates no status-change
   audit event.
4. A distinct status change atomically persists status and audit event with
   timestamp, action, actor label, previous status, and new status.
5. A failed transaction is reported as failure and not shown as a completed
   change. Available persisted audit history is inspectable.

### US-012 — Load persisted review data after restart

**As a** local human reviewer, **I want** accepted transactions, flags and
evidence, cases, and audit events to remain available after restart, **so
that** I can continue review.

**Sources:** Technical Architecture, “Data persistence and migration
approach”; BRD FR-011–FR-013; FRD-013–FRD-015.

**Acceptance criteria**

1. After successful import and application restart, all persisted review
   records remain inspectable.
2. Startup loads saved flags without rerunning detection or replacing them.
3. Express accesses the single SQLite file configured by `AML_DATABASE_PATH`;
   failed commits are not reported as success.

**Out of scope:** Driver until runtime is pinned; backup, recovery, retention,
deletion, and multiple-import behavior.

### US-013 — Add rapid-movement scenario fixture

**As a** project reviewer, **I want** fixed synthetic examples for the
rapid-movement rule, **so that** its approved behavior is reproducible.

**Sources:** BRD FR-005, FR-015; PRD “Risk indicators” and Section 6;
FRD-007, FRD-019; NFR-002, NFR-005, NFR-012.

**Acceptance criteria**

1. In `aml-synthetic-demo-v1`, document positive, negative,
   benign-lookalike, and boundary setups for rapid fund movement, with stable
   synthetic IDs/timestamps, expected outcomes, and reasons.
2. Boundary setup covers below, exactly at, and above each applicable
   approved boundary. Keep expected boundary outcomes pending until rule
   thresholds, precision, and comparison semantics are approved.
3. Record boundary expected outcomes as pending, not as test pass/fail
   assertions, until thresholds and comparison semantics are approved. No
   threshold is invented and fixture results are not accuracy claims.

### US-014 — Add repeated-transfer scenario fixture

**As a** project reviewer, **I want** fixed synthetic examples for the
repeated-transfer rule, **so that** its approved behavior is reproducible.

**Sources:** BRD FR-006, FR-015; PRD “Risk indicators” and Section 6;
FRD-008, FRD-019; NFR-002, NFR-005, NFR-012.

**Acceptance criteria**

1. Document positive, negative, benign-lookalike, and boundary setups for
   repeated transfers with stable synthetic IDs/timestamps, outcomes, and
   reasons.
2. Boundary setup covers below, exactly at, and above applicable approved
   boundaries; record outcomes as pending until rules are approved. Do not
   invent thresholds or equality outcomes.
3. Record the scenario in the fixed fixture manifest; make no accuracy
   claim.

### US-015 — Add circular-flow scenario fixture

**As a** project reviewer, **I want** fixed synthetic examples for circular
flows, **so that** cycle behavior is reproducible.

**Sources:** BRD FR-007, FR-015; PRD “Risk indicators” and Section 6;
FRD-009, FRD-019; NFR-002, NFR-005, NFR-012.

**Acceptance criteria**

1. Document positive, negative, benign-lookalike, and boundary setups for
   circular flows using stable synthetic IDs/timestamps, outcomes, and
   reasons.
2. Boundary setup covers below, exactly at, and above applicable approved
   boundaries; record outcomes as pending until rules are approved. Do not
   invent thresholds, matching, or equality behavior.
3. Record the scenario in the fixed fixture manifest; make no accuracy
   claim.

### US-016 — Add structuring-like scenario fixture

**As a** project reviewer, **I want** fixed synthetic examples for
structuring-like patterns, **so that** their approved behavior is
reproducible.

**Sources:** BRD FR-008, FR-015; PRD “Risk indicators” and Section 6;
FRD-010, FRD-019; NFR-002, NFR-005, NFR-012.

**Acceptance criteria**

1. Document positive, negative, benign-lookalike, and boundary setups for
   structuring-like patterns using stable synthetic IDs/timestamps, outcomes,
   and reasons.
2. Boundary setup covers below, exactly at, and above applicable approved
   boundaries; record outcomes as pending until rules are approved. Do not
   invent thresholds, amount semantics, or equality behavior.
3. Record the scenario in the fixed fixture manifest; make no accuracy
   claim.

### US-017 — Verify import atomicity with automated tests

**As a** developer, **I want** repeatable tests for valid and invalid
imports, **so that** whole-file rejection and persistence integrity can be
checked.

**Sources:** BRD FR-001–FR-003, FR-016, NFR-003; FRD-001–FRD-004;
NFR-003, NFR-005, NFR-015.

**Acceptance criteria**

1. Automated cases cover valid import, invalid file structure, multiple
   invalid rows, and unexpected write failure using synthetic inputs.
2. Invalid submissions leave none of their records stored and do not alter
   previously accepted data.
3. Test commands/results are reported only after actual execution.

### US-018 — Verify rapid-movement rule and evidence

**As a** developer, **I want** repeatable tests for rapid movement and its
evidence references, **so that** flags match approved scenarios.

**Sources:** BRD FR-005, FR-009, FR-015–FR-016; FRD-007, FRD-011–FRD-012,
FRD-019; NFR-004–NFR-006, NFR-012.

**Acceptance criteria**

1. Test the rapid-movement positive, negative, benign-lookalike, and
   approved boundary scenarios. Boundary assertions remain pending until
   rule thresholds and comparison semantics are approved.
2. Verify each emitted rapid-movement flag has its category, reason, and
   references resolving to its supporting synthetic transactions.
3. Record outcomes as scenario behavior, not accuracy claims.

### US-019 — Verify repeated-transfer rule and evidence

**As a** developer, **I want** repeatable tests for repeated transfers and
evidence references, **so that** the rule follows its approved scenarios.

**Sources:** BRD FR-006, FR-009, FR-015–FR-016; FRD-008, FRD-011–FRD-012,
FRD-019; NFR-004–NFR-006, NFR-012.

**Acceptance criteria**

1. Test repeated-transfer positive, negative, benign-lookalike, and approved
   boundary scenarios. Boundary assertions remain pending until rule
   thresholds and comparison semantics are approved.
2. Verify an emitted flag has its category, reason, and references resolving
   to the scenario's supporting transactions.
3. Record results as synthetic scenario behavior, not accuracy claims.

### US-020 — Verify circular-flow rule and evidence

**As a** developer, **I want** repeatable tests for circular flows and
evidence references, **so that** cycle results follow approved scenarios.

**Sources:** BRD FR-007, FR-009, FR-015–FR-016; FRD-009, FRD-011–FRD-012,
FRD-019; NFR-004–NFR-006, NFR-012.

**Acceptance criteria**

1. Test circular-flow positive, negative, benign-lookalike, and approved
   boundary scenarios. Boundary assertions remain pending until rule
   thresholds and comparison semantics are approved.
2. Verify an emitted flag references the transactions forming the expected
   synthetic cycle.
3. Record results as scenario behavior, not accuracy claims.

### US-021 — Verify structuring-like rule and evidence

**As a** developer, **I want** repeatable tests for structuring-like
patterns and evidence references, **so that** results follow approved
scenarios.

**Sources:** BRD FR-008–FR-009, FR-015–FR-016; FRD-010–FRD-012, FRD-019;
NFR-004–NFR-006, NFR-012.

**Acceptance criteria**

1. Test structuring-like positive, negative, benign-lookalike, and approved
   boundary scenarios. Boundary assertions remain pending until rule
   thresholds and comparison semantics are approved.
2. Verify an emitted flag has a reason and references the expected
   supporting synthetic transactions.
3. Record results as scenario behavior, not accuracy claims.

### US-022 — Verify case, status, and audit behavior

**As a** developer, **I want** repeatable tests for case constraints and
status/audit writes, **so that** human review history remains consistent.

**Sources:** BRD FR-011–FR-013, NFR-008; FRD-013–FRD-015, FRD-018;
NFR-008, NFR-015–NFR-016.

**Acceptance criteria**

1. Test explicit case creation, initial `Pending`, and prevention of a
   second case for the same flag.
2. Test all six distinct status transitions and all three same-status
   no-ops.
3. Verify actual changes persist the required audit fields atomically; a
   failed write is not displayed as a completed change.
4. Do not require a case-creation audit event unless that proposal is
   separately approved.

### US-023 — Demonstrate the integrated local review journey

**As a** local human reviewer, **I want** to complete the review journey
through the local interface, **so that** I can use the application without
inspecting source code.

**Sources:** BRD FR-017, NFR-001; PRD Journeys A–C and “Local use”;
FRD-020; NFR-001.

**Acceptance criteria**

1. As an integration/demo check, demonstrate import, dashboard, filter,
   flag/evidence inspection, manual case creation, status update, and audit
   inspection using the local app and synthetic fixture.
2. This story verifies end-to-end integration across already implemented
   feature stories; it does not redefine or duplicate their individual
   feature acceptance criteria.
3. Use only verified local setup/run instructions; this story does not claim
   that the application or commands currently exist.

### US-024 — Complete primary journeys accessibly

**As a** local human reviewer, **I want** the primary interface journeys to
be keyboard-operable and clearly labelled, **so that** I can use the MVP
without relying on a mouse.

**Sources:** BRD FR-017; PRD Journeys A–C; NFR-013.

**Acceptance criteria**

1. Complete primary import, filter, flag inspection, case creation, and
   status-update journeys using only the keyboard.
2. Interactive controls have visible focus and accessible labels.
3. Record verification outcomes without claiming conformance to an
   unapproved accessibility standard.

## Dependencies and delivery notes

- US-001 precedes US-002. The approved CSV contract is a prerequisite; empty
  valid-file semantics and capacities remain unresolved.
- US-003 must not implement summary behavior until multiple-import scope is
  approved. US-004 amount filtering also depends on approved currency
  semantics.
- US-005–US-008 each depend on their own approved rule definition; US-009
  depends on their flag output.
- US-013–US-016 create per-rule fixtures; US-017–US-022 verify separate
  import, rule/evidence, and case/audit slices. The Sprint Plan may further
  subdivide where work exceeds a 1–2-hour session.
- US-023 is an integration/demo verification story, not a replacement for
  feature-level acceptance checks. US-024 covers keyboard and label
  verification separately.
- All Must scope targets the four-day MVP; sizing and achievable sequencing
  require review in the Sprint Plan stage.

## Deferred scope

- Authentication, multi-user roles, remote access, external integrations,
  public/real customer data, production deployment, and regulatory claims.
- Automated accusations, law-enforcement conclusions, blocking, financial
  decisions, numeric risk probabilities, and automatic startup re-analysis.
- CSV capacity and oversized-file behavior; rule thresholds and matching
  semantics; multiple-import policy; currency semantics; audit scope and
  actor-label representation; retention, backup, recovery, deletion; runtime
  version/SQLite driver; performance and test coverage targets.

## Combined approval checklist

- [x] Review proposed model entities, fields, constraints, relationships,
      and unresolved import/duplicate behavior.
- [x] Review proposed endpoint shapes, responses, status codes, errors, and
      currency constraints.
- [x] Confirm model, API, and stories agree on atomic imports, persisted
      flags/evidence, manual cases, statuses, and audit behavior.
- [x] Confirm all four rules have positive, negative, benign-lookalike, and
      boundary scenarios without invented thresholds or boundary outcomes.
- [x] Confirm story scope, dependencies, traceability, and 1–2-hour
      work-item sizing for the subsequent Sprint Plan.
- [x] Confirm unresolved decisions remain open and all data is synthetic.
- [x] Confirm risk flags remain indicators for human review and no
      accusation, financial decision, probability, or production claim is
      introduced.

**Status:** Approved.
**Reviewer:** Rakesh.
**Decision and date:** Approved as Version 0.2 baseline for the next SDLC stage, 2026-10-20.
**Requested changes:** None. Accepted caveats are recorded above.
