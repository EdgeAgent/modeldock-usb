# Project TODO

- [x] Establish the elegant, refined AI agent operations dashboard shell and navigation.
- [x] Build Department Overview home screen with per-department KPI cards for runs completed, approval rate, average cycle time, and open queue items.
- [x] Add Department Overview summary chart.
- [x] Build Agent Registry with name, department, role, status, model, and allowed tools fields.
- [x] Add activate/deactivate controls for individual agents.
- [x] Build Agent Run Launcher with agent selection, task description, priority level, and tier level.
- [x] Build Live Run Monitor with active and recent agent runs, status, current step, elapsed time, and cost estimate.
- [x] Build Human Approval Queue with agent, proposed action, tool and parameters, supporting evidence, risk tier, and deadline.
- [x] Add Approve action to Human Approval Queue.
- [x] Add Deny action to Human Approval Queue.
- [x] Add Edit & Resubmit action to Human Approval Queue.
- [x] Build immutable chronological Audit Log with timestamp and actor attribution for agent runs, tool calls, approval decisions, denial reasons, and state transitions.
- [x] Build Emergency Stop Controls with per-agent kill switches.
- [x] Build global kill switch to immediately disable tool execution and freeze active runs without deleting evidence.
- [x] Build Policy and Tool Registry with allowed tools, approval tier, spend limits, data classification, and last review date.
- [x] Add database schema, seed-safe demo records, protected procedures, and unit tests.
- [x] Verify responsive layouts, loading states, empty states, error states, and accessibility.
- [x] Run typecheck and Vitest tests.
- [x] Capture visual screenshots and save final project checkpoint.

- [x] Implement database schema and protected tRPC procedures for agents, runs, approvals, audit entries, policies, and emergency-stop state.
- [x] Replace hardcoded dashboard arrays with server-backed queries and mutations.
- [x] Implement real approval workflows: Approve, Deny with denial reason, and a true Edit & Resubmit form that persists changes.
- [x] Write audit-log entries for run launches, tool calls, approvals/denials, and state transitions automatically.
- [x] Implement actual per-agent and global emergency-stop enforcement that freezes active runs and blocks tool execution.
- [x] Add complete loading, error, empty, and accessibility coverage for each major screen and interaction.

- [x] Implement an idempotent seed routine for demo agents, runs, approvals, policies, and workspace state.
- [x] Verify the demo seed routine can run repeatedly without duplicate records or unique-key failures.

- [x] Add a natural-language command chat interface inside Agent Ops Desk.
- [x] Route chat commands to launch an agent workflow with task, priority level, and tier level.
- [x] Support chat commands to pause runs, inspect status, and open the Human Approval Queue.
- [x] Display live run progress in chat with status, current step, elapsed time, cost estimate, and approval state.
- [x] Add a chat command audit trail and clear safety messaging for blocked or approval-gated actions.
- [x] Add loading, error, empty, and accessibility states for the command chat.
- [x] Test, visually verify, and checkpoint the chat experience.

- [x] Render explicit live run updates inside the chat stream with status, current step, elapsed time, cost estimate, and approval state.
- [x] Audit every supported chat command and blocked or approval-gated command attempt, not only successful launches.
- [x] Add explicit command-chat keyboard, screen-reader, loading, error, and empty-state coverage.
- [x] Save a new project checkpoint after the completed chat hardening pass.

- [x] Upgrade natural-language processing to parse complex multi-step workflow commands into ordered steps with per-step agent, task, priority, tier, and approval requirements.
- [x] Add multi-step workflow preview, launch, progress, pause, and failure handling in the Command Center.
- [x] Add clickable live agent status cards with a detailed execution-log drawer or panel.
- [x] Persist and display detailed execution log entries with timestamps, actors, steps, tool calls, approvals, and state transitions.
- [x] Add a WebSocket server channel for low-latency agent status and execution-log updates.
- [x] Subscribe the dashboard and Command Center to WebSocket updates with reconnect and polling fallback behavior.
- [x] Add tests, responsive visual verification, and a fresh checkpoint for the upgrades.

