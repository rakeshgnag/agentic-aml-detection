# AML Project SDLC Workflow

## Purpose

This guide adapts the role handoffs, focused prompts, checklists, and review
discipline of the Agentic SDLC workshop reference to this local VS Code
workspace. It uses Copilot Chat custom agents and skills; it does not depend on
GitHub Actions, GitHub Issues, a remote coding agent, or a particular
application stack.

## Non-negotiable human approval gates

Run one stage at a time. When a stage is complete, inspect its output and
explicitly approve it in Copilot Chat before invoking the next stage. If you
request changes, revise the same stage and review it again. Do not treat a
draft, checklist, agent response, or generated file as approval.

The `Not started` files under the deliverable paths are scaffolds, not
requirements or design decisions. Populate each only when its stage begins.
The existing BRD and design document remain untouched source material unless
you explicitly request edits to them.

## Stage sequence

| # | Stage | Inputs | Output | Gate before continuing |
|---|---|---|---|---|
| 1 | BRD review | Existing `docs/requirements/BRD.md` | Existing BRD; no replacement | Confirm scope, roles, constraints, assumptions, and open questions |
| 2 | PRD | Approved BRD | `docs/requirements/PRD.md` | Approve goals, users, MVP boundaries, and success measures |
| 3 | FRD | Approved BRD and PRD | `docs/requirements/FRD.md` | Approve functional behavior and testable acceptance criteria |
| 4 | NFR | Approved BRD, PRD, and FRD | `docs/requirements/NFR.md` | Approve quality, privacy, security, accessibility, and performance expectations |
| 5 | Logical Architecture | Approved requirements | `docs/architecture/logical-architecture.md` | Approve components, responsibilities, and flows without prematurely fixing tools |
| 6 | Technical Architecture | Approved logical architecture and inspected repository | `docs/architecture/technical-architecture.md` | Approve verified stack choices, local setup, and technology-specific decisions |
| 7 | Data Model / API Contract / User Stories | Approved requirements and architectures; existing design doc as reference | `docs/contracts/data-model.md`, `docs/contracts/api-contract.md`, `docs/contracts/user-stories.md` | Review all three artifacts together; approve entities, interfaces, boundaries, and acceptance criteria |
| 8 | Sprint Plan | Approved user stories and constraints | `docs/planning/sprint-plan.md` | Approve dependencies, four-day scope, milestones, and deferrals |
| 9 | Development | Approved sprint plan and one approved story at a time | Application changes, only when explicitly requested | Review each implementation diff and test evidence before accepting it |
| 10 | Test Plan | Approved requirements, design, and implementation scope | `docs/testing/test-plan.md` | Approve coverage, synthetic scenarios, and pass/fail criteria before test execution |
| 11 | Release Plan | Approved test results and known limitations | `docs/release/release-plan.md` | Approve readiness, remaining risks, demo steps, and release decision |

Development may be iterative, but do not expand beyond the approved sprint
scope. The Test Plan and Release Plan are distinct stages and both require
human review.

## Copilot Chat roles

Select a custom agent from the VS Code Copilot Chat agent picker, or invoke the
matching skill from the `/` menu. Agent and skill availability can vary with
the installed Copilot Chat version.

| Agent | Intended stages |
|---|---|
| `AML Product Analyst` | BRD review, PRD, FRD, NFR |
| `AML Solution Architect` | Logical and Technical Architecture; data and API contracts |
| `AML Delivery Planner` | User stories and sprint plan |
| `AML Developer` | Approved story implementation only |
| `AML QA and Release` | Test Plan and Release Plan |

Prefer one skill per stage. Provide the relevant approved inputs when prompted.
The agent must stop at the gate and wait for your explicit approval.

## First run

1. Open this repository folder in VS Code and open Copilot Chat.
2. Select `AML Product Analyst` (or invoke `/review-existing-brd`).
3. Ask it to review the existing BRD without editing it, summarize gaps and
   open decisions, and provide the BRD approval checklist.
4. Review the response and the BRD yourself. Explicitly approve it in chat
   before invoking `/create-prd`.
5. Continue one stage at a time using the sequence above.

Example request:

> Use the `review-existing-brd` skill. Read the existing BRD and design doc.
> Do not edit either file. Report gaps and open decisions for human review, then
> stop at the BRD approval gate.

## Scope and data guardrails

- Keep work suitable for a four-day educational MVP. Mark stretch items as
  deferred rather than silently adding scope.
- Use synthetic data by default. Use public data only after its source,
  license, permitted use, and suitability are verified.
- Include positive, negative, threshold-boundary, and benign-lookalike
  scenarios in the eventual test plan.
- Explain each indicator and link it to evidence. A flag means only that a
  configured rule matched; it does not establish wrongdoing.
- Case statuses remain human-managed: Pending, Reviewed, Escalated.
- Do not add automated accusations or financial decisions.

## Traceability and review

Carry requirement IDs forward when they exist. Give new requirements stable
IDs and do not reuse an ID for a different meaning. Each user story should
reference its source requirement and include verifiable acceptance criteria.
The sprint plan and test plan should map back to those IDs.

At every gate, review:

- Scope and terminology match the approved upstream artifacts.
- Assumptions and unresolved decisions are visible.
- No downstream stage has been started early.
- Data use and human-review safeguards are preserved.
- The work is achievable locally and within the agreed time.
- No claim is made about unverified technology, test results, accuracy, or
  production readiness.
