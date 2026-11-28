'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { removeLogo, saveBranding, uploadLogo, type SettingsState } from '@/app/(app)/settings/actions';
import { Icon } from '../icons';
import { AgencyMark } from '../ui/brand';
import { Button } from '../ui/button';
import { Segmented } from '../ui/choices';
import { TextField } from '../ui/field';
import { useToast } from '../ui/toast';
import { brandColorCheck, normaliseHex } from '@/lib/settings/contrast';

const SWATCHES = [
  ['#1F3B34', 'Forest'],
  ['#3B2C55', 'Plum'],
  ['#6E2C2C', 'Oxblood'],
  ['#15173A', 'Ink navy'],
] as const;

export interface BrandingProps {
  name: string;
  replyTo: string;
  brandColor: string;
  accent: 'brass' | 'brand';
  logoUrl: string | null;
}

/** Shows a toast once per new action result. */
function useResultToast(state: SettingsState) {
  const toast = useToast();
  const last = useRef<SettingsState | null>(null);
  useEffect(() => {
    if (state === last.current) return;
    last.current = state;
    if (state.ok) toast.show(state.ok);
    else if (state.error) toast.show(state.error, { tone: 'error' });
  }, [state, toast]);
}

function Pin({ n }: { n: number }) {
  return (
    <span className="pin" aria-hidden="true">
      {n}
    </span>
  );
}

