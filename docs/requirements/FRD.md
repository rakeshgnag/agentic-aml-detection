# Functional Requirements Document (FRD)

**Project:** AML Transaction Risk Identification System
**Version:** 0.1
**Status:** Approved
**Sources:** Approved `docs/requirements/BRD.md` (Version 0.2) and
`docs/requirements/PRD.md` (Version 0.1)
**Approval gate:** Product owner approval recorded. NFR work remains a
separate SDLC stage and was not started as part of this approval update.

> This document translates the approved business and product baselines into
> functional behavior. It does not assert that the application implements
> these requirements. The BRD and PRD remain unchanged.

## 1. Scope and terminology

The FRD specifies user-visible functional behavior for the four-day,
educational, local MVP. The application is used by one local human reviewer
with synthetic transaction data only.

- CSV is the MVP import format. Excel `.xlsx` import is a future enhancement
  and is out of scope for this MVP.
- The deterministic synthetic demonstration fixture specified in Section 7
  is a repeatable demo/test input, not the only dataset the product may
  process.

- **Transaction:** A synthetic record submitted in a CSV import.
- **Risk indicator / flag:** An explanation that a configured rule matched
  specific available transactions. A flag is for human review and is not
  proof of wrongdoing.
- **Case:** A review record explicitly created by the human from a selected
  flag. Cases are not created automatically for every flag.
- **Supporting transaction reference:** A reference that lets the user
  identify and inspect a transaction used by a flag.
- **Accepted import:** A CSV for which all rows pass validation and all
  submitted records become available for analysis.
- **Rejected import:** A CSV with at least one invalid row or invalid file
  structure; none of the submitted records from that import are accepted or
  left partially stored.

Numeric risk scores, automated accusations, and automated financial or
law-enforcement decisions are outside this product behavior.

## 2. Actors and permissions

| Actor | Functional capability |
|---|---|
| Local human reviewer | Imports synthetic CSV data, views dashboard summaries, filters and inspects transactions and flags, manually creates cases from flags, and manages case statuses. |

The MVP has one local user. Authentication, separate user accounts, and
multi-user roles are out of scope. The actor label recorded in the audit trail
does not establish an authenticated identity; its exact representation is
deferred to the Data Model/API Contract stage.

