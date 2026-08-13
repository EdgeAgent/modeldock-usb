import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { agents, agentRuns, approvals, auditLogs, policies, users, workspaceState, type InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb(); if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; } else { values.lastSignedIn = new Date(); updateSet.lastSignedIn = new Date(); }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) { const db = await getDb(); if (!db) return undefined; const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1); return result[0]; }

export async function listAgents() { const db = await getDb(); if (!db) return []; return db.select().from(agents).orderBy(agents.department, agents.name); }
export async function updateAgentStatus(id: number, status: "active" | "paused") { const db = await getDb(); if (!db) return undefined; await db.update(agents).set({ status }).where(eq(agents.id, id)); return db.select().from(agents).where(eq(agents.id, id)).limit(1).then((rows) => rows[0]); }
export async function updateAgentConfig(id: number, config: { systemInstructions?: string | null; memory?: string | null; enabledSkills?: string[]; enabledConnectors?: string[] }) { const db = await getDb(); if (!db) return undefined; await db.update(agents).set(config).where(eq(agents.id, id)); return db.select().from(agents).where(eq(agents.id, id)).limit(1).then((rows) => rows[0]); }
export async function getAgentById(id: number) { const db = await getDb(); if (!db) return undefined; return db.select().from(agents).where(eq(agents.id, id)).limit(1).then((rows) => rows[0]); }
export async function listRuns() { const db = await getDb(); if (!db) return []; return db.select({ run: agentRuns, agent: agents }).from(agentRuns).leftJoin(agents, eq(agentRuns.agentId, agents.id)).orderBy(desc(agentRuns.updatedAt)).limit(100); }
export async function listApprovals() { const db = await getDb(); if (!db) return []; return db.select({ approval: approvals, agent: agents }).from(approvals).leftJoin(agents, eq(approvals.agentId, agents.id)).where(eq(approvals.status, "pending")).orderBy(approvals.deadline); }
export async function listAuditLogs() { const db = await getDb(); if (!db) return []; return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200); }
export async function listPolicies() { const db = await getDb(); if (!db) return []; return db.select({ policy: policies, agent: agents }).from(policies).leftJoin(agents, eq(policies.agentId, agents.id)).orderBy(agents.name); }
export async function getWorkspaceState() { const db = await getDb(); if (!db) return undefined; return db.select().from(workspaceState).where(eq(workspaceState.id, 1)).limit(1).then((rows) => rows[0]); }

export async function addAuditLog(entry: { eventType: string; actorType: "human" | "agent" | "system"; actorName: string; details: string; referenceKey?: string }) { const db = await getDb(); if (!db) return; await db.insert(auditLogs).values(entry); }

export async function getOverview() { const [agentRows, runRows, approvalRows] = await Promise.all([listAgents(), listRuns(), listApprovals()]); const byDepartment = new Map<string, { runs: number; approvals: number; queue: number; cycleSeconds: number }>(); for (const item of runRows) { const department = item.agent?.department || "Operations"; const entry = byDepartment.get(department) || { runs: 0, approvals: 0, queue: 0, cycleSeconds: 0 }; entry.runs += item.run.status === "completed" ? 1 : 0; entry.cycleSeconds += item.run.elapsedSeconds; byDepartment.set(department, entry); } for (const item of approvalRows) { const department = item.agent?.department || "Operations"; const entry = byDepartment.get(department) || { runs: 0, approvals: 0, queue: 0, cycleSeconds: 0 }; entry.queue += 1; byDepartment.set(department, entry); } return { activeRuns: runRows.filter((item) => item.run.status === "running").length, approvalQueue: approvalRows.length, spendCents: runRows.reduce((total, item) => total + item.run.costCents, 0), departments: Array.from(byDepartment.entries()).map(([name, value]) => ({ name, runs: value.runs, approval: value.approvals ? Math.round((value.approvals / Math.max(value.approvals + value.queue, 1)) * 100) : 100, cycleSeconds: value.runs ? Math.round(value.cycleSeconds / value.runs) : 0, queue: value.queue })), agents: agentRows.length }; }

export async function createRun(values: typeof agentRuns.$inferInsert) { const db = await getDb(); if (!db) return undefined; await db.insert(agentRuns).values(values); return db.select().from(agentRuns).where(eq(agentRuns.runKey, values.runKey)).limit(1).then((rows) => rows[0]); }
export async function updateRunStatus(runKey: string, status: "running" | "waiting_approval" | "completed" | "paused" | "failed", currentStep: string) { const db = await getDb(); if (!db) return undefined; await db.update(agentRuns).set({ status, currentStep }).where(eq(agentRuns.runKey, runKey)); return db.select().from(agentRuns).where(eq(agentRuns.runKey, runKey)).limit(1).then((rows) => rows[0]); }
export async function resolveApproval(id: number, status: "approved" | "denied" | "resubmitted", denialReason?: string, proposedAction?: string) { const db = await getDb(); if (!db) return undefined; await db.update(approvals).set({ status, denialReason: status === "denied" ? denialReason : undefined, proposedAction: status === "resubmitted" && proposedAction ? proposedAction : undefined, resolvedAt: new Date() }).where(and(eq(approvals.id, id), eq(approvals.status, "pending"))); return db.select().from(approvals).where(eq(approvals.id, id)).limit(1).then((rows) => rows[0]); }
export async function setGlobalKillSwitch(enabled: boolean, updatedBy: string) { const db = await getDb(); if (!db) return undefined; await db.update(workspaceState).set({ globalKillSwitch: enabled ? 1 : 0, updatedBy }).where(eq(workspaceState.id, 1)); if (enabled) await db.update(agentRuns).set({ status: "paused", currentStep: "Paused by global kill switch" }).where(inArray(agentRuns.status, ["running", "waiting_approval"])); return getWorkspaceState(); }
