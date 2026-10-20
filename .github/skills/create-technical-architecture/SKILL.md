---
name: create-technical-architecture
description: Selects a locally runnable technical approach based on approved design and repository inspection.
---

# Create the Technical Architecture

Prerequisites: Logical Architecture and all requirements have explicit human
approval. Inspect the current repository before stating its stack, source
layout, commands, or dependencies. Read `docs/design/design-doc.md` as a draft
input; preserve it and label any unverified proposal.

Create or update only `docs/architecture/technical-architecture.md`. Cover
verified baseline, recommended local stack and rationale, runtime topology,
component mapping, persistence, import-file handling, privacy/security
boundaries, verified build/test/run commands, alternatives, and risks. Favor
the simplest beginner-friendly approach achievable in four days. Identify
decisions needing user confirmation rather than installing tools or changing
application code.

End with an approval checklist. Stop before data/API/story contracts.
