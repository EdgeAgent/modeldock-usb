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
