---
name: create-test-plan
description: Creates a measurable, synthetic-scenario-based test plan for the approved AML MVP.
---

# Create the Test Plan

Prerequisites: implementation scope is approved; read approved requirements,
contracts, sprint plan, and inspect actual implementation and available test
commands. Do not invent test outcomes or production behavior.

Create or update only `docs/testing/test-plan.md`. Specify scope, environment,
verified commands, test types, scenario data and provenance, CSV validation,
rule positives/negatives/boundaries/benign lookalikes, explanations and
evidence references, case status/audit, dashboard/filter behavior,
input/privacy checks, entry/exit criteria, and defect reporting.

Tests verify configured indicator behavior, not criminality or real-world
accuracy. End with a human approval checklist and stop before test execution
or Release Plan work.
