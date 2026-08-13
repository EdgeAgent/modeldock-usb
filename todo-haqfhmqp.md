# Project TODO

- [x] Open the attached Agent Ops Desk project for editing.
- [x] Review the existing project implementation against the user's requested changes.
- [x] Implement the user's requested UI, behavior, or data changes.
- [x] Add or update Vitest coverage for implemented changes.
- [x] Verify the project with type checks, tests, and a rendered preview.
- [x] Save a checkpoint after completing and validating requested changes.

## History

This session was opened from the attached shared project. No specific edit request has been provided yet.

- [x] Redesign the app around a guided agency operating system with a clear daily command center.
- [x] Add a simple business-ask intake flow that guides the user from request to next action.
- [x] Add workflow templates for common agency asks such as new client work, proposal, marketing campaign, website build, and recurring operations.
- [x] Add step-by-step progress tracking with clear owners, status, due dates, and next-best action.
- [x] Add agency views for active work, upcoming deadlines, and client delivery health.
- [x] Preserve or improve authentication and responsive behavior.
- [x] Add or update Vitest coverage for the guided workflow behavior.
- [x] Verify the updated experience with type checks, tests, and screenshots.
- [x] Save a checkpoint for the completed redesign.

- [x] Restore dedicated routed views for Work board, approvals, specialists, activity history, and guardrails.
- [x] Add dynamic workflow tracking fields for owner, due date, status, and next-best action.
- [x] Replace hardcoded fallback dashboard metrics with data-driven empty states or live values.
- [x] Re-run validation and save the redesign checkpoint.
- [x] Persist target dates for new workflows and display them on the work board and command center.
- [x] Re-run final validation after due-date persistence is added.
- [x] Save the final redesign checkpoint.
- [x] Add a Deliverables tab for agent-created outputs with status, owner, workflow, and access to the output.
- [x] Add a workflow builder for composing reusable agent workflows from steps and transitions.
- [x] Use Dify and LangChain concepts as reference points without copying their code or branding.
- [x] Persist workflows, workflow steps, and deliverable metadata with appropriate audit records.
- [x] Preserve approval gates for sensitive or external actions in built workflows.
- [x] Add or update Vitest coverage for workflow creation and deliverable behavior.
- [x] Verify Deliverables and Workflow Builder across responsive layouts and save a checkpoint.
- [x] Add a visible Skills tab for per-agent skills and instructions.
- [x] Add a Memory tab for durable agent context, preferences, and scoped notes.
- [x] Add Apps and MCPs tabs for per-agent connector access and tool permissions.
- [x] Add agent-level configuration persistence and audit visibility.
- [x] Add tests for saving and reading agent configuration.
- [x] Validate the new configuration workspace responsively and save a checkpoint.
- [x] Split Apps and MCPs into separate configuration tabs.
- [x] Clearly label the connector catalog and explain how workspace connections become available.
- [x] Add read-path test coverage for agent configuration.
- [x] Validate the Specialists configuration workspace on mobile.
- [x] Save a new checkpoint after the configuration changes.
- [x] Show the linked workflow on each deliverable card.
- [x] Enforce approval requirements when launching a workflow with sensitive or tool steps.
- [x] Add deliverable creation mutation and audit coverage.
- [x] Validate Deliverables and Workflow Builder on mobile and save the final checkpoint.
- [x] Create real approval records when a workflow run reaches a required approval or sensitive tool step.
- [x] Let the builder mark agent and tool steps as approval-gated.
- [x] Save a final checkpoint after the approval enforcement changes.
- [x] Carry workflow IDs through launch and advance calls and advance runs through ordered workflow steps.
- [x] Create approvals only when execution reaches the gated step, including a non-gated step before it.
- [x] Add test coverage for step progression into a later approval gate.
- [x] Save a final checkpoint after step-by-step execution validation.
- [ ] Save a new project checkpoint after the final step-by-step workflow execution changes are validated.
