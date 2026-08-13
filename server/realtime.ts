import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

export type RealtimeEvent = {
  type: "run.updated" | "agent.updated" | "approval.updated" | "audit.created" | "execution-log.created";
  referenceKey?: string;
  payload: Record<string, unknown>;
  emittedAt: string;
};

let wss: WebSocketServer | null = null;

export function attachRealtime(server: Server) {
  wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "/", "http://localhost").pathname;
    if (pathname !== "/api/realtime") return;
    wss?.handleUpgrade(request, socket, head, (client) => wss?.emit("connection", client, request));
  });
  wss.on("connection", (client) => {
    client.send(JSON.stringify({ type: "realtime.connected", emittedAt: new Date().toISOString(), payload: { transport: "websocket" } }));
  });
}

export function publishRealtime(event: Omit<RealtimeEvent, "emittedAt">) {
  const message = JSON.stringify({ ...event, emittedAt: new Date().toISOString() });
  wss?.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(message);
  });
}
