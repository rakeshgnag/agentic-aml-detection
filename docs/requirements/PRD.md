# Product Requirements Document (PRD)

**Project:** AML Transaction Risk Identification System  
**Version:** 0.1  
**Status:** Approved
**Source:** Approved `docs/requirements/BRD.md` (Version 0.2)  
**Target:** Four-day educational MVP  
**Deployment context:** Local development environment

## 1. Product summary

The product is a locally run educational web application for one human user to
import synthetic transaction data, inspect transaction and risk-indicator
summaries, review explainable indicators for four configured transaction
patterns, and manually create and manage cases from selected flags.

A risk flag means that a configured rule matched the available synthetic
records. It is an indicator for human review, not proof of money laundering.
The application must not make accusations or automate financial or
law-enforcement decisions. The MVP does not establish detection accuracy,
real-world effectiveness, regulatory compliance, or production readiness.

## 2. Product goals and outcomes

1. Let the local user import valid synthetic transaction data and understand
   validation failures.
2. Identify illustrative patterns for rapid fund movement, repeated transfers,
   circular flows, and structuring-like activity using configurable,
   transparent rules.
3. Make every displayed flag understandable through its rule category,
   explanation, and supporting transaction references, without a numeric risk
   score.
4. Let the user choose which flags warrant a manually created case and manage
   its Pending, Reviewed, or Escalated status.
5. Make case-status changes auditable and keep them under human control.
6. Provide a dashboard and filtering sufficient to review the accepted
   synthetic dataset.
7. Demonstrate the behavior with repeatable synthetic examples and tests,
   documenting limitations and avoiding claims of real-world effectiveness.

## 3. Users and primary journeys

### Primary user: Local human reviewer

The intended user is a financial crime analyst acting as a single local human
reviewer. The product does not provide authentication or multi-user roles in
this MVP.

### Review perspective

Compliance-review needs may be represented during demonstration, but the
compliance reviewer is not a separate account or permission role.

### Journey A: Import synthetic transactions

1. The user selects a synthetic CSV file.
2. The product validates the file and its rows before accepting any
   transaction from that import.
3. If all rows are valid under the CSV contract approved in the FRD, the
   product accepts the import and makes its transactions available for
   analysis.
4. If any row is invalid, the product rejects the entire import, gives
   actionable row-level errors, and leaves no transactions from that import
   stored.

### Journey B: Review risk indicators

1. The user opens the dashboard and views summaries for the accepted
   synthetic dataset.
2. The user filters transactions or flags using the behavior defined in the
   FRD.
3. The user opens a flag and sees its category, understandable explanation,
   and references to supporting transactions.
4. The user considers the indicator independently; the product does not
   present it as a conclusion about wrongdoing.

### Journey C: Create and manage a case

1. The user selects a flag and explicitly creates a linked case.
2. No case is created automatically for an unselected flag.
3. The user inspects the evidence and manages the case using Pending,
   Reviewed, or Escalated.
4. The product records timestamp, action, and actor label for audit entries;
   a status-change entry also records the previous and new status.
5. Updated case status and available audit history are shown to the user.

## 4. MVP scope

### Included

- One local human user, without authentication or multi-user roles.
- Synthetic transaction data only; no real customer data or public transaction
  dataset.
- CSV import with validation, atomic rejection on any invalid row, actionable
  row-level errors, and no partially stored transactions from a failed import.
- Dashboard summaries and user-facing filtering for transactions and flags.
- Configurable rule indicators for all four patterns:
  - Rapid fund movement.
  - Repeated transfers.
  - Circular flows.
  - Structuring-like patterns.
- Flags that show a rule category, explanation, and supporting transaction
  references. Numeric risk scores are excluded.
- Cases created manually by a human from a flag, with statuses Pending,
  Reviewed, or Escalated.
- Audit entries containing timestamp, action, and actor label; status changes
  additionally contain previous and new status.
- Synthetic expected-positive examples for each rule, benign lookalikes,
  negative examples, rule-boundary cases, and invalid CSV scenarios.
