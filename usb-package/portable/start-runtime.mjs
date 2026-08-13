import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.env.PORTABLE_ROOT ? resolve(process.env.PORTABLE_ROOT) : resolve(new URL("..", import.meta.url).pathname);
const port = process.env.PORT || "4173";
const entry = resolve(root, "dist/index.js");
const dataRoot = resolve(root, "portable-data");
mkdirSync(dataRoot, { recursive: true });

if (!existsSync(entry)) {
  console.error("Agent Ops Desk is not built. Run the portable preparation command before launching from USB.");
  process.exit(2);
}

const child = spawn(process.execPath, [entry], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "production", PORT: port, PORTABLE_ROOT: root },
  stdio: "inherit",
});

const openBrowser = () => { const url = `http://127.0.0.1:${port}`; const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"; const args = process.platform === "win32" ? ["", url] : [url]; spawn(command, args, { detached: true, stdio: "ignore", shell: process.platform === "win32" }).unref(); };
const waitForHealth = async () => { for (let attempt = 0; attempt < 30; attempt += 1) { try { const response = await fetch(`http://127.0.0.1:${port}/`); if (response.ok || response.status < 500) { openBrowser(); return; } } catch {} await new Promise((resolveDelay) => setTimeout(resolveDelay, 500)); } console.error(`Agent Ops Desk did not become ready at http://127.0.0.1:${port}`); };
void waitForHealth();

const shutdown = (signal) => {
  if (!child.killed) child.kill(signal);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
