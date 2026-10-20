# agentic-aml-detection

## Agentic SDLC workflow

This repository contains an educational AML Transaction Risk Identification
project. The local Copilot workflow is documented in
[docs/SDLC-WORKFLOW.md](docs/SDLC-WORKFLOW.md).

Open Copilot Chat in VS Code and select one of the project agents from the
agent picker. To run a repeatable stage prompt, enter `/` and select its
skill, for example `/review-existing-brd` or `/create-prd`. Availability and
the exact picker presentation depend on the installed Copilot Chat version.

The workflow is gated: review each artifact and explicitly approve it in chat
before asking Copilot to start the next SDLC stage. The existing BRD and design
document are preserved as draft inputs. This setup does not include application
source code or a verified technology stack.

Use synthetic or appropriately licensed public data only. Risk indicators are
for human review, not proof of money laundering and not a basis for automated
financial or law-enforcement decisions.
