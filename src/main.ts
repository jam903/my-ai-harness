// App shell: API key, model picker, free-text subject/topic, and the Learn | Quiz | Chat tabs
// (ADR-0004 layout; ADR-0008 user-entered subjects and topics).
import './style.css';
import { DEFAULT_MODEL, fetchModelIds } from './openrouter';
import { forgetKey, loadKey, loadModel, loadPref, saveKey, saveModel, savePref } from './storage';
import { describeScope, learnSystemPrompt, type StudyContext } from './study/prompts';
import { recentSubjects, recentTopics, rememberScope } from './study/recent';
import { mountConversation } from './ui/conversation';
import { mountQuiz } from './ui/quiz';
import { byId, el } from './ui/dom';

const keyArea = byId<HTMLDivElement>('key-area');
const modelInput = byId<HTMLInputElement>('model');
const modelList = byId<HTMLDataListElement>('model-list');
const subjectInput = byId<HTMLInputElement>('subject');
const subjectList = byId<HTMLDataListElement>('subject-list');
const topicInput = byId<HTMLInputElement>('topic');
const topicList = byId<HTMLDataListElement>('topic-list');
const studyControls = byId<HTMLDivElement>('study-controls');

let apiKey: string | null = loadKey();

// ── API key (ADR-0002) ─────────────────────────────────────────────────────
function renderKeyArea(): void {
  keyArea.replaceChildren();
  if (apiKey) {
    keyArea.append(el('span', 'key-status', `Key saved (…${apiKey.slice(-4)})`));
    const forget = el('button', 'secondary', 'Forget key');
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
    const save = el('button', 'primary', 'Save key');
    save.type = 'submit';
    form.append(field, save);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const value = field.value.trim();
      if (!value) return;
      apiKey = value;
      saveKey(value);
      renderKeyArea();
    });
    keyArea.append(form);
  }
}

// ── Model picker (ADR-0003) ────────────────────────────────────────────────
function fillDatalist(list: HTMLDataListElement, values: string[]) {
  list.replaceChildren(...values.map((v) => new Option(v, v)));
}

modelInput.value = loadModel() || DEFAULT_MODEL;
modelInput.addEventListener('change', () => saveModel(modelInput.value.trim()));
fetchModelIds()
  .then((ids) => fillDatalist(modelList, [DEFAULT_MODEL, ...ids]))
  .catch(() => {
    /* suggestions are optional; any typed model ID still works */
  });

// ── Subject / topic (ADR-0008: free text, with your previous entries suggested) ──
subjectInput.value = loadPref('study-subject') ?? '';
topicInput.value = loadPref('study-topic') ?? '';

function refreshSuggestions() {
  fillDatalist(subjectList, recentSubjects());
  fillDatalist(topicList, recentTopics(subjectInput.value));
}
refreshSuggestions();

const context = (): StudyContext => ({ subject: subjectInput.value, topic: topicInput.value });

// ── Tabs ───────────────────────────────────────────────────────────────────
const getKey = () => apiKey;
const getModel = () => modelInput.value;

const learn = mountConversation(byId('panel-learn'), {
  getKey,
  getModel,
  getSystemPrompt: () => learnSystemPrompt(context()),
  placeholder: 'Ask about a concept, e.g. "How does photosynthesis store energy?"',
  emptyHint:
    'Enter a subject (and optionally a topic) above, then ask about any concept. New concepts are explained as Big idea → Step by step → Example → Common mistake → Check yourself.',
});
const quiz = mountQuiz(byId('panel-quiz'), { getKey, getModel, getContext: context });
mountConversation(byId('panel-chat'), {
  getKey,
  getModel,
  placeholder: 'Type a message — Enter to send, Shift+Enter for a newline',
  emptyHint: 'Plain chat with the selected model — no tutor instructions.',
});

// `change` fires when you leave the field or press Enter, not on every keystroke.
let lastScope = `${subjectInput.value.trim()}\n${topicInput.value.trim()}`;
function onScopeChange() {
  const scope = `${subjectInput.value.trim()}\n${topicInput.value.trim()}`;
  if (scope === lastScope) return;
  lastScope = scope;
  savePref('study-subject', subjectInput.value.trim());
  savePref('study-topic', topicInput.value.trim());
  rememberScope(subjectInput.value, topicInput.value);
  refreshSuggestions();
  const label = describeScope(context());
  learn.reset(label ? `Now studying ${label}. Ask about any concept.` : undefined);
  quiz.reset(label ? `Now quizzing ${label}. Press Start quiz.` : undefined);
}
subjectInput.addEventListener('change', onScopeChange);
topicInput.addEventListener('change', onScopeChange);
subjectInput.addEventListener('input', () => fillDatalist(topicList, recentTopics(subjectInput.value)));

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
function selectTab(name: string) {
  for (const tab of tabs) {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(active));
    byId(`panel-${tab.dataset.tab}`).hidden = !active;
  }
  studyControls.hidden = name === 'chat';
  savePref('tab', name);
}
for (const tab of tabs) tab.addEventListener('click', () => selectTab(tab.dataset.tab!));
const savedTab = loadPref('tab');
selectTab(savedTab && tabs.some((t) => t.dataset.tab === savedTab) ? savedTab : 'learn');

renderKeyArea();
