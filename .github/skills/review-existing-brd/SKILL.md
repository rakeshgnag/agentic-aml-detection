---
name: review-existing-brd
description: Reviews the existing AML BRD without replacing it and prepares a human approval checklist.
---

# Review the existing BRD

Read `docs/requirements/BRD.md`, `docs/design/design-doc.md`,
`.github/copilot-instructions.md`, and `docs/SDLC-WORKFLOW.md`.

Do not edit the BRD or design document. Report:

1. A concise summary of the product, users, scope, and constraints.
2. Coverage of CSV import, dashboard, explainable configurable rules, evidence,
   human-managed case statuses, audit, filters, tests, and synthetic scenarios.
3. Contradictions, missing details, and decisions required before PRD work.
4. Any technology or data assumptions that remain unverified.
5. The BRD approval checklist: scope, outcomes, roles, data/privacy boundaries,
   human-review limits, and open questions.

Do not resolve open questions by guessing. Stop and wait for explicit approval.
