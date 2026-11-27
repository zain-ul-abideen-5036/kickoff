'use client';

import type { ReactNode } from 'react';
import type { Edit } from '@/lib/brief-edit/edits';
import type { Brief } from '@/lib/domain/brief';
import { briefFacts } from '@/lib/engine/generate';
import { formatGbp, formatWeeks } from '@/lib/format';
import { Icon, type IconName } from '../icons';
import { ButtonLink } from '../ui/button';
import { EditableText } from './editable-text';
import { FeatureColumns } from './features';
import { QuoteSummary } from './quote-summary';
import { SitemapTree } from './sitemap';
import { TimelineChart } from './timeline';

export const SECTIONS = [
  ['summary', 'Summary'],
  ['goals', 'Goals'],
  ['audience', 'Audience'],
  ['sitemap', 'Sitemap'],
  ['features', 'Features'],
  ['platform', 'Platform'],
  ['content', 'Content'],
  ['timeline', 'Timeline'],
  ['quote', 'Estimate'],
  ['risks', 'Risks'],
  ['questions', 'Kickoff questions'],
] as const;

const TITLES: Record<string, string> = {
  summary: 'Summary',
  goals: 'Goals and success measures',
  audience: 'Audience',
  sitemap: 'Recommended sitemap',
  features: 'Features',
  platform: 'Platform',
  content: 'Content checklist',
  timeline: 'Timeline',
  quote: 'Estimate',
  risks: 'Risks',
  questions: 'Questions for the kickoff call',
};

function Section({ id, action, children }: { id: string; action?: ReactNode; children: ReactNode }) {
  const n = SECTIONS.findIndex(([s]) => s === id) + 1;
  return (
    <section className="sec" id={id} aria-labelledby={`${id}-h`}>
      <div className="row between wrapf" style={{ gap: 12 }}>
        <div className="sh">
          <span className="n">{String(n).padStart(2, '0')}</span>
          <h2 className="d-3" id={`${id}-h`}>
            {TITLES[id]}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={onClick}>
      <Icon name="plus" size="sm" />
      {label}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm btn-icon rm-btn"
      aria-label={label}
      onClick={onClick}
    >
      <Icon name="close" size="sm" />
    </button>
  );
}

const CONTENT_ICON: Record<string, { icon: IconName; cls: string; label: string }> = {
  ready: { icon: 'statusWon', cls: 'st st-won', label: 'Ready' },
  missing: { icon: 'statusLost', cls: 'st st-lost', label: 'Not ready' },
  collect: { icon: 'statusNew', cls: 'st st-new', label: 'To collect' },
};
const NEXT_STATE = { ready: 'missing', missing: 'collect', collect: 'ready' } as const;

/**
 * The project brief as a document. With `editable`, each part edits in place and reports changes
 * through `onEdit`; without it, this is the read-only version the client sees.
 */
