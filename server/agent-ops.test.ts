import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const { updateAgentConfig, addAuditLog, listAgents } = vi.hoisted(() => ({
  updateAgentConfig: vi.fn(async (id: number, config: Record<string, unknown>) => ({ id, ...config })),
  addAuditLog: vi.fn(async () => undefined),
  listAgents: vi.fn(async () => [{ id: 7, name: "Test Agent", enabledSkills: ["Proposal writing"], enabledConnectors: ["gmail"] }]),
}));
vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, updateAgentConfig, addAuditLog, listAgents };
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
