import { SettingsSchema, parseSettings, type Settings } from '@/lib/domain/settings';
import type { Store } from '@/lib/store';

const KEY = 'settings.json';

export async function loadSettings(store: Store): Promise<Settings> {
  return parseSettings(await store.getJSON(KEY));
}

/** Saves strictly: invalid settings throw rather than silently falling back to defaults. */
export async function saveSettings(store: Store, settings: Settings): Promise<Settings> {
  const clean = SettingsSchema.parse(settings);
  await store.putJSON(KEY, clean);
  return clean;
}
