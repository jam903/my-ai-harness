// @vitest-environment jsdom
// App-shell tests (ADR-0004 layout, ADR-0008 free study, ADR-0010 curriculum/progress/resume).
// A missing element id or bad wiring in main.ts throws at startup = a blank page on GitHub Pages,
// which neither tsc nor vite build catches. The session is pre-seeded as if the user had reloaded
// mid-lesson, so the first test is "resume exactly where I left off".
import { beforeAll, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const $$ = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel));

function subtopicRow(title: string) {
  return $$('#panel-progress .subtopic').find((r) => r.querySelector('.subtopic-name')?.textContent?.startsWith(title))!;
}
function openAll() {
  for (const d of $$('#panel-progress details')) (d as HTMLDetailsElement).open = true;
}

beforeAll(async () => {
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/, '');
  localStorage.setItem('openrouter-api-key', 'sk-or-test');
  localStorage.setItem(
    'session-state',
    JSON.stringify({
      tab: 'learn',
      scope: { kind: 'curriculum', subtopicId: 'dat.gc.ii.ideal-gas-law' },
      learn: [
        { role: 'user', content: 'What does PV = nRT mean?' },
        { role: 'assistant', content: 'Think of a gas as a crowd of tiny bouncing balls…', model: 'some/model' },
      ],
    }),
  );
  vi.stubGlobal('fetch', () => Promise.reject(new Error('offline'))); // no network in tests
  vi.stubGlobal('confirm', () => true);
  await import('../src/main');
});

describe('app shell', () => {
  it('resumes exactly where you left off: tab, subtopic, and the Learn conversation', () => {
    expect($('[data-tab="learn"]').getAttribute('aria-selected')).toBe('true');
    expect($('#scope-label').textContent).toBe('General Chemistry › Gases › Ideal gas law');
    expect($('#panel-learn').textContent).toContain('What does PV = nRT mean?');
    expect($('#resume-note').hidden).toBe(false);
    // …and the restored conversation is saved again, so a second reload resumes too.
    expect(JSON.parse(localStorage.getItem('session-state')!).learn).toHaveLength(2);
  });

  it('Progress lists all four DAT tests (six sections) with their exam item counts', () => {
    $<HTMLButtonElement>('[data-tab="progress"]').click();
    const titles = $$('#panel-progress .subject-title').map((e) => e.textContent);
    expect(titles).toEqual([
      'Biology',
      'General Chemistry',
      'Organic Chemistry',
      'Quantitative Reasoning',
      'Perceptual Ability',
      'Reading Comprehension',
    ]);
    expect($('#panel-progress').textContent).toContain('40 exam items');
  });

  it('PAT subtopics can be learned but not AI-quizzed (visual puzzles)', () => {
    openAll();
    const row = subtopicRow('Cube counting strategy');
    const quizBtn = Array.from(row.querySelectorAll('button')).find((b) => b.textContent === 'Quiz')!;
    expect(quizBtn.disabled).toBe(true);
  });

  it('"Learn" on a subtopic switches to Learn with that subtopic as the scope', () => {
    const row = subtopicRow('Classical genetics');
    Array.from(row.querySelectorAll('button')).find((b) => b.textContent === 'Learn')!.click();
    expect($('[data-tab="learn"]').getAttribute('aria-selected')).toBe('true');
    expect($('#scope-label').textContent).toBe('Biology › Genetics › Classical genetics');
    expect($('#panel-learn').textContent).toContain('Now studying');
  });

  it('"Quiz" on a subtopic starts a question and reports a model error readably', async () => {
    $<HTMLButtonElement>('[data-tab="progress"]').click();
    openAll();
    Array.from(subtopicRow('Ideal gas law').querySelectorAll('button')).find((b) => b.textContent === 'Quiz')!.click();
    expect($('[data-tab="quiz"]').getAttribute('aria-selected')).toBe('true');
    await vi.waitFor(() => expect($('#panel-quiz .quiz-card').textContent).toContain('offline'));
  });

  it('a custom topic from your study materials appears, starts "Not started", and is saved', () => {
    $<HTMLButtonElement>('[data-tab="progress"]').click();
    openAll();
    const bio = $$('#panel-progress details.subject')[0];
    const add = Array.from(bio.querySelectorAll<HTMLButtonElement>(':scope > .inline-add button')).find((b) =>
      b.textContent?.includes('Add your own topic'),
    )!;
    add.click();
    const form = bio.querySelector<HTMLFormElement>(':scope > .inline-add form')!;
    form.querySelector('input')!.value = 'Kaplan ch. 7 extras';
    form.requestSubmit();
    openAll();
    expect(subtopicRow('Kaplan ch. 7 extras').textContent).toContain('Not started');
    expect(localStorage.getItem('study-progress')).toContain('Kaplan ch. 7 extras');
  });

  it('free study still works for any subject (ADR-0008), and quiz asks for a subject first', () => {
    $<HTMLButtonElement>('[data-tab="quiz"]').click();
    $<HTMLButtonElement>('#scope-free').click();
    expect($('#scope-freeform').hidden).toBe(false);
    $<HTMLButtonElement>('#panel-quiz .quiz-bar button').click();
    expect($('#panel-quiz .quiz-card').textContent).toContain('Choose something to study first');
  });

  it('the Chat tab hides the study controls, which do not apply to it', () => {
    $<HTMLButtonElement>('[data-tab="chat"]').click();
    expect($<HTMLElement>('#study-controls').hidden).toBe(true);
  });
});
