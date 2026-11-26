import type { FetchLike } from '@/lib/ai/gemini';

export interface Email {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export type SendResult =
  { sent: true; id: string } | { sent: false; reason: 'not-configured' | 'failed'; detail?: string };

export interface EmailConfig {
  apiKey?: string;
  from?: string;
  fetchImpl?: FetchLike;
}

export function emailConfigFromEnv(env: Record<string, string | undefined> = process.env): EmailConfig {
  return { apiKey: env.RESEND_API_KEY || undefined, from: env.EMAIL_FROM || undefined };
}

export function emailEnabled(config: EmailConfig): boolean {
  return !!config.apiKey && !!config.from;
}

/**
 * Sends through Resend's HTTP API. Email is optional: with no key the app still works and tells
 * the studio to share the link themselves.
 */
export async function sendEmail(email: Email, config: EmailConfig): Promise<SendResult> {
  if (!emailEnabled(config)) return { sent: false, reason: 'not-configured' };
  const recipients = email.to.filter((t) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)).slice(0, 10);
  if (recipients.length === 0) return { sent: false, reason: 'failed', detail: 'No valid recipients' };
  try {
    const res = await (config.fetchImpl ?? fetch)('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${config.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: config.from,
        to: recipients,
        subject: email.subject.slice(0, 200),
        html: email.html,
        text: email.text,
        reply_to: email.replyTo || undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { sent: false, reason: 'failed', detail: `Resend returned ${res.status}` };
    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { sent: true, id: json.id ?? '' };
  } catch (e) {
    return { sent: false, reason: 'failed', detail: e instanceof Error ? e.message : String(e) };
  }
}
