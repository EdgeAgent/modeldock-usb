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

The launcher currently detects a system-installed Node.js runtime. A truly no-install USB edition must place signed Node binaries under `portable-runtime/` for Windows, macOS, and Linux architectures, then select the correct binary before starting `dist/index.js`. The current web project still expects its configured database and model/API environment, so this package is a **portable launcher scaffold**, not yet a fully offline self-contained agent.

Model APIs and business integrations require network connectivity unless a local model and local connector implementations are bundled. Secrets should be entered during first-run setup and stored in an encrypted portable-data location; never commit them to the USB package or launcher scripts. Users should close the launcher and use the operating system's safe-eject function before removing the drive.

## Preparation

From a development machine, build the application with `pnpm build`, copy the resulting `dist/` directory and `portable/` directory to the USB package root, then provide a local database configuration appropriate for the target deployment. The next packaging milestone is replacing system Node detection with signed per-platform runtime bundles and adding a first-run encrypted-secrets wizard.
