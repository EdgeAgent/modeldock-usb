import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { updateAgentConfig, addAuditLog, listAgents, listWorkflows, listDeliverables, createWorkflow, createDeliverable, listWorkflowSteps, getWorkspaceState, getAgentById, getRunByKey, getRunById, updateRunStatus, createRun, createApproval, resolveApproval } = vi.hoisted(() => ({
  updateAgentConfig: vi.fn(async (id: number, config: Record<string, unknown>) => ({ id, ...config })),
  addAuditLog: vi.fn(async () => undefined),
  listAgents: vi.fn(async () => [{ id: 7, name: "Test Agent", enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] }]),
  listWorkflows: vi.fn(async () => [{ id: 11, workflowKey: "WF-TEST", name: "Client delivery", status: "draft" }]),
  listDeliverables: vi.fn(async () => [{ deliverable: { id: 21, title: "Client brief", status: "review" }, agent: { name: "Test Agent" } }]),
  createWorkflow: vi.fn(async (workflow: Record<string, unknown>, steps: Array<Record<string, unknown>>) => ({ id: 11, ...workflow, steps })),
  createDeliverable: vi.fn(async (deliverable: Record<string, unknown>) => ({ id: 21, ...deliverable })),
  listWorkflowSteps: vi.fn(async () => [{ stepKey: "approval", name: "Human review", requiresApproval: 1 }]),
  getWorkspaceState: vi.fn(async () => ({ globalKillSwitch: 0 })),
  getAgentById: vi.fn(async () => ({ id: 7, status: "active" })),
  getRunByKey: vi.fn(async () => ({ id: 31, runKey: "RUN-STEP", agentId: 7, currentStep: "workflow:11;step:research|Research", status: "running" })),
  getRunById: vi.fn(async () => ({ id: 31, runKey: "RUN-STEP", agentId: 7, currentStep: "workflow:11;approval:publish|Publish", status: "waiting_approval" })),
  updateRunStatus: vi.fn(async (runKey: string, status: string, currentStep: string) => ({ id: 31, runKey, agentId: 7, workflowId: 11, currentStep, status })),
  createRun: vi.fn(async (run: Record<string, unknown>) => ({ id: 31, ...run })),
  createApproval: vi.fn(async (approval: Record<string, unknown>) => ({ id: 41, ...approval })),
  resolveApproval: vi.fn(async () => ({ id: 41, runId: 31, evidence: "workflow:11;step:publish", status: "approved" })),
}));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, updateAgentConfig, addAuditLog, listAgents, listWorkflows, listDeliverables, createWorkflow, createDeliverable, listWorkflowSteps, getWorkspaceState, getAgentById, getRunByKey, getRunById, updateRunStatus, createRun, createApproval, resolveApproval };
});

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "agent-ops-test-user",
    email: "ops@example.com",
    name: "Operations Reviewer",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("agent operations governance", () => {
  it("requires a denial reason before denying an approval", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.approvals.resolve({ id: 1, action: "denied" })).rejects.toThrow("A denial reason is required");
  });

  it("reads saved workflows and deliverables for the workspace", async () => {
    const caller = appRouter.createCaller(createContext());
    const workflows = await caller.workflows.list();
    const deliverables = await caller.deliverables.list();
    expect(workflows[0]).toMatchObject({ workflowKey: "WF-TEST", status: "draft" });
    expect(deliverables[0]?.deliverable).toMatchObject({ title: "Client brief", status: "review" });
  });

  it("saves a workflow with an explicit approval gate", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.workflows.create({ name: "Review path", description: "A guarded path", steps: [{ stepKey: "approval", position: 0, name: "Human review", stepType: "approval", requiresApproval: 1 }] });
    expect(createWorkflow).toHaveBeenCalledWith(expect.objectContaining({ name: "Review path", status: "draft" }), [{ stepKey: "approval", position: 0, name: "Human review", stepType: "approval", requiresApproval: 1 }]);
    expect(result).toMatchObject({ name: "Review path", steps: [{ requiresApproval: 1 }] });
  });

  it("pauses a workflow run before a required approval gate", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.runs.launch({ agentId: 7, task: "Publish the campaign", priority: "normal", tierLevel: "Tier 1", workflowId: 11 });
    expect(result).toMatchObject({ status: "waiting_approval", currentStep: "workflow:11;approval:approval|Human review" });
    expect(createRun).toHaveBeenCalledWith(expect.objectContaining({ status: "waiting_approval" }));
    expect(createApproval).toHaveBeenCalledWith(expect.objectContaining({ runId: 31, status: "pending", toolName: "workflow-approval" }));
  });

  it("creates an approval when advancement reaches a later gated step", async () => {
    listWorkflowSteps.mockResolvedValueOnce([{ stepKey: "research", name: "Research", position: 0, requiresApproval: 0, stepType: "agent" }, { stepKey: "publish", name: "Publish", position: 1, requiresApproval: 1, stepType: "tool" }]);
    const caller = appRouter.createCaller(createContext());
    const result = await caller.runs.advance({ runKey: "RUN-STEP", workflowId: 11 });
    expect(result).toMatchObject({ status: "waiting_approval", currentStep: "workflow:11;approval:publish|Publish" });
    expect(createApproval).toHaveBeenCalledWith(expect.objectContaining({ runId: 31, toolName: "workflow-tool", status: "pending" }));
  });

  it("resumes the next step after approval", async () => {
    listWorkflowSteps.mockResolvedValueOnce([{ stepKey: "publish", name: "Publish", position: 1, requiresApproval: 1, stepType: "tool" }, { stepKey: "deliverable", name: "Package output", position: 2, requiresApproval: 0, stepType: "deliverable" }]);
    const caller = appRouter.createCaller(createContext());
    await caller.approvals.resolve({ id: 41, action: "approved" });
    expect(updateRunStatus).toHaveBeenCalledWith("RUN-STEP", "running", "workflow:11;step:deliverable|Package output");
  });

  it("creates a deliverable with workflow metadata and records the event", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.deliverables.create({ title: "Reviewed proposal", kind: "proposal", summary: "A proposal ready for human review.", workflowId: 11, status: "review" });
    expect(createDeliverable).toHaveBeenCalledWith(expect.objectContaining({ title: "Reviewed proposal", workflowId: 11, status: "review" }));
    expect(result).toMatchObject({ title: "Reviewed proposal", workflowId: 11 });
    expect(addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ eventType: "Deliverable created" }));
  });

  it("reads persisted agent configuration from the agent list", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.agents.list();
    expect(listAgents).toHaveBeenCalled();
    expect(result[0]).toMatchObject({ id: 7, enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] });
  });

  it("saves agent instructions, memory, skills, and connector permissions", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.agents.updateConfig({ id: 7, systemInstructions: "Use concise client updates.", memory: "Prefer British English.", enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] });
    expect(updateAgentConfig).toHaveBeenCalledWith(7, { systemInstructions: "Use concise client updates.", memory: "Prefer British English.", enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] });
    expect(result).toMatchObject({ id: 7, enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] });
    expect(addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ eventType: "Agent configuration updated", referenceKey: "AGENT-7" }));
  });
});