## 3. Functional requirements

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| FRD-001 | The product shall accept a synthetic CSV import for analysis only after its structure and every row pass the approved validation rules. | Given a valid CSV under the approved CSV contract, when the user submits it, then the product reports success and all submitted records are available for analysis. | BRD FR-001–FR-002; PRD Import behavior |
| FRD-002 | The product shall reject a whole import when its file structure is invalid or any transaction row is invalid. | Given a CSV with at least one invalid row, when submitted, then the product reports rejection and no transaction from that submission is accepted or remains partially stored. Existing previously accepted data is not represented as part of the rejected import. | BRD FR-001–FR-003, NFR-003; PRD Atomic invalid-import handling |
| FRD-003 | For each invalid transaction row, the product shall report an actionable error identifying the row and the issue. | Given invalid data in one or more rows, then each reported row error identifies the row and the relevant field or issue sufficiently for the user to correct the input. File-level structure errors identify the missing or invalid structure. | BRD FR-003, NFR-007; PRD Atomic invalid-import handling |
| FRD-004 | The product shall make the result of an import visible to the user. | On successful submission, the user sees that the import was accepted. On rejected submission, the user sees that it was rejected and the validation errors. Neither outcome is represented as successful when the operation failed. | BRD FR-001–FR-003; PRD Journey A |
| FRD-005 | The product shall show total imported transactions, total flags, flags grouped by rule category, and cases grouped by status for the data currently available to analysis. | For an accepted analysis dataset, the dashboard shows (1) the count of accepted transaction records, (2) the count of distinct flags, (3) a count for each rule category, and (4) counts for Pending, Reviewed, and Escalated cases, including zero counts. A rejected import contributes no transactions or flags. Whether multiple accepted imports are combined or one is selected remains open as specified in Section 9. | BRD FR-004, FR-014; PRD Section 5, “Dashboard and review”; Section 6 |
| FRD-006 | The product shall allow the local user to filter and inspect transactions, flags, and cases using applicable date-range, rule-category, case-status, amount-range, and flagged-state criteria. | Within each view, active applicable filters are combined using AND; one range or value per filter dimension may be active. Range endpoints are inclusive. On the transaction view, date and amount apply to each transaction; flagged state selects transactions with or without at least one flag; rule category selects transactions with at least one flag in that category. On the flag view, category applies to the flag, while date and amount match only if at least one same supporting transaction satisfies all active range criteria. On transaction and flag views, an active case-status filter returns only items linked through a flag to a case with that status; items without a linked case are excluded while that filter is active. The case view supports case status. Clearing filters restores all items in that view. A view with no matches shows an explicit no-results state, distinct from an empty dataset or loading failure. | BRD FR-010, NFR-009; PRD Journey B; Sections 5 and 6 |
| FRD-007 | The product shall identify configured rapid fund movement patterns. | Given the documented expected-positive synthetic scenario and approved rule configuration, the product displays a rapid-movement flag with the correct category, an explanation, and references to all supporting transactions identified by the scenario. Negative, benign-lookalike, and boundary scenario outcomes match their documented expectations. | BRD FR-005, FR-015; PRD Rule behavior |
| FRD-008 | The product shall identify configured repeated transfer patterns. | Given the documented expected-positive synthetic scenario and approved rule configuration, the product displays a repeated-transfer flag with the correct category, an explanation, and references to all supporting transactions identified by the scenario. Negative, benign-lookalike, and boundary scenario outcomes match their documented expectations. | BRD FR-006, FR-015; PRD Rule behavior |
| FRD-009 | The product shall identify configured circular flows. | Given the documented expected-positive synthetic cycle and approved rule configuration, the product displays a circular-flow flag with the correct category, an explanation, and references to the transactions forming the cycle. Negative, benign-lookalike, and boundary scenario outcomes match their documented expectations. | BRD FR-007, FR-015; PRD Rule behavior |
| FRD-010 | The product shall identify configured structuring-like patterns. | Given the documented expected-positive synthetic scenario and approved rule configuration, the product displays a structuring-like flag with the correct category, an explanation, and references to the supporting transactions. Negative, benign-lookalike, and boundary scenario outcomes match their documented expectations. | BRD FR-008, FR-015; PRD Rule behavior |
| FRD-011 | Every displayed risk flag shall identify its rule category, explain why it was raised, and provide references to supporting transactions; the MVP shall not display a numeric risk score. | For each displayed flag, the user can identify its category, read its explanation and inspect the referenced supporting transactions. No numeric risk score is displayed. | BRD FR-009, NFR-004; PRD Risk indicators |
| FRD-012 | Risk flags shall be presented only as indicators for human review. | Flag details and relevant empty/error states do not describe a flag as proof of money laundering or as an automated decision or accusation. The user retains responsibility for whether to create a case. | BRD NFR-011 and Sections 1, 4, 9; PRD Product summary and Safe interpretation |
| FRD-013 | The product shall let the local human user manually create at most one case from a selected risk flag. | When the user creates a case from a flag with no linked case, the product creates one linked case with initial status Pending. Detection alone never creates a case. If the user attempts to create another case from a flag that already has one, the product creates no additional case and explains that a case already exists. | BRD FR-011; PRD Journey C; explicit user decisions for this FRD revision |
| FRD-014 | The product shall let the user manage case status using exactly Pending, Reviewed, and Escalated, including reopening by returning a case to Pending. | The permitted actual transitions are Pending→Reviewed, Pending→Escalated, Reviewed→Pending, Reviewed→Escalated, Escalated→Pending, and Escalated→Reviewed. Selecting the case’s existing status is a no-op: it does not represent a change and creates no audit event. After a permitted change, the displayed status is the new status; no other status is accepted. | BRD FR-012; PRD Journey C; explicit user decisions for this FRD revision |
| FRD-015 | The product shall record an audit event for each recorded action and the required status-change details. | An audit event for a recorded action shows a timestamp, action, and actor label. A case-status-change event also shows the previous and new status. Each event corresponds to an action completed. A no-op status selection creates no audit event. | BRD FR-013, NFR-008; PRD Case and audit behavior |
| FRD-016 | The product shall provide a useful empty state when no transaction data is available. | With no accepted transactions, the dashboard and transaction/risk views indicate that there is no data to review and do not show fabricated counts, flags, or cases. The user is directed to the import task where applicable. | BRD FR-001, FR-004, FR-014, FR-017; PRD Journeys A and B |
| FRD-017 | The product shall provide empty states when an accepted dataset has no matching flags or no cases. | When no flags match, the user sees that no risk indicators are currently available for review; the product does not imply that the dataset is risk-free. When no cases exist, the case view indicates that no cases have been created. | BRD FR-009, FR-011, FR-014; PRD Risk indicators and Case workflow |
| FRD-018 | The product shall communicate operational failures without presenting them as successful outcomes. | If import, summary, flag, case, status-update, or audit retrieval fails, the user sees an error state and is not shown a success confirmation for the failed action. A failed status update does not appear as a completed status change. Exact error formats are deferred. | BRD FR-003, FR-013; NFR-007; PRD Import behavior and Case and audit behavior |
| FRD-019 | The repository shall include one deterministic synthetic demonstration/test dataset covering all in-scope detection rules, benign and negative examples, rule boundaries, and import validation. | The fixture has fixed synthetic records, identifiers, and timestamps (no runtime randomness), can be reused to reproduce documented outcomes, and contains positive, benign-lookalike, and negative scenarios for each rule, plus parameterized boundary cases and invalid CSV inputs. For each scenario, the fixture documentation states setup, expected outcome, and reason. Boundary outcomes remain pending approval of rule definitions where applicable. The fixture is not a limit on other valid synthetic CSVs the product can process. | BRD FR-015–FR-016; PRD Sections 4 and 6 |
| FRD-020 | The product shall support demonstration of the core import, review, and case journeys without requiring source-code inspection. | A reviewer can follow the documented local demonstration to import valid synthetic data, inspect summaries and flags, manually create a case, update its status, and inspect the audit details. | BRD FR-017; PRD Local use and Human case workflow |

