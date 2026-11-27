'use client';

import { useState } from 'react';
import type { Edit } from '@/lib/brief-edit/edits';
import type { Page } from '@/lib/domain/brief';
import { Icon } from '../icons';
import { Button } from '../ui/button';
import { cx } from '../ui/cx';

/**
 * The blueprint sitemap. Read-only it simply draws in; editable, a page can be selected (click or
 * Enter), renamed in place, moved left or right, dragged, removed, and new pages added.
 */
export function SitemapTree({
  pages,
  editable,
  onEdit,
  label,
}: {
  pages: Page[];
  editable: boolean;
  onEdit?: (e: Edit) => void;
  label: string;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [home, ...rest] = pages;
  const selected = pages.find((p) => p.id === sel);
  const selIndex = pages.findIndex((p) => p.id === sel);

  const finishRename = (p: Page) => {
    const v = name.trim();
    if (v && v !== p.label) onEdit?.({ type: 'page.rename', id: p.id, label: v });
    setRenaming(null);
  };

  return (
    <div className="col" style={{ gap: 12 }}>
      <div className="bp paper-grid">
        <span className="bp-label">{label}</span>
        <div className="tree">
          {home && (
            <span className="node root" style={{ ['--d' as string]: '0ms' }}>
              {home.label}
              <span className="nid">01</span>
            </span>
          )}
          <span className="vstem" style={{ ['--d' as string]: '120ms' }} />
          <div className="kids">
            {rest.map((p, i) => {
              const d = `${200 + i * 80}ms`;
              const nid = String(i + 2).padStart(2, '0');
              return (
                <div
                  key={p.id}
                  className={cx('kid', drag && drag !== p.id && 'drop-ok')}
                  style={{ ['--d' as string]: d }}
                  onDragOver={editable ? (e) => e.preventDefault() : undefined}
                  onDrop={
                    editable
                      ? (e) => {
                          e.preventDefault();
                          if (drag && drag !== p.id) onEdit?.({ type: 'page.move', id: drag, to: i + 1 });
                          setDrag(null);
                        }
                      : undefined
                  }
                >
                  {renaming === p.id ? (
                    <span className="node sel">
                      <input
                        autoFocus
                        aria-label={`Rename ${p.label}`}
                        value={name}
                        maxLength={60}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => finishRename(p)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishRename(p);
                          if (e.key === 'Escape') setRenaming(null);
                        }}
                      />
                      <span className="nid">{nid}</span>
                    </span>
                  ) : editable ? (
                    <button
                      type="button"
                      className={cx('node', sel === p.id && 'sel')}
                      style={{ ['--d' as string]: d }}
                      aria-pressed={sel === p.id}
                      draggable
                      onDragStart={() => setDrag(p.id)}
                      onDragEnd={() => setDrag(null)}
                      onClick={() => setSel(sel === p.id ? null : p.id)}
                      onDoubleClick={() => {
                        setName(p.label);
                        setRenaming(p.id);
                      }}
                    >
                      {p.label}
                      <span className="nid">{nid}</span>
                    </button>
                  ) : (
                    <span className="node" style={{ ['--d' as string]: d }}>
                      {p.label}
                      <span className="nid">{nid}</span>
                    </span>
                  )}
                  {p.sections.length > 0 && (
                    <div className="subs">
                      <span className="vstem" style={{ ['--d' as string]: '700ms' }} />
                      <span className="node sub" style={{ ['--d' as string]: '760ms' }}>
                        {p.sections.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {editable && selected && selIndex > 0 && (
        <div className="nodebar a-in-y" role="toolbar" aria-label={`Actions for ${selected.label}`}>
          <span className="t-sm">
            <span className="muted">Selected:</span> <span className="w5">{selected.label}</span>
          </span>
          <span className="grow" />
          <Button
            size="sm"
            variant="ghost"
            icon="edit"
            onClick={() => {
              setName(selected.label);
              setRenaming(selected.id);
            }}
          >
            Rename
          </Button>
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon="arrowLeft"
            aria-label="Move page left"
            disabled={selIndex <= 1}
            onClick={() => onEdit?.({ type: 'page.move', id: selected.id, to: selIndex - 1 })}
          />
          <Button
            size="sm"
            variant="ghost"
            iconOnly
            icon="arrowRight"
            aria-label="Move page right"
            disabled={selIndex >= pages.length - 1}
            onClick={() => onEdit?.({ type: 'page.move', id: selected.id, to: selIndex + 1 })}
          />
          <Button
            size="sm"
            variant="ghost"
            className="danger-text"
            onClick={() => {
              onEdit?.({ type: 'page.remove', id: selected.id });
              setSel(null);
            }}
          >
            Remove
          </Button>
        </div>
      )}
      {editable && (
        <p className="t-xs muted row" style={{ gap: 6 }}>
          <Icon name="info" size="sm" />
          Select a page to rename or move it, or drag pages to reorder. Changing pages updates the estimate.
        </p>
      )}
    </div>
  );
}
