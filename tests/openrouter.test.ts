// Tests for the OpenRouter client logic (ADR-0001 gate; ADR-0002/0003 behaviors).
import { describe, expect, it } from 'vitest';
import {
  buildChatRequest,
  describeError,
  parseChatResponse,
  sendChat,
  type ChatMessage,
} from '../src/openrouter';

const convo: ChatMessage[] = [
  { role: 'user', content: 'What is metacognition?' },
  { role: 'assistant', content: 'Thinking about thinking.' },
  { role: 'user', content: 'Give an example.' },
];

describe('buildChatRequest', () => {
  it('sends the whole conversation in order, since the API is stateless', () => {
    const req = buildChatRequest('openai/gpt-4o-mini', convo);
    expect(req.messages.map((m) => m.content)).toEqual([
      'What is metacognition?',
      'Thinking about thinking.',
      'Give an example.',
    ]);
  });

  it('falls back to openrouter/auto when the model field is left blank', () => {
    expect(buildChatRequest('   ', convo).model).toBe('openrouter/auto');
  });
});

describe('parseChatResponse', () => {
  it('reports the model that actually answered, not the one requested', () => {
    // openrouter/auto routes to a concrete model and names it in `model`.
    const reply = parseChatResponse({
      model: 'anthropic/claude-x',
      choices: [{ message: { role: 'assistant', content: 'Hello' } }],
    });
    expect(reply).toEqual({ content: 'Hello', model: 'anthropic/claude-x' });
  });

  it('surfaces an error object even when it arrives in an HTTP 200 body', () => {
    expect(() =>
      parseChatResponse({ error: { code: 502, message: 'Provider returned error' } }),
    ).toThrow('Provider returned error');
  });
});

describe('describeError', () => {
  it('tells the user to check their key on 401', () => {
    expect(describeError(401, { error: { message: 'No auth credentials found' } })).toMatch(/API key/);
  });

  it('tells the user they are out of credits on 402', () => {
    expect(describeError(402, null)).toMatch(/credits/);
  });

  it("passes through OpenRouter's own message for other errors (e.g. an unknown model)", () => {
    expect(describeError(400, { error: { message: 'not-a-model is not a valid model ID' } })).toBe(
      'OpenRouter error (400): not-a-model is not a valid model ID',
    );
  });
});

describe('sendChat', () => {
  it('sends the key only to openrouter.ai, as a Bearer token (ADR-0002)', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const fakeFetch = async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({ model: 'm', choices: [{ message: { content: 'ok' } }] }),
        { status: 200 },
      );
    };

    await sendChat('sk-or-test', 'openrouter/auto', convo, fakeFetch);

    expect(calls).toHaveLength(1);
    expect(new URL(calls[0].url).origin).toBe('https://openrouter.ai');
    expect((calls[0].init?.headers as Record<string, string>).Authorization).toBe('Bearer sk-or-test');
  });

  it('turns a non-JSON error page into a readable message instead of crashing', async () => {
    const fakeFetch = async () => new Response('<html>Bad Gateway</html>', { status: 502 });
    await expect(sendChat('k', 'm', convo, fakeFetch)).rejects.toThrow('OpenRouter error (HTTP 502).');
  });
});
