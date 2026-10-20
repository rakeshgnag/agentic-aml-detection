# Business Requirements Document (BRD)

## AML Transaction Risk Identification System

**Project:** Agentic AML Detection
**Document:** Business Requirements Document
**Version:** 0.2
**Status:** Approved
**Target delivery:** Four-day MVP sprint
**Deployment:** Local development environment

---

## 1. Problem statement

Financial crime analysts need to identify transaction patterns that may warrant further investigation. Reviewing transactions manually can make it difficult to spot relationships across multiple transfers, repeated activity, rapid movement of funds, and circular transaction flows.

This project will build an educational web application for one local human user. The MVP will analyze synthetic transaction data only, identify four configurable transaction-pattern indicators, and explain why transactions or entities were flagged.

Risk flags are indicators for human review, not proof of money laundering. The application will not make accusations or automated financial or law-enforcement decisions.

## 2. Objectives

- Import transaction data from CSV files with clear validation feedback.
- Detect all four in-scope patterns using transparent, configurable logic: rapid fund movement, repeated transfers, circular flows, and structuring-like patterns.
- Explain each flag using understandable reasons and supporting transaction references.
- Provide a dashboard for reviewing flagged activity and investigating cases.
- Record human review decisions and changes in case status.
- Include automated tests, expected-positive synthetic examples for each in-scope rule, benign lookalikes, boundary cases, invalid CSV scenarios, and documentation.
- Demonstrate an AI-assisted SDLC workflow in which generated artifacts and code are reviewed by a human.

### Success criteria

The MVP is successful when one local user can import a valid synthetic CSV, see the documented transaction summaries and risk indicators, inspect each indicator's category, explanation, and supporting transaction references, manually create a case from a flag, update its status with an audit record, and run the documented automated tests locally. A CSV containing any invalid row is rejected in full, with actionable row-level errors and no transactions from that import left partially stored. Demonstration scenarios document expected behavior for all four rules, benign lookalikes, rule-boundary cases, and invalid CSV input.

These outcomes do not establish detection accuracy or real-world effectiveness. The MVP makes no regulatory-compliance claim.

## 3. Stakeholders and users

### Primary user: Local human reviewer (financial crime analyst)

Needs to review potential risk indicators, understand the underlying transactions, filter activity, and document investigation outcomes. The MVP supports one local user; the role describes the intended user, not an authenticated or role-based access model.

### Review perspective: Compliance reviewer

The application may be demonstrated from a compliance-review perspective, including inspection of evidence and case history. This is not a separate account, permission set, or multi-user role in the MVP.

### Project owner / developer

Needs clear requirements, a manageable implementation plan, testable acceptance criteria, and traceability between requirements, implementation, and tests.

## 4. Scope

### In scope

1. CSV transaction import and validation using synthetic data only. An import is atomic: if any row fails validation, reject the entire import, report actionable row-level errors, and retain none of its transactions.
2. Transaction summaries and filtering.
3. Configurable rules for:
   - Rapid movement of funds.
   - Repeated transfers.
   - Circular transaction flows.
   - Structuring-like patterns.
4. Explainable risk flags showing a rule category, understandable explanation, and supporting transaction references. Numeric risk scores are excluded from the MVP.
5. Evidence linking flags to supporting transactions.
6. Cases manually created by a human from a risk flag, with statuses Pending, Reviewed, or Escalated. A case is not automatically created for every flag.
7. Audit trail recording timestamp, action, and actor label; case-status changes also record the previous and new statuses.
8. Dashboard counts and case details.
9. Automated tests and documented synthetic scenarios, including expected-positive examples for each rule, benign lookalikes, rule-boundary cases, and invalid CSV input.
10. Local setup and demonstration instructions.
11. AI-assisted SDLC artifacts, including user stories, architecture, testing, and code-review instructions.
12. A single local user; authentication and multi-user roles are deferred.

### Out of scope

- Production banking integrations.
- Real customer, account-holder, or transaction data. The MVP uses synthetic transaction data only.
- Autonomous allegations of criminal activity.
- Automatic account freezes, transaction blocking, or financial actions.
- Production deployment requirements and regulatory-compliance claims.
- A claim that the application replaces trained analysts.
- Complex production-grade machine-learning pipelines.
- Authentication, multi-user roles, production identity management, deployment infrastructure, and enterprise-scale operations.

