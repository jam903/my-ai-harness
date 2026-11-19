// @vitest-environment jsdom
// Boot test for the app shell (ADR-0004 layout, ADR-0008 free-text subjects). A missing element id
// or bad wiring in main.ts throws at startup = a blank page on GitHub Pages, which neither tsc nor
// vite build catches.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

function type(sel: string, value: string) {
  const input = $<HTMLInputElement>(sel);
  input.value = value;
  input.dispatchEvent(new Event('change'));
}

beforeAll(async () => {
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/, '');
  localStorage.setItem('openrouter-api-key', 'sk-or-test'); // a saved key, as for a returning user
  vi.stubGlobal('fetch', () => Promise.reject(new Error('offline'))); // no network in tests
  await import('../src/main');
});

describe('app shell', () => {
  it('boots on the Learn tab with empty subject/topic fields and no exam presets', () => {
    expect($('[data-tab="learn"]').getAttribute('aria-selected')).toBe('true');
    expect($<HTMLElement>('#panel-quiz').hidden).toBe(true);
    expect($<HTMLInputElement>('#subject').value).toBe('');
    expect($<HTMLInputElement>('#topic').value).toBe('');
    expect($('#key-area').textContent).toContain('…test');
  });

  it('quiz asks for a subject before calling the model', () => {
    $<HTMLButtonElement>('[data-tab="quiz"]').click();
    $<HTMLButtonElement>('#panel-quiz .quiz-bar button').click();
    expect($('#panel-quiz .quiz-card').textContent).toContain('Enter a subject');
  });

  it('entering your own subject and topic resets both modes and remembers them as suggestions', () => {
    type('#subject', 'Microeconomics');
    type('#topic', 'Price elasticity');
    expect($('#panel-quiz').textContent).toContain('the topic "Price elasticity" in Microeconomics');
    expect($('#panel-learn').textContent).toContain('Now studying');
    expect(Array.from($<HTMLDataListElement>('#subject-list').options).map((o) => o.value)).toContain('Microeconomics');
    expect(Array.from($<HTMLDataListElement>('#topic-list').options).map((o) => o.value)).toContain('Price elasticity');
  });

  it('with a subject entered, Start quiz calls the model and shows its error readably', async () => {
    $<HTMLButtonElement>('#panel-quiz .quiz-bar button').click();
    await vi.waitFor(() => expect($('#panel-quiz .quiz-card').textContent).toContain('offline'));
  });

  it('the Chat tab hides the subject/topic controls, which do not apply to it', () => {
    $<HTMLButtonElement>('[data-tab="chat"]').click();
    expect($<HTMLElement>('#study-controls').hidden).toBe(true);
    expect($<HTMLElement>('#panel-chat').hidden).toBe(false);
  });
});
