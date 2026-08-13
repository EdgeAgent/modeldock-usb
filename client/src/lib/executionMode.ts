export type ExecutionMode = "offline" | "cloud";

export function getExecutionMode(): ExecutionMode {
  if (typeof window === "undefined") return "cloud";
  return window.localStorage.getItem("agent-ops-execution-mode") === "offline" ? "offline" : "cloud";
}

export function isOfflineMode() {
  return getExecutionMode() === "offline";
}

export function subscribeToExecutionMode(listener: (mode: ExecutionMode) => void) {
  const onMode = (event: Event) => listener((event as CustomEvent<{ mode: ExecutionMode }>).detail.mode);
  window.addEventListener("agent-ops:execution-mode", onMode);
  return () => window.removeEventListener("agent-ops:execution-mode", onMode);
}