## 4. User flows and status behavior

### 4.1 Import flow

1. The user selects and submits a synthetic CSV.
2. The product validates the CSV structure and all rows before accepting
   records.
3. If the structure or any row is invalid, the product reports file-level or
   actionable row-level errors and rejects the whole import. No transaction
   from that import is left accepted or partially stored.
4. If all rows are valid, the product accepts the import and makes its
   transactions available for analysis.
5. The dashboard and review views update to represent the accepted dataset.

### 4.2 Flag review flow

1. The user views the dashboard and applies available transaction or flag
   filters.
2. The user opens a flag.
3. The product displays the rule category, explanation, and supporting
   transaction references.
4. The user interprets the flag independently. The product does not present
   it as proof of wrongdoing.
5. The user may choose to create a linked case, or leave the flag without a
   case.

### 4.3 Case flow

1. A case exists only after the user explicitly creates it from a flag.
2. A newly created case starts in Pending.
3. The user may change status through any of these transitions:
   Pending→Reviewed, Pending→Escalated, Reviewed→Pending, Reviewed→Escalated,
   Escalated→Pending, or Escalated→Reviewed. Returning to Pending reopens a
   case. No other status is permitted.
4. Selecting the current status leaves it unchanged and creates no audit
   event.
5. For an actual status change, the product shows the new status and records
   timestamp, action, actor label, previous status, and new status.
6. On a failed status change, the product reports failure and does not show
   the requested status as saved.

At most one case may be linked to a flag. An attempt to create another case
for that flag is prevented and the product explains that a case already
exists.

## 5. Data validation and error behavior

### 5.1 Import validation

- Validate file structure and every row against the CSV contract approved
  before implementation.
- Required columns, accepted timestamp/time-zone interpretation, amount and
  currency semantics, and duplicate-ID behavior remain open as listed in
  Section 9 and must be settled in the appropriate requirements/contract
  work.
- Any invalid row rejects the entire import.
- Errors identify the row and issue. A file-level error identifies the
  structural problem when a row number is not applicable.
