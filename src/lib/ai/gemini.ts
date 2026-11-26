export type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export class AiError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export interface GeminiOptions {
  apiKey: string;
  model?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

/**
 * Calls Gemini's generateContent in JSON mode and returns the parsed object. Never throws for a
 * bad reply shape: callers validate and fall back to templates.
 */
export async function geminiJson(system: string, user: string, opts: GeminiOptions): Promise<unknown> {
  const model = opts.model || 'gemini-2.5-flash';
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { temperature: 0.4, responseMimeType: 'application/json', maxOutputTokens: 1200 },
        }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 20_000),
      },
    );
  } catch (e) {
    throw new AiError(`Gemini request failed: ${e instanceof Error ? e.message : String(e)}`, true);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new AiError(
      `Gemini returned ${res.status}: ${text.slice(0, 160)}`,
      res.status === 429 || res.status >= 500,
    );
  }
  const json = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const raw = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  try {
    return JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''));
  } catch {
    throw new AiError('Gemini did not return JSON', false);
  }
}