- [x] Emit execution-log-specific realtime events whenever execution log rows are created, and subscribe the UI to those events.
- [x] Write execution-log entries for tool calls, approval approvals/denials/resubmissions, and all run state transitions.
- [x] Save a fresh checkpoint after the complete execution-log and realtime coverage pass.

- [x] Add quick-action templates in the Command Center for frequently used multi-step workflows.
- [x] Allow quick-action templates to populate and launch multi-step workflow commands safely.
- [x] Add workflow controls to retry failed steps.
- [x] Add workflow controls to pause active agents and active workflow steps.
- [x] Add step-level timeout configuration and enforcement.
- [x] Add a live log-tail view for the selected run.
- [x] Add live log-tail filters by event type, actor, and step.
- [x] Preserve WebSocket updates, polling fallback, approval gates, audit entries, and emergency-stop enforcement through the new controls.
- [x] Add tests, responsive visual verification, and a fresh checkpoint for the workflow-control upgrades.

- [x] Add a true agent-level pause action in the live run detail surface that updates agent status and blocks new launches.

- [x] Add persistent custom workflow templates with name, description, ordered steps, priority, tier, and approval-gate settings.
- [x] Add create, edit, save, delete, and chat-insert actions for custom workflow templates.
- [x] Add date-range filtering to the execution-log tail.
- [x] Add execution-log export with the active filters applied.
- [x] Add role-based permissions for resuming paused agents and workflows.
- [x] Add resume-agent controls that securely reactivate paused agents and resume eligible workflow runs.
- [x] Audit resume decisions and export actions with actor attribution.
- [x] Add tests, responsive visual verification, and a fresh checkpoint for the personalized controls.

- [x] Implement true custom template deletion or clearly expose the archive behavior under matching labels.
- [x] Persist full custom template edits, including ordered steps and each step's priority, tier, and approval-gate settings.
- [x] Save a fresh checkpoint after the personalized-control corrections.

- [x] Add direct step-level template editing so users can load, review, reorder, and modify each saved step's agent, task, priority, tier, and approval-gate setting before saving.
- [x] Save a fresh checkpoint after the direct template-step editor is verified.

- [x] Add move up and move down controls for custom template steps and persist updated positions on save.
- [x] Save a fresh checkpoint after verifying template-step reordering.

- [ ] Define the one-click USB startup target and supported host platforms.
- [ ] Package the dashboard, local agent runtime, portable database, and launcher for removable storage.
- [ ] Add a one-click launcher that detects the USB root, starts local services, opens the dashboard, and shuts them down cleanly.
- [ ] Define encrypted local secrets handling and first-run setup without storing credentials in plain text on the USB.
- [ ] Define offline versus internet-required capabilities for model access and business integrations.
- [ ] Add portable persistence, backup, emergency-stop, and safe-eject behavior.
- [ ] Test startup and shutdown from a clean host environment and document the USB folder layout.

- [x] Add a shared USB package layout that works from any mounted drive path.
- [x] Add a Windows one-click launcher for the portable Agent Ops Desk runtime.
- [x] Add a macOS one-click launcher with executable-permission guidance.
- [x] Add a Linux one-click launcher with executable-permission guidance.
- [x] Detect a compatible local Node runtime, with bundled per-platform runtime still pending.
- [ ] Use a portable local database and filesystem paths relative to the USB root.
- [ ] Add cross-platform first-run configuration for model/API connectivity and encrypted local secrets.
- [ ] Add portable launcher health checks, browser opening, clean shutdown, and safe-eject guidance.
- [x] Document offline limitations, required internet connectivity, and USB security considerations.
- [ ] Test Windows, macOS, and Linux launch paths or provide reproducible build instructions where the sandbox cannot emulate a host OS.

- [x] Add explicit macOS and Linux launcher permission and startup instructions to the USB README.
