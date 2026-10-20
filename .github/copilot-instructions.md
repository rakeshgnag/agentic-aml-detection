# AML Transaction Risk Identification — Copilot Instructions

## Project context

This is an educational, locally runnable AML transaction risk identification
web application. The project is intended to be achievable as a four-day MVP.
Read the approved SDLC artifact for the task before drafting a later artifact
or changing code.

## Source documents and current state

- `docs/requirements/BRD.md` is an existing draft. Preserve it; do not replace
  or rewrite it unless the user explicitly requests that work.
- `docs/design/design-doc.md` is an existing draft containing proposed
  architecture, data model, API, UI, and scenarios. Preserve it. Its technology
  choices are proposals, not verified repository facts.
- Inspect the repository before making implementation claims. Do not invent
  application source, dependencies, APIs, runtime commands, or test results.
- Stage output files are scaffolds until a human reviews and approves them.

## Required SDLC order and gates

Follow `docs/SDLC-WORKFLOW.md` in this order:

1. Review and approve the existing BRD.
2. PRD.
3. FRD.
4. NFR.
5. Logical Architecture.
6. Technical Architecture.
7. Data Model, API Contract, and User Stories.
8. Sprint Plan.
9. Development.
10. Test Plan.
11. Release Plan.

Work on only the stage requested. At its end, summarize what changed, identify
assumptions and unresolved decisions, provide the stage's human-review
checklist, and stop. Do not draft or implement a downstream stage until the
user explicitly approves the current stage. An AI-generated artifact is never
its own approval.

## Domain and safety constraints

- Use synthetic or appropriately licensed public data only. Never add real
  customer, account-holder, or transaction data.
- Risk flags are configurable indicators that may warrant human review. They
  are not proof of money laundering.
- Do not automate accusations, law-enforcement conclusions, account freezes,
  transaction blocking, or other financial decisions.
- Show rule reasons, configured parameters, limitations, and supporting
  transaction references. Do not present an unvalidated score as a probability.
- Document false positives, benign lookalikes, and known failure cases.
- Respect the statuses exactly: Pending, Reviewed, Escalated. Status changes
  are human-managed and auditable.
- Keep local-MVP assumptions explicit. Do not imply production readiness,
  regulatory compliance, or security certification.

## Engineering and documentation rules

- Preserve traceability between requirements, design, user stories,
  implementation, and tests.
- Keep the solution beginner-friendly and within the four-day MVP target.
  Identify optional scope rather than silently expanding the MVP.
- Verify the actual repository stack and available commands before proposing
  implementation details. Prefer existing patterns and dependencies.
- Do not modify application source code when working on workflow or
  documentation setup tasks.
- Do not overwrite existing user documents. If an existing file needs a
  substantive change, explain the conflict and ask first.
- State open decisions instead of guessing, especially dataset licensing,
  CSV semantics, time zones, thresholds, persistence, and authentication.
- Never claim a test, build, review, or runtime check passed unless it was run.

## Working in VS Code

Use repository files and tools available in the current VS Code Copilot Chat
session. Do not assume GitHub Issues, GitHub Actions, a remote coding agent,
GitHub MCP tools, Claude, or network access are available. Ask the user to
provide remote content if the task depends on unavailable integrations.
