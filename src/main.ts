// App shell: API key, model picker, study scope (a curriculum subtopic or free study), and the
// Learn | Quiz | Progress | Chat tabs. ADR-0004 layout; ADR-0008 free study; ADR-0010 Phase 1
// curriculum, progress, and resume.
import './style.css';
import { DEFAULT_MODEL, fetchModelIds } from './openrouter';
import { forgetKey, loadKey, loadModel, loadPref, saveKey, saveModel } from './storage';
import { describeScope, learnSystemPrompt, type StudyContext } from './study/prompts';
import { recentSubjects, recentTopics, rememberScope } from './study/recent';
import { recordQuizResult } from './study/results';
import { DAT_CURRICULUM } from './curriculum/dat';
import { findSubtopic, pathLabel, withCustom } from './curriculum';
import { statusOf, STATUS_LABEL } from './progress/model';
import {
  addCustomSubtopic,
  addCustomTopic,
  loadProgress,
  recordAttempt,
  recordLearn,
  recordTestOut,
  removeCustom,
  saveProgress,
} from './progress/store';
import { exportFilename, exportProgress, ImportError, parseImport } from './progress/transfer';
import { loadSession, saveSession, type Scope } from './session/resume';
import { mountConversation } from './ui/conversation';
import { mountQuiz } from './ui/quiz';
import { mountProgress, type StudyMode } from './ui/progress';
import { byId, el } from './ui/dom';

const keyArea = byId<HTMLDivElement>('key-area');
const modelInput = byId<HTMLInputElement>('model');
const modelList = byId<HTMLDataListElement>('model-list');
const subjectInput = byId<HTMLInputElement>('subject');
const subjectList = byId<HTMLDataListElement>('subject-list');
const topicInput = byId<HTMLInputElement>('topic');
const topicList = byId<HTMLDataListElement>('topic-list');
const studyControls = byId<HTMLDivElement>('study-controls');
const scopeCurriculum = byId<HTMLDivElement>('scope-curriculum');
const scopeFreeform = byId<HTMLDivElement>('scope-freeform');
const scopeLabel = byId<HTMLElement>('scope-label');
const scopeStatus = byId<HTMLElement>('scope-status');
const resumeNote = byId<HTMLElement>('resume-note');

let apiKey: string | null = loadKey();
let progress = loadProgress();
const curriculum = () => withCustom(DAT_CURRICULUM, progress.custom);
const persistProgress = () => saveProgress(progress);

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

// ── Study scope: a curriculum subtopic, or free study (ADR-0010 QST-COACH-SCOPE A) ──
const session = loadSession();
let scope: Scope = session.scope ?? {
  kind: 'free',
  subject: loadPref('study-subject') ?? '',
  topic: loadPref('study-topic') ?? '',
};
if (scope.kind === 'curriculum' && !findSubtopic(curriculum(), scope.subtopicId)) scope = { kind: 'free', subject: '', topic: '' };
if (scope.kind === 'free') {
  subjectInput.value = scope.subject;
  topicInput.value = scope.topic;
}

function context(): StudyContext {
  if (scope.kind === 'curriculum') {
    const p = findSubtopic(curriculum(), scope.subtopicId);
    if (p) {
      const topic = p.subtopic.title === p.topic.title ? p.topic.title : `${p.topic.title}: ${p.subtopic.title}`;
      return { subject: `${DAT_CURRICULUM.name} ${p.subject.title}`, topic, subtopicId: p.subtopic.id };
    }
  }
  return { subject: subjectInput.value, topic: topicInput.value };
}

function scopeName(): string | null {
  if (scope.kind === 'curriculum') {
    const p = findSubtopic(curriculum(), scope.subtopicId);
    return p ? pathLabel(p) : null;
  }
  return describeScope(context());
}

