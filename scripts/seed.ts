/**
 * Loads the sample briefs into the configured store (local ./storage, or Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set). Safe to run twice: it skips if briefs already exist.
 */
import { loadSettings } from '../src/lib/repo/settings-repo';
import { seedSampleBriefs } from '../src/lib/repo/seed';
import { getStore } from '../src/lib/store';

const store = getStore();
const settings = await loadSettings(store);
const made = await seedSampleBriefs(store, settings);
console.info(
  made.length
    ? `Added ${made.length} sample briefs (${store.kind} store).`
    : 'Briefs already exist; nothing added.',
);
