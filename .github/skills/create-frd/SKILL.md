---
name: create-frd
description: Defines testable AML functional behavior from approved requirements.
---

# Create the FRD

Prerequisites: the BRD and PRD have explicit human approval. Read both and
preserve their terminology and scope. Do not edit upstream artifacts.

Create or update only `docs/requirements/FRD.md`. Define actors, user flows,
functional requirements with stable IDs and verifiable acceptance criteria,
case-status transitions, CSV validation/error behavior, filters, dashboard
behavior, risk explanations/evidence, audit behavior, out-of-scope items, and
open decisions. Trace each requirement to its source. Avoid prescribing
technology unless it is already approved.

End with a completeness and approval checklist. Stop before NFR work.