function renderScope() {
  scopeCurriculum.hidden = scope.kind !== 'curriculum';
  scopeFreeform.hidden = scope.kind === 'curriculum';
  if (scope.kind === 'curriculum') {
    const p = findSubtopic(curriculum(), scope.subtopicId);
    scopeLabel.textContent = p ? pathLabel(p) : '';
    const status = statusOf(progress.records[scope.subtopicId]);
    scopeStatus.textContent = STATUS_LABEL[status];
    scopeStatus.className = `pill status-${status}`;
  }
}

function refreshSuggestions() {
  fillDatalist(subjectList, recentSubjects());
  fillDatalist(topicList, recentTopics(subjectInput.value));
}
refreshSuggestions();

// ── Tabs: Learn, Quiz, Progress, Chat ──────────────────────────────────────
const getKey = () => apiKey;
const getModel = () => modelInput.value;

const learn = mountConversation(byId('panel-learn'), {
  getKey,
  getModel,
  getSystemPrompt: () => learnSystemPrompt(context()),
  placeholder: 'Ask about a concept, e.g. "How does the ideal gas law work?"',
  emptyHint:
    'Pick a subtopic in Progress (or enter a subject above), then ask about any concept. Your tutor will teach it one small step at a time and check your understanding as you go. Say "I\'m confused" anytime to get a different explanation.',
  onReply: (first) => {
    // The first reply in a curriculum-scoped Learn conversation counts as one exposure (ADR-0011).
    if (first && scope.kind === 'curriculum') {
      recordLearn(progress, scope.subtopicId);
      persistProgress();
      renderScope();
    }
  },
  onChange: (history) => saveSession({ learn: history }),
});

function blockedReason(ctx: StudyContext): string | null {
  if (!ctx.subtopicId) return null;
  const p = findSubtopic(curriculum(), ctx.subtopicId);
  if (p?.subject.practice === 'external')
    return 'Perceptual Ability puzzles are visual, so they can’t be written as text questions. Use Learn for strategy on this subtest, and practise the puzzles in a dedicated PAT tool.';
  if (p?.subject.practice === 'passage')
    return 'Reading Comprehension practice passages are coming in a later phase. For now, Learn can coach you on reading strategy.';
  return null;
}

const quiz = mountQuiz(byId('panel-quiz'), {
  getKey,
  getModel,
  getContext: context,
  blockedReason,
  onAnswered: (ctx, correct, testOut) => {
    if (!ctx.subtopicId) {
      recordQuizResult({ subject: ctx.subject.trim(), topic: ctx.topic.trim(), correct, timestamp: Date.now() });
      return;
    }
    const { before, after } = recordAttempt(progress, ctx.subtopicId, correct, testOut ? 'testout' : 'quiz');
    persistProgress();
    renderScope();
    if (!testOut && before !== 'mastered' && after === 'mastered') {
      const p = findSubtopic(curriculum(), ctx.subtopicId);
      return `🎉 Mastered: ${p ? pathLabel(p) : 'this subtopic'}. You’ve shown it on more than one day — that’s real retention, not luck.`;
    }
  },
  onTestOutDone: (ctx, correct, total) => {
    if (!ctx.subtopicId) return '';
    const { after } = recordTestOut(progress, ctx.subtopicId, correct, total);
    persistProgress();
    renderScope();
    const name = scopeName() ?? 'this subtopic';
    return after === 'mastered'
      ? `🎉 ${correct}/${total} — ${name} is now marked Mastered. A spaced review later will check that it sticks.`
      : `${correct}/${total} on the test-out. Good to know — ${name} is now in Practicing, and the explanations above show exactly where to start.`;
  },
  onChange: (snapshot) => saveSession({ quiz: snapshot }),
});

const chat = mountConversation(byId('panel-chat'), {
  getKey,
  getModel,
  placeholder: 'Type a message — Enter to send, Shift+Enter for a newline',
  emptyHint: 'Plain chat with the selected model — no tutor instructions.',
  onChange: (history) => saveSession({ chat: history }),
});

