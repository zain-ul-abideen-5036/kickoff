'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ConfirmResult } from '@/app/start/actions';
import { Icon } from '@/components/icons';
import { AgencyMark, PoweredBy } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { ProgressBar, Stepper } from '@/components/ui/progress';
import { useToast } from '@/components/ui/toast';
import { STEPS, stepErrors, type IntakeAnswers, type StepKey } from '@/lib/domain/intake';
import { selectFollowUps, type FollowUpSet } from '@/lib/engine/followups';
import type { SaveResult } from '@/lib/server/intake';
import { BriefPreview } from './brief-preview';
import { FollowUpsStep } from './followups-step';
import { previewModel, screens as screenList, type ScreenKey } from './model';
import { ReviewStep } from './review-step';
import { STEP_COPY, StepBody, type Update } from './steps';
import { readBackup, useAutosave, type SaveState } from './use-autosave';

export interface IntakeAppProps {
  draftId: string;
  initialAnswers: IntakeAnswers;
  initialStep: number;
  updatedAt: string;
  steps: StepKey[];
  followUpsOn: boolean;
  agency: { name: string; color: string; logoUrl: string | null };
  save: (id: string, input: { step: number; answers: IntakeAnswers }) => Promise<SaveResult>;
  getFollowUps: (id: string, answers: IntakeAnswers) => Promise<FollowUpSet | null>;
  confirm: (
    id: string,
    input: { answers: IntakeAnswers; consent: boolean; trap?: string },
  ) => Promise<ConfirmResult>;
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

/** Keeps rule-chosen questions and options, taking only the polished wording when ids match. */
function mergeWording(local: FollowUpSet, polished: FollowUpSet | null): FollowUpSet {
  if (!polished || polished.questions.length !== local.questions.length) return local;
  if (polished.questions.some((q, i) => q.id !== local.questions[i]!.id)) return local;
  return {
    ...local,
    questions: local.questions.map((q, i) => ({
      ...q,
      question: polished.questions[i]!.question,
      hint: polished.questions[i]!.hint,
    })),
  };
}

/** The guided intake: one question group per screen, with the brief building alongside. */
export function IntakeApp(props: IntakeAppProps) {
  const { draftId, steps, agency, followUpsOn, getFollowUps, confirm } = props;
  const toast = useToast();
  const router = useRouter();
  const [answers, setAnswers] = useState(props.initialAnswers);
  const startCount = screenList(
    steps,
    followUpsOn && selectFollowUps(props.initialAnswers).questions.length > 0,
  ).length;
  const [index, setIndex] = useState(Math.min(props.initialStep, startCount - 1));
  const [furthest, setFurthest] = useState(Math.min(props.initialStep, startCount - 1));
  const [showErrors, setShowErrors] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [polished, setPolished] = useState<FollowUpSet | null>(null);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // A newer copy on this device (for example saved while offline) wins over the server copy.
  useEffect(() => {
    const b = readBackup(draftId);
    if (b && b.savedAt > Date.parse(props.updatedAt)) {
      setAnswers(b.answers);
      setIndex(b.step);
      setFurthest(b.step);
    }
  }, [draftId, props.updatedAt]);

  const localSet = useMemo(() => (followUpsOn ? selectFollowUps(answers) : null), [followUpsOn, answers]);
  const followUps = localSet && localSet.questions.length ? mergeWording(localSet, polished) : null;
  const all = useMemo(() => screenList(steps, !!followUps), [steps, followUps]);
  const at = Math.min(index, all.length - 1);
  const screen = all[at] as ScreenKey;
  const isStep = screen !== 'followups' && screen !== 'review';
  const step = screen as StepKey;
  const reached = useMemo(() => new Set(all.slice(0, Math.max(furthest, at) + 1)), [all, furthest, at]);
  const preview = useMemo(() => previewModel(answers, reached), [answers, reached]);
  const errors = useMemo(
    () => (showErrors && isStep ? stepErrors(step, answers[step]) : {}),
    [showErrors, isStep, step, answers],
  );
  const saveState = useAutosave(draftId, at, answers, props.save);

  const update: Update = useCallback((section, patch) => {
    setAnswers((a) => ({ ...a, [section]: { ...a[section], ...patch } }));
  }, []);

  // Ask the server for polished follow-up wording when the client reaches that screen.
  useEffect(() => {
    if (screen !== 'followups' || polished) return;
    let live = true;
    getFollowUps(draftId, answers)
      .then((set) => live && set && setPolished(set))
      .catch(() => undefined);
    return () => {
      live = false;
    };
    // Only when arriving at the screen; later answer changes keep the rule-chosen questions.
  }, [screen]);

  useEffect(() => {
    if (!drawer) return;
    const close = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [drawer]);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = true;
  }, [at]);