- Rejection must leave no submitted transaction partially accepted or stored.
- Only synthetic transaction data is permitted.

### 5.2 User-visible failure outcomes

| Situation | Required outcome |
|---|---|
| Invalid file structure | Reject import and explain the structural problem; accept no transactions from that import. |
| One or more invalid rows | Reject the whole import; identify each invalid row and its issue; accept no transactions from that import. |
| Import operation fails unexpectedly | Show a failure state, do not report success, and do not expose sensitive information. |
| No accepted dataset | Show an empty state rather than fabricated summaries or flags. |
| No matching flags | Show that there are no current flags to review; do not imply proof that no risk exists. |
| No cases | Show that no cases have been manually created. |
| A view has no records matching its active filters | Show a no-results state for that view; do not present it as a loading or operational failure. |
| Summary, flag, case, status, or audit operation fails | Show an error state and do not represent a failed write as successful. |

Exact error response structure, codes, and technical failure handling remain
for the Data Model/API Contract and Technical Architecture stages.

## 6. Reporting, filters, and audit behavior

### 6.1 Dashboard

The dashboard shows these measures for the data currently available to
analysis:

- **Total imported transactions:** count of accepted transaction records.
- **Total flags:** count of distinct flags.
- **Flags by rule category:** count of flags in each category.
- **Cases by status:** counts for Pending, Reviewed, and Escalated, including
  zero counts.

Rejected imports contribute no transactions or flags. When there is no
accepted dataset, the dashboard shows an empty state instead of fabricated
counts. When the dataset has no flags or cases, the corresponding measures
show zero and the relevant views show their empty states. Whether multiple
accepted imports are combined, or one is selected for analysis, remains open
in Section 9.

### 6.2 Filtering and inspection

The user can filter transactions, flags, and cases using the applicable
criteria below. Multiple active, applicable filters are combined using AND.
One date range, one amount range, one rule category, one case status, and one
flagged-state value may be active per view. Range endpoints are inclusive.
For date comparisons, the selected start and end dates are included;
interpretation of transaction timestamps and time zones remains subject to
the CSV contract.

| View | Applicable filters and behavior |
|---|---|
| Transactions | Date range and amount range apply to each transaction. Flagged/unflagged selects transactions with at least one flag or no flags, respectively. Rule category selects transactions with at least one flag in that category. Case status selects only transactions linked through a flag to a case in that status; transactions without a linked case are excluded while the case-status filter is active. |
| Flags | Rule category applies to the flag. Date range and amount range match a flag only when at least one same supporting transaction satisfies all active date and amount criteria. Case status selects only flags linked to a case in that status; flags without a linked case are excluded while the case-status filter is active. Flagged/unflagged is not applicable to this view. |
| Cases | Case status applies to cases. The other listed filters are not applicable to this view. |

Clearing filters restores all records in the current view. If the current
view has no matches, it shows an explicit no-results state; this is distinct
from having no accepted dataset and from an operational failure.

### 6.3 Risk explanation and evidence

Each flag presents its category and a human-readable explanation of the
configured rule match. Its supporting transaction references lead to the
relevant synthetic records. Explanations may describe the configured
parameters but must not imply a probability, certainty of wrongdoing, or
automated decision. Numeric scores are excluded from the MVP.

### 6.4 Audit

An audit event contains:

- Timestamp.
- Action.
- Actor label.
- For case-status changes: previous status and new status.

The actor-label format, precise set of actions to record beyond status
changes, persistence mechanism, and retention behavior remain open for the
Data Model/API Contract and NFR stages.

## 7. Synthetic scenarios and expected outcomes

All records in the required demo/test fixture are synthetic, fixed, and
reproducible: it has stable transaction identifiers and timestamps and uses
no runtime randomness. Maintain it as one versioned fixture,
`aml-synthetic-demo-v1`, with isolated scenario records and a manifest of
inputs and expected outcomes. Invalid CSV inputs are separate deterministic
validation cases, not rows in the valid rule-scenario dataset. The fixture
covers all four rules and is not the only dataset the product may process.
Rule thresholds, time windows, matching logic, and applicable boundary
conventions remain unresolved until their rule definitions are approved.
Accordingly, the boundary outcomes below are explicit open expectations, not
invented rule behavior.

