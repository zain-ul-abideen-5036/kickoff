'use client';

import { startTransition, useEffect, useRef, type FormEvent } from 'react';
import type { SettingsState } from '@/app/(app)/settings/actions';
import { useToast } from '../ui/toast';

/** Shows a toast once for each new result from a settings action. */
export function useResultToast(state: SettingsState) {
  const toast = useToast();
  const last = useRef<SettingsState | null>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok) toast.show(state.ok);
    else if (state.error) toast.show(state.error, { tone: 'error' });
    else if (state.fieldErrors && Object.keys(state.fieldErrors).length)
      toast.show('Nothing was saved. Check the highlighted fields.', { tone: 'error' });
  }, [state, toast]);
}

/**
 * Submits a form to an action without React's automatic form reset, so a validation error
 * never wipes what the person typed.
 */
export function submitKeepingValues(action: (form: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}
