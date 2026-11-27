'use client';

import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { ChipGroup, ChipSelect, RangePair, Segmented } from '@/components/ui/choices';
import { TextAreaField, TextField } from '@/components/ui/field';
import {
  AUDIENCES,
  BUDGETS,
  BUSINESS_TYPES,
  GOALS,
  LAUNCHES,
  MAX_GOALS,
  PHOTO_SOURCES,
  READINESS,
  STYLE_WORDS,
  WEBSITE_STATES,
} from '@/lib/domain/catalog';
import { AboutSchema, type IntakeAnswers, type StepKey } from '@/lib/domain/intake';
import { featureOptions } from './model';

export type Update = <K extends keyof IntakeAnswers>(section: K, patch: Partial<IntakeAnswers[K]>) => void;

interface StepProps {
  answers: IntakeAnswers;
  update: Update;
  errors: Record<string, string>;
  agencyName: string;
}

/** Headline and helper line for each step, in the design's words. */
export const STEP_COPY: Record<StepKey, { title: string; lead: string }> = {
  about: { title: 'First, a little about you', lead: 'So we know who we’re talking to and where you are.' },
  goals: {
    title: 'What should the new website do for you?',
    lead: 'Choose up to three. We’ll turn them into goals and simple ways to measure them.',
  },
  audience: {
    title: 'Who are you hoping to reach?',
    lead: 'Pick the people you most want to welcome. You can choose several.',
  },
  features: {
    title: 'What would you like the site to do?',
    lead: 'Choose everything that sounds useful. We’ll sort it into must-haves and nice-to-haves.',
  },
  content: {
    title: 'What do you already have?',
    lead: 'It’s fine if things aren’t ready. We’ll plan around it.',
  },
  inspiration: {
    title: 'Show us what you like',
    lead: 'Share a site or two you admire. They don’t need to be in your line of work.',
  },
  budget: { title: 'Budget and timing', lead: 'A rough range is fine. It helps us suggest the right scope.' },
};

function Row({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="row between wrapf rb" style={{ padding: '16px 0', gap: 12 }}>
      <span className="w5" id={id}>
        {label}
      </span>
      {children}
    </div>
  );
}

function About({ answers, update, errors }: StepProps) {
  const a = answers.about;
  const emailOk = !errors.email && AboutSchema.shape.email.safeParse(a.email).success;
  return (
    <>
      <div className="g2" style={{ gap: 20 }}>
        <TextField
          label="Your name"
          autoComplete="name"
          value={a.name}
          onChange={(e) => update('about', { name: e.target.value })}
          error={errors.name}
        />
        <TextField
          label="Business name"
          autoComplete="organization"
          value={a.business}
          onChange={(e) => update('about', { business: e.target.value })}
          error={errors.business}
        />
      </div>
      <ChipSelect
        label="What kind of business is it?"
        options={BUSINESS_TYPES}
        value={a.businessType}
        onChange={(businessType) => update('about', { businessType })}
      />
      <div className="g2" style={{ gap: 20 }}>
        <TextField
          label="Where are you based?"
          autoComplete="address-level2"
          placeholder="e.g. Barking, London"
          value={a.location}
          onChange={(e) => update('about', { location: e.target.value })}
          error={errors.location}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={a.email}
          onChange={(e) => update('about', { email: e.target.value })}
          error={errors.email}
          success={emailOk ? 'We’ll send your brief here' : undefined}
        />
      </div>
      <Segmented
        label="Do you have a website now?"
        options={WEBSITE_STATES}
        value={a.website}
        onChange={(website) => update('about', { website })}
      />
    </>
  );
}

function Goals({ answers, update, errors }: StepProps) {
  const g = answers.goals;
  return (
    <>
      <ChipGroup
        label="Goals"
        hideLabel
        options={GOALS}
        value={g.goals}
        max={MAX_GOALS}
        onChange={(goals) => update('goals', { goals })}
        error={errors.goals}
      />
      <p className="t-sm muted" aria-live="polite">
        <span className="mono">{g.goals.length}</span> of {MAX_GOALS} chosen
      </p>
      <TextField
        label="Is there a search you’d love to be found for?"
        optional
        placeholder="e.g. florist Barking"
        value={g.searchTerm}
        onChange={(e) => update('goals', { searchTerm: e.target.value })}
        hint="Think of what a new customer would type into Google."
      />
    </>
  );
}

