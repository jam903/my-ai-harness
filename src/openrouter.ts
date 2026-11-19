// OpenRouter client — pure request/response logic, kept DOM-free so it can be tested.
// The API key is passed in per call and only ever sent to OPENROUTER_BASE (ADR-0002).

export type Role = 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatReply {
  content: string;
  /** The model that actually answered (with openrouter/auto this differs from the one requested). */
  model: string;
}

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
export const DEFAULT_MODEL = 'openrouter/auto';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function buildChatRequest(model: string, messages: ChatMessage[]) {
  return {
    model: model.trim() || DEFAULT_MODEL,
    messages: messages.map(({ role, content }) => ({ role, content })),
  };
}

function errorMessageFrom(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'error' in body) {
    const err = (body as { error: unknown }).error;
    if (err && typeof err === 'object' && 'message' in err) {
      const msg = (err as { message: unknown }).message;
      if (typeof msg === 'string' && msg) return msg;
    }
  }
  return undefined;
}

/** Turn an HTTP failure into a message a person can act on. */
export function describeError(status: number, body: unknown): string {
  const detail = errorMessageFrom(body);
  switch (status) {
    case 401:
      return 'OpenRouter rejected the API key (401). Check it, or click "Forget key" and paste a new one.';
    case 402:
      return 'Your OpenRouter account or key is out of credits (402). Add credits or raise the key limit at openrouter.ai.';
    case 429:
      return 'Rate limited by OpenRouter (429). Wait a moment and try again.';
    default:
      return detail ? `OpenRouter error (${status}): ${detail}` : `OpenRouter error (HTTP ${status}).`;
  }
}

/** Extract the assistant reply from a successful chat-completions body. */
export function parseChatResponse(body: unknown): ChatReply {
  const detail = errorMessageFrom(body);
  if (detail) throw new Error(`OpenRouter error: ${detail}`);

  const b = body as { model?: unknown; choices?: Array<{ message?: { content?: unknown } }> };
  const choice = b?.choices?.[0];
  if (!choice) throw new Error('OpenRouter returned no reply.');

  const content = typeof choice.message?.content === 'string' ? choice.message.content : '';
  return {
    content: content || '(empty reply)',
    model: typeof b.model === 'string' ? b.model : 'unknown model',
  };
}

export async function sendChat(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  fetchImpl: FetchLike = fetch,
): Promise<ChatReply> {
  const res = await fetchImpl(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildChatRequest(model, messages)),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // non-JSON body; fall through with null
  }
  if (!res.ok) throw new Error(describeError(res.status, body));
  return parseChatResponse(body);
}

/** Public model list (no key needed) — used only for picker suggestions. */
export async function fetchModelIds(fetchImpl: FetchLike = fetch): Promise<string[]> {
  const res = await fetchImpl(`${OPENROUTER_BASE}/models`);
  if (!res.ok) return [];
  const body = (await res.json()) as { data?: Array<{ id?: unknown }> };
  return (body.data ?? [])
    .map((m) => m.id)
    .filter((id): id is string => typeof id === 'string')
    .sort();
}