For each rule, the fixture includes these scenarios. “Meets the configured
trigger conditions” and “fails a trigger condition” refer to the full rule
definition approved later; they do not establish thresholds or matching
logic in this FRD.

### Rapid fund movement

- **Positive — setup:** A synthetic entity receives funds and sends funds
  onward within the configured rapid-movement conditions. **Expected
  outcome:** A rapid-movement flag references the receiving and onward
  transactions. **Reason:** The configured rapid-movement conditions match.
- **Benign lookalike — setup:** A superficially similar receive-and-send
  sequence fails at least one documented rapid-movement trigger condition.
  **Expected outcome:** No rapid-movement flag. **Reason:** The complete
  configured trigger conditions are not met.
- **Negative — setup:** Synthetic transactions contain no qualifying
  receive-and-onward sequence. **Expected outcome:** No rapid-movement flag.
  **Reason:** The relevant pattern is absent.
- **Boundary — setup:** Otherwise matching activity is immediately below,
  exactly at, and immediately above each applicable configured time or other
  rule boundary. **Expected outcome:** To be specified after the threshold,
  comparison convention, and supported input precision are approved.
  **Reason:** Those rule details are open; this FRD does not assume whether
  equality triggers a flag.

### Repeated transfers

- **Positive — setup:** Synthetic counterparties transfer repeatedly and
  meet the configured repetition conditions. **Expected outcome:** A
  repeated-transfer flag references the qualifying transfers. **Reason:** The
  configured repetition conditions match.
- **Benign lookalike — setup:** A superficially similar recurring-payment
  pattern fails at least one documented repeated-transfer trigger condition.
  **Expected outcome:** No repeated-transfer flag. **Reason:** The complete
  configured trigger conditions are not met.
- **Negative — setup:** Synthetic counterparties have no qualifying repeated
  transfer activity. **Expected outcome:** No repeated-transfer flag.
  **Reason:** The relevant pattern is absent.
- **Boundary — setup:** Activity is immediately below, exactly at, and
  immediately above each applicable configured repetition-count, amount, or
  time boundary. **Expected outcome:** To be specified after applicable
  thresholds, comparison conventions, and input precision are approved.
  **Reason:** Equality and boundary behavior are not yet defined.

### Circular flows

- **Positive — setup:** Synthetic transactions form a path such as A→B, B→C,
  and C→A and meet the configured cycle conditions. **Expected outcome:** A
  circular-flow flag references the transactions forming the cycle.
  **Reason:** The configured cycle conditions match.
- **Benign lookalike — setup:** A superficially similar transfer chain has no
  return path to an earlier entity and fails the documented cycle condition.
  **Expected outcome:** No circular-flow flag. **Reason:** No qualifying
  cycle exists under the configured rule.
- **Negative — setup:** Synthetic transactions contain no qualifying
  circular path. **Expected outcome:** No circular-flow flag. **Reason:** The
  relevant pattern is absent.
- **Boundary — setup:** A cycle is tested immediately below, exactly at, and
  immediately above each applicable configured path-length, time, or other
  boundary, if the approved rule defines one. **Expected outcome:** To be
  specified after applicable rule parameters and comparison conventions are
  approved. **Reason:** No cycle boundary behavior is assumed here.

### Structuring-like patterns

- **Positive — setup:** Multiple synthetic transfers satisfy the approved
  configured individual-amount and combined-activity conditions within the
  configured period. **Expected outcome:** A structuring-like flag references
  all supporting transfers. **Reason:** The configured rule conditions
  match; this is an indicator for human review, not proof of wrongdoing.
- **Benign lookalike — setup:** A superficially similar group of synthetic
  transfers fails at least one documented structuring-like trigger
  condition. **Expected outcome:** No structuring-like flag. **Reason:** The
  complete configured trigger conditions are not met.
- **Negative — setup:** Synthetic transfers do not form a qualifying grouped
  activity pattern. **Expected outcome:** No structuring-like flag.
  **Reason:** The relevant pattern is absent.
