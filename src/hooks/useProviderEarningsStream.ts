/**
 * Server-Sent Events bridge for provider earnings.
 *
 * `EventSource` cannot attach an `Authorization` header, so this hook
 * consumes the stream through `fetch` and writes snapshots straight into
 * the React Query cache. Reconnects use exponential backoff and the whole
 * loop is torn down on unmount.
 */
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { API_URL, USER_TOKEN_KEY } from '@/lib/api';
import { queryKeys, type ProviderEarningsResponse } from '@/hooks/queries';

export interface ProviderEarningsStreamState {
  connected: boolean;
  error: string | null;
  lastEventAt: number | null;
}

const INITIAL_BACKOFF_MS = 3_000;
const MAX_BACKOFF_MS = 15_000;

function isEarningsSnapshot(value: unknown): value is ProviderEarningsResponse {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as Record<string, unknown>;
  const summary = candidate.summary;
  const transactions = candidate.transactions;

  return (
    typeof summary === 'object' &&
    summary !== null &&
    Array.isArray(transactions)
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Earnings stream disconnected.';
}

export function useProviderEarningsStream(
  enabled = true
): ProviderEarningsStreamState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ProviderEarningsStreamState>({
    connected: false,
    error: null,
    lastEventAt: null,
  });

  // Keep the latest client in a ref so the effect does not restart when the
  // query client identity is stable but the hook re-renders frequently.
  const clientRef = useRef(queryClient);
  clientRef.current = queryClient;

  useEffect(() => {
    if (!enabled) {
      setState({ connected: false, error: null, lastEventAt: null });
      return;
    }

    const token = sessionStorage.getItem(USER_TOKEN_KEY);
    if (!token) {
      setState({ connected: false, error: null, lastEventAt: null });
      return;
    }

    let disposed = false;
    let backoff = INITIAL_BACKOFF_MS;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const update = (patch: Partial<ProviderEarningsStreamState>) => {
      if (disposed) return;
      setState((previous) => ({ ...previous, ...patch }));
    };

    const scheduleReconnect = () => {
      if (disposed) return;

      const delay = backoff;
      backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);

      retryTimer = setTimeout(() => {
        retryTimer = null;
        void connect();
      }, delay);
    };

    const handleEventBlock = (block: string) => {
      const lines = block.split('\n');
      let eventName = '';
      const dataLines: string[] = [];

      for (const line of lines) {
        const trimmed = line.replace(/\r$/, '');
        if (trimmed.startsWith('event:')) {
          eventName = trimmed.slice(6).trim();
        } else if (trimmed.startsWith('data:')) {
          dataLines.push(trimmed.slice(5).trimStart());
        }
      }

      if (dataLines.length === 0) return;

      const raw = dataLines.join('\n').trim();
      if (!raw || raw === '[DONE]') return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return;
      }

      if (eventName && eventName !== 'earnings' && !isEarningsSnapshot(parsed)) {
        return;
      }

      if (!isEarningsSnapshot(parsed)) return;

      clientRef.current.setQueryData<ProviderEarningsResponse>(
        queryKeys.earnings.provider,
        parsed
      );
      update({ lastEventAt: Date.now() });
    };

    const readStream = async (response: Response) => {
      if (!response.body) throw new Error('Earnings stream has no body.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (disposed) {
            await reader.cancel().catch(() => undefined);
            return;
          }
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let boundary = buffer.indexOf('\n\n');
          while (boundary !== -1) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            handleEventBlock(block);
            boundary = buffer.indexOf('\n\n');
          }
        }
      } finally {
        reader.releaseLock();
      }
    };

    const connect = async () => {
      if (disposed) return;

      controller = new AbortController();

      try {
        const response = await fetch(
          `${API_URL}/bookings/provider-earnings/stream`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
            signal: controller.signal,
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error(`Earnings stream failed with status ${response.status}.`);
        }

        if (!response.body) {
          throw new Error('Earnings stream has no body.');
        }

        update({ connected: true, error: null });
        backoff = INITIAL_BACKOFF_MS;

        await readStream(response);

        // The server closed the stream without an abort: reconnect.
        if (!disposed) {
          update({ connected: false });
          scheduleReconnect();
        }
      } catch (error) {
        if (disposed) return;

        const aborted =
          controller?.signal.aborted === true ||
          (error instanceof Error && error.name === 'AbortError');

        if (aborted) return;

        update({ connected: false, error: errorMessage(error) });
        scheduleReconnect();
      }
    };

    void connect();

    return () => {
      disposed = true;
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      controller?.abort();
      controller = null;
    };
  }, [enabled]);

  return state;
}
