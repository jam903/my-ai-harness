// @vitest-environment jsdom
// Boot test for the app shell (ADR-0004). A missing element id or a bad wiring in main.ts
// throws at startup = a blank page on GitHub Pages, which neither tsc nor vite build catches.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import html from '../index.html?raw';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

beforeAll(async () => {
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/, '');
  vi.stubGlobal('fetch', () => Promise.reject(new Error('offline'))); // model suggestions are optional
  await import('../src/main');
});

describe('app shell', () => {
  it('boots on the Learn tab with the three DAT sciences and a key prompt', () => {
    expect($('[data-tab="learn"]').getAttribute('aria-selected')).toBe('true');
    expect($<HTMLElement>('#panel-quiz').hidden).toBe(true);
    const subjects = Array.from($<HTMLSelectElement>('#subject').options).map((o) => o.text);
    expect(subjects).toEqual(['Biology', 'General Chemistry', 'Organic Chemistry']);
    expect($('#key-area input[type="password"]')).not.toBeNull();
  });

  it('switching subject swaps the topic list and starts from Mixed', () => {
    const subject = $<HTMLSelectElement>('#subject');
    subject.value = 'orgo';
    subject.dispatchEvent(new Event('change'));
    const topic = $<HTMLSelectElement>('#topic');
    expect(topic.value).toBe('Mixed (all topics)');
    expect(Array.from(topic.options).map((o) => o.text)).toContain('Stereochemistry');
    expect($('#panel-quiz').textContent).toContain('Organic Chemistry');
  });

  it('the Chat tab hides the subject/topic controls, which do not apply to it', () => {
    $<HTMLButtonElement>('[data-tab="chat"]').click();
    expect($<HTMLElement>('#study-controls').hidden).toBe(true);
    expect($<HTMLElement>('#panel-chat').hidden).toBe(false);
    $<HTMLButtonElement>('[data-tab="quiz"]').click();
    expect($<HTMLElement>('#study-controls').hidden).toBe(false);
  });

  it('starting a quiz without a key explains what to do instead of failing silently', () => {
    $<HTMLButtonElement>('#panel-quiz .quiz-bar button').click();
    expect($('#panel-quiz .quiz-card').textContent).toContain('Paste your OpenRouter API key');
  });
});
