'use client';

import { useEffect, useRef, useState } from 'react';
import type { IntakeAnswers } from '@/lib/domain/intake';
import type { SaveResult } from '@/lib/server/intake';

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'closed';

export const backupKey = (id: string) => `kickoff-draft-${id}`;

export interface Backup {
  step: number;
  answers: IntakeAnswers;
  savedAt: number;
}

/** Reads this device's backup of a draft, if any. */
export function readBackup(id: string): Backup | null {
  try {
    const raw = localStorage.getItem(backupKey(id));
    return raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    return null;
  }
}

/**
 * Saves the draft a moment after the client stops typing. A copy always goes to this device
 * first, so nothing is lost if the network drops; the server copy follows.
 */
export function useAutosave(
  id: string,
  step: number,
  answers: IntakeAnswers,
  save: (id: string, input: { step: number; answers: IntakeAnswers }) => Promise<SaveResult>,
  delayMs = 800,
): SaveState {
  const [state, setState] = useState<SaveState>('idle');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(
        backupKey(id),
        JSON.stringify({ step, answers, savedAt: Date.now() } satisfies Backup),
      );
    } catch {
      /* storage full or private mode: the server copy still saves */
    }
    setState('saving');
    const t = window.setTimeout(async () => {
      try {
        const r = await save(id, { step, answers });
        setState(r.ok ? 'saved' : r.reason === 'submitted' ? 'closed' : 'offline');
      } catch {
        setState('offline');
      }
    }, delayMs);
    return () => window.clearTimeout(t);
  }, [id, step, answers, save, delayMs]);
  return state;
}
