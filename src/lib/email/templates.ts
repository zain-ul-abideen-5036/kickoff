import type { Brief } from '@/lib/domain/brief';
import type { Settings } from '@/lib/domain/settings';
import { briefFacts } from '@/lib/engine/generate';
import { formatGbp, formatWeeks } from '@/lib/format';
import type { Email } from './send';

/** Escapes text for HTML email bodies. */
export function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

/** A plain, branded email shell that renders well in every client. */
function shell(settings: Settings, body: string): string {
  const brand = esc(settings.agency.brandColor);
  return `<!doctype html><html><body style="margin:0;background:#F7F5EF;font-family:Georgia,serif;color:#15173A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFDF8;border:1px solid #DDD7C9;border-radius:10px">
<tr><td style="height:4px;background:${brand};border-radius:10px 10px 0 0"></td></tr>
<tr><td style="padding:28px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6">
<p style="margin:0 0 20px;font-weight:bold">${esc(settings.agency.name)}</p>${body}
</td></tr></table>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#6B6558">Powered by Kickoff</p>
</td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#835A1E;color:#FFFDF8;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`;
}

/** To the client: their reviewed brief and estimate, with the private link. */
export function briefForClientEmail(
  brief: Brief,
  settings: Settings,
  shareUrl: string,
  message?: string,
): Email {
  const f = briefFacts(brief, settings.rateCard.vatRate);
  const name = brief.answers.about.name.split(' ')[0] || brief.answers.about.name;
  const note = message?.trim() ? `<p>${esc(message.trim()).replace(/\n/g, '<br>')}</p>` : '';
  const lines = [
    `${f.pageCount} pages`,
    formatWeeks(f.weeks),
    `estimate ${formatGbp(f.total)} excluding VAT`,
  ].join(' · ');
  return {
    to: [brief.answers.about.email],
    replyTo: settings.agency.replyTo || undefined,
    subject: `Your project brief from ${settings.agency.name}`,
    html: shell(
      settings,
      `<p>Hi ${esc(name)},</p>${note}<p>Your project brief for ${esc(brief.answers.about.business)} is ready: ${esc(lines)}.</p>${button(shareUrl, 'View your brief')}<p style="color:#6B6558;font-size:13px">This private link stays open for ${settings.shareDays} days. You can approve the brief or reply to ask a question.</p>`,
    ),
    text: `Hi ${name},\n\n${message?.trim() ? `${message.trim()}\n\n` : ''}Your project brief for ${brief.answers.about.business} is ready: ${lines}.\n\nView it here: ${shareUrl}\n\nThis private link stays open for ${settings.shareDays} days.\n\n${settings.agency.name}`,
  };
}

/** To the studio: a new brief has arrived. */
export function newBriefEmail(brief: Brief, settings: Settings, briefUrl: string): Email {
  const f = briefFacts(brief, settings.rateCard.vatRate);
  const a = brief.answers.about;
  return {
    to: settings.notifications.recipients,
    subject: `New brief: ${a.business} · ${formatGbp(f.total)}`,
    html: shell(
      settings,
      `<p><strong>${esc(a.business)}</strong> (${esc(a.location)}) just finished the intake.</p><p>${esc(brief.summary)}</p><p>${f.pageCount} pages · ${esc(formatWeeks(f.weeks))} · ${esc(formatGbp(f.total))}</p>${button(briefUrl, 'Review the brief')}`,
    ),
    text: `${a.business} (${a.location}) just finished the intake.\n\n${brief.summary}\n\n${f.pageCount} pages · ${formatWeeks(f.weeks)} · ${formatGbp(f.total)}\n\nReview: ${briefUrl}`,
  };
}

/** To the studio: the client approved the brief from the shared link. */
export function approvedEmail(brief: Brief, settings: Settings, briefUrl: string): Email {
  const a = brief.answers.about;
  return {
    to: settings.notifications.recipients,
    subject: `Approved: ${a.business} brief`,
    html: shell(
      settings,
      `<p>${esc(a.name)} approved the brief for <strong>${esc(a.business)}</strong>.</p>${button(briefUrl, 'Open the brief')}`,
    ),
    text: `${a.name} approved the brief for ${a.business}.\n\nOpen: ${briefUrl}`,
  };
}