function Audience({ answers, update, errors }: StepProps) {
  const a = answers.audience;
  return (
    <>
      <ChipGroup
        label="Audience"
        hideLabel
        options={AUDIENCES}
        value={a.groups}
        onChange={(groups) => update('audience', { groups })}
        error={errors.groups}
      />
      <RangePair
        label="Typical age range"
        min={18}
        max={75}
        low={a.ageMin}
        high={a.ageMax}
        onChange={(ageMin, ageMax) => update('audience', { ageMin, ageMax })}
      />
      <TextAreaField
        label="Anything else about them?"
        optional
        value={a.notes}
        onChange={(e) => update('audience', { notes: e.target.value })}
      />
    </>
  );
}

function Features({ answers, update }: StepProps) {
  return (
    <>
      <ChipGroup
        label="Features"
        hideLabel
        cards
        options={featureOptions(answers.about.businessType)}
        value={answers.features.features}
        onChange={(features) => update('features', { features })}
      />
      <p className="hint">Not sure? Leave it out. You can talk it through on the kickoff call.</p>
    </>
  );
}

function Content({ answers, update, agencyName }: StepProps) {
  const c = answers.content;
  return (
    <div className="card" style={{ padding: '4px 20px' }}>
      <Row label="Logo" id="c-logo">
        <Segmented
          label="Logo"
          hideLabel
          size="sm"
          fillMobile={false}
          options={READINESS}
          value={c.logo}
          onChange={(logo) => update('content', { logo })}
        />
      </Row>
      <div className="rb" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="row between wrapf" style={{ gap: 12 }}>
          <span className="w5">Photos</span>
          <Segmented
            label="Photos"
            hideLabel
            size="sm"
            fillMobile={false}
            options={READINESS}
            value={c.photos}
            onChange={(photos) => update('content', { photos })}
          />
        </div>
        <div className="row wrapf" style={{ gap: 12 }}>
          <span className="t-sm muted">Taken by</span>
          <Segmented
            label="Photos taken by"
            hideLabel
            size="sm"
            fillMobile={false}
            options={PHOTO_SOURCES}
            value={c.photoSource}
            onChange={(photoSource) => update('content', { photoSource })}
          />
        </div>
      </div>
      <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="row between wrapf" style={{ gap: 12 }}>
          <span className="w5">Written text</span>
          <Segmented
            label="Written text"
            hideLabel
            size="sm"
            fillMobile={false}
            options={READINESS}
            value={c.text}
            onChange={(text) => update('content', { text })}
          />
        </div>
        {c.text !== 'ready' && (
          <p className="hint">No problem. {agencyName} can include copywriting support in your estimate.</p>
        )}
      </div>
    </div>
  );
}

function Inspiration({ answers, update }: StepProps) {
  const i = answers.inspiration;
  const sites = [i.sites[0] ?? '', i.sites[1] ?? ''];
  const setSite = (n: number, v: string) => {
    const next = [...sites];
    next[n] = v;
    update('inspiration', { sites: next });
  };
  return (
    <>
      <TextField
        label="A website you like"
        icon="link"
        inputMode="url"
        placeholder="e.g. a site you admire"
        value={sites[0]}
        onChange={(e) => setSite(0, e.target.value)}
      />
      <TextField
        label="Another one"
        optional
        icon="link"
        inputMode="url"
        value={sites[1]}
        onChange={(e) => setSite(1, e.target.value)}
      />
      <ChipGroup
        label="Words that describe the feel you want"
        options={STYLE_WORDS}
        value={i.words}
        onChange={(words) => update('inspiration', { words })}
      />
      <TextAreaField
        label="What do you like about them?"
        optional
        value={i.notes}
        onChange={(e) => update('inspiration', { notes: e.target.value })}
      />
    </>
  );
}

function Budget({ answers, update }: StepProps) {
  const b = answers.budget;
  return (
    <>
      <Segmented
        label="Budget"
        mono
        options={BUDGETS.map((x) => ({ id: x.id, label: x.short }))}
        value={b.budget}
        onChange={(budget) => update('budget', { budget })}
      />
      <Segmented
        label="When would you like to launch?"
        options={LAUNCHES}
        value={b.launch}
        onChange={(launch) => update('budget', { launch })}
      />
      <div className="note">
        <Icon name="calendar" />
        <span>
          Most websites take five to six weeks. If your date is tight, we&rsquo;ll suggest launching the key
          pages first.
        </span>
      </div>
    </>
  );
}

const BODIES: Record<StepKey, (p: StepProps) => ReactNode> = {
  about: About,
  goals: Goals,
  audience: Audience,
  features: Features,
  content: Content,
  inspiration: Inspiration,
  budget: Budget,
};

export function StepBody({ step, ...props }: StepProps & { step: StepKey }) {
  const Body = BODIES[step];
  return <Body {...props} />;
}
