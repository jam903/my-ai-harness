// App shell: API key, model picker, subject/topic/focus, and the Learn | Quiz | Chat tabs (ADR-0004).
import './style.css';
import { DEFAULT_MODEL, fetchModelIds } from './openrouter';
import { forgetKey, loadKey, loadModel, loadPref, saveKey, saveModel, savePref } from './storage';
import { isSubjectId, MIXED, SUBJECT_IDS, SUBJECTS, topicsFor, type SubjectId } from './dat/topics';
import { learnSystemPrompt, type StudyContext } from './dat/prompts';
import { mountConversation } from './ui/conversation';
import { mountQuiz } from './ui/quiz';
import { byId, el } from './ui/dom';

const keyArea = byId<HTMLDivElement>('key-area');
const modelInput = byId<HTMLInputElement>('model');
const modelList = byId<HTMLDataListElement>('model-list');
const subjectSelect = byId<HTMLSelectElement>('subject');
const topicSelect = byId<HTMLSelectElement>('topic');
const focusInput = byId<HTMLInputElement>('focus');
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

// ── Subject / topic / focus (ADR-0004 QST-TOPICS C) ────────────────────────
for (const id of SUBJECT_IDS) subjectSelect.append(new Option(SUBJECTS[id].label, id));
const savedSubject = loadPref('subject');
subjectSelect.value = isSubjectId(savedSubject) ? savedSubject : 'biology';

function fillTopics(subject: SubjectId, selected?: string | null) {
  topicSelect.replaceChildren(...[MIXED, ...topicsFor(subject)].map((t) => new Option(t, t)));
  topicSelect.value = selected && [MIXED, ...topicsFor(subject)].includes(selected) ? selected : MIXED;
}
fillTopics(subjectSelect.value as SubjectId, loadPref('topic'));

const context = (): StudyContext => ({
  subject: subjectSelect.value as SubjectId,
  topic: topicSelect.value,
  focus: focusInput.value,
});

// ── Tabs ───────────────────────────────────────────────────────────────────
const getKey = () => apiKey;
const getModel = () => modelInput.value;

const learn = mountConversation(byId('panel-learn'), {
  getKey,
  getModel,
  getSystemPrompt: () => learnSystemPrompt(context()),
  placeholder: 'Ask about a concept, e.g. "How does the electron transport chain make ATP?"',
  emptyHint:
    'Ask about any concept in the subject and topic above. New concepts are explained as Big idea → Step by step → Example → Common DAT trap → Check yourself.',
});
const quiz = mountQuiz(byId('panel-quiz'), { getKey, getModel, getContext: context });
mountConversation(byId('panel-chat'), {
  getKey,
  getModel,
  placeholder: 'Type a message — Enter to send, Shift+Enter for a newline',
  emptyHint: 'Plain chat with the selected model — no DAT tutor instructions.',
});

function onScopeChange() {
  savePref('subject', subjectSelect.value);
  savePref('topic', topicSelect.value);
  const label = `${SUBJECTS[subjectSelect.value as SubjectId].label} · ${topicSelect.value}`;
  learn.reset(`Now studying ${label}. Ask about any concept.`);
  quiz.reset(`Now quizzing ${label}. Press Start quiz.`);
}
subjectSelect.addEventListener('change', () => {
  fillTopics(subjectSelect.value as SubjectId);
  onScopeChange();
});
topicSelect.addEventListener('change', onScopeChange);

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