These exclusions are not part of the four-day MVP.

## 5. Functional requirements

| ID     | Requirement                                                                                                          | Priority | Acceptance criteria |
| ------ | -------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| FR-001 | The system shall import transaction records from a CSV file containing synthetic data only.                          | Must     | A valid synthetic CSV is accepted and its records are available for analysis. A file containing any invalid row is rejected as a whole; none of that import's transactions remain stored. |
| FR-002 | The system shall validate the agreed CSV structure and transaction values before accepting an import.                | Must     | Demonstration or tests show validation of required fields, data types, timestamps, and amounts against the approved CSV contract; invalid input prevents the import from being accepted. |
| FR-003 | The system shall report actionable row-level validation errors and reject an import if any row fails validation.      | Must     | For each invalid row, the user can identify its row and issue from the report; after a failed import, no transaction from that import is present. |
| FR-004 | The system shall display transaction totals and summary counts for the imported dataset.                              | Must     | The dashboard shows the agreed transaction totals and counts for an accepted synthetic dataset, consistent with its imported records. |
| FR-005 | The system shall identify configurable rapid-fund-movement patterns.                                                  | Must     | An expected-positive synthetic scenario produces a flag with its rule category, explanation, and supporting transaction references; a documented negative/lookalike and boundary scenario produces the expected result for the approved rule configuration. |
| FR-006 | The system shall identify configurable repeated-transfer patterns.                                                   | Must     | An expected-positive synthetic scenario produces a flag with its rule category, explanation, and supporting transaction references; a documented negative/lookalike and boundary scenario produces the expected result for the approved rule configuration. |
| FR-007 | The system shall identify configurable circular-flow patterns.                                                       | Must     | An expected-positive synthetic transaction path that returns to an earlier entity produces a flag with its rule category, explanation, and supporting transaction references; documented negative/lookalike and boundary scenarios produce the expected result for the approved rule configuration. |
| FR-008 | The system shall identify configurable structuring-like patterns.                                                    | Must     | An expected-positive synthetic scenario produces a flag with its rule category, explanation, and supporting transaction references; documented negative/lookalike and boundary scenarios produce the expected result for the approved rule configuration. |
| FR-009 | Each risk flag shall show its rule category, an understandable explanation, and references to supporting transactions; the MVP shall not display a numeric risk score. | Must | A user can inspect each displayed flag and see its category, explanation, and transaction references; no numeric risk score is shown. |
| FR-010 | The user shall be able to filter and inspect transactions and potential risk indicators.                              | Must     | A user can apply the agreed filters and inspect matching results; detailed filter fields and behavior are specified in the FRD. |
| FR-011 | A human shall be able to create a review case from a risk flag; the system shall not create a case automatically for every flag. | Must | Demonstration shows a user creating a case from a flag and the resulting case linked to that flag; an unselected flag does not automatically create a case. |
| FR-012 | The user shall be able to set a case to Pending, Reviewed, or Escalated.                                               | Must     | Demonstration or tests show a case status can be set to each named status; detailed reopening and transition behavior is specified in the FRD. |
| FR-013 | The system shall record an audit entry for each recorded action and, for case-status changes, include timestamp, action, actor label, previous status, and new status. | Must | A demonstrated status change has an audit entry showing all five required values; other recorded audit actions show timestamp, action, and actor label. |
| FR-014 | The dashboard shall display transaction, flag, and case-by-status summaries for the accepted dataset.                 | Must     | Displayed counts correspond to the accepted dataset and its flags and cases; the summary fields are agreed in the FRD. |
| FR-015 | The repository shall include synthetic data and documented expected scenarios for every in-scope detection rule, benign lookalikes, rule-boundary cases, and invalid CSV input. | Must | Each of the four rules has at least one documented expected-positive synthetic example; the scenario set also documents benign lookalikes, boundaries, and invalid CSV outcomes. |
| FR-016 | The repository shall include automated tests for CSV validation, all in-scope detection rules, and core case workflows. | Must | The documented test run covers those behaviors and reports actual results; detailed coverage targets and test selection are specified in the Test Plan. |
| FR-017 | The application shall provide instructions for local setup, execution, testing, and demonstration.                    | Must     | A reviewer can follow the documented steps to run the application and perform the demonstration locally. |
| FR-018 | The system shall allow each in-scope detection rule's thresholds and windows to be configured without rewriting its detection logic. | Must | A user or developer can change approved rule configuration without changing the rule's implementation; exact thresholds, windows, and configuration interaction are defined in the FRD and architecture. |