const progressView = mountProgress(byId('panel-progress'), {
  getCurriculum: curriculum,
  getProgress: () => progress,
  onStudy: (subtopicId, mode) => studySubtopic(subtopicId, mode),
  onAddTopic: (subjectId, title) => {
    addCustomTopic(progress, subjectId, title);
    persistProgress();
    progressView.render();
  },
  onAddSubtopic: (topicId, title) => {
    addCustomSubtopic(progress, topicId, title);
    persistProgress();
    progressView.render();
  },
  onRemove: (id) => {
    removeCustom(progress, id);
    persistProgress();
    if (scope.kind === 'curriculum' && !findSubtopic(curriculum(), scope.subtopicId)) setScope({ kind: 'free', subject: '', topic: '' });
    progressView.render();
  },
  onExport: () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' });
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = exportFilename();
    a.click();
    URL.revokeObjectURL(a.href);
  },
  onImport: (file) => {
    void file.text().then((text) => {
      try {
        const imported = parseImport(text);
        if (!confirm('Replace the progress saved in this browser with this file?')) return;
        progress = imported;
        persistProgress();
        renderScope();
        progressView.render();
      } catch (err) {
        alert(err instanceof ImportError ? err.message : 'Could not read that file.');
      }
    });
  },
});

function setScope(next: Scope) {
  scope = next;
  saveSession({ scope, learn: [], quiz: null });
  renderScope();
  const label = scopeName();
  learn.reset(label ? `Now studying ${label}. Ask about any concept — or just say "teach me this from the start."` : undefined);
  quiz.reset(label ? `Now quizzing ${label}. Press Start quiz.` : undefined);
}

function studySubtopic(subtopicId: string, mode: StudyMode) {
  if (scope.kind !== 'curriculum' || scope.subtopicId !== subtopicId) setScope({ kind: 'curriculum', subtopicId });
  selectTab(mode === 'learn' ? 'learn' : 'quiz');
  if (mode === 'quiz') quiz.start();
  if (mode === 'testout') quiz.startTestOut();
}

// Free study: `change` fires when you leave the field or press Enter, not on every keystroke.
function onFreeScopeChange() {
  const next: Scope = { kind: 'free', subject: subjectInput.value.trim(), topic: topicInput.value.trim() };
  if (scope.kind === 'free' && scope.subject === next.subject && scope.topic === next.topic) return;
  rememberScope(subjectInput.value, topicInput.value);
  refreshSuggestions();
  setScope(next);
}
subjectInput.addEventListener('change', onFreeScopeChange);
topicInput.addEventListener('change', onFreeScopeChange);
subjectInput.addEventListener('input', () => fillDatalist(topicList, recentTopics(subjectInput.value)));
byId<HTMLButtonElement>('scope-free').addEventListener('click', () => {
  subjectInput.value = '';
  topicInput.value = '';
  setScope({ kind: 'free', subject: '', topic: '' });
  subjectInput.focus();
});
byId<HTMLButtonElement>('scope-browse').addEventListener('click', () => selectTab('progress'));

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
function selectTab(name: string) {
  for (const tab of tabs) {
    const active = tab.dataset.tab === name;
    tab.setAttribute('aria-selected', String(active));
    byId(`panel-${tab.dataset.tab}`).hidden = !active;
  }
  studyControls.hidden = name === 'chat' || name === 'progress';
  if (name === 'progress') progressView.render();
  saveSession({ tab: name });
}
for (const tab of tabs)
  tab.addEventListener('click', () => {
    resumeNote.hidden = true;
    selectTab(tab.dataset.tab!);
  });

// ── Resume exactly where you left off ──────────────────────────────────────
renderScope();
if (session.learn?.length) learn.restore(session.learn);
if (session.chat?.length) chat.restore(session.chat);
if (session.quiz) quiz.restore(session.quiz);
const startTab = session.tab ?? loadPref('tab') ?? 'progress';
selectTab(tabs.some((t) => t.dataset.tab === startTab) ? startTab : 'progress');
const resumed = scopeName();
if (session.tab && resumed && (session.learn?.length || session.quiz)) {
  resumeNote.textContent = `Welcome back — picking up where you left off: ${resumed}.`;
  resumeNote.hidden = false;
}

renderKeyArea();