- Automated tests, local setup and demonstration instructions, and
  documentation of limitations and observed test outcomes.
- Delivery targeted to a four-day MVP sprint.

### Deferred or out of scope

- Production banking integrations, production deployment requirements,
  enterprise operations, and production identity management.
- Authentication and multi-user roles.
- Real customer or account-holder data and public transaction datasets.
- Production regulatory reporting, regulatory-compliance claims, or claims
  that the product replaces trained analysts.
- Automated accusations, law-enforcement conclusions, account freezes,
  transaction blocking, or other financial decisions.
- Numeric risk scores and claims of calibrated probability.
- Complex production-grade machine-learning pipelines.
- Any capability not needed to meet the approved MVP outcomes, unless
  separately approved.

## 5. Product behavior and usability expectations

### Import behavior

An import is treated as one unit. The product validates the entire CSV before
accepting transactions from it. Any invalid row causes the whole import to be
rejected. Errors must identify the affected row and explain the issue so the
user can correct the input. A rejected import must not leave any of its
transactions partially stored. Exact CSV columns, timestamp interpretation,
currency and amount semantics, duplicate-ID handling, and error response
details remain to be defined in the FRD and Data Model/API Contract.

### Risk indicators

The product evaluates the four in-scope rule patterns using approved
configuration. The exact thresholds, time windows, and matching logic remain
open for the FRD. Every flag must identify the applicable rule category,
explain why it was raised, and reference its supporting transactions. The MVP
does not display a numeric risk score. Flags are only indicators for human
review and must not be presented as proof of money laundering.

Synthetic scenarios and test results demonstrate specified behavior for the
configured rules; they do not establish detection accuracy or real-world
effectiveness. Documentation and demonstration should identify false
positives, benign lookalikes, limitations, and known failure cases.

### Case and audit behavior

A human decides whether to create a case from a flag. The MVP does not
automatically create a case for every flag. A case uses the statuses Pending,
Reviewed, and Escalated, with status changes managed by the human user.
Reopening and detailed transition rules remain for the FRD.

Audit entries record timestamp, action, and actor label. Case-status changes
also record the previous and new status. The scope of other recorded actions,
the actor-label representation, and persistence/retention details remain open
for later stages.

### Dashboard and review

The dashboard presents transaction, flag, and case-by-status summaries for
the accepted dataset. The user can filter and inspect transactions and
potential risk indicators without inspecting source code. Exact summary
fields, filter options, and filter behavior are deferred to the FRD.

## 6. Measurable success measures

The MVP outcome is demonstrated when:

| Measure | Acceptance evidence |
|---|---|
| Local use | One user follows the eventual setup instructions and completes the demonstration locally. |
| Valid import | A valid synthetic CSV is accepted and its transactions are available for analysis. |
| Atomic invalid-import handling | A CSV with one or more invalid rows is rejected in full, actionable row-level errors are shown, and no transactions from that import remain stored. |
| Rule behavior | At least one documented expected-positive synthetic scenario exists for each of the four rules and produces the documented flag under approved configuration. |
| Negative and boundary behavior | Documented benign lookalikes, negative cases, and cases at/inside/outside configured boundaries produce the outcomes specified by the approved rule definitions. |
| Explainability | Each displayed flag shows a rule category, understandable explanation, and supporting transaction references; no numeric risk score is displayed. |
| Human case workflow | The user can manually create a case from a flag and manage its status as Pending, Reviewed, or Escalated; no case is automatically created for every flag. |
| Auditability | Audit entries show timestamp, action, and actor label; status-change entries also show previous and new status. |
| Testability | Documented automated tests cover CSV validation and atomic rejection, all four rules, and core case workflows; actual run results are reported. |
| Safe interpretation | Product text and demonstration identify flags as human-review indicators and do not claim established real-world effectiveness or make automated decisions. |

These measures assess the defined educational scenarios and product behavior
only. They do not establish detection accuracy, effectiveness on real
transactions, regulatory compliance, or production readiness.

