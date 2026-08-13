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
