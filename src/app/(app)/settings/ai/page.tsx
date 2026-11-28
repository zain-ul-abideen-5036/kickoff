import type { Metadata } from 'next';
import { AiForm, PasswordForm } from '@/components/settings/ai-form';
import { aiConfigFromEnv } from '@/lib/ai/writer';
import { getSettings } from '@/lib/server/context';

export const metadata: Metadata = { title: 'AI and privacy · Settings' };

export default async function AiPage() {
  const settings = await getSettings();
  const ai = aiConfigFromEnv();
  return (
    <>
      <AiForm
        enabled={settings.ai.enabled}
        keyConfigured={!!ai.apiKey}
        model={ai.model ?? 'gemini-2.5-flash'}
      />
      <PasswordForm />
    </>
  );
}
