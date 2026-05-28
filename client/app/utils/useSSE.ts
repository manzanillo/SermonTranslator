'use client';
import { useEffect, useRef } from 'react';

/**
 * Hook to connect to the SSE endpoint at the backend and listen for a
 * specific named event type.
 *
 * The backend sends named events like:
 *   event: forumsUpdated
 *   data: {"postId":1}
 *
 * EventSource.onmessage only fires for *unnamed* events. For named events
 * we must use addEventListener(eventName, ...).
 *
 * @param eventName  The SSE event type to listen for (e.g. 'forumsUpdated').
 * @param handler    Callback invoked with the parsed JSON data from the event.
 */
export function useSSE(eventName: string, handler: (data: any) => void) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const source = new EventSource('http://localhost:3001/api/events', {
      withCredentials: true,
    });

    const listener = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        handlerRef.current(data);
      } catch {
        // ignore malformed messages
      }
    };

    source.addEventListener(eventName, listener);

    source.onerror = () => {
      // EventSource auto-reconnects; nothing special needed
    };

    return () => {
      source.removeEventListener(eventName, listener);
      source.close();
    };
  }, [eventName]);
}
