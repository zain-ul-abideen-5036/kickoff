/** Runs once when the server starts: report configuration problems early and clearly. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { checkEnv } = await import('./lib/server/env-check');
  const { errors, notes } = checkEnv();
  for (const n of notes) console.info(`[kickoff] ${n}`);
  for (const e of errors) console.error(`[kickoff] ${e}`);
}
