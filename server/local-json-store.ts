import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export type LocalJsonState = {
  executionMode: "offline" | "cloud";
  updatedAt: string;
  workspace: Record<string, unknown>;
  tables: Record<string, Array<Record<string, any>>>;
};

const defaultState: LocalJsonState = {
  executionMode: "cloud",
  updatedAt: new Date(0).toISOString(),
  workspace: {},
  tables: {},
};

function statePath() {
  return resolve(process.env.PORTABLE_JSON_STORE_PATH || "portable-data/agent-ops-state.json");
}

async function readState(): Promise<LocalJsonState> {
  try {
    const raw = await readFile(statePath(), "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalJsonState>;
    return {
      executionMode: parsed.executionMode === "offline" ? "offline" : "cloud",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : defaultState.updatedAt,
      workspace: parsed.workspace && typeof parsed.workspace === "object" ? parsed.workspace : {},
      tables: parsed.tables && typeof parsed.tables === "object" ? parsed.tables as Record<string, Array<Record<string, any>>> : {},
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.warn("[Local JSON] Could not read state; using defaults", error);
    return { ...defaultState, workspace: {}, tables: {} };
  }
}

export async function getLocalJsonState() {
  return readState();
}

export async function updateLocalJsonState(patch: Partial<Pick<LocalJsonState, "executionMode" | "workspace" | "tables">>) {
  const current = await readState();
  const next: LocalJsonState = {
    executionMode: patch.executionMode ?? current.executionMode,
    updatedAt: new Date().toISOString(),
    workspace: patch.workspace ? { ...current.workspace, ...patch.workspace } : current.workspace,
    tables: patch.tables ? { ...current.tables, ...patch.tables } : current.tables,
  };
  const target = statePath();
  const temporary = `${target}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  return next;
}

export function getLocalJsonStatePath() {
  return statePath();
}

export async function getLocalJsonStateStats() {
  try {
    const file = await stat(statePath());
    return { path: statePath(), sizeBytes: file.size, updatedAt: (await readState()).updatedAt };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { path: statePath(), sizeBytes: 0, updatedAt: defaultState.updatedAt };
  }
}

export type LocalModelSetup = { provider: string; modelName: string; modelPath: string; apiBaseUrl?: string; configuredAt?: string; ready?: boolean };

export function validateLocalModelSetup(input: LocalModelSetup) {
  const provider = input.provider.trim();
  const modelName = input.modelName.trim();
  const modelPath = input.modelPath.trim();
  if (!provider || !modelName || !modelPath) return { ready: false, message: "Provider, model name, and a local path or loopback endpoint are required." };
  const isLoopbackUrl = [modelPath, input.apiBaseUrl].some((value) => typeof value === "string" && (value.startsWith("http://localhost") || value.startsWith("https://localhost") || value.startsWith("http://127.0.0.1") || value.startsWith("https://127.0.0.1")));
  const isPortablePath = modelPath.startsWith("./") || modelPath.startsWith("../") || modelPath.startsWith("/") || /^[A-Za-z]:/.test(modelPath);
  if (!isLoopbackUrl && !isPortablePath) return { ready: false, message: "Use a USB-relative path such as ./models/model.gguf or a localhost/127.0.0.1 endpoint." };
  return { ready: true, message: "Local model configuration is ready for Offline launch checks." };
}

export async function probeLocalModel(setup: LocalModelSetup) {
  const validation = validateLocalModelSetup(setup);
  if (!validation.ready) return { ...validation, checkedAt: new Date().toISOString(), health: "invalid" as const };
  const endpoint = setup.apiBaseUrl || (setup.modelPath.startsWith("http") ? setup.modelPath : undefined);
  if (!endpoint) return { ready: true, message: "Portable model path is configured; endpoint probing is not required.", checkedAt: new Date().toISOString(), health: "path" as const };
  const healthUrl = `${endpoint.replace(/\/$/, "")}/health`;
  try {
    const response = await fetch(healthUrl, { signal: AbortSignal.timeout(1800) });
    return response.ok ? { ready: true, message: `Local model endpoint responded at ${endpoint}.`, checkedAt: new Date().toISOString(), health: "healthy" as const } : { ready: false, message: `Local model endpoint returned HTTP ${response.status}.`, checkedAt: new Date().toISOString(), health: "unhealthy" as const };
  } catch {
    return { ready: false, message: `Could not reach local model endpoint at ${endpoint}. Start the local model service and try again.`, checkedAt: new Date().toISOString(), health: "unreachable" as const };
  }
}

export async function getLocalModelReadiness() {
  const state = await readState();
  const setup = state.workspace.localModel as LocalModelSetup | undefined;
  if (!setup) return { ready: false, message: "Configure a local model before launching fully disconnected work.", setup: null, checkedAt: new Date().toISOString(), health: "missing" as const };
  return { ...(await probeLocalModel(setup)), setup };
}

export function discoverLocalModelPaths(platform: NodeJS.Platform = process.platform) {
  const root = resolve(process.env.PORTABLE_ROOT || process.cwd());
  const candidates = platform === "win32"
    ? [join(root, "models", "windows"), join(root, "portable-data", "models", "windows"), join(root, "models", "windows", "model.gguf"), join(root, "Models", "model.gguf")]
    : platform === "darwin"
      ? [join(root, "models", "macos"), join(root, "models", "macos-arm64"), join(root, "portable-data", "models", "macos"), join(root, "models", "macos", "model.gguf")]
      : [join(root, "models", "linux"), join(root, "portable-data", "models", "linux"), join(root, "models", "linux", "model.gguf"), join(root, "models", "model.gguf")];
  return { platform, root, candidates };
}

export async function exportLocalJsonState() {
  const state = await readState();
  return JSON.stringify({ ...state, backupVersion: 1, backupCreatedAt: new Date().toISOString() }, null, 2);
}

export async function importLocalJsonState(serialized: string) {
  const current = await readState();
  const parsed = JSON.parse(serialized) as Partial<LocalJsonState>;
  if (!parsed || (parsed.executionMode !== "offline" && parsed.executionMode !== "cloud") || !parsed.workspace || typeof parsed.workspace !== "object" || !parsed.tables || typeof parsed.tables !== "object") {
    throw new Error("The selected backup is not a valid Agent Ops Desk JSON store");
  }
  const next: LocalJsonState = {
    executionMode: parsed.executionMode,
    updatedAt: new Date().toISOString(),
    workspace: parsed.workspace as Record<string, unknown>,
    tables: parsed.tables as Record<string, Array<Record<string, any>>>,
  };
  const target = statePath();
  const temporary = `${target}.tmp`;
  const backupDirectory = join(dirname(target), "backups");
  const snapshotPath = join(backupDirectory, `pre-restore-v1-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  await mkdir(dirname(target), { recursive: true });
  await mkdir(backupDirectory, { recursive: true });
  await writeFile(snapshotPath, `${JSON.stringify({ ...current, backupVersion: 1, backupCreatedAt: new Date().toISOString(), snapshotType: "pre-restore" }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  return { ...next, snapshotPath };
}
