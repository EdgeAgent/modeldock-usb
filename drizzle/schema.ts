import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  department: varchar("department", { length: 80 }).notNull(),
  role: varchar("role", { length: 140 }).notNull(),
  status: mysqlEnum("status", ["active", "paused"]).default("active").notNull(),
  model: varchar("model", { length: 120 }).notNull(),
  allowedTools: json("allowedTools").notNull(),
  systemInstructions: text("systemInstructions"),
  memory: text("memory"),
  enabledSkills: json("enabledSkills").$type<string[]>(),
  enabledConnectors: json("enabledConnectors").$type<string[]>(),
  accent: varchar("accent", { length: 32 }).default("cyan").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const agentRuns = mysqlTable("agentRuns", {
  id: int("id").autoincrement().primaryKey(),
  runKey: varchar("runKey", { length: 32 }).notNull().unique(),
  agentId: int("agentId").notNull(),
  task: text("task").notNull(),
  priority: mysqlEnum("priority", ["urgent", "high", "normal", "low"]).default("normal").notNull(),
  tierLevel: varchar("tierLevel", { length: 24 }).default("Tier 1").notNull(),
  status: mysqlEnum("status", ["running", "waiting_approval", "completed", "paused", "failed"]).default("running").notNull(),
  currentStep: varchar("currentStep", { length: 180 }).default("Initializing workflow").notNull(),
  elapsedSeconds: int("elapsedSeconds").default(0).notNull(),
  costCents: int("costCents").default(0).notNull(),
  targetDate: timestamp("targetDate"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  approvalKey: varchar("approvalKey", { length: 32 }).notNull().unique(),
  runId: int("runId").notNull(),
  agentId: int("agentId").notNull(),
  proposedAction: text("proposedAction").notNull(),
  toolName: varchar("toolName", { length: 180 }).notNull(),
  parameters: json("parameters").notNull(),
  evidence: text("evidence").notNull(),
  riskTier: varchar("riskTier", { length: 24 }).notNull(),
  deadline: timestamp("deadline").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "denied", "resubmitted"]).default("pending").notNull(),
  denialReason: text("denialReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorType: mysqlEnum("actorType", ["human", "agent", "system"]).notNull(),
  actorName: varchar("actorName", { length: 160 }).notNull(),
  details: text("details").notNull(),
  referenceKey: varchar("referenceKey", { length: 80 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  approvalTier: varchar("approvalTier", { length: 24 }).notNull(),
  spendLimitCents: int("spendLimitCents").default(0).notNull(),
  dataClassification: varchar("dataClassification", { length: 80 }).notNull(),
  lastReviewDate: timestamp("lastReviewDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workspaceState = mysqlTable("workspaceState", {
  id: int("id").autoincrement().primaryKey(),
  globalKillSwitch: int("globalKillSwitch").default(0).notNull(),
  updatedBy: varchar("updatedBy", { length: 160 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const executionLogs = mysqlTable("executionLogs", {
  id: int("id").autoincrement().primaryKey(),
  runId: int("runId").notNull(),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  actorType: mysqlEnum("actorType", ["human", "agent", "system"]).notNull(),
  actorName: varchar("actorName", { length: 160 }).notNull(),
  step: varchar("step", { length: 180 }),
  message: text("message").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  workflowKey: varchar("workflowKey", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["draft", "published", "paused"]).default("draft").notNull(),
  triggerType: varchar("triggerType", { length: 40 }).default("manual").notNull(),
  createdBy: varchar("createdBy", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const workflowSteps = mysqlTable("workflowSteps", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  stepKey: varchar("stepKey", { length: 40 }).notNull(),
  position: int("position").notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  stepType: mysqlEnum("stepType", ["intake", "agent", "tool", "approval", "deliverable"]).notNull(),
  agentId: int("agentId"),
  config: json("config"),
  requiresApproval: int("requiresApproval").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  deliverableKey: varchar("deliverableKey", { length: 40 }).notNull().unique(),
  runId: int("runId"),
  workflowId: int("workflowId"),
  agentId: int("agentId"),
  title: varchar("title", { length: 200 }).notNull(),
  kind: varchar("kind", { length: 60 }).notNull(),
  status: mysqlEnum("status", ["draft", "review", "approved", "delivered", "archived"]).default("draft").notNull(),
  summary: text("summary").notNull(),
  outputUrl: text("outputUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type Approval = typeof approvals.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type Workflow = typeof workflows.$inferSelect;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type Deliverable = typeof deliverables.$inferSelect;
export type ExecutionLog = typeof executionLogs.$inferSelect;