export function BriefDocument({
  brief,
  vatRate,
  agency,
  editable = false,
  onEdit,
  quoteHref,
}: {
  brief: Brief;
  vatRate: number;
  agency: string;
  editable?: boolean;
  onEdit?: (e: Edit) => void;
  quoteHref?: string;
}) {
  const edit = (e: Edit) => onEdit?.(e);
  const f = briefFacts(brief, vatRate);
  const date = new Date(brief.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <div className="doc">
      {brief.writtenBy === 'template' && editable && (
        <div className="note" style={{ marginBottom: 24 }}>
          <Icon name="brief" />
          <span>
            <span className="w5">Written from templates.</span> AI was off or unavailable, so the wording is
            plainer. Prices and timings are calculated the same way.
          </span>
        </div>
      )}
      <header className="col doc-head">
        <p className="eyebrow">
          Project brief · {brief.ref} · {date}
        </p>
        <h1 className="d-1">{brief.answers.about.business}</h1>
        <p className="t-lg muted">{brief.tags.slice(0, 2).join(' · ')}</p>
        <div className="row wrapf t-sm muted" style={{ gap: 18 }}>
          <span>Prepared for {brief.answers.about.name}</span>
          <span>By {agency}</span>
          <span className="mono">
            {f.pageCount} pages · {formatWeeks(f.weeks)} · {formatGbp(f.total)}
          </span>
        </div>
      </header>

      <Section id="summary">
        <EditableText
          as="p"
          className="t-lg measure"
          value={brief.summary}
          editable={editable}
          multiline
          maxLength={1200}
          label="Summary"
          onCommit={(v) => edit({ type: 'summary', value: v })}
        />
        <div className="row wrapf" style={{ gap: 8 }}>
          {brief.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section
        id="goals"
        action={
          editable && brief.goals.length < 6 ? (
            <AddButton label="Add goal" onClick={() => edit({ type: 'goal.add' })} />
          ) : undefined
        }
      >
        <div>
          <div className="goal goal-h">
            <span className="eyebrow">#</span>
            <span className="eyebrow">Goal</span>
            <span className="eyebrow gm hide-m">How we&rsquo;ll measure it</span>
          </div>
          {brief.goals.map((g, i) => (
            <div key={i} className="goal">
              <span className="mono brass">{i + 1}</span>
              <EditableText
                className="w5"
                value={g.goal}
                editable={editable}
                label={`Goal ${i + 1}`}
                onCommit={(v) => edit({ type: 'goal.set', index: i, goal: v, measure: g.measure })}
              />
              <span className="gm row" style={{ gap: 6, alignItems: 'flex-start' }}>
                <EditableText
                  className="t-sm muted grow"
                  value={g.measure}
                  editable={editable}
                  label={`How goal ${i + 1} is measured`}
                  onCommit={(v) => edit({ type: 'goal.set', index: i, goal: g.goal, measure: v })}
                />
                {editable && (
                  <RemoveButton
                    label={`Remove goal ${i + 1}`}
                    onClick={() => edit({ type: 'goal.remove', index: i })}
                  />
                )}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="audience">
        <div className="g2" style={{ gap: 16 }}>
          {brief.audience.map((p, i) => {
            const set = (patch: Partial<typeof p>) =>
              edit({ type: 'audience.set', index: i, ...p, ...patch });
            return (
              <div key={i} className="card aud">
                <div className="row between" style={{ gap: 8 }}>
                  <EditableText
                    className="w5"
                    value={p.name}
                    editable={editable}
                    label={`Profile ${i + 1} name`}
                    onCommit={(v) => set({ name: v })}
                  />
                  <EditableText
                    className="mono t-xs muted"
                    value={p.tag}
                    editable={editable}
                    label={`Profile ${i + 1} tag`}
                    onCommit={(v) => set({ tag: v })}
                  />
                </div>
                <EditableText
                  as="p"
                  className="t-sm muted"
                  value={p.description}
                  editable={editable}
                  label={`Profile ${i + 1} description`}
                  onCommit={(v) => set({ description: v })}
                />
                <ul className="t-sm col" style={{ gap: 4 }}>
                  {p.needs.map((n, j) => (
                    <li key={j} className="row" style={{ gap: 6 }}>
                      <span aria-hidden="true">·</span>
                      <EditableText
                        className="grow"
                        value={n}
                        editable={editable}
                        label={`Profile ${i + 1} need ${j + 1}`}
                        onCommit={(v) => set({ needs: p.needs.map((x, k) => (k === j ? v : x)) })}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="sitemap"
        action={
          editable ? (
            <AddButton
              label="Add page"
              onClick={() => edit({ type: 'page.add', label: `New page ${brief.pages.length + 1}` })}
            />
          ) : undefined
        }
      >
        <SitemapTree
          pages={brief.pages}
          editable={editable}
          onEdit={onEdit}
          label={`Sitemap · ${brief.pages.length} pages`}
        />
      </Section>

      <Section
        id="features"
        action={
          editable ? (
            <AddButton
              label="Add feature"
              onClick={() => edit({ type: 'feature.add', label: 'New feature', priority: 'Could' })}
            />
          ) : undefined
        }
      >
        <FeatureColumns features={brief.features} editable={editable} onEdit={onEdit} />
      </Section>

      <Section id="platform">
        <div className="split" style={{ gap: 32 }}>
          <div className="col grow" style={{ gap: 10, flex: '1 1 0' }}>
            <EditableText
              as="p"
              className="d-3 it platform-name"
              value={brief.platform.label}
              editable={editable}
              label="Platform"
              onCommit={(v) => edit({ type: 'platform.set', label: v, reasons: brief.platform.reasons })}
            />
            <ul className="col t-sm" style={{ gap: 8 }}>
              {brief.platform.reasons.map((r, i) => (
                <li key={i} className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                  <Icon name="check" size="sm" className="brass reason-tick" />
                  <EditableText
                    className="grow"
                    value={r}
                    editable={editable}
                    label={`Reason ${i + 1}`}
                    onCommit={(v) =>
                      edit({
                        type: 'platform.set',
                        label: brief.platform.label,
                        reasons: brief.platform.reasons.map((x, k) => (k === i ? v : x)),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
          {brief.platform.alternatives.length > 0 && (
            <div className="sunk alts">
              <p className="eyebrow">Also considered</p>
              {brief.platform.alternatives.map((a) => (
                <p key={a.name} className="t-sm">
                  <span className="w5">{a.name}</span> <span className="muted">· {a.note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section id="content">
        <div>
          {brief.content.map((c) => {
            const s = CONTENT_ICON[c.state]!;
            return (
              <div key={c.id} className="ck">
                <Icon name={s.icon} />
                <span>
                  {c.label}
                  {c.note && <span className="t-sm muted"> · {c.note}</span>}
                </span>
                {editable ? (
                  <button
                    type="button"
                    className={`${s.cls} st-btn`}
                    aria-label={`${c.label}: ${s.label}. Change status`}
                    onClick={() => edit({ type: 'content.state', id: c.id, state: NEXT_STATE[c.state] })}
                  >
                    {s.label}
                  </button>
                ) : (
                  <span className={s.cls}>{s.label}</span>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section
        id="timeline"
        action={
          <span className="mono">
            <span className="brass w5">{f.weeks}</span> weeks
          </span>
        }
      >
        <TimelineChart
          phases={brief.phases}
          launchId={brief.answers.budget.launch}
          editable={editable}
          onEdit={onEdit}
        />
      </Section>

      <Section
        id="quote"
        action={
          editable && quoteHref ? (
            <ButtonLink href={quoteHref} variant="ghost" size="sm" iconAfter="arrowRight">
              Open quote editor
            </ButtonLink>
          ) : undefined
        }
      >
        <QuoteSummary quote={brief.quote} vatRate={vatRate} agency={agency} />
      </Section>

      <Section
        id="risks"
        action={
          editable ? <AddButton label="Add risk" onClick={() => edit({ type: 'risk.add' })} /> : undefined
        }
      >
        <div className="col" style={{ gap: 10 }}>
          {brief.risks.length === 0 && <p className="t-sm muted">No risks flagged.</p>}
          {brief.risks.map((r, i) => (
            <div key={r.id} className={i === 0 ? 'note note-brass' : 'note'}>
              <Icon name="alert" />
              <span className="col grow" style={{ gap: 2 }}>
                <EditableText
                  className="w5"
                  value={r.title}
                  editable={editable}
                  label={`Risk ${i + 1}`}
                  onCommit={(v) => edit({ type: 'risk.set', id: r.id, title: v, detail: r.detail })}
                />
                <EditableText
                  value={r.detail}
                  editable={editable}
                  label={`Risk ${i + 1} detail`}
                  onCommit={(v) => edit({ type: 'risk.set', id: r.id, title: r.title, detail: v })}
                />
              </span>
              {editable && (
                <RemoveButton
                  label={`Remove risk ${i + 1}`}
                  onClick={() => edit({ type: 'risk.remove', id: r.id })}
                />
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="questions"
        action={
          editable ? (
            <AddButton label="Add question" onClick={() => edit({ type: 'question.add' })} />
          ) : undefined
        }
      >
        <ol className="col">
          {brief.questions.map((q, i) => (
            <li key={i} className="row rb qrow">
              <span className="mono brass">Q{i + 1}</span>
              <EditableText
                className="grow"
                value={q}
                editable={editable}
                label={`Question ${i + 1}`}
                onCommit={(v) => edit({ type: 'question.set', index: i, value: v })}
              />
              {editable && (
                <RemoveButton
                  label={`Remove question ${i + 1}`}
                  onClick={() => edit({ type: 'question.remove', index: i })}
                />
              )}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
}
