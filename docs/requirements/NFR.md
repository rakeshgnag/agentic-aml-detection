# Non-Functional Requirements (NFR)

**Project:** AML Transaction Risk Identification System
**Version:** 0.1
**Status:** Approved by product owner
**Approval gate:** Product-owner and technical reviewer approvals recorded.
The NFR gate is satisfied.
**Sources:** User-approved `docs/requirements/BRD.md` (Version 0.2),
`docs/requirements/PRD.md` (Version 0.1), and
`docs/requirements/FRD.md` (Version 0.1)

> This document defines quality requirements for the local, single-user,
> educational four-day MVP. It does not claim implementation, production
> readiness, regulatory compliance, or established real-world detection
> effectiveness. The approved BRD, PRD, and FRD are unchanged.

## Requirements

Priority and source note: NFR-001–NFR-012 retain the corresponding approved
BRD NFR IDs and Must priority. NFR-013–NFR-016 are additional requirements
accepted into this NFR draft and use the project's Must priority. The NFR
document itself remains draft pending human review and approval.

| ID | Category | Requirement | Acceptance criteria / verification method | Priority | Traceability |
|---|---|---|---|---|---|
| NFR-001 | Local use | The MVP shall run locally using documented setup instructions. | On a clean local environment that meets the eventual documented prerequisites, a reviewer follows the setup instructions and starts the application without relying on undocumented commands or external production services. Record the environment and actual result; no startup-time target is established here. | Must (BRD) | BRD NFR-001, FR-017; PRD Local use; FRD-020 |
| NFR-002 | Privacy and data handling | The MVP shall use synthetic transaction data only and shall not use real customer or personally identifiable financial data. | Inspect included fixtures and demonstration inputs and confirm they are synthetic and contain no real customer or account-holder data. Review the repository and demonstration materials for accidental real financial/identity data before acceptance. | Must (BRD) | BRD NFR-002; PRD Sections 1 and 4; FRD Sections 1, 5, and 7 |
| NFR-003 | Reliability and data integrity | CSV validation shall complete before any transaction from an import is accepted; an import containing an invalid row shall be rejected atomically. | Test a valid CSV and a CSV containing valid and invalid rows. For the invalid import, verify rejection, actionable errors, and absence of every transaction from that import after the operation; verify previously accepted transactions are unchanged. No persistence technology is prescribed. | Must (BRD) | BRD NFR-003, FR-001–FR-003; PRD Import behavior; FRD-001–FRD-004 |
| NFR-004 | Explainability and usability | Risk explanations shall identify the matched rule category and be traceable to supporting transaction references. | For each displayed flag in the deterministic synthetic scenarios, verify a category and understandable reason are present and every referenced transaction can be located in the accepted data. Verify no numeric risk score is displayed. | Must (BRD) | BRD NFR-004, FR-009; PRD Risk indicators; FRD-007–FRD-012 |
| NFR-005 | Testability and reproducibility | Automated tests shall be repeatable and runnable using documented commands. | A reviewer follows the documented test instructions and records the actual result. Run the documented scenarios against the same fixed synthetic fixture twice and verify that the scenario outcomes are consistent; do not interpret these results as real-world accuracy. | Must (BRD) | BRD NFR-005, FR-016; PRD Testability; FRD-019 |
| NFR-006 | Maintainability and rule transparency | Important assumptions for each detection rule shall be documented, and approved rule parameters shall be configurable without rewriting the detection logic. | For each of the four rules, review its documented inputs, configured parameters, trigger behavior, flag explanation, and known limitations. Demonstrate that changing an approved parameter through the eventual documented configuration process does not require rewriting that rule's detection logic. Exact parameters and the configuration interface remain governed by the approved rule definitions and later design. | Must (BRD) | BRD NFR-006, FR-005–FR-008, FR-018; PRD Risk indicators; FRD-007–FRD-010, FRD-019 |
| NFR-007 | Input safety and privacy | Validation errors shall identify the affected CSV row and issue without exposing sensitive information. | Submit invalid synthetic CSV cases. Verify row-level errors identify the affected row and actionable issue; file-level structural errors explain the problem when a row is not applicable. Confirm messages do not include secrets or real customer data. | Must (BRD) | BRD NFR-007, FR-003; PRD Import behavior; FRD-002–FRD-004 |
| NFR-008 | Auditability | Audit entries shall record timestamp, action, and actor label; a case-status change shall additionally record previous and new status. | Demonstrate a case creation/action and each actual status change; inspect that the required fields are present for the action type and accurately describe the completed action. Same-status selection produces no audit event as specified by the FRD. Verify visible behavior without prescribing audit storage or retention. | Must (BRD) | BRD NFR-008, FR-013; PRD Case and audit behavior; FRD-013–FRD-015 |
| NFR-009 | Usability | The interface shall allow the local user to filter and review transactions and risk indicators without inspecting source code. | Using the interface and the deterministic synthetic fixture, complete the filter-and-review journey for the date, amount, rule-category, flagged-state, and applicable case-status criteria in FRD-006. Verify the returned records match the selected criteria and no-results states are distinguishable from failures. | Must (BRD) | BRD NFR-009, FR-010; PRD Journey B; FRD-005–FRD-006, FRD-016–FRD-018 |
| NFR-010 | Human oversight and governance | Requirements, designs, code, and AI-generated artifacts shall receive human review before acceptance; an artifact shall not be treated as self-approved. | Review the project workflow and stage records to confirm each stage has an explicit human approval gate and downstream work has not started before its prerequisite approval. | Must (BRD) | BRD NFR-010; PRD Section 9; `docs/SDLC-WORKFLOW.md` |
| NFR-011 | Safe interpretation | The product shall not make accusations or automated financial or law-enforcement decisions. | Review user-visible text and demonstrate flag/case flows. Flags are described only as indicators for human review, and no automated accusation, financial action, or law-enforcement conclusion is produced. | Must (BRD) | BRD NFR-011 and Sections 1, 4, and 9; PRD Sections 1, 4, and 6; FRD-011–FRD-014 |
| NFR-012 | Limitations and transparency | The prototype shall document limitations, expected false positives, benign lookalikes, and known failure cases. | Review the scenario and demonstration documentation for all four rules and confirm it identifies limitations, benign lookalikes, and known failure cases. Confirm that neither the materials nor results claim established detection accuracy, real-world effectiveness, regulatory compliance, or production readiness. | Must (BRD) | BRD NFR-012; PRD Sections 1, 4, and 6; FRD-007–FRD-012, FRD-019 |
| NFR-013 | Accessibility | Primary MVP journeys shall be operable using a keyboard, with visible focus and accessible labels for interactive controls. | Verify by keyboard-only completion of import, filter, flag inspection, case creation, and status update; check visible focus and that each interactive control has an accessible name/label. This requirement does not claim conformance to a named accessibility standard. | Must | No explicit BRD/PRD NFR ID; derived from BRD FR-017, PRD Journeys A–C, and FRD-001, FRD-006, FRD-011, FRD-013–FRD-014 |
| NFR-014 | CSV safety and local-use boundary | The product shall reject unsupported upload formats and shall treat CSV cell contents as data, not as executable commands, scripts, or formulas. | Submit an unsupported file type and synthetic CSV values containing text that resembles executable content. Verify unsupported files are rejected and imported content is not executed or interpreted as commands/scripts/formulas during validation, analysis, or display. The MVP remains for one local user; authentication and multi-user access control are not implied. | Must | BRD Security and privacy expectations, NFR-002–NFR-003; PRD Sections 3–4; FRD-001–FRD-004 |
| NFR-015 | Reliability and failure behavior | A failed import, summary, flag, case, status, or audit operation shall not be presented as successful. | Exercise the available failure paths or controlled test doubles for each operation. Verify a failure outcome is visible, no success confirmation is shown for a failed operation, and a failed status update is not presented as saved. Record unavailable failure paths as not yet verifiable rather than passing them. | Must | BRD FR-003, FR-013; PRD Import behavior and Case and audit behavior; FRD-004, FRD-018 |
| NFR-016 | Case and audit consistency | Each actual case-status change shall be reflected consistently in the displayed case status and its required audit details. | For every permitted transition in FRD-014, verify the displayed new status and the corresponding audit timestamp, action, actor label, previous status, and new status. Verify same-status selection changes neither displayed state nor audit history. This requirement does not prescribe internal transaction or persistence mechanisms. | Must | BRD NFR-008, FR-012–FR-013; PRD Case and audit behavior; FRD-014–FRD-015 |