**Requirement notes**

- A rule flag is a prompt for human investigation, not proof of misconduct.
- Numeric risk scores are not part of the MVP.
- Circular-flow detection depends on transaction identifiers, counterparties, timestamps, and other available data.
- Structuring-like detection depends on configurable thresholds and time windows; these are illustrative project settings, not universal legal thresholds.

## 6. Non-functional requirements

| ID      | Requirement                                                                                         | Priority | Acceptance criteria |
| ------- | --------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| NFR-001 | The MVP shall run locally using documented setup instructions.                                      | Must     | A reviewer follows the documented setup and starts the application locally. |
| NFR-002 | The application shall use synthetic transaction data only; it shall not use real customer data.     | Must     | The included dataset and demonstration inputs are synthetic, and repository review finds no real customer transaction data. |
| NFR-003 | CSV input shall be validated before any transaction from an import is accepted.                     | Must     | Tests or demonstration verify invalid rows reject the entire import and leave no partial transaction records from it. |
| NFR-004 | Risk explanations shall identify the rule category and be traceable to supporting transaction references. | Must | Each displayed flag provides an understandable reason and references that resolve to its supporting synthetic transactions. |
| NFR-005 | Automated tests shall be repeatable and runnable using documented commands.                         | Must     | A reviewer can run the documented test command and observe its actual result. |
| NFR-006 | Important detection-rule assumptions shall be documented.                                            | Must     | Each in-scope rule documents its inputs, configured parameters, trigger behavior, explanation, and known limitations. |
| NFR-007 | Validation errors shall identify the affected row and issue without exposing sensitive information. | Must     | Invalid CSV scenarios produce actionable row-level errors and the application uses no real customer data. |
| NFR-008 | Audit entries shall record timestamp, action, and actor label; case-status changes shall additionally record previous and new status. | Must | Demonstrated audit entries contain the required values for their action type. |
| NFR-009 | The interface shall allow the local user to filter and review transactions and risk indicators without inspecting source code. | Must | A user completes the agreed filter-and-review demonstration using the interface. |
| NFR-010 | Requirements, design, code, and AI-generated artifacts shall receive human review before acceptance. | Must | Each SDLC stage has a documented human approval gate; generated work is not treated as self-approved. |
| NFR-011 | The system shall not make accusations or automated financial or law-enforcement decisions. | Must | Product behavior and interface describe flags only as human-review indicators; no automated accusation or financial action is present. |
| NFR-012 | The prototype shall document limitations, expected false positives, benign lookalikes, and known failure cases. | Must | Demonstration materials or project documentation identify these limitations and do not claim established real-world detection effectiveness. |

### Security and privacy expectations

- Do not commit secrets, credentials, or real customer financial data; use synthetic transaction data only.
- Validate uploaded files and reject unsupported formats.
- Avoid executing content from imported CSV files.
- Apply appropriate access restrictions to any functionality exposed beyond a local development environment.
- Keep audit records limited to the information needed for review.
- Do not claim production-grade authentication, authorization, or security certification unless implemented and tested.

## 7. User workflows

### Workflow A: Import synthetic transactions

1. The user opens the application.
2. The user selects a synthetic CSV file.
3. The application validates its structure and records.
4. If any row is invalid, the application rejects the entire import, reports actionable row-level errors, and leaves no transactions from that import partially stored.
5. If every row is valid, the application reports the import result and makes all records available for analysis.

### Workflow B: Review risk indicators

1. The user opens the dashboard.
2. The user filters the transaction or flag list.
3. The user selects a risk indicator.
4. The application displays the reason, rule or threshold involved, and supporting transactions.
5. The user evaluates the evidence independently.

### Workflow C: Review a case

1. The user selects a risk flag and manually creates a linked case.
2. The user inspects the supporting evidence.
3. The user sets the case to Pending, Reviewed, or Escalated.
4. The application records the status change with timestamp, action, actor label, previous status, and new status.
5. The updated status appears in the dashboard and case details.

