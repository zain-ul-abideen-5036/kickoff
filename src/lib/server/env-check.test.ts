import { describe, expect, it } from 'vitest';
import { checkEnv } from './env-check';

const secret = 's'.repeat(40);

describe('checkEnv', () => {
  it('needs a secret and Blob storage on Vercel', () => {
    const r = checkEnv({ VERCEL: '1' });
    expect(r.errors.join(' ')).toMatch(/SESSION_SECRET/);
    expect(r.errors.join(' ')).toMatch(/BLOB_READ_WRITE_TOKEN/);
  });

  it('passes a complete production setup', () => {
    const r = checkEnv({
      VERCEL: '1',
      SESSION_SECRET: secret,
      BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x',
      SETUP_CODE: 'open-sesame',
      APP_URL: 'https://kickoff.example',
      GEMINI_API_KEY: 'k',
      RESEND_API_KEY: 'r',
      EMAIL_FROM: 'Kickoff <a@b.co>',
    });
    expect(r).toEqual({ errors: [], notes: [] });
  });

  it('treats AI and email as optional', () => {
    const r = checkEnv({
      VERCEL: '1',
      SESSION_SECRET: secret,
      BLOB_READ_WRITE_TOKEN: 'x',
      SETUP_CODE: 'c',
      APP_URL: 'https://a.b',
    });
    expect(r.errors).toEqual([]);
    expect(r.notes.join(' ')).toMatch(/templates/);
    expect(r.notes.join(' ')).toMatch(/email is off/);
  });

  it('needs nothing locally', () => {
    expect(checkEnv({}).errors).toEqual([]);
  });

  it('rejects a malformed APP_URL', () => {
    expect(checkEnv({ APP_URL: 'kickoff.example' }).errors.join(' ')).toMatch(/APP_URL/);
  });
});
