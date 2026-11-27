'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { saveQuote } from '@/app/(app)/briefs/[id]/quote/actions';
import { parseAmount, quoteOps, rateCardCatalog } from '@/lib/brief-edit/quote';
import type { Quote } from '@/lib/domain/brief';
import type { RateCard } from '@/lib/domain/rate-card';
import { lineAmount, quoteTotals } from '@/lib/engine/pricing';
import { formatGbp } from '@/lib/format';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { useToast } from '../ui/toast';

function MoneyInput({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (n: number) => void;
}) {
  const [text, setText] = useState(String(value));
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(String(value));
  }
  return (
    <span className="money">
      <span aria-hidden="true">£</span>
      <input
        aria-label={label}
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(parseAmount(text))}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </span>
  );
}

/**
 * The quote editor. Changes are local until saved, so the studio can try figures freely; the
 * total updates as they type. Every price comes from the rate card or a deliberate edit.
 */
export function QuoteEditor({
  briefId,
  business,
  refCode,
  initial,
  rates,
}: {
  briefId: string;
  business: string;
  refCode: string;
  initial: Quote;
  rates: RateCard;
}) {
  const toast = useToast();
  const [q, setQ] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const discId = useId();
  const vatId = useId();
  const t = quoteTotals(q, rates.vatRate);
  const dirty = JSON.stringify(q) !== JSON.stringify(saved);
  const catalog = rateCardCatalog(rates, q);

  const save = async () => {
    setBusy(true);
    const res = await saveQuote(briefId, q).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setSaved(q);
      toast.show(`Quote saved: ${formatGbp(res.total)}`);
    } else toast.show(res?.error ?? 'Couldn’t save. Check your connection.', { tone: 'error' });
  };

  return (
    <div className="qe-page">
      <header className="ed-top">
        <Link href={`/briefs/${briefId}`} className="btn btn-ghost btn-sm" style={{ paddingLeft: 6 }}>
          <Icon name="arrowLeft" />
          {business} brief
        </Link>
        <div className="col grow" style={{ minWidth: 0 }}>
          <span className="w5 ed-title">Quote</span>
          <span className="t-xs mono muted">{refCode}</span>
        </div>
        {dirty && <span className="t-xs muted">Unsaved changes</span>}
        <Button variant="primary" size="sm" icon="check" loading={busy} disabled={!dirty} onClick={save}>
          Save quote
        </Button>
      </header>
      <div className="qe">
        <div className="col" style={{ gap: 20, minWidth: 0 }}>
          <div className="note note-brass" role="note">
            <Icon name="lock" />
            <span>
              <span className="w5">Calculated from your rate card. AI never sets prices.</span> The brief
              suggests which items apply; every figure comes from your rates or your own edits.
            </span>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="qr qr-h eyebrow" aria-hidden="true">
              <span>Item</span>
              <span>Qty</span>
              <span className="r">Rate</span>
              <span className="r">Amount</span>
              <span />
            </div>
            {q.lines.map((l) => (
              <div key={l.id} className="qr a-in-y">
                <div className="qr-item col">
                  <span className="w5">{l.label}</span>
                  <span className="t-xs mono muted">{l.basis}</span>
                </div>
                <div className="qty" role="group" aria-label={`Quantity for ${l.label}`}>
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={l.qty <= 0}
                    onClick={() => setQ(quoteOps.setQty(q, l.id, l.qty - 1))}
                  >
                    <Icon name="minus" size="sm" />
                  </button>
                  <span className="mono" aria-live="polite">
                    {l.qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQ(quoteOps.setQty(q, l.id, l.qty + 1))}
                  >
                    <Icon name="plus" size="sm" />
                  </button>
                </div>
                <MoneyInput
                  value={l.rate}
                  label={`Rate for ${l.label}`}
                  onChange={(n) => setQ(quoteOps.setRate(q, l.id, n))}
                />
                <span className="mono r">{formatGbp(lineAmount(l))}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon rm-btn"
                  aria-label={`Remove ${l.label}`}
                  onClick={() => setQ(quoteOps.remove(q, l.id))}
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            ))}
            {q.adjustments.map((a) => (
              <div key={a.id} className="qr qr-adj a-in-y">
                <label className="qr-item">
                  <span className="sr-only">Adjustment description</span>
                  <input
                    className="input input-sm"
                    defaultValue={a.label}
                    maxLength={80}
                    onBlur={(e) =>
                      setQ(quoteOps.setAdjustment(q, a.id, { label: e.target.value.trim() || 'Adjustment' }))
                    }
                  />
                </label>
                <span className="t-xs muted">Adjustment</span>
                <MoneyInput
                  value={a.amount}
                  label="Adjustment amount"
                  onChange={(n) => setQ(quoteOps.setAdjustment(q, a.id, { amount: n }))}
                />
                <span className="mono r">{formatGbp(a.amount)}</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-icon rm-btn"
                  aria-label="Remove adjustment"
                  onClick={() => setQ(quoteOps.removeAdjustment(q, a.id))}
                >
                  <Icon name="close" size="sm" />
                </button>
              </div>
            ))}
            <div className="row" style={{ padding: '12px 16px' }}>
              <Button size="sm" variant="ghost" icon="plus" onClick={() => setQ(quoteOps.addAdjustment(q))}>
                Add adjustment
              </Button>
            </div>
          </div>
          {catalog.length > 0 && (
            <div className="card qe-cat">
              <div className="row between">
                <span className="label">Add from your rate card</span>
                <Link href="/settings/rates" className="t-sm brass">
                  Edit rate card
                </Link>
              </div>
              <div className="g2" style={{ gap: 8 }}>
                {catalog.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip qe-add"
                    onClick={() => setQ(quoteOps.add(q, c))}
                  >
                    <span className="row" style={{ gap: 8 }}>
                      <Icon name="plus" size="sm" />
                      {c.label}
                    </span>
                    <span className="mono t-sm muted">{formatGbp(c.rate)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside className="qe-side" aria-label="Quote totals">
          <div className="card float qe-sum">
            <span className="eyebrow">Summary</span>
            <div className="sum-row">
              <span>Subtotal</span>
              <span className="mono">{formatGbp(t.subtotal)}</span>
            </div>
            <div className="sum-row">
              <span>Adjustments</span>
              <span className="mono">{formatGbp(t.adjustments)}</span>
            </div>
            <div className="col rt" style={{ gap: 10, padding: '12px 0' }}>
              <div className="row between">
                <span className="t-sm" id={discId}>
                  Discount
                </span>
                <div className="seg seg-sm" role="radiogroup" aria-labelledby={discId}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={q.discount.mode === 'percent'}
                    onClick={() => setQ(quoteOps.setDiscount(q, 'percent', q.discount.value))}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={q.discount.mode === 'amount'}
                    onClick={() => setQ(quoteOps.setDiscount(q, 'amount', q.discount.value))}
                  >
                    £
                  </button>
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                <label className="grow">
                  <span className="sr-only">Discount value</span>
                  <input
                    className="input input-sm mono"
                    style={{ textAlign: 'right' }}
                    inputMode="decimal"
                    defaultValue={q.discount.value}
                    key={q.discount.mode}
                    onBlur={(e) =>
                      setQ(quoteOps.setDiscount(q, q.discount.mode, parseAmount(e.target.value)))
                    }
                  />
                </label>
                <span className="mono" style={{ width: 92, textAlign: 'right' }}>
                  {t.discount ? `−${formatGbp(t.discount)}` : formatGbp(0)}
                </span>
              </div>
            </div>
            <div className="row between rt" style={{ padding: '12px 0' }}>
              <span className="t-sm" id={vatId}>
                Add VAT ({Math.round(rates.vatRate * 100)}%)
              </span>
              <button
                type="button"
                className="switch"
                role="switch"
                aria-checked={q.vat}
                aria-labelledby={vatId}
                onClick={() => setQ(quoteOps.setVat(q, !q.vat))}
              />
            </div>
            <div className="sum-row" style={{ paddingTop: 0 }}>
              <span className="muted">VAT</span>
              <span className="mono">{formatGbp(t.vat)}</span>
            </div>
            <div className="total rt">
              <span className="w5">Total</span>
              <span className="fig" aria-live="polite">
                {formatGbp(t.total)}
              </span>
            </div>
            <p className="t-xs muted">
              {q.vat ? 'Includes VAT.' : 'Excludes VAT. Turn VAT on if your studio is registered.'}
            </p>
          </div>
          <div className="card qe-note">
            <span className="label">Client sees</span>
            <p className="t-sm muted">
              Line items and the total, labelled as calculated from your rate card. Internal notes stay
              hidden.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
