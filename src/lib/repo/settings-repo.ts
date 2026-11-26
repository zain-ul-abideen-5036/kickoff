import { parseSettings, type Settings } from '@/lib/domain/settings';
import type { Store } from '@/lib/store';

const KEY = 'settings.json';

export async function loadSettings(store: Store): Promise<Settings> {
  return parseSettings(await store.getJSON(KEY));
}

export async function saveSettings(store: Store, settings: Settings): Promise<Settings> {
  const clean = parseSettings(settings);
  await store.putJSON(KEY, clean);
  return clean;
}
