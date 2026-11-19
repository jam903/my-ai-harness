// UI wiring for the chat (ADR-0003). All model output is inserted with textContent,
// never innerHTML — a reply must not be able to run script on a page holding the key (ADR-0002).
import './style.css';
import { DEFAULT_MODEL, fetchModelIds, sendChat, type ChatMessage } from './openrouter';
import { forgetKey, loadKey, loadModel, saveKey, saveModel } from './storage';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const keyArea = $<HTMLDivElement>('key-area');
const modelInput = $<HTMLInputElement>('model');
const modelList = $<HTMLDataListElement>('model-list');
const newChatBtn = $<HTMLButtonElement>('new-chat');
const messagesEl = $<HTMLElement>('messages');
const composer = $<HTMLFormElement>('composer');
const input = $<HTMLTextAreaElement>('input');
const sendBtn = $<HTMLButtonElement>('send');

let apiKey: string | null = loadKey();
let history: ChatMessage[] = [];
let busy = false;

// ── API key ────────────────────────────────────────────────────────────────
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderKeyArea(): void {
  keyArea.replaceChildren();
  if (apiKey) {
    keyArea.append(el('span', 'key-status', `Key saved (…${apiKey.slice(-4)})`));
    const forget = el('button', undefined, 'Forget key');
    forget.type = 'button';
    forget.addEventListener('click', () => {
      forgetKey();
      apiKey = null;
      renderKeyArea();
    });
    keyArea.append(forget);
  } else {
    const form = el('form', 'key-form');
    const field = el('input');
    field.type = 'password';
    field.placeholder = 'Paste your OpenRouter API key (sk-or-…)';
    field.autocomplete = 'off';
    field.setAttribute('aria-label', 'OpenRouter API key');
    const save = el('button', undefined, 'Save key');
    save.type = 'submit';
    form.append(field, save);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = field.value.trim();
      if (!value) return;
      apiKey = value;
      saveKey(value);
      renderKeyArea();
      input.focus();
    });
    keyArea.append(form);
  }
}

// ── Model picker ───────────────────────────────────────────────────────────
modelInput.value = loadModel() || DEFAULT_MODEL;
modelInput.addEventListener('change', () => saveModel(modelInput.value.trim()));
fetchModelIds()
  .then((ids) => {
    for (const id of [DEFAULT_MODEL, ...ids]) {
      const opt = document.createElement('option');
      opt.value = id;
      modelList.append(opt);
    }
  })
  .catch(() => {
    /* suggestions are optional; any typed model ID still works */
  });

// ── Messages ───────────────────────────────────────────────────────────────
function addBubble(kind: 'user' | 'assistant' | 'error' | 'pending', text: string, label?: string) {
  const bubble = el('div', `msg msg-${kind}`);
  if (label) bubble.append(el('div', 'msg-label', label));
  bubble.append(el('div', 'msg-body', text));
  messagesEl.append(bubble);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return bubble;
}

function setBusy(value: boolean): void {
  busy = value;
  sendBtn.disabled = value;
  input.disabled = value;
}

async function send(): Promise<void> {
  const text = input.value.trim();
  if (!text || busy) return;
  if (!apiKey) {
    addBubble('error', 'Paste your OpenRouter API key at the top first.');
    return;
  }

  const userMsg: ChatMessage = { role: 'user', content: text };
  history.push(userMsg);
  const userBubble = addBubble('user', text, 'You');
  input.value = '';
  setBusy(true);
  const pending = addBubble('pending', 'Thinking…');

  try {
    const reply = await sendChat(apiKey, modelInput.value, history);
    history.push({ role: 'assistant', content: reply.content });
    pending.remove();
    addBubble('assistant', reply.content, reply.model);
  } catch (err) {
    // Roll back the failed turn so a retry doesn't send it twice; give the text back.
    history.pop();
    pending.remove();
    userBubble.remove();
    input.value = text;
    addBubble('error', err instanceof Error ? err.message : String(err));
  } finally {
    setBusy(false);
    input.focus();
  }
}

composer.addEventListener('submit', (e) => {
  e.preventDefault();
  void send();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    void send();
  }
});

newChatBtn.addEventListener('click', () => {
  if (busy) return;
  history = [];
  messagesEl.replaceChildren();
  input.focus();
});

renderKeyArea();
