// A chat conversation panel, shared by the Learn tab (with the tutor prompt) and the Chat tab (without).
// Supports resume (ADR-0010): the history can be restored and every change is reported.
import { sendChat, type ChatMessage } from '../openrouter';
import { renderMarkdown } from '../markdown';
import { el } from './dom';

export interface StoredMessage extends ChatMessage {
  /** The model that answered (assistant messages only), shown as the bubble label. */
  model?: string;
}

export interface ConversationDeps {
  getKey: () => string | null;
  getModel: () => string;
  /** Read at send time, so a changed scope applies to the next message. */
  getSystemPrompt?: () => string;
  placeholder: string;
  emptyHint: string;
  /** Called after each successful reply; `first` is true for the conversation's first reply. */
  onReply?: (first: boolean) => void;
  /** Called whenever the stored history changes (for resume). */
  onChange?: (history: StoredMessage[]) => void;
}

export interface Conversation {
  reset(notice?: string): void;
  restore(history: StoredMessage[]): void;
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

  let history: StoredMessage[] = [];
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
    deps.onChange?.(history);
  }

  function restore(saved: StoredMessage[]) {
    generation++;
    history = saved.filter((m) => m.role === 'user' || m.role === 'assistant');
    messagesEl.replaceChildren();
    setBusy(false);
    if (!history.length) addBubble('hint', deps.emptyHint);
    for (const m of history) addBubble(m.role === 'user' ? 'user' : 'assistant', m.content, m.role === 'user' ? 'You' : m.model);
    // Mounting reports an empty history; re-save so a second reload doesn't lose the conversation.
    deps.onChange?.(history);
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
    const first = !history.some((m) => m.role === 'assistant');
    history.push({ role: 'user', content: text });
    const userBubble = addBubble('user', text, 'You');
    input.value = '';
    setBusy(true);
    const pending = addBubble('pending', 'Thinking…');

    const system = deps.getSystemPrompt?.();
    const turns: ChatMessage[] = history.map(({ role, content }) => ({ role, content }));
    const messages: ChatMessage[] = system ? [{ role: 'system', content: system }, ...turns] : turns;

    try {
      const reply = await sendChat(key, deps.getModel(), messages);
      if (mine !== generation) return;
      history.push({ role: 'assistant', content: reply.content, model: reply.model });
      pending.remove();
      addBubble('assistant', reply.content, reply.model);
      deps.onChange?.(history);
      deps.onReply?.(first);
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
  return { reset, restore };
}
