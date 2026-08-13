import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { discoverLocalModelPaths, exportLocalJsonState, getLocalJsonState, getLocalJsonStateStats, importLocalJsonState, probeLocalModel, scanLocalModelFiles, updateLocalJsonState, validateLocalModelSetup } from "./local-json-store";

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
    expect(JSON.parse(backup).backupVersion).toBe(1);
    await updateLocalJsonState({ executionMode: "cloud", workspace: { localModel: null } });
    const restored = await importLocalJsonState(backup);
    const stats = await getLocalJsonStateStats();

    expect(restored.executionMode).toBe("offline");
    expect(restored.snapshotPath).toContain("pre-restore-v1-");
    expect((await readFile(restored.snapshotPath, "utf8"))).toContain("snapshotType");
    expect(restored.tables.agents).toEqual([{ id: 1, name: "Scout" }]);
    expect(stats.sizeBytes).toBeGreaterThan(0);
    await expect(importLocalJsonState(JSON.stringify({ executionMode: "offline" }))).rejects.toThrow("valid ModelDock JSON store");
  });

  it("validates portable paths and loopback endpoints for Offline readiness", () => {
    expect(validateLocalModelSetup({ provider: "llama.cpp", modelName: "local", modelPath: "./models/model.gguf" }).ready).toBe(true);
    expect(validateLocalModelSetup({ provider: "Ollama", modelName: "local", modelPath: "http://127.0.0.1:11434" }).ready).toBe(true);
    expect(validateLocalModelSetup({ provider: "Remote", modelName: "cloud", modelPath: "https://api.example.com/model" }).ready).toBe(false);
  });

  it("reports path health without network access and exposes platform discovery candidates", async () => {
    const pathHealth = await probeLocalModel({ provider: "llama.cpp", modelName: "local", modelPath: "./models/model.gguf" });
    const discovery = discoverLocalModelPaths();
    const windows = discoverLocalModelPaths("win32");
    const mac = discoverLocalModelPaths("darwin");
    const linux = discoverLocalModelPaths("linux");
    expect(pathHealth.health).toBe("path");
    expect(pathHealth.ready).toBe(true);
    expect(discovery.candidates.some((candidate) => candidate.includes("models"))).toBe(true);
    expect(windows.candidates.some((candidate) => candidate.includes("windows"))).toBe(true);
    expect(mac.candidates.some((candidate) => candidate.includes("macos"))).toBe(true);
    expect(linux.candidates.some((candidate) => candidate.includes("linux"))).toBe(true);
  });

  it("scans supported model files without following symlinks or executing files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-ops-model-scan-"));
    tempDirectories.push(directory);
    process.env.PORTABLE_ROOT = directory;
    const modelDirectory = join(directory, "models", "linux");
    await mkdir(modelDirectory, { recursive: true });
    await writeFile(join(modelDirectory, "local.gguf"), "model-bytes");
    await writeFile(join(modelDirectory, "notes.txt"), "ignore");
    const result = await scanLocalModelFiles();
    expect(result.files).toHaveLength(1);
    expect(result.files[0].format).toBe("gguf");
    expect(result.files[0].relativePath).toContain("local.gguf");
    delete process.env.PORTABLE_ROOT;
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
