'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { AgencyMark, PoweredBy } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { ProgressBar, Stepper } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { STEPS, stepErrors, type IntakeAnswers, type StepKey } from '@/lib/domain/intake';
import type { SaveResult } from '@/lib/server/intake';
import { BriefPreview } from './brief-preview';
import { previewModel, screens as screenList, type ScreenKey } from './model';
import { STEP_COPY, StepBody, type Update } from './steps';
import { readBackup, useAutosave, type SaveState } from './use-autosave';

export interface IntakeAppProps {
  draftId: string;
  initialAnswers: IntakeAnswers;
  initialStep: number;
  updatedAt: string;
  steps: StepKey[];
  agency: { name: string; color: string; logoUrl: string | null };
  save: (id: string, input: { step: number; answers: IntakeAnswers }) => Promise<SaveResult>;
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state === 'idle') return null;
  const text =
    state === 'saving'
      ? 'Saving…'
      : state === 'saved'
        ? 'Saved'
        : state === 'closed'
          ? 'Already sent'
          : 'Offline: saved on this device';
  return (
    <span className="save-state" role="status">
      <Icon name={state === 'offline' ? 'offline' : 'check'} size="sm" />
      {text}
    </span>
  );
}

/** The guided intake: one question group per screen, with the brief building alongside. */
export function IntakeApp(props: IntakeAppProps) {
  const { draftId, steps, agency } = props;
  const toast = useToast();
  const [answers, setAnswers] = useState(props.initialAnswers);
  const [index, setIndex] = useState(Math.min(props.initialStep, steps.length - 1));
  const [furthest, setFurthest] = useState(Math.min(props.initialStep, steps.length - 1));
  const [showErrors, setShowErrors] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // A newer copy on this device (for example saved while offline) wins over the server copy.
  useEffect(() => {
    const b = readBackup(draftId);
    if (b && b.savedAt > Date.parse(props.updatedAt)) {
      setAnswers(b.answers);
      const i = Math.min(b.step, steps.length - 1);
      setIndex(i);
      setFurthest(i);
    }
  }, [draftId, props.updatedAt, steps.length]);

  const all = useMemo(() => screenList(steps, false), [steps]);
  const screen = all[index] as ScreenKey;
  const step = screen as StepKey;
  const reached = useMemo(() => new Set(all.slice(0, furthest + 1)), [all, furthest]);
  const preview = useMemo(() => previewModel(answers, reached), [answers, reached]);
  const errors = useMemo(
    () => (showErrors ? stepErrors(step, answers[step]) : {}),
    [showErrors, step, answers],
  );
  const saveState = useAutosave(draftId, index, answers, props.save);

  const update: Update = useCallback((section, patch) => {
    setAnswers((a) => ({ ...a, [section]: { ...a[section], ...patch } }));
  }, []);

  useEffect(() => {
    if (!drawer) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [drawer]);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [index]);

  const go = (i: number) => {
    setShowErrors(false);
    setIndex(i);
    setFurthest((f) => Math.max(f, i));
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    const errs = stepErrors(step, answers[step]);
    if (Object.keys(errs).length) {
      setShowErrors(true);
      return;
    }
    if (index < all.length - 1) go(index + 1);
    else toast.show('Saved. Review comes next.');
  };

  const stepNo = steps.indexOf(step) + 1;
  const progress = Math.min(1, (index + 1) / (all.length + 1));
  const errorCount = Object.keys(errors).length;
  const copy = STEP_COPY[step];
  const stepLabel = STEPS.find((s) => s.key === step)?.label ?? '';

  return (
    <div className={drawer ? 'ishell dopen' : 'ishell'}>
      <div className="brand-rule" style={{ background: agency.color }} />
      <header className="rb">
        <div className="wrap ihead">
          <span className="row" style={{ gap: 10 }}>
            <AgencyMark name={agency.name} color={agency.color} logoUrl={agency.logoUrl} />
            <span className="w5">{agency.name}</span>
            <span className="t-sm muted hide-m">· Project intake</span>
          </span>
          <Button
            variant="quiet"
            size="sm"
            icon="bookmark"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.show('Link copied. Open it any time to carry on where you left off.');
              } catch {
                toast.show('Bookmark this page to carry on later. Your answers are saved.');
              }
            }}
          >
            <span className="hide-m">Save and finish later</span>
            <span className="only-m">Save</span>
          </Button>
        </div>
        <div className="wrap dsteps" style={{ paddingBottom: 18 }}>
          <Stepper
            steps={steps.map((k) => STEPS.find((s) => s.key === k)!.label)}
            current={Math.min(index, steps.length)}
          />
        </div>
        <div className="wrap mprog col" style={{ paddingBottom: 14, gap: 8 }}>
          <div className="row between t-sm">
            <span className="w5">
              Step {stepNo} of {steps.length} · {stepLabel}
            </span>
            <span className="mono muted t-xs">{Math.round(progress * 100)}%</span>
          </div>
          <ProgressBar value={progress} label="Intake progress" />
        </div>
      </header>

      <div className="wrap ibody">
        <main id="main" className="iform">
          <form
            key={screen}
            className="a-in-x col"
            style={{ gap: 28 }}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <div className="q">
              <span className="eyebrow">
                Step {stepNo} of {steps.length} · {stepLabel}
              </span>
              <h1 className="d-2" ref={heading} tabIndex={-1}>
                {copy.title}
              </h1>
              <p className="muted">{copy.lead}</p>
            </div>
            {errorCount > 0 && (
              <div className="note note-err" role="alert">
                <Icon name="alert" />
                <span>
                  {errorCount === 1 ? '1 answer needs' : `${errorCount} answers need`} a quick look before you
                  carry on.
                </span>
              </div>
            )}
            <StepBody
              step={step}
              answers={answers}
              update={update}
              errors={errors}
              agencyName={agency.name}
            />
            <div className="ibar">
              <Button className="mbrief" icon="brief" aria-expanded={drawer} onClick={() => setDrawer(true)}>
                Your brief so far
                <span className="tag" style={{ marginLeft: 'auto' }}>
                  {preview.readyCount} sections
                </span>
              </Button>
              <Button variant="ghost" icon="arrowLeft" disabled={index === 0} onClick={() => go(index - 1)}>
                Back
              </Button>
              <SaveStatus state={saveState} />
              <Button type="submit" variant="primary" size="lg" className="nxt" iconAfter="arrowRight">
                Continue
              </Button>
            </div>
          </form>
        </main>
        <button
          type="button"
          className="scrim pv-scrim"
          aria-label="Close brief preview"
          onClick={() => setDrawer(false)}
        />
        <BriefPreview
          preview={preview}
          current={screen}
          agencyName={agency.name}
          onClose={() => setDrawer(false)}
        />
      </div>
      <p className="wrap hide-m" style={{ paddingBottom: 20 }}>
        <PoweredBy /> <span className="t-xs muted">· Your answers are private to {agency.name}</span>
      </p>
    </div>
  );
}
