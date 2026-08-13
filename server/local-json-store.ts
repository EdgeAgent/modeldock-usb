import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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