- **Boundary — setup:** Activity is immediately below, exactly at, and
  immediately above each applicable configured individual-amount,
  aggregate-amount, count, or time boundary. **Expected outcome:** To be
  specified after thresholds, comparison conventions, currency/amount
  semantics, and input precision are approved. **Reason:** Those details are
  unresolved and are not universal legal thresholds.

### Import validation scenarios

- **Invalid structure — setup:** A synthetic CSV omits a required column or
  has an invalid structure under the approved CSV contract. **Expected
  outcome:** Reject the entire import, identify the structural issue, and
  store none of its transactions. **Reason:** The file cannot be validated
  against the contract.
- **Invalid row — setup:** An otherwise valid synthetic CSV contains one or
  more rows invalid under the approved contract, including malformed
  timestamps and invalid amounts. **Expected outcome:** Reject the entire
  import, report each row and issue, and store none of the import's
  transactions. **Reason:** Any invalid row makes the import atomic
  rejection.

These scenarios verify only the stated behavior on synthetic examples. They
do not measure or establish real-world detection accuracy or effectiveness.

## 8. Out of scope

- Public, real customer, or account-holder transaction data.
- Excel `.xlsx` import; CSV is the MVP import format.
- Authentication, multiple users, and role-specific permissions.
- Numeric risk scores, calibrated probabilities, or claims of proven
  detection accuracy.
- Automated accusations, law-enforcement conclusions, account freezes,
  transaction blocking, or other financial decisions.
- Production integrations, production deployment requirements, regulatory
  reporting, compliance claims, and enterprise operations.
- Selection of a specific technology stack, API format, storage engine, or
  implementation architecture in this functional document.
- Detailed performance targets, backup/retention policy, and test-coverage
  targets, which are assigned to later stages.

## 9. Assumptions and open decisions

### Fixed by approved baselines and decisions for this FRD revision

- All four detection patterns are in scope.
- Synthetic transaction data only; one local human user.
- CSV is the MVP import format; `.xlsx` is out of scope.
- Invalid CSV imports are rejected atomically with actionable row-level
  errors.
- Cases are manually created from flags; at most one case is linked to a flag
  and a new case starts Pending.
- The only case statuses are Pending, Reviewed, and Escalated. All transitions
  between distinct statuses are allowed; selecting the existing status is a
  no-op with no audit event.
- Flags show a category, explanation, and evidence references; no numeric risk
  score.
- Status-change audit entries include timestamp, action, actor label, and
  previous/new status.
- Flags are indicators for human review, not proof of money laundering.
- The documented synthetic fixture is deterministic and covers the required
  rule, benign, negative, boundary, and invalid-input scenarios; it does not
  limit other datasets the product may process.
- Dashboard measures and the filter behavior in Sections 6.1 and 6.2 are the
  FRD functional defaults; the accepted dataset scope for multiple imports
  remains open.

### Open functional decisions

- Exact rule thresholds, windows, matching logic, and boundary inclusion for
  each pattern. Expected boundary outcomes (below, equal to, and above each
  applicable threshold) cannot be finalized until those decisions and the
  comparison convention are approved.
- Required/optional CSV columns, timestamp/time-zone rules, amount and
  currency semantics, and duplicate transaction-ID policy.
- Whether dashboard counts and detection operate over all accepted imports or
  a single selected/current accepted dataset.
- Result ordering in transaction, flag, and case views.
- Actor-label value and the additional actions captured in the audit trail.
- The final deterministic fixture records and expected outcomes at rule
  boundaries, after rule parameters and CSV semantics are approved.
- Exact user-facing empty-state copy.
- Exact validation and operational error presentation, including technical
  response formats.

### Assigned to later SDLC stages

- NFR: measurable performance, security/privacy quality measures, backup and
  retention requirements.
- Logical/Technical Architecture: component responsibilities and
  repository-verified technology choices.
- Data Model/API Contract: entities, persistence, audit implementation, API
  and error formats.
- Test Plan: detailed test selection, coverage targets, and test exit
  criteria.

No unresolved item above may be silently decided during implementation;
decisions affecting behavior must be approved in the appropriate stage.

## 10. Traceability

