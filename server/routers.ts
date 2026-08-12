import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addAuditLog, createRun, getAgentById, getOverview, getWorkspaceState, listAgents, listApprovals, listAuditLogs, listPolicies, listRuns, resolveApproval, setGlobalKillSwitch, updateAgentStatus, updateRunStatus } from "./db";
import { z } from "zod";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  agents: router({
    list: protectedProcedure.query(() => listAgents()),
    setStatus: protectedProcedure.input(z.object({ id: z.number(), status: z.enum(["active", "paused"]) })).mutation(async ({ input, ctx }) => { const updated = await updateAgentStatus(input.id, input.status); await addAuditLog({ eventType: input.status === "paused" ? "Agent paused" : "Agent activated", actorType: "human", actorName: ctx.user.name || ctx.user.email || "Workspace user", details: `Agent ${input.id} status changed to ${input.status}`, referenceKey: `AGENT-${input.id}` }); return updated; }),
  }),
  runs: router({
    list: protectedProcedure.query(() => listRuns()),
    launch: protectedProcedure.input(z.object({ agentId: z.number(), task: z.string().min(1), priority: z.enum(["urgent", "high", "normal", "low"]), tierLevel: z.string() })).mutation(async ({ input, ctx }) => { const state = await getWorkspaceState(); if (state?.globalKillSwitch) throw new Error("Global kill switch is active"); const agent = await getAgentById(input.agentId); if (!agent || agent.status !== "active") throw new Error("This agent is paused and cannot run"); const runKey = `RUN-${nanoid(6).toUpperCase()}`; const run = await createRun({ runKey, agentId: input.agentId, task: input.task, priority: input.priority, tierLevel: input.tierLevel, status: "running", currentStep: "Initializing workflow", elapsedSeconds: 0, costCents: 0 }); await addAuditLog({ eventType: "Run launched", actorType: "human", actorName: ctx.user.name || ctx.user.email || "Workspace user", details: input.task, referenceKey: runKey }); return run; }),
    pause: protectedProcedure.input(z.object({ runKey: z.string() })).mutation(async ({ input, ctx }) => { const run = await updateRunStatus(input.runKey, "paused", "Paused by operator"); await addAuditLog({ eventType: "Run paused", actorType: "human", actorName: ctx.user.name || ctx.user.email || "Workspace user", details: "Run paused by operator", referenceKey: input.runKey }); return run; }),
  }),
  overview: router({ summary: protectedProcedure.query(() => getOverview()) }),
  approvals: router({
    list: protectedProcedure.query(() => listApprovals()),
    resolve: protectedProcedure.input(z.object({ id: z.number(), action: z.enum(["approved", "denied", "resubmitted"]), denialReason: z.string().optional(), proposedAction: z.string().optional() })).mutation(async ({ input, ctx }) => { if (input.action === "denied" && !input.denialReason?.trim()) throw new Error("A denial reason is required"); if (input.action === "resubmitted" && !input.proposedAction?.trim()) throw new Error("An edited proposed action is required"); const approval = await resolveApproval(input.id, input.action, input.denialReason, input.proposedAction); await addAuditLog({ eventType: input.action === "approved" ? "Approval approved" : input.action === "denied" ? "Approval denied" : "Approval resubmitted", actorType: "human", actorName: ctx.user.name || ctx.user.email || "Workspace user", details: input.denialReason || `Approval ${input.id} resolved`, referenceKey: `APR-${input.id}` }); return approval; }),
  }),
  audit: router({ list: protectedProcedure.query(() => listAuditLogs()), logToolCall: protectedProcedure.input(z.object({ toolName: z.string(), parametersSummary: z.string(), referenceKey: z.string().optional() })).mutation(async ({ input, ctx }) => { await addAuditLog({ eventType: "Tool call", actorType: "agent", actorName: ctx.user.name || ctx.user.email || "Agent runtime", details: `${input.toolName} · ${input.parametersSummary}`, referenceKey: input.referenceKey }); return { success: true } as const; }) }),
  policies: router({ list: protectedProcedure.query(() => listPolicies()) }),
  emergency: router({
    state: protectedProcedure.query(() => getWorkspaceState()),
    setGlobal: adminProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ input, ctx }) => { const state = await setGlobalKillSwitch(input.enabled, ctx.user.name || ctx.user.email || "Admin"); await addAuditLog({ eventType: input.enabled ? "Global kill switch enabled" : "Global kill switch disabled", actorType: "human", actorName: ctx.user.name || ctx.user.email || "Admin", details: input.enabled ? "Tool execution disabled and active runs frozen" : "Tool execution resumed", referenceKey: "WORKSPACE" }); return state; }),
  }),
});

export type AppRouter = typeof appRouter;
