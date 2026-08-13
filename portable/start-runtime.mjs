import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { selectNode } from "./select-node.mjs";

const root = process.env.PORTABLE_ROOT ? resolve(process.env.PORTABLE_ROOT) : resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = process.env.PORT || "4173";
const entry = resolve(root, "dist/index.js");
const dataRoot = resolve(root, "portable-data");
mkdirSync(dataRoot, { recursive: true });
const databaseFile = resolve(dataRoot, "database-url.txt");
const runtime = selectNode(root);
const portableDatabaseUrl = existsSync(databaseFile) ? readFileSync(databaseFile, "utf8").trim() : "";

if (!existsSync(entry)) {
  console.error("ModelDock is not built. Run the portable preparation command before launching from USB.");
  process.exit(2);
}

const child = spawn(runtime.path, [entry], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "production", PORT: port, PORTABLE_ROOT: root, PORTABLE_JSON_STORE_PATH: process.env.PORTABLE_JSON_STORE_PATH || resolve(dataRoot, "agent-ops-state.json"), PORTABLE_PERSISTENCE: process.env.PORTABLE_PERSISTENCE || "local-json", DATABASE_URL: process.env.DATABASE_URL || process.env.PORTABLE_DATABASE_URL || portableDatabaseUrl || undefined },
  stdio: "inherit",
});

const openBrowser = () => { const url = `http://127.0.0.1:${port}`; const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open"; const args = process.platform === "win32" ? ["", url] : [url]; spawn(command, args, { detached: true, stdio: "ignore", shell: process.platform === "win32" }).unref(); };
const waitForHealth = async () => { for (let attempt = 0; attempt < 30; attempt += 1) { try { const response = await fetch(`http://127.0.0.1:${port}/`); if (response.ok || response.status < 500) { openBrowser(); return; } } catch {} await new Promise((resolveDelay) => setTimeout(resolveDelay, 500)); } console.error(`ModelDock did not become ready at http://127.0.0.1:${port}`); };
void waitForHealth();

const shutdown = (signal) => {
  if (!child.killed) child.kill(signal);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
