import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.env.PORTABLE_ROOT ? resolve(process.env.PORTABLE_ROOT) : resolve(new URL("..", import.meta.url).pathname);
const port = process.env.PORT || "4173";
const entry = resolve(root, "dist/index.js");

if (!existsSync(entry)) {
  console.error("Agent Ops Desk is not built. Run the portable preparation command before launching from USB.");
  process.exit(2);
}

const child = spawn(process.execPath, [entry], {
  cwd: root,
  env: { ...process.env, NODE_ENV: "production", PORT: port, PORTABLE_ROOT: root },
  stdio: "inherit",
});

const shutdown = (signal) => {
  if (!child.killed) child.kill(signal);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