## 8. Data requirements

### Initial transaction fields

The proposed CSV schema includes:

- `transaction_id`: transaction identifier; duplicate-ID behavior remains open.
- `timestamp`: transaction date and time in a documented format.
- `sender_id`: synthetic sender identifier.
- `receiver_id`: synthetic receiver identifier.
- `amount`: transaction amount.
- `currency`: currency code.
- `transaction_type`: optional transaction classification.

The exact schema must be confirmed before implementation. Optional fields may be added if they materially improve detection or explanation.

### Data assumptions

- All MVP transaction data is synthetic; real customer data and public datasets are not used.
- Identifiers do not reveal real individuals or accounts.
- Timestamp interpretation and amount/currency semantics are deferred for definition in the FRD.
- Missing or inconsistent values are reported explicitly.
- The sample dataset includes expected-positive examples for all four rules, benign lookalikes, rule-boundary cases, and invalid CSV scenarios.

### Dataset decision

The MVP uses synthetic transaction data only. No public or real-customer transaction data is in scope.

## 9. Detection and evaluation requirements

The MVP shall use transparent, configurable rules for all four in-scope patterns: rapid fund movement, repeated transfers, circular flows, and structuring-like patterns. Flags are indicators for human review, not proof of money laundering. The system shall not make accusations or automated financial or law-enforcement decisions.

Each detection rule should document:

- Rule identifier and name.
- Inputs required.
- Thresholds and time windows.
- Conditions that trigger a flag.
- Explanation presented to the reviewer.
- Known limitations and expected false positives.

Synthetic test and demonstration scenarios shall include:

- **Rapid movement — expected positive:** A synthetic entity receives funds and sends funds onward within the configured rapid-movement window; the expected flag references the supporting transactions.
- **Repeated transfers — expected positive:** Synthetic counterparties make repeated transfers to one another within the configured repetition period; the expected flag references those transfers.
- **Circular flow — expected positive:** A synthetic transaction path such as entity A to B, B to C, and C back to A forms a cycle; the expected flag references the transactions in that cycle.
- **Structuring-like pattern — expected positive:** One synthetic sender makes multiple transfers whose individual amounts are below the illustrative configured amount threshold while their combined activity meets the configured rule within its time window; the expected flag references the supporting transfers. This is an illustrative pattern only, not evidence of wrongdoing.
- **Benign lookalikes and negative examples:** Include legitimate-looking repeated payments and rapid transfers, plus examples that do not satisfy a rule. Document the expected result for each configured rule; a flag on a lookalike remains only an indicator for human review.
- **Boundary cases:** Include synthetic examples at the configured threshold/window boundary and just inside or outside it. Document expected outcomes according to the approved rule definition and its boundary convention.
- **Invalid CSV:** Include a missing required column, malformed timestamp, invalid amount, and an otherwise valid file with at least one invalid row. Each invalid import is rejected in full with actionable row-level errors and leaves no transactions from that import stored.
- A failed-import check that verifies no transactions from that import remain stored.

The MVP shall report observed test results. It shall not claim that detection accuracy or real-world effectiveness has been established.

## 10. Acceptance criteria

The MVP will be accepted when:

1. One local user can follow the documentation to run and demonstrate the application.
2. A valid synthetic CSV is imported, while an import containing any invalid row is rejected in full with actionable row-level errors and no partially imported transactions.
3. The dashboard displays the agreed transaction, flag, and case summaries for the accepted dataset.
4. Each of the four detection rules produces its documented expected-positive result on synthetic examples; benign lookalikes and boundary scenarios produce their documented outcomes.
5. Every displayed flag shows a rule category, understandable explanation, and supporting transaction references; no numeric risk score is displayed.
6. A human can manually create a case from a flag and set its status to Pending, Reviewed, or Escalated; flags do not automatically create cases.
7. Audit entries contain timestamp, action, and actor label; status-change entries also contain previous and new statuses.
8. Automated tests cover CSV validation and atomic rejection, all four detection rules, and core case workflows, and their actual results are reported.
9. Setup, testing, limitations, synthetic scenario expectations, and demonstration instructions are documented.
10. A human has reviewed the requirements, design decisions, and implementation changes. This criterion does not imply that this BRD is already approved.

