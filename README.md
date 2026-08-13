# ModelDock USB

> **Your local LLM command center — autonomous business workflows, human oversight, and portable USB-first execution.**

**ModelDock USB** turns a plain-language business ask into a trackable workflow that can be planned, launched, paused, approved, audited, retried, or stopped. It brings local-model operations out of the demo and into a control desk designed for real operators.

**Why people should care:** run a serious agent workspace from a removable drive, keep operational state local by default, connect a loopback model when you want fully disconnected execution, and retain a human approval desk for the moments that matter.

| Local-first promise | What ModelDock delivers |
|---|---|
| **Portable** | Windows, macOS, and Linux USB launchers with bundled-runtime slots |
| **Private by default** | Atomic local JSON persistence, encrypted secret helper, loopback binding |
| **Operator-controlled** | Approval gates, audit history, pause/resume, retries, timeouts, and emergency stop |
| **Model-flexible** | Local model setup, endpoint health checks, USB path discovery, and read-only model scanning |

> **Start here:** run `pnpm install && pnpm test`, then open the dashboard with `pnpm dev`. To use it as a USB product, build with `pnpm portable:package` and follow [`portable/README.md`](portable/README.md).

The platform runs as a web dashboard and can be assembled into a cross-platform USB package for **Windows, macOS, and Linux**. Its portable runtime defaults to an atomic local JSON store, supports local-model setup and health checks, and keeps cloud connectivity optional rather than mandatory.

## Why this project is different

Most agent demos show a model completing a task. ModelDock is designed around the harder question: **how do you operate a fleet of agents responsibly when the work matters?**

| Operating problem | ModelDock response |
|---|---|
| Business asks arrive vague and unstructured | Natural-language command center converts asks into ordered workflow steps |
| Agents can act faster than people can review | Human approval queue with edit, deny, resubmit, and audit attribution |
| Failures are difficult to understand | Live run monitor, execution-log tail, filters, retries, pause/resume, and timeouts |
| Automation can become unsafe | Per-agent pause, global emergency stop, policy controls, and server-side guards |
| Sensitive data should not require a cloud dependency | Offline mode, local JSON persistence, encrypted local secrets, and local-model readiness checks |
| A workspace should travel with its operator | USB-relative paths, bundled-runtime slots, cross-platform launchers, backup/restore, and safe-eject guidance |

## Core capabilities

- **Command Center:** Describe a business objective in plain language and preview the resulting multi-step plan before launch.
- **Agent Registry:** Track departments, roles, models, allowed tools, status, and configuration.
- **Live Run Monitor:** Follow current step, status, elapsed time, cost estimate, approvals, and execution events.
- **Human Approval Desk:** Approve, deny, edit, and resubmit sensitive actions with evidence and risk tiers.
- **Workflow Builder:** Save reusable templates with ordered steps, agent assignment, priority, timeouts, and approval gates.
- **Audit and governance:** Preserve chronological activity, actors, state transitions, tool calls, and control decisions.
- **Emergency controls:** Pause agents, pause runs, retry failed steps, resume eligible work, or trigger the global kill switch.
- **Offline-first operation:** Select Offline or Cloud mode, persist operational state locally, configure a local model, probe loopback endpoints, and block cloud-only launches.
- **Portable model operations:** Discover platform-specific USB model locations, scan supported model files read-only, select a detected file, and inspect file size and format.
- **Versioned backups:** Export v1 JSON backups and create automatic pre-restore snapshots before importing state.

## Quick start for development

### Requirements

- Node.js 22.x or a compatible current Node release
- pnpm 10.x
- A MySQL/TiDB connection only when intentionally using the cloud database path; local JSON is the default for the portable runtime

```bash
git clone <your-repository-url>
cd agent-ops-desk
pnpm install
pnpm check
pnpm test
pnpm dev
```

Open the local dashboard shown by the development server. For a production build:

```bash
pnpm build
pnpm start
```

## One-click USB workflow

The USB package is assembled from the production build and portable runtime sources. The launcher selects a bundled runtime when the matching slot exists and falls back to host Node only when necessary.