## Privacy and data handling

- Synthetic transaction data only; no real customer, account-holder, or
  personally identifiable financial data.
- Audit details remain limited to the approved fields and review purpose;
  detailed persistence and retention are not specified here.
- The synthetic fixture and any test inputs must remain deterministic and
  reproducible without introducing real financial records.

## Security and local-use boundaries

- The MVP is an educational local application for one local user. This NFR
  does not add authentication, multi-user roles, remote integrations, or
  production deployment requirements.
- Reject unsupported upload formats and never execute imported CSV content.
- Do not commit secrets or credentials. Review source and configuration for
  accidental secrets as part of human review.
- No security certification, production-grade security claim, or protection
  against a production threat model is implied.

## Accessibility and usability

- Apply NFR-004, NFR-009, and the accepted-draft accessibility requirement
  NFR-013.
- Keep flag language understandable and explicitly limited to indicators for
  human review; do not present flags as proof of wrongdoing.

## Performance and reliability

- No numeric response-time, throughput, dataset-size, or memory target is
  established by the approved BRD, PRD, or FRD. Do not treat an unapproved
  number as an acceptance target.
- Atomic import rejection, user-visible failure behavior, and status/audit
  consistency are verifiable under NFR-003, NFR-015, and NFR-016.

## Maintainability and testability

