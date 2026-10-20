# ADR-SP09-RAPID-001: Rapid fund movement prototype definition

**Status:** Proposed — awaiting repository review and recording
**Scope:** US-005 / SP-09 rapid fund movement rule only
**Project owner direction:** The project owner specified this definition in
conversation for a configurable prototype. It is not an approved AML policy
threshold, and repository review remains pending.

## Context

US-005 requires a configured rapid-movement rule with a category, explanation,
and supporting transaction evidence. The Sprint Plan gates implementation on
an explicit rule definition. Approved sources leave thresholds, windows,
matching, boundary conventions, and multiple-import analysis open.

## Definition proposed for repository review

- Stable identifier: `rapid-fund-movement.v1`.
- Category: `rapid_fund_movement`.
- A match is a pair of distinct transactions where the first transaction's
  `receiver_id` equals the next transaction's `sender_id`.
- Each qualifying pair contains two transactions. Longer chains are evaluated
  as consecutive linked pairs; each matching pair is a separate flag with
  those two transactions as evidence.
- No amount or currency condition is applied.
- Transactions from all persisted imports are considered together.
- The configurable prototype maximum gap is 30 minutes for each consecutive
  linked pair. A gap exactly equal to 30 minutes qualifies; a greater gap does
  not. This 30-minute value is a demonstration default pending human review,
  not an AML policy threshold.
- Repeated evaluation of the same rule and exact internal transaction
  evidence set does not create another flag.

## Rationale and limitations

The pair definition gives the prototype a small, testable linked-funds
scenario without comparing amounts across currencies or introducing an
unapproved amount threshold. Per-pair evidence makes longer chains
inspectable, but can produce overlapping flags. The result is only an
indicator for human review; it does not establish wrongdoing or predict risk.
The selected window is illustrative and has not been validated for real-world
use.

## References

- `docs/contracts/user-stories.md` — US-005.
- `docs/requirements/FRD.md` — FRD-007 and FRD-019.
- `docs/planning/sprint-plan.md` — SP-09 and SP-10.
- `docs/architecture/technical-architecture.md` — configurable rule modules;
  rule thresholds and matching conventions remain open.
- `docs/contracts/data-model.md` — transaction, risk flag, and evidence
  entities and unresolved rule semantics.

This record captures owner direction for review. It does not amend approved
baseline documents or claim repository approval.
