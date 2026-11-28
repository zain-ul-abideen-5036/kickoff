'use client';

import { useActionState } from 'react';
import { saveRateCard } from '@/app/(app)/settings/actions';
import type { RateCard } from '@/lib/domain/rate-card';
import { FEATURE_FIELDS, PLATFORM_FIELDS } from '@/lib/settings/forms';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { Group, UnitRow } from './fields';
import { submitKeepingValues, useResultToast } from './use-result-toast';

export function RateCardForm({ rateCard }: { rateCard: RateCard }) {
  const [state, action, pending] = useActionState(saveRateCard, {});
  useResultToast(state);
  const e = state.fieldErrors ?? {};
  return (
    <form onSubmit={submitKeepingValues(action)} noValidate>
      <div className="set-head">
        <h1 className="d-2">Rate card</h1>
        <p className="muted">
          Every estimate is built from these numbers. AI only suggests which items apply.
        </p>
      </div>
      <div className="note note-brass" style={{ marginBottom: 8 }}>
        <Icon name="lock" />
        <span>
          <span className="w5">Your rates decide the price.</span> Changes apply to new briefs; existing
          quotes keep their figures until you edit them.
        </span>
      </div>

      <Group title="Platform bases" hint="One per project, chosen by the brief's platform rule.">
        {PLATFORM_FIELDS.map((p) => (
          <UnitRow
            key={p.name}
            label={p.label}
            name={p.name}
            prefix="£"
            defaultValue={rateCard.platforms[p.id]}
            error={e[p.name]}
          />
        ))}
      </Group>

      <Group title="Pages" hint="Multiplied by the number of pages in the sitemap.">
        <UnitRow
          label="Price per page"
          name="perPage"
          prefix="£"
          defaultValue={rateCard.perPage}
          error={e.perPage}
        />
      </Group>

      <Group title="Features" hint="Added when the client chooses the feature. Leave at 0 if it's included.">
        {FEATURE_FIELDS.map((f) => (
          <UnitRow
            key={f.name}
            label={f.label}
            name={f.name}
            prefix="£"
            defaultValue={rateCard.features[f.id]}
            error={e[f.name]}
          />
        ))}
      </Group>

      <Group title="Extras" hint="Added by rule: product count, the Google goal, and text that isn't ready.">
        <UnitRow
          label="Product setup, per 10 products beyond 10"
          name="shopPer10Products"
          prefix="£"
          defaultValue={rateCard.shopPer10Products}
          error={e.shopPer10Products}
        />
        <UnitRow label="SEO setup" name="seo" prefix="£" defaultValue={rateCard.seo} error={e.seo} />
        <UnitRow
          label="Copywriting support"
          name="copywriting"
          prefix="£"
          defaultValue={rateCard.copywriting}
          error={e.copywriting}
        />
      </Group>

      <Group title="VAT" hint="Used when you turn VAT on in a quote.">
        <UnitRow
          label="VAT rate"
          name="vatPercent"
          suffix="%"
          inputMode="decimal"
          defaultValue={Math.round(rateCard.vatRate * 10000) / 100}
          error={e.vatPercent}
        />
      </Group>

      <div className="set-actions">
        <Button type="submit" variant="primary" loading={pending} icon="check">
          Save rate card
        </Button>
      </div>
    </form>
  );
}
