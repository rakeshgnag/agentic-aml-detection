---
name: create-logical-architecture
description: Defines AML system responsibilities and flows without assuming a technology stack.
---

# Create the Logical Architecture

Prerequisite: BRD, PRD, FRD, and NFR have explicit human approval.

Create or update only `docs/architecture/logical-architecture.md`. Describe
system context, responsibilities, component boundaries, user/data flows,
trust boundaries, human decision points, quality attribute trade-offs, and
alternatives. A simple Mermaid diagram is appropriate if it improves clarity.
Do not select frameworks, databases, hosting, or libraries here. Trace choices
to approved requirements.

End with open decisions and an approval checklist. Stop before Technical
Architecture.
