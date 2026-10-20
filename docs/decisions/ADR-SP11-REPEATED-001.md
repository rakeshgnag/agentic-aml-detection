# ADR-SP11-REPEATED-001: Repeated-transfer prototype definition

**Status:** Proposed — awaiting repository review and recording
**Scope:** US-006 / SP-11 repeated-transfer rule only
**Project owner direction:** The project owner specified this configurable
prototype definition in conversation. The values are demonstration defaults,
not approved AML policy thresholds; repository review remains pending.

## Context

US-006 requires configurable repeated-transfer detection with explanations
and supporting references. The Sprint Plan gates implementation on an
explicit repeated-transfer definition. Approved sources leave the minimum
count, window, matching semantics, boundary, grouping, and multiple-import
analysis scope open.

## Definition proposed for repository review

- Stable identifier: `repeated-transfers.v1`.
- Category: `repeated_transfers`.
- A group contains transactions with the same `sender_id`, same `receiver_id`,
  and same direction. Reverse-direction transactions belong to a different
  group and do not count toward the same minimum.
- A group qualifies at three or more transactions.
- Amounts may vary; there is no amount equality or amount threshold.
- Currency must match exactly within a group. No currency conversion is
  performed.
- Transactions from all persisted imports are considered together.
- The configurable prototype window is 24 hours, inclusive: elapsed time
  equal to 24 hours qualifies; a greater span does not.
- A sliding window is anchored at each transaction in chronological order and
  includes same-key transactions through the configured inclusive duration.
  Each qualifying window produces a flag containing all its matching
  transactions. Overlapping groups are allowed; identical evidence sets are
  emitted once.
- Repeated evaluation of the same rule and exact internal transaction
  evidence set does not create another flag.

## Rationale and limitations

This definition supports small deterministic synthetic examples, makes
direction and currency grouping explicit, and avoids comparing or converting
amounts. Sliding windows can yield overlapping flags for a larger group; all
supporting records remain inspectable. The minimum count and duration are
illustrative, have not been validated for real-world use, and must not be
interpreted as AML policy.

## References

- `docs/contracts/user-stories.md` — US-006.
- `docs/requirements/FRD.md` — FRD-008 and FRD-019.
- `docs/planning/sprint-plan.md` — SP-11 and SP-12.
- `docs/architecture/technical-architecture.md` — configurable rule modules;
  thresholds, windows, matching, and boundary conventions remain open.
- `docs/contracts/data-model.md` — transaction, risk flag, and evidence
  entities and unresolved rule semantics.

This record captures owner direction for review. It does not amend approved
baseline documents or claim repository approval.
