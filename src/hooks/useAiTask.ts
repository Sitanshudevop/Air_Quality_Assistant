// Generic React hook for AI proxy tasks with AbortController, retry, and provenance.
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { getAiResponse } from '../services/ai.js';
import type { AllowedTask, Provenance, TaskContext } from '../../shared/types.js';

/** Configuration options for useAiTask hook. */
export interface UseAiTaskOptions {
  readonly task: AllowedTask;
  readonly context: TaskContext;
  readonly userText?: string;
  readonly autoFetch?: boolean;
}

/** Return state and action handlers from useAiTask hook. */
export interface UseAiTaskResult<TResult> {
  readonly data: TResult | null;
  readonly provenance: Provenance;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly trigger: (overrideText?: string, overrideContext?: TaskContext) => Promise<void>;
  readonly retry: () => Promise<void>;
}

const DEFAULT_PROVENANCE: Provenance = { source: 'rules', model: 'rules-v1', cached: false };

async function runAiFetch<TResult>(params: {
  task: AllowedTask;
  context: TaskContext;
  userText?: string;
  mountedRef: MutableRefObject<boolean>;
  controller: AbortController;
  onSuccess: (data: TResult, provenance: Provenance) => void;
  onError: (msg: string) => void;
  onDone: () => void;
}): Promise<void> {
  try {
    const res = await getAiResponse({
      task: params.task,
      context: params.context,
      userText: params.userText,
      signal: params.controller.signal,
    });
    if (params.mountedRef.current && !params.controller.signal.aborted) {
      params.onSuccess(res.result as TResult, res.provenance);
    }
  } catch (err) {
    if (params.mountedRef.current && !params.controller.signal.aborted) {
      params.onError(err instanceof Error ? err.message : 'Unable to reach AI assistant.');
    }
  } finally {
    if (params.mountedRef.current && !params.controller.signal.aborted) params.onDone();
  }
}

/**
 * Executes an AI-assisted proxy task with cancellation, loading state, and rule fallback.
 *
 * @param options - Task name, grounded context, optional prompt, and autoFetch toggle.
 * @returns Stateful task result, provenance metadata, and trigger/retry controls.
 */
export function useAiTask<TResult>({ task, context, userText, autoFetch = false }: UseAiTaskOptions): UseAiTaskResult<TResult> {
  const [data, setData] = useState<TResult | null>(null);
  const [provenance, setProvenance] = useState<Provenance>(DEFAULT_PROVENANCE);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastRef = useRef({ text: userText, ctx: context });
  lastRef.current = { text: userText, ctx: context };

  const trigger = useCallback(async (text?: string, ctx?: TaskContext): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);
    setError(null);
    await runAiFetch<TResult>({
      task, context: ctx ?? lastRef.current.ctx, userText: text ?? lastRef.current.text, mountedRef, controller,
      onSuccess: (d, p) => { setData(d); setProvenance(p); }, onError: setError, onDone: () => setIsLoading(false),
    });
  }, [task]);

  const retry = useCallback(async (): Promise<void> => {
    if (!isLoading) await trigger(lastRef.current.text, lastRef.current.ctx);
  }, [isLoading, trigger]);

  useEffect(() => {
    mountedRef.current = true;
    if (autoFetch) void trigger(userText, context);
    return () => { mountedRef.current = false; abortRef.current?.abort(); };
  }, [autoFetch, context.aqi, context.city, userText, trigger]);

  return { data, provenance, isLoading, error, trigger, retry };
}
