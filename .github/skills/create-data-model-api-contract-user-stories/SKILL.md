---
name: create-data-model-api-contract-user-stories
description: Produces the data model, API contract, and traceable user stories as one reviewed design stage.
---

# Create Data Model, API Contract, and User Stories

Prerequisites: all requirements and both architecture documents have explicit
human approval. Read the existing design doc as draft input and inspect the
repository where necessary. Do not modify application schema or source code.

Create or update only these three files:

- `docs/contracts/data-model.md`: entities, fields, types, constraints,
  relationships, lifecycle states, import/duplicate assumptions, audit, and
  synthetic fixtures.
- `docs/contracts/api-contract.md`: method/path, request/response, validation,
  errors, access assumptions, filters, evidence references, and audit behavior.
- `docs/contracts/user-stories.md`: small user stories with IDs, source
  requirement IDs, verifiable acceptance criteria, dependencies, and deferred
  scope.

Mark unverified designs as proposals. Preserve Pending, Reviewed, Escalated.
Use only synthetic or verified-licensed public data. Every flag must have a
reason and supporting transaction references and remain a human-review
indicator.

Review all three artifacts together for consistency and traceability. End with
the combined approval checklist and stop before Sprint Plan.
