import { getExecutionMode, type ExecutionMode } from "./executionMode";

type AgentForLaunch = { model?: string | null };

export function getWorkflowLaunchGuard(agent: AgentForLaunch | null | undefined, mode: ExecutionMode = getExecutionMode()) {
  if (mode === "offline" && !/local|offline/i.test(String(agent?.model ?? ""))) {
    return {
      allowed: false,
      executionMode: mode,
      message: "Offline mode is enabled. This agent is not marked local/offline. Switch to Cloud mode or choose a local agent.",
    } as const;
  }
  return { allowed: true, executionMode: mode, message: "" } as const;
}
