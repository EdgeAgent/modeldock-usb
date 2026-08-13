import { useEffect, useRef, useState } from "react";

export type RealtimeEvent = { type: string; referenceKey?: string; payload?: Record<string, unknown>; emittedAt?: string };

export function useRealtime(onEvent: (event: RealtimeEvent) => void) {
  const callbackRef = useRef(onEvent);
  const [connected, setConnected] = useState(false);
  useEffect(() => { callbackRef.current = onEvent; }, [onEvent]);
  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;
    let disposed = false;
    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(`${protocol}//${window.location.host}/api/realtime`);
      socket.onopen = () => setConnected(true);
      socket.onmessage = (message) => { try { callbackRef.current(JSON.parse(message.data) as RealtimeEvent); } catch { /* Ignore malformed event frames and keep fallback polling active. */ } };
      socket.onclose = () => { setConnected(false); if (!disposed) retryTimer = window.setTimeout(connect, 2000); };
      socket.onerror = () => socket?.close();
    };
    connect();
    return () => { disposed = true; if (retryTimer) window.clearTimeout(retryTimer); socket?.close(); setConnected(false); };
  }, []);
  return { connected };
}
