/**
 * Checks the environment at server start and explains, in plain words, what is missing.
 * Required settings stop a production deployment from running half-configured; optional ones
 * just turn a feature off.
 */
export interface EnvReport {
  errors: string[];
  notes: string[];
}

export function checkEnv(env: Record<string, string | undefined> = process.env): EnvReport {
  const errors: string[] = [];
  const notes: string[] = [];
  const onVercel = !!env.VERCEL;

  if (onVercel) {
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)
      errors.push('SESSION_SECRET must be at least 32 random characters.');
    if (!env.BLOB_READ_WRITE_TOKEN)
      errors.push('BLOB_READ_WRITE_TOKEN is missing: connect a Vercel Blob store to the project.');
    if (!env.SETUP_CODE) notes.push('SETUP_CODE is not set, so first-run setup is locked until you add it.');
    if (!env.APP_URL) notes.push('APP_URL is not set, so emails and copied links use localhost.');
  }
  if (!env.GEMINI_API_KEY) notes.push('GEMINI_API_KEY is not set: briefs are written from templates.');
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM)
    notes.push('RESEND_API_KEY or EMAIL_FROM is not set: email is off; share links still work.');
  if (env.APP_URL && !/^https?:\/\/[^/]+/.test(env.APP_URL)) errors.push('APP_URL must start with https://.');
  return { errors, notes };
}
