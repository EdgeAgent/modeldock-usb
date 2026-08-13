import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { addAuditLog, addExecutionLog, createRun, getRunByKey, listAuditLogs, listExecutionLogs, listRuns, updateRunStatus } from "./db";
import { insertLocal } from "./local-json-db";

const originalPath = process.env.PORTABLE_JSON_STORE_PATH;
const originalDatabase = process.env.DATABASE_URL;
const tempDirectories: string[] = [];

afterEach(async () => {
  if (originalPath === undefined) delete process.env.PORTABLE_JSON_STORE_PATH;
  else process.env.PORTABLE_JSON_STORE_PATH = originalPath;
  if (originalDatabase === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabase;
  delete process.env.PORTABLE_PERSISTENCE;
  await Promise.all(tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("local JSON application persistence", () => {
  it("persists agents, runs, execution logs, and audit records without MySQL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-ops-local-db-"));
    tempDirectories.push(directory);
    process.env.PORTABLE_JSON_STORE_PATH = join(directory, "state.json");
    delete process.env.DATABASE_URL;
    process.env.PORTABLE_PERSISTENCE = "local-json";

    await insertLocal("agents", { id: 7, name: "Local Scout", department: "Operations", role: "Local specialist", status: "active", model: "local-model", allowedTools: [], enabledSkills: [], enabledConnectors: [], accent: "cyan", createdAt: new Date(), updatedAt: new Date() });
    const created = await createRun({ runKey: "RUN-LOCAL1", agentId: 7, task: "Persist locally", priority: "normal", tierLevel: "Tier 1", status: "running", currentStep: "Starting", elapsedSeconds: 0, costCents: 0 });
    await addExecutionLog({ runId: created!.id, eventType: "run.created", actorType: "system", actorName: "Test", step: "Starting", message: "Created locally" });
    await updateRunStatus("RUN-LOCAL1", "completed", "Done");
    await addAuditLog({ eventType: "Run completed", actorType: "system", actorName: "Test", details: "Local run completed", referenceKey: "RUN-LOCAL1" });

    expect((await getRunByKey("RUN-LOCAL1"))?.status).toBe("completed");
    expect((await listRuns()).some((item) => item.run.runKey === "RUN-LOCAL1")).toBe(true);
    expect((await listExecutionLogs(created!.id)).map((row) => row.message)).toEqual(["Created locally", "running → completed"]);
    expect((await listAuditLogs()).some((row) => row.referenceKey === "RUN-LOCAL1")).toBe(true);
  });
});
