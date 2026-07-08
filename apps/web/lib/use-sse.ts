"use client";

import { useEffect, useRef, useCallback } from "react";

type EventHandler = (data: any) => void;

export function useSSE(eventHandlers: Record<string, EventHandler>) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  const connect = useCallback(() => {
    if (eventSourceRef.current?.readyState === EventSource.OPEN) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const es = new EventSource("/api/sse");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {});
    es.addEventListener("heartbeat", () => {});

    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const handlerFn = handlersRef.current[event.type];
        if (handlerFn) handlerFn(data);
      } catch {}
    };

    es.addEventListener("message", handler);

    es.onerror = () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      reconnectRef.current = setTimeout(() => {
        eventSourceRef.current = null;
        connect();
      }, 5000);
    };
  }, []);

  useEffect(() => {
    const es = eventSourceRef.current;
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (es) es.close();
      eventSourceRef.current = null;
    };
  }, []);
}