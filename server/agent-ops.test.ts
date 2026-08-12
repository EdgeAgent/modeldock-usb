import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("agent operations governance", () => {
  it("requires a denial reason before denying an approval", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.approvals.resolve({ id: 1, action: "denied" })).rejects.toThrow("A denial reason is required");
  });
});