| FRD requirement | BRD source | PRD source |
|---|---|---|
| FRD-001–FRD-004: Import and validation | FR-001–FR-003; NFR-002–NFR-003, NFR-007 | Journey A; Import behavior; Valid import and Atomic invalid-import handling |
| FRD-005: Dashboard measures and data scope | FR-004, FR-014 | Section 5, “Dashboard and review”; Section 6 |
| FRD-006: Filtering | FR-010; NFR-009 | Journey B; Sections 5 and 6 |
| FRD-007: Rapid movement | FR-005, FR-015 | Product goals; Rule behavior; Rule behavior measure |
| FRD-008: Repeated transfers | FR-006, FR-015 | Product goals; Rule behavior; Rule behavior measure |
| FRD-009: Circular flows | FR-007, FR-015 | Product goals; Rule behavior; Rule behavior measure |
| FRD-010: Structuring-like patterns | FR-008, FR-015 | Product goals; Rule behavior; Rule behavior measure |
| FRD-011–FRD-012: Explanation, evidence, human review | FR-009; NFR-004, NFR-011–NFR-012 | Risk indicators; Safe interpretation |
| FRD-013–FRD-014: Manual cases, duplicate prevention, and status lifecycle | FR-011–FR-012 | Journey C; Sections 4 and 5; case cardinality, initial status, transition, and no-op decisions are specified for this FRD revision |
| FRD-015: Audit events and no-op status behavior | FR-013; NFR-008 | Journey C; Sections 4 and 5 |
| FRD-016–FRD-018: Empty/failure behavior | FR-003–FR-004, FR-009, FR-011, FR-013–FR-014; NFR-007 | Journeys A–C; Atomic invalid-import handling |
| FRD-019: Deterministic synthetic fixture and scenarios | FR-015–FR-016; NFR-005, NFR-012 | Section 4; Section 6 |
| FRD-020: Local demonstration | FR-017; NFR-001 | Local use |

FRD identifiers are new identifiers in this document only. BRD and PRD
identifiers are cited as sources and are not renumbered or replaced.
The PRD does not assign individual requirement IDs, so its sections, journey
names, and success-measure names are cited instead of inventing PRD IDs.

## 11. Completeness and human approval

- [ ] Import validation checks structure and every row before acceptance.
- [ ] Any invalid row rejects the full import, returns actionable row-level
      errors, and leaves no transactions from that import partially stored.
- [ ] Dashboard summary and filter decisions are resolved or explicitly
      deferred before implementation.
- [ ] Dashboard measures show accepted transaction count, total flags,
      flags by category, and cases by status; multiple-import scope is
      explicitly resolved before implementation.
- [ ] Filters use the specified views, AND combination, inclusive ranges,
      case-link behavior, clearing behavior, and no-results state.
- [ ] Each of the four rules has positive, benign-lookalike, negative, and
      threshold-boundary scenarios with setup, expected outcome, and reason;
      boundary outcomes remain open until rule definitions are approved.
- [ ] Flags include category, explanation, and supporting transaction
      references and never include numeric risk scores.
- [ ] Cases are manually created, limited to one per flag, initially Pending,
      and use only the six permitted transitions among Pending, Reviewed, and
      Escalated; same-status selection creates no audit event.
- [ ] Audit fields match the approved BRD.
- [ ] Empty and failure states do not imply successful operations or imply
      that no risk exists.
- [ ] Synthetic-only data and non-accusation safeguards are preserved.
- [ ] The deterministic synthetic fixture is documented and includes all four
      rule patterns, benign and negative cases, boundaries, and invalid CSV
      inputs; `.xlsx` remains out of scope.
- [ ] Every FRD requirement traces to the approved BRD and PRD without
      changing their IDs.
- [ ] Open decisions are visible and assigned to the correct later stage.
- [ ] No unverified technology, API, or implementation detail is presented as
      settled.

**Status:** Approved — human approval explicitly recorded.
**Reviewer:** Project owner
**Decision and date:** Approved in Copilot Chat, 2026-10-20.
**Requested changes:**

This approval records the FRD baseline and does not resolve the open
decisions listed above. Begin the NFR stage only as a separate, explicitly
requested task.
