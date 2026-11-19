// A chat conversation panel, shared by the Learn tab (with the tutor prompt) and the Chat tab (without).
import { sendChat, type ChatMessage } from '../openrouter';
import { renderMarkdown } from '../markdown';
import { el } from './dom';

export interface ConversationDeps {
  getKey: () => string | null;
  getModel: () => string;
  /** Read at send time, so a changed focus applies to the next message. */
  getSystemPrompt?: () => string;
  placeholder: string;
  emptyHint: string;
}

export interface Conversation {
  reset(notice?: string): void;
}

export function mountConversation(root: HTMLElement, deps: ConversationDeps): Conversation {
  const messagesEl = el('div', 'messages');
  messagesEl.setAttribute('aria-live', 'polite');
  const form = el('form', 'composer');
  const input = el('textarea');
  input.rows = 3;
  input.placeholder = deps.placeholder;
  const sendBtn = el('button', undefined, 'Send');
  sendBtn.type = 'submit';
  const newBtn = el('button', 'secondary', 'New');
  newBtn.type = 'button';
  newBtn.title = 'Start a new conversation';
  const buttons = el('div', 'composer-buttons');
  buttons.append(sendBtn, newBtn);
  form.append(input, buttons);
  root.append(messagesEl, form);

  let history: ChatMessage[] = [];
  let busy = false;
  let generation = 0; // bumps on reset so a late reply can't land in a new conversation

  function addBubble(kind: 'user' | 'assistant' | 'error' | 'pending' | 'hint', text: string, label?: string) {
    const bubble = el('div', `msg msg-${kind}`);
    if (label) bubble.append(el('div', 'msg-label', label));
    const body = el('div', 'msg-body');
    if (kind === 'assistant') body.innerHTML = renderMarkdown(text);
    else body.textContent = text;
    bubble.append(body);
    messagesEl.append(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function setBusy(value: boolean) {
    busy = value;
    sendBtn.disabled = value;
    input.disabled = value;
  }

  function reset(notice?: string) {
    generation++;
    history = [];
    messagesEl.replaceChildren();
    setBusy(false);
    addBubble('hint', notice ?? deps.emptyHint);
  }

  async function send() {
    const text = input.value.trim();
    if (!text || busy) return;
    const key = deps.getKey();
    if (!key) {
      addBubble('error', 'Paste your OpenRouter API key at the top first.');
      return;
    }

    messagesEl.querySelector('.msg-hint')?.remove();
    const mine = generation;
    history.push({ role: 'user', content: text });
    const userBubble = addBubble('user', text, 'You');
    input.value = '';
    setBusy(true);
    const pending = addBubble('pending', 'Thinking…');

    const system = deps.getSystemPrompt?.();
    const messages: ChatMessage[] = system ? [{ role: 'system', content: system }, ...history] : history;

    try {
      const reply = await sendChat(key, deps.getModel(), messages);
      if (mine !== generation) return;
      history.push({ role: 'assistant', content: reply.content });
      pending.remove();
      addBubble('assistant', reply.content, reply.model);
    } catch (err) {
      if (mine !== generation) return;
      // Roll back the failed turn so a retry doesn't send it twice; give the text back.
      history.pop();
      pending.remove();
      userBubble.remove();
      input.value = text;
      addBubble('error', err instanceof Error ? err.message : String(err));
    } finally {
      if (mine === generation) {
        setBusy(false);
        input.focus();
      }
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void send();
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      void send();
    }
  });
  newBtn.addEventListener('click', () => {
    reset();
    input.focus();
  });

  reset();
  return { reset };
}
