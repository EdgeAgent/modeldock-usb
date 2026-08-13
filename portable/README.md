# Agent Ops Desk USB Package

This directory defines the cross-platform USB launch surface for Agent Ops Desk. The intended package is a folder that can be copied to a removable drive and started with one platform launcher:

| Host | Launcher | Behavior |
|---|---|---|
| Windows | `launch-windows.ps1` | Starts the local runtime and opens the dashboard in the default browser. |
| macOS | `launch-unix.sh` | Starts the local runtime and opens the dashboard with `open`. |
| Linux | `launch-unix.sh` | Starts the local runtime and opens the dashboard with `xdg-open`. |

The shared runtime is `start-runtime.mjs`. It resolves paths from the USB root, uses a configurable local port, forwards shutdown signals, and does not write credentials into the launcher scripts.

On macOS and Linux, open Terminal, change into the USB package root, run `chmod +x portable/launch-unix.sh` once, and start it with `./portable/launch-unix.sh`. macOS uses the `open` command to open the local dashboard; Linux uses `xdg-open` when available. On Windows, open PowerShell in the USB package root and run `powershell -ExecutionPolicy Bypass -File .\\portable\\launch-windows.ps1`.

## Expected package layout

```text
Agent-Ops-Desk/
├── dist/                       # Production build output
├── portable/
│   ├── launch-windows.ps1
│   ├── launch-unix.sh
│   ├── start-runtime.mjs
│   ├── package-manifest.json
│   └── README.md
├── portable-data/              # Local database, audit exports, and encrypted config
└── portable-runtime/           # Optional bundled Node runtime per host architecture
```

## Current runtime contract

The launcher selects a bundled Node.js runtime from `portable-runtime/<platform-key>/` when that binary is present and falls back to the host `node` executable otherwise. The separately assembled USB distribution contains official Node.js v22.13.0 binaries for Linux x64, Windows x64, macOS x64, and macOS arm64. The saved project keeps the runtime slots, official signed checksum artifacts, and `BUNDLED-BINARY-SHA256SUMS`; the large binary payload is distributed separately because it exceeds the project checkpoint size limit. Verify the signed checksum before distributing a release. When the runtime payload has been copied into the four `portable-runtime/<platform-key>/` slots from the USB distribution or File Storage artifact, the launcher selects the correct bundled binary before starting `dist/index.js`, enabling no-preinstalled-Node startup. The portable runtime now uses a **local JSON-backed application store by default**, so agents, runs, approvals, audit logs, execution logs, workflows, deliverables, policies, workspace state, and the selected execution mode can persist without MySQL/TiDB. Set `PORTABLE_PERSISTENCE=mysql` and provide a database URL only when you intentionally want the cloud database path. The JSON store is written to `portable-data/agent-ops-state.json` with atomic replacement and restrictive file permissions. Copy `config.example.json` to a user-controlled configuration location during first-run setup, then provide database and model credentials through the host environment or an encrypted secret store; never place live keys in the USB repository. To create an encrypted secret, set `PORTABLE_SECRET_PASSPHRASE` only in the host environment and run `node portable/secrets.mjs set MODEL_API_KEY your-value`; use `node portable/secrets.mjs list` to inspect names without revealing values. The passphrase and live values are never written to the USB package.

The dashboard includes a **User settings** panel and a persistent status indicator for **Offline mode / Cloud mode**. Offline mode blocks workflow starts for agents without a local/offline model marker while preserving approvals, audit logs, and emergency-stop controls. The shared runtime creates `portable-data/`, passes the JSON state path and `PORTABLE_PERSISTENCE=local-json` to the server by default, waits for the local HTTP endpoint to respond, and opens the dashboard only after the health check succeeds. Closing the launcher forwards a shutdown signal to the local server. After the browser is closed and the launcher process exits, create a backup with `node portable/backup.mjs`, then use the host operating system's safe-eject action before removing the USB drive.

Model APIs and business integrations require network connectivity unless a local model and local connector implementations are bundled. Secrets should be entered during first-run setup and stored in an encrypted portable-data location; never commit them to the USB package or launcher scripts. Users should close the launcher and use the operating system's safe-eject function before removing the drive.

## Preparation

From a development machine, build the application with `pnpm build`, copy the resulting `dist/`, `portable/`, `portable-runtime/`, and `portable-data/` scaffolds to the USB package root, then verify the signed runtime checksums before distribution. Local JSON persistence is the default; configure `PORTABLE_PERSISTENCE=mysql` only when intentionally using MySQL/TiDB. The sandbox cannot execute native Windows or macOS launchers directly, and PowerShell is not installed here for parser validation. Run `powershell -ExecutionPolicy Bypass -File .\\portable\\launch-windows.ps1` on Windows and execute `./portable/launch-unix.sh` on macOS/Linux as host-side smoke tests. The launcher scripts select bundled runtimes when present and otherwise fall back to host Node 22+.