These acceptance criteria verify the educational MVP behavior only; they do not establish detection accuracy or real-world effectiveness.

## 11. Risks and mitigations

| Risk                                | Mitigation                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| Excessive false positives           | Include benign lookalikes, document limitations, and keep humans responsible for review.       |
| Incorrect interpretation of flags   | Explain the triggering conditions and show supporting transactions.                            |
| Poor-quality input data             | Validate schemas, values, timestamps, and identifiers.                                         |
| Dataset licensing uncertainty       | Use synthetic transaction data only in the MVP.                                                 |
| Scope growth                        | Protect the four-rule, synthetic-data local MVP; defer unapproved enhancements and keep detailed implementation choices in later SDLC stages. |
| AI-generated defects                | Review diffs, run tests, and require human approval.                                           |
| Weak auditability                   | Record status changes and document the information retained.                                   |
| Misleading model performance claims | Report only measured results and state dataset limitations.                                    |
| Insecure handling of uploaded files | Validate file input and keep the MVP local unless additional controls are designed and tested. |

## 12. Four-day MVP milestones

### Day 1 — Requirements and design

- Review and approve this BRD.
- Create user stories and acceptance criteria after the requirements gates.
- Inspect the repository and choose the stack.
- Define the CSV contract and detection-rule specifications in the appropriate later stages.
- Draft the architecture and implementation plan.

**Deliverable:** Requirements and design artifacts reviewed at their human approval gates; technical choices remain subject to their architecture-stage approval.

### Day 2 — Data and core functionality

- Create or verify the sample dataset.
- Implement CSV validation.
- Implement initial transparent detection rules.
- Build the first API and user interface.
- Display risk explanations and supporting evidence.

**Deliverable:** A locally running application with basic analysis.

### Day 3 — Review workflow and testing

- Implement case-status updates and audit records.
- Add dashboard filters and summaries.
- Add unit and integration tests.
- Test positive, negative, boundary, and benign-lookalike scenarios.
- Review input handling, privacy, and access assumptions.

**Deliverable:** A testable end-to-end review workflow.

### Day 4 — Stabilization and demonstration

- Fix priority defects.
- Verify setup and test instructions.
- Document architecture, detection rules, limitations, and data assumptions.
- Prepare a repeatable demonstration.
- Complete a human code and security review.

**Deliverable:** A documented, locally runnable educational prototype.

The schedule is a target, not a guarantee. Must requirements take precedence over optional features.

## 13. AI-assisted SDLC and traceability

The project will progressively create dedicated agent instructions or workflows for:

1. Business requirements.
2. User stories.
3. Planning.
4. Architecture and design.
5. Data model.
6. Backend implementation.
7. Frontend implementation.
8. Unit testing.
9. End-to-end testing.
10. Security review.
11. Code review.

Every artifact should be traceable to requirements and acceptance criteria where practical. AI-generated work must be inspected and tested before acceptance. An agent's recommendation is not equivalent to human approval.

## 14. Open questions requiring human decisions

The following details remain open for their designated SDLC stages. They do not change the business decisions in this BRD: all four rule categories are in MVP scope; data is synthetic only; one local human user is supported without authentication or multi-user roles; cases are created manually from flags; and flags show category, explanation, and supporting transaction references without a numeric score.

### FRD

- Exact rule thresholds, time windows, and matching logic for each detection pattern.
- CSV column contract, timestamp and time-zone interpretation, currency and amount semantics, and duplicate-ID policy.
- Dashboard summary fields and detailed filtering behavior.
- Case reopening behavior and detailed lifecycle transitions beyond the stated statuses.

### NFR

- Measurable performance targets.
- Backup and retention expectations appropriate to the local MVP.

### Logical and Technical Architecture

- Technology stack and repository-specific architecture, based on repository inspection.

### Data Model and API Contract

- Data model and API contracts, including error response formats.
- Detailed audit persistence and actor-label implementation.

### Test Plan

- Detailed test coverage targets, test selection, and measurable test exit criteria.

These details must be reviewed and approved at their respective stages before implementation decisions that depend on them are finalized.

## 15. Approval

**Status:** Approved.

The project owner has reviewed and explicitly approved the scope, data boundaries, acceptance criteria, and deferred decisions. The approver's name and approval date are not recorded here.

**End of document**