```text
Agent-Ops-Desk/
├── dist/                         # Production dashboard/server bundle
├── portable/
│   ├── launch-windows.ps1       # Windows launcher
│   ├── launch-unix.sh            # macOS/Linux launcher
│   ├── start-runtime.mjs         # Shared startup, health check, and shutdown
│   ├── select-node.mjs           # Bundled-runtime selection
│   ├── package-manifest.json     # Distribution contract
│   ├── backup.mjs                # Portable data backup helper
│   ├── secrets.mjs               # Encrypted local secret helper
│   └── README.md                 # Detailed USB instructions
├── portable-data/                # Local JSON state and encrypted local data
└── portable-runtime/             # Bundled Node runtime slots and verification files
```

Build the application and assemble a package with:

```bash
pnpm portable:package
```

On macOS or Linux, run `chmod +x portable/launch-unix.sh` once, then start `./portable/launch-unix.sh`. On Windows, run PowerShell with `powershell -ExecutionPolicy Bypass -File .\\portable\\launch-windows.ps1`. The launcher waits for the local server health check before opening the dashboard and forwards shutdown signals when it exits.

Large signed runtime payloads are distributed separately from this source repository when required. The repository retains runtime slots, manifests, checksums, and launcher logic so the source remains reviewable and GitHub-friendly.

## Local-first data and model safety

Offline mode is not a visual toggle. It is enforced by shared client guards and server-side launch checks. The portable runtime writes application records to `portable-data/agent-ops-state.json` using atomic replacement and restrictive permissions. Cloud persistence remains available as an explicit override with `PORTABLE_PERSISTENCE=mysql` and a configured database URL.

The local-model setup flow validates portable paths and loopback endpoints. A manual health check can probe a local endpoint before launch, and Offline workflow starts reject missing or unreachable local-model configuration. Model-file discovery is bounded and read-only: it follows no symlinks, executes no files, and only reports supported extensions such as `.gguf`, `.safetensors`, `.onnx`, `.bin`, `.pt`, and `.pth`.

> **Important:** This project is an operational platform and a serious starting point, not a certification that every model, connector, or host environment is safe. Test on disposable data, review policies, validate native launchers on each target OS, and keep encrypted backups.

## Security model

The default posture is designed around least surprise:

1. The portable server binds to loopback when `PORTABLE_ROOT` is set, reducing accidental LAN exposure.
2. Credentials are not placed in launcher scripts or committed to the repository.
3. Local secrets use an encrypted AES-GCM helper driven by a host-provided passphrase.
4. Sensitive workflow actions remain approval-gated and auditable.
5. Emergency-stop state is preserved across local persistence operations.
6. Portable backups create a pre-restore snapshot before replacing active state.
7. Repository rules exclude state files, encrypted secrets, logs, generated USB assemblies, and archives.

## Architecture at a glance

```text
Natural-language request
        │
        ▼
Command Center → workflow planner → approval gates → agent run
        │                                  │
        ├──────── live WebSocket/polling ───┤
        ▼                                  ▼
Run monitor + execution logs       Human approval desk
        │                                  │
        └──────── local JSON / MySQL ──────┘
                         │
                  USB portable runtime
```

The application uses React 19, Tailwind CSS, Express, tRPC, Drizzle ORM, WebSockets, and Vitest. The local JSON adapter mirrors the application’s operational vocabulary so agents, runs, approvals, logs, policies, workflows, deliverables, and workspace controls can remain available without MySQL.

## Validation

The repository currently validates with:

```bash
pnpm check
pnpm test
```

The portable test surface also covers launcher/runtime selection, local JSON persistence, backup validation, local-model readiness, platform-specific path discovery, and read-only model-file scanning. Native PowerShell execution and physical USB behavior must still be verified on real Windows, macOS, and Linux hosts before a public release.

## Roadmap toward a breakout release

The next high-leverage improvements are connector sandboxing, signed release automation, endpoint-specific health probes for common local runtimes, model checksum verification, backup history with retention policies, richer model metadata extraction, and a polished first-run onboarding flow. Community feedback should focus on repeatable business workflows, measurable operator time saved, and safe failure recovery rather than novelty demos.

## Contributing

Contributions are welcome when they improve operator control, reproducibility, security, accessibility, or cross-platform reliability. Please include tests for behavior changes, avoid committing real credentials or state files, and document any host-specific assumptions. For large changes, open an issue describing the workflow, safety boundary, and validation plan before submitting a pull request.

## License

ModelDock is released under the MIT License. See `package.json` for the repository license declaration.
