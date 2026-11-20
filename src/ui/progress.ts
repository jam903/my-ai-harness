// Progress tab (ADR-0010 Phase 1): the curriculum as a collapsible tree with coverage and mastery
// per subject / topic / subtopic, actions to study any subtopic, custom topics, and export/import.
// Calm by design: native <details>, one accent colour, no red, no counters of what's "behind".
import type { Curriculum, Subject, Topic } from '../curriculum/types';
import { rollup, statusOf, STATUS_LABEL, type Progress, type Rollup } from '../progress/model';
import { el } from './dom';

export type StudyMode = 'learn' | 'quiz' | 'testout';

export interface ProgressDeps {
  getCurriculum: () => Curriculum;
  getProgress: () => Progress;
  onStudy: (subtopicId: string, mode: StudyMode) => void;
  onAddTopic: (subjectId: string, title: string) => void;
  onAddSubtopic: (topicId: string, title: string) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

function bar(r: Rollup) {
  const wrap = el('div', 'bar');
  wrap.title = `${pct(r.coverage)} started · ${pct(r.mastery)} mastered`;
  const started = el('div', 'bar-started');
  started.style.width = pct(r.coverage);
  const mastered = el('div', 'bar-mastered');
  mastered.style.width = pct(r.mastery);
  wrap.append(started, mastered);
  return wrap;
}

function inlineAdd(label: string, placeholder: string, onAdd: (title: string) => void) {
  const wrap = el('div', 'inline-add');
  const open = el('button', 'link', `+ ${label}`);
  open.type = 'button';
  const form = el('form', 'inline-add-form');
  form.hidden = true;
  const input = el('input');
  input.placeholder = placeholder;
  input.setAttribute('aria-label', label);
  const add = el('button', 'primary', 'Add');
  add.type = 'submit';
  const cancel = el('button', 'secondary', 'Cancel');
  cancel.type = 'button';
  form.append(input, add, cancel);
  open.addEventListener('click', () => {
    form.hidden = false;
    open.hidden = true;
    input.focus();
  });
  cancel.addEventListener('click', () => {
    form.hidden = true;
    open.hidden = false;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim()) onAdd(input.value.trim());
  });
  wrap.append(open, form);
  return wrap;
}

export function mountProgress(root: HTMLElement, deps: ProgressDeps) {
  const openIds = new Set<string>();

  function details(id: string, summary: HTMLElement, body: HTMLElement[], cls: string) {
    const d = el('details', cls);
    d.open = openIds.has(id);
    d.addEventListener('toggle', () => (d.open ? openIds.add(id) : openIds.delete(id)));
    const s = el('summary');
    s.append(summary);
    d.append(s, ...body);
    return d;
  }

  function topicNode(subject: Subject, topic: Topic, p: Progress) {
    const ids = topic.subtopics.map((s) => s.id);
    const r = rollup(ids, p);
    const head = el('div', 'row-head');
    head.append(
      el('span', 'row-title', `${topic.code ? topic.code + '. ' : ''}${topic.title}`),
      el('span', 'row-meta', `${r.counts.mastered}/${r.total} mastered`),
      bar(r),
    );

    const quizzable = subject.practice === 'ai';
    const rows = topic.subtopics.map((st) => {
      const status = statusOf(p.records[st.id]);
      const row = el('div', 'subtopic');
      const name = el('div', 'subtopic-name');
      name.append(el('span', undefined, st.title));
      if (st.detail) name.append(el('span', 'muted', ` — ${st.detail}`));
      const actions = el('div', 'subtopic-actions');
      const btn = (label: string, mode: StudyMode, enabled = true, why = '') => {
        const b = el('button', 'secondary small', label);
        b.type = 'button';
        b.disabled = !enabled;
        if (why) b.title = why;
        b.addEventListener('click', () => deps.onStudy(st.id, mode));
        return b;
      };
      const why = quizzable ? '' : subject.practice === 'external' ? 'Visual puzzles: practise in a PAT tool' : 'Practice passages arrive in a later phase';
      actions.append(btn('Learn', 'learn'), btn('Quiz', 'quiz', quizzable, why));
      if (quizzable && status !== 'mastered') actions.append(btn('Test me', 'testout', true, 'I already know this — 5 questions, 4 right = mastered'));
      if (st.custom) {
        const rm = el('button', 'link small', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', () => {
          if (confirm(`Remove "${st.title}" and its progress?`)) deps.onRemove(st.id);
        });
        actions.append(rm);
      }
      row.append(name, el('span', `pill status-${status}`, STATUS_LABEL[status]), actions);
      return row;
    });

    const body: HTMLElement[] = [...rows, inlineAdd('Add subtopic', 'e.g. a chapter from your study book', (t) => deps.onAddSubtopic(topic.id, t))];
    if (topic.custom) {
      const rm = el('button', 'link small', 'Remove this topic');
      rm.type = 'button';
      rm.addEventListener('click', () => {
        if (confirm(`Remove "${topic.title}" and all its progress?`)) deps.onRemove(topic.id);
      });
      body.push(rm);
    }
    return details(topic.id, head, body, 'topic');
  }

  function render() {
    const c = deps.getCurriculum();
    const p = deps.getProgress();
    root.replaceChildren();

    const all = c.subjects.flatMap((s) => s.topics.flatMap((t) => t.subtopics.map((st) => st.id)));
    const overall = rollup(all, p);
    const summary = el('div', 'progress-summary');
    summary.append(
      el('div', 'progress-title', `${c.name} syllabus`),
      el(
        'div',
        'muted',
        `${overall.total - overall.counts['not-started']} of ${overall.total} subtopics started · ${overall.counts.mastered} mastered`,
      ),
      bar(overall),
      el('div', 'legend muted', 'Light bar: started (you have seen it) · Dark bar: mastered (you have shown it, over time)'),
    );
    root.append(summary);

    for (const subject of c.subjects) {
      const ids = subject.topics.flatMap((t) => t.subtopics.map((st) => st.id));
      const r = rollup(ids, p);
      const head = el('div', 'row-head');
      head.append(
        el('span', 'row-title subject-title', subject.title),
        el('span', 'row-meta', `${subject.items} exam items · ${pct(r.coverage)} started · ${pct(r.mastery)} mastered`),
        bar(r),
      );
      const body: HTMLElement[] = [];
      if (subject.note) body.push(el('p', 'subject-note muted', subject.note));
      body.push(...subject.topics.map((t) => topicNode(subject, t, p)));
      body.push(inlineAdd('Add your own topic', 'e.g. a topic from your study materials', (t) => deps.onAddTopic(subject.id, t)));
      root.append(details(subject.id, head, body, 'subject'));
    }

    const footer = el('div', 'progress-footer');
    const exp = el('button', 'secondary', 'Export progress');
    exp.type = 'button';
    exp.addEventListener('click', deps.onExport);
    const imp = el('label', 'secondary button-like', 'Import progress');
    const file = el('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.hidden = true;
    file.addEventListener('change', () => {
      if (file.files?.[0]) deps.onImport(file.files[0]);
      file.value = '';
    });
    imp.append(file);
    footer.append(exp, imp, el('span', 'muted small-text', 'Saved in this browser. Exports never include your API key.'));
    root.append(footer);
  }

  return { render };
}
