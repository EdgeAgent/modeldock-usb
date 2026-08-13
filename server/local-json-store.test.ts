import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { exportLocalJsonState, getLocalJsonState, getLocalJsonStateStats, importLocalJsonState, updateLocalJsonState, validateLocalModelSetup } from "./local-json-store";

const originalPath = process.env.PORTABLE_JSON_STORE_PATH;
const tempDirectories: string[] = [];

afterEach(async () => {
  if (originalPath === undefined) delete process.env.PORTABLE_JSON_STORE_PATH;
  else process.env.PORTABLE_JSON_STORE_PATH = originalPath;
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("local JSON state store", () => {
  it("creates the state file and preserves workspace values across updates", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-ops-json-"));
    tempDirectories.push(directory);
    process.env.PORTABLE_JSON_STORE_PATH = join(directory, "portable-data", "agent-ops-state.json");

    const first = await updateLocalJsonState({ executionMode: "offline", workspace: { lastView: "settings" } });
    const second = await updateLocalJsonState({ workspace: { selectedAgent: "local-scout" } });
    const file = await readFile(process.env.PORTABLE_JSON_STORE_PATH, "utf8");

    expect(first.executionMode).toBe("offline");
    expect(second.executionMode).toBe("offline");
    expect(second.workspace).toEqual({ lastView: "settings", selectedAgent: "local-scout" });
    expect(JSON.parse(file)).toMatchObject({ executionMode: "offline", workspace: second.workspace });
  });

  it("exports and imports a complete backup while rejecting malformed payloads", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-ops-json-backup-"));
    tempDirectories.push(directory);
    process.env.PORTABLE_JSON_STORE_PATH = join(directory, "state.json");
    await updateLocalJsonState({ executionMode: "offline", workspace: { localModel: { modelName: "local-test" } }, tables: { agents: [{ id: 1, name: "Scout" }] } });

    const backup = await exportLocalJsonState();
    await updateLocalJsonState({ executionMode: "cloud", workspace: { localModel: null } });
    const restored = await importLocalJsonState(backup);
    const stats = await getLocalJsonStateStats();

    expect(restored.executionMode).toBe("offline");
    expect(restored.tables.agents).toEqual([{ id: 1, name: "Scout" }]);
    expect(stats.sizeBytes).toBeGreaterThan(0);
    await expect(importLocalJsonState(JSON.stringify({ executionMode: "offline" }))).rejects.toThrow("valid Agent Ops Desk JSON store");
  });

  it("validates portable paths and loopback endpoints for Offline readiness", () => {
    expect(validateLocalModelSetup({ provider: "llama.cpp", modelName: "local", modelPath: "./models/model.gguf" }).ready).toBe(true);
    expect(validateLocalModelSetup({ provider: "Ollama", modelName: "local", modelPath: "http://127.0.0.1:11434" }).ready).toBe(true);
    expect(validateLocalModelSetup({ provider: "Remote", modelName: "cloud", modelPath: "https://api.example.com/model" }).ready).toBe(false);
  });

  it("recovers with safe defaults when the state file does not exist", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-ops-json-default-"));
    tempDirectories.push(directory);
    process.env.PORTABLE_JSON_STORE_PATH = join(directory, "missing", "state.json");

    const state = await getLocalJsonState();

    expect(state.executionMode).toBe("cloud");
    expect(state.workspace).toEqual({});
  });
});