  const go = (i: number) => {
    setShowErrors(false);
    setFormError('');
    setIndex(i);
    setFurthest((f) => Math.max(f, i));
    window.scrollTo({ top: 0 });
  };
  const goTo = (key: ScreenKey) => {
    const i = all.indexOf(key);
    if (i >= 0) go(i);
  };

  const submit = async (form: HTMLFormElement) => {
    setSubmitting(true);
    setFormError('');
    try {
      const trap = String(new FormData(form).get('website_url') ?? '');
      const r = await confirm(draftId, { answers, consent, trap });
      if (r.ok) {
        router.push(`/start/${draftId}/assembling`);
        return;
      }
      setFormError(r.message);
      if (r.screen && r.screen !== 'review') {
        goTo(r.screen as ScreenKey);
        setShowErrors(true);
      }
    } catch {
      setFormError('We couldn’t reach the studio just now. Your answers are saved: please try again.');
    }
    setSubmitting(false);
  };

  const next = (form: HTMLFormElement) => {
    if (isStep) {
      if (Object.keys(stepErrors(step, answers[step])).length) {
        setShowErrors(true);
        return;
      }
    } else if (screen === 'followups') {
      if (followUps?.questions.some((q) => !answers.followUps[q.id])) {
        setShowErrors(true);
        return;
      }
    } else {
      void submit(form);
      return;
    }
    go(at + 1);
  };

  const stepNo = isStep ? steps.indexOf(step) + 1 : steps.length;
  const progress = Math.min(1, (at + 1) / (all.length + 1));
  const errorCount = Object.keys(errors).length;
  const stepLabel = isStep
    ? (STEPS.find((s) => s.key === step)?.label ?? '')
    : screen === 'followups'
      ? 'Final details'
      : 'Review';
  const head = isStep
    ? { eyebrow: `Step ${stepNo} of ${steps.length} · ${stepLabel}`, ...STEP_COPY[step] }
    : screen === 'followups'
      ? {
          eyebrow: `Nearly there · ${followUps?.questions.length === 1 ? '1 quick question' : `${followUps?.questions.length} quick questions`}`,
          title: 'A couple of quick details so your estimate is accurate',
          lead: followUps?.reason ?? '',
        }
      : {
          eyebrow: 'Review',
          title: 'Check your answers',
          lead: 'Change anything you like before we put your brief together.',
        };
  const nextLabel =
    screen === 'review' ? 'Create my brief' : screen === 'followups' ? 'Review my answers' : 'Continue';

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
            current={isStep ? at : steps.length}
          />
        </div>
        <div className="wrap mprog col" style={{ paddingBottom: 14, gap: 8 }}>
          <div className="row between t-sm">
            <span className="w5">
              {isStep ? `Step ${stepNo} of ${steps.length} · ${stepLabel}` : stepLabel}
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
              next(e.currentTarget);
            }}
          >
            <div className="q">
              <span className={screen === 'followups' ? 'eyebrow brass' : 'eyebrow'}>{head.eyebrow}</span>
              <h1 className="d-2" ref={heading} tabIndex={-1}>
                {head.title}
              </h1>
              {head.lead && <p className="muted">{head.lead}</p>}
            </div>
            {(errorCount > 0 || formError) && (
              <div className="note note-err" role="alert">
                <Icon name="alert" />
                <span>
                  {formError ||
                    `${errorCount === 1 ? '1 answer needs' : `${errorCount} answers need`} a quick look before you carry on.`}
                </span>
              </div>
            )}
            {isStep && (
              <StepBody
                step={step}
                answers={answers}
                update={update}
                errors={errors}
                agencyName={agency.name}
              />
            )}
            {screen === 'followups' && followUps && (
              <FollowUpsStep
                set={followUps}
                values={answers.followUps}
                showErrors={showErrors}
                onChange={(id, value) =>
                  setAnswers((a) => ({ ...a, followUps: { ...a.followUps, [id]: value } }))
                }
              />
            )}
            {screen === 'review' && (
              <ReviewStep
                answers={answers}
                steps={steps}
                followUps={followUps}
                onEdit={goTo}
                consent={consent}
                setConsent={(v) => {
                  setConsent(v);
                  setFormError('');
                }}
                agencyName={agency.name}
              />
            )}
            <div className="ibar">
              <Button className="mbrief" icon="brief" aria-expanded={drawer} onClick={() => setDrawer(true)}>
                Your brief so far
                <span className="tag" style={{ marginLeft: 'auto' }}>
                  {preview.readyCount} sections
                </span>
              </Button>
              <Button variant="ghost" icon="arrowLeft" disabled={at === 0} onClick={() => go(at - 1)}>
                Back
              </Button>
              <SaveStatus state={saveState} />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="nxt"
                iconAfter="arrowRight"
                loading={submitting}
              >
                {nextLabel}
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