export function BrandingForm(props: BrandingProps) {
  const [state, action, pending] = useActionState(saveBranding, {});
  const [logoState, logoAction, logoPending] = useActionState(uploadLogo, {});
  const [removing, setRemoving] = useState(false);
  const toast = useToast();
  const [name, setName] = useState(props.name);
  const [hex, setHex] = useState(props.brandColor);
  const [accent, setAccent] = useState<'brass' | 'brand'>(props.accent);
  useResultToast(state);
  useResultToast(logoState);

  const color = normaliseHex(hex) ?? props.brandColor;
  const check = brandColorCheck(hex);
  const e = state.fieldErrors ?? {};
  const accentColor = accent === 'brand' && check.ok ? color : 'var(--brass)';

  return (
    <div>
      <div className="set-head">
        <h1 className="d-2">Branding</h1>
        <p className="muted">Clients see your logo and colours on the intake, the shared link and the PDF.</p>
      </div>

      <section className="set-grp" aria-labelledby="logo-h">
        <div className="set-grp-l">
          <h2 className="label" id="logo-h">
            Logo
          </h2>
          <span className="hint">PNG, JPEG or WebP, up to 256 KB. Shown at 36px high.</span>
        </div>
        <form action={logoAction} className="set-drop">
          <AgencyMark name={name || 'Studio'} color={color} logoUrl={props.logoUrl} size={56} />
          <div className="col grow" style={{ gap: 6, minWidth: 200 }}>
            <label className="label" htmlFor="logo-file">
              {props.logoUrl ? 'Replace logo' : 'Upload a logo'}
            </label>
            <input
              id="logo-file"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="t-sm"
            />
            {logoState.error && (
              <span className="err-msg" role="alert">
                {logoState.error}
              </span>
            )}
          </div>
          <Button type="submit" size="sm" icon="upload" loading={logoPending}>
            Upload
          </Button>
          {props.logoUrl && (
            <Button
              size="sm"
              variant="quiet"
              loading={removing}
              onClick={async () => {
                setRemoving(true);
                const r = await removeLogo();
                setRemoving(false);
                if (r.ok) toast.show(r.ok);
              }}
            >
              Remove
            </Button>
          )}
        </form>
      </section>

      <form action={action} noValidate>
        <section className="set-grp" aria-labelledby="colour-h">
          <div className="set-grp-l">
            <h2 className="label" id="colour-h">
              Brand colour
            </h2>
            <span className="hint">Logo tile, PDF cover band and welcome rule.</span>
          </div>
          <div className="col" style={{ gap: 12 }}>
            <div className="row wrapf" style={{ gap: 10 }} role="group" aria-labelledby="colour-h">
              {SWATCHES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className="set-swatch"
                  style={{ background: value }}
                  aria-pressed={color === value}
                  aria-label={label}
                  onClick={() => setHex(value)}
                />
              ))}
              <div style={{ width: 150 }}>
                <TextField
                  label="Hex"
                  name="brandColor"
                  value={hex}
                  onChange={(ev) => setHex(ev.target.value)}
                  className="mono"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>
            <span className={check.ok ? 'ok-msg' : 'err-msg'} role="status">
              <Icon name={check.ok ? 'check' : 'info'} size="sm" />
              {e.brandColor && !check.ok ? e.brandColor : check.message}
            </span>
          </div>
        </section>

        <section className="set-grp" aria-labelledby="accent-h">
          <div className="set-grp-l">
            <h2 className="label" id="accent-h">
              Accent
            </h2>
            <span className="hint">Buttons, the active step and key figures.</span>
          </div>
          <div className="col" style={{ gap: 8 }}>
            <input type="hidden" name="accent" value={accent} />
            <Segmented
              label="Accent"
              hideLabel
              fillMobile={false}
              options={[
                { id: 'brass', label: 'Kickoff brass' },
                { id: 'brand', label: 'Use brand colour' },
              ]}
              value={accent}
              onChange={setAccent}
            />
            <span className="hint">
              Accents must reach 4.5:1 with ivory text, so a pale brand colour keeps brass.
            </span>
          </div>
        </section>

        <section className="set-grp" aria-labelledby="details-h">
          <div className="set-grp-l">
            <h2 className="label" id="details-h">
              Studio details
            </h2>
            <span className="hint">Shown to clients and used as the reply address on emails.</span>
          </div>
          <div className="g2" style={{ gap: 16 }}>
            <TextField
              label="Studio name"
              name="name"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              error={e.name}
              autoComplete="organization"
            />
            <TextField
              label="Reply-to email"
              name="replyTo"
              type="email"
              defaultValue={props.replyTo}
              error={e.replyTo}
              optional
              autoComplete="email"
            />
          </div>
        </section>

        <section className="set-grp" aria-labelledby="preview-h">
          <div className="set-grp-l">
            <h2 className="label" id="preview-h">
              Live preview
            </h2>
            <span className="hint">Updates as you change the settings above.</span>
          </div>
          <div className="col" style={{ gap: 14 }}>
            <div className="set-preview" aria-hidden="true">
              <figure className="col" style={{ gap: 8, margin: 0 }}>
                <div className="card float" style={{ overflow: 'hidden' }}>
                  <div style={{ height: 4, background: color }} />
                  <div className="row rb" style={{ gap: 8, padding: '10px 14px' }}>
                    <AgencyMark name={name || 'Studio'} color={color} logoUrl={props.logoUrl} size={24} />
                    <span className="t-sm w5">{name || 'Your studio'}</span>
                    <span style={{ marginLeft: 'auto' }}>
                      <Pin n={1} />
                    </span>
                  </div>
                  <div className="paper-grid col" style={{ padding: '22px 16px', gap: 10 }}>
                    <p className="serif" style={{ fontSize: 24, lineHeight: 1.1 }}>
                      Tell us about your project
                    </p>
                    <p className="t-xs muted">It takes about 5 minutes.</p>
                    <span className="row" style={{ gap: 8 }}>
                      <span
                        className="btn btn-sm"
                        style={{ background: accentColor, color: 'var(--on-brass)', pointerEvents: 'none' }}
                      >
                        Start my brief
                      </span>
                      <Pin n={3} />
                    </span>
                  </div>
                </div>
                <figcaption className="t-xs muted">Client intake welcome</figcaption>
              </figure>
              <figure className="col" style={{ gap: 8, margin: 0 }}>
                <div className="card float col set-cover">
                  <div className="row between" style={{ background: color, padding: 16 }}>
                    <AgencyMark
                      name={name || 'Studio'}
                      color={color}
                      logoUrl={props.logoUrl}
                      size={26}
                      inverted
                    />
                    <Pin n={2} />
                  </div>
                  <div className="col" style={{ padding: 16, gap: 6, flex: 1 }}>
                    <span className="eyebrow">Project brief</span>
                    <span className="serif" style={{ fontSize: 22 }}>
                      Ember &amp; Oak
                    </span>
                    <span className="t-xs muted">Prepared by {name || 'your studio'}</span>
                  </div>
                </div>
                <figcaption className="t-xs muted">PDF cover</figcaption>
              </figure>
            </div>
            <div className="row wrapf t-xs muted" style={{ gap: 16 }}>
              <span className="row" style={{ gap: 6 }}>
                <Pin n={1} />
                Your logo
              </span>
              <span className="row" style={{ gap: 6 }}>
                <Pin n={2} />
                Brand colour
              </span>
              <span className="row" style={{ gap: 6 }}>
                <Pin n={3} />
                Accent
              </span>
            </div>
          </div>
        </section>

        <div className="set-actions">
          <Button type="submit" variant="primary" loading={pending} icon="check">
            Save branding
          </Button>
          {Object.keys(e).length > 0 && (
            <span className="err-msg" role="alert">
              {Object.keys(e).length === 1 ? 'One setting needs' : 'Some settings need'} a quick look.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
