import { useCallback, useEffect, useRef, useState } from 'react';

import type { CallAssistRequest, CallAssistStatus } from '@naczas/shared';

import { api } from '@/services';

export type CallPhase = 'idle' | 'starting' | 'calling' | 'finished' | 'error';

export interface CallAssistState {
  phase: CallPhase;
  mode: 'live' | 'simulated' | null;
  status: CallAssistStatus | null;
  /** Call ended, waiting for the provider's post-call extraction of the booked date */
  analysing: boolean;
}

const POLL_MS = 1000;
/** Post-call analysis usually lands within a few seconds; give up after this many polls. */
const MAX_ANALYSIS_POLLS = 20;

const initial: CallAssistState = { phase: 'idle', mode: null, status: null, analysing: false };

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });

/** Starts the call and polls its status until it ends (and the result is extracted). */
export function useCallAssist() {
  const [state, setState] = useState<CallAssistState>(initial);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const start = useCallback(async (req: CallAssistRequest) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    const { signal } = ctrl;
    setState({ ...initial, phase: 'starting' });

    try {
      const { callId, mode } = await api.startCallAssist(req, { signal, timeoutMs: 20_000 });
      setState((s) => ({ ...s, phase: 'calling', mode }));

      let analysisPolls = 0;
      while (!signal.aborted) {
        const status = await api.getCallAssist(callId, { signal });
        if (signal.aborted) return;
        const ended = status.status === 'ended' || status.status === 'failed';
        const analysing = status.status === 'ended' && status.result === null;
        const finished =
          status.status === 'failed' ||
          (ended && !analysing) ||
          (analysing && ++analysisPolls > MAX_ANALYSIS_POLLS);
        setState((s) => ({
          ...s,
          status,
          analysing: analysing && !finished,
          phase: finished ? 'finished' : 'calling',
        }));
        if (finished) return;
        await sleep(POLL_MS, signal);
      }
    } catch {
      if (!signal.aborted) setState((s) => ({ ...s, phase: 'error', analysing: false }));
    }
  }, []);

  const reset = useCallback(() => {
    controller.current?.abort();
    setState(initial);
  }, []);

  return { state, start, reset };
}