- Document all four rules' inputs, approved parameters, trigger behavior,
  explanations, limitations, and repeatable synthetic scenarios.
- Preserve the FRD's scenario structure and test the documented outcomes;
  synthetic outcomes do not establish real-world accuracy.
- Report actual test commands and results only after they have been run.

## Known limitations and exclusions

- **Performance:** Open decision for the NFR review: select a representative
  deterministic synthetic dataset size, operation(s) to measure, local test
  environment, and numeric response-time/resource targets. Until approved,
  the NFR has no numeric performance commitment.
- **Input capacity:** Open decision: maximum CSV file size and row count and
  expected behavior when an input exceeds the eventual limit. Do not invent
  a limit or imply safe processing of arbitrarily large files.
- **Recovery and retention:** Backup, recovery, audit retention, and data
  deletion behavior remain open as assigned by the BRD to NFR and later
  design work. No persistence mechanism or retention duration is selected.
- **Test coverage:** Detailed coverage percentages, test selection, and test
  exit criteria remain for the Test Plan stage.
- **Accessibility:** NFR-013 is accepted into this draft with Must priority;
  it is not an approved baseline until this NFR document is approved, and it
  does not claim conformance to a named accessibility standard.
- **Baseline metadata discrepancy:** The BRD and PRD file headers still say
  “Draft — pending human review,” while the user explicitly approved both
  baselines in Copilot Chat. They were treated as approved inputs for this
  stage and were not edited. Their metadata can be reconciled only through a
  separate authorized update.
- This is an educational local prototype, not a production AML platform.
  No regulatory-compliance, production-readiness, or real-world detection
  effectiveness claim is made.

## Human approval

- [ ] Review the inherited Must requirements NFR-001–NFR-012 and confirm
      traceability to BRD/PRD/FRD.
- [ ] Review the verification evidence for NFR-013's keyboard operation,
      visible focus, and accessible labels.
- [ ] Agree on measurable performance workload, environment, and response
      targets before treating performance as an acceptance criterion.
- [ ] Decide CSV size/row limits and failure behavior for oversized inputs.
- [ ] Resolve backup, recovery, retention, and deletion expectations at the
      appropriate requirements/design stage.
- [ ] Confirm the BRD/PRD approval-header discrepancy is recorded without
      changing those read-only baselines.
- [ ] Confirm local-only, synthetic-only, human-review safeguards and the
      explicit non-production/non-compliance limitations.

**Status:** Approved.
**Product-owner reviewer:** Name not provided.
**Product-owner decision and date:** Approved, 2026-10-20.
**Technical reviewer:** Rakesh.
**Technical reviewer decision and date:** Approved, 2026-10-20.
**Requested changes:**

The product owner and technical reviewer approved this baseline with the
documented open decisions retained. This records the NFR approval gate only;
it does not start Logical Architecture.
