import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

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

export async function getLocalModelReadiness() {
  const state = await readState();
  const setup = state.workspace.localModel as LocalModelSetup | undefined;
  if (!setup) return { ready: false, message: "Configure a local model before launching fully disconnected work.", setup: null };
  return { ...validateLocalModelSetup(setup), setup };
}

export async function exportLocalJsonState() {
  return JSON.stringify(await readState(), null, 2);
}

export async function importLocalJsonState(serialized: string) {
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
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, target);
  return next;
}