Detailed performance targets, test-coverage targets, and test exit criteria
are not set in this PRD; they remain for the NFR and Test Plan stages.

## 7. Assumptions, dependencies, and open decisions

### Approved baseline assumptions

- The BRD is the approved business baseline and is read-only during this PRD
  stage.
- The MVP is local, educational, and targeted for completion in four days.
- Synthetic transaction data only is permitted.
- One local human user operates the MVP; authentication and multi-user roles
  are deferred.
- Rule flags are explainable indicators for human review, not determinations
  of wrongdoing.
- Cases are manually created from flags and human-managed.
- Numeric risk scores are excluded.

### Dependencies

- The FRD must define the CSV contract and detailed user-visible behavior
  before implementation.
- The FRD must specify each rule’s threshold, window, matching logic, and
  expected behavior for positive, negative, benign-lookalike, and boundary
  scenarios.
- The NFR and Test Plan must define measurable quality expectations and test
  criteria without overstating what synthetic results establish.
- Logical and Technical Architecture must inspect the actual repository before
  selecting or asserting technologies.
- The Data Model/API Contract stage must define entities, interfaces, error
  formats, and the detailed audit representation.

### Open decisions by later stage

**FRD**

- Exact rule thresholds, time windows, and matching logic.
- CSV column contract; timestamp/time-zone interpretation; currency and amount
  semantics; duplicate-ID policy.
- Dashboard summary fields and detailed filtering behavior.
- Case reopening and detailed lifecycle transitions.

**NFR**

- Measurable performance targets.
- Backup and retention behavior suitable for the local MVP.

**Logical/Technical Architecture**

- Technology stack and repository-specific architecture, after repository
  inspection.

**Data Model/API Contract**

- Data model and API contracts, including error response formats.
- Detailed audit persistence and actor-label implementation.

**Test Plan**

- Detailed test selection, coverage targets, and measurable test exit
  criteria.

## 8. BRD traceability

| Product requirement area | Approved BRD references |
|---|---|
| Product goals, intended user, local educational scope | Objectives; Sections 1–4; NFR-001 |
| Synthetic-only data and atomic CSV import | FR-001–FR-003, FR-015; NFR-002–NFR-003, NFR-007 |
| Dashboard summaries and filtering | FR-004, FR-010, FR-014; NFR-009 |
| Rapid fund movement | FR-005 |
| Repeated transfers | FR-006 |
| Circular flows | FR-007 |
| Structuring-like patterns | FR-008 |
| Explainable category and evidence, no score | FR-009; NFR-004 |
| Manual case creation and statuses | FR-011–FR-012 |
| Audit record fields | FR-013; NFR-008 |
| Synthetic scenarios and automated tests | FR-015–FR-016; NFR-005, NFR-012 |
| Local setup and demonstration | FR-017; NFR-001 |
| Configurable thresholds and assumptions | FR-018; NFR-006 |
| Human review and no automated accusations/decisions | NFR-010–NFR-011; BRD Sections 1, 4, 9, and 10 |
| Four-day delivery constraint and deferred scope | BRD Sections 4, 11, and 12 |

## 9. Human review and approval

### Review checklist

- [ ] Product summary and user perspective match the approved BRD.
- [ ] All four rule categories are included, with no claim of proven accuracy or
      real-world effectiveness.
- [ ] Synthetic-only data, atomic CSV rejection, and actionable row-level
      errors are preserved.
- [ ] Flags remain explainable human-review indicators with no numeric score.
- [ ] Cases are created manually and use the approved human-managed statuses.
- [ ] Audit fields match the approved BRD.
- [ ] MVP scope remains local, single-user, and achievable within the
      four-day target; deferred items are not represented as commitments.
- [ ] Open decisions are assigned to later SDLC stages rather than guessed.
- [ ] Traceability to approved BRD requirements is complete and consistent.

**Status:** Approved.
**Reviewer:** Human reviewer (name not provided).
**Decision and date:** Approved; date not provided.
**Requested changes:**

The product owner has explicitly approved this PRD. The approver's name and
approval date are not recorded here.
