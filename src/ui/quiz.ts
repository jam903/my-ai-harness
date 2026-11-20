// Quiz tab (ADR-0006): one question at a time, clickable choices, instant grading, and every
// choice explained after every answer. ADR-0010/0011 add: answers recorded against the current
// subtopic, an "I already know this — test me" check (QST-MASTERY B), and resume.
import { generateQuizQuestion, LETTERS, type QuizQuestion } from '../study/quiz';
import type { StudyContext } from '../study/prompts';
import { TESTOUT_QUESTIONS } from '../progress/model';
import { renderInlineMarkdown, renderMarkdown } from '../markdown';
import { el } from './dom';

export interface QuizSnapshot {
  ctx: StudyContext;
  question: QuizQuestion;
  model: string;
  picked: number | null;
  score: { correct: number; total: number };
  stems: string[];
  testOut: { answered: number; correct: number } | null;
}

export interface QuizDeps {
  getKey: () => string | null;
  getModel: () => string;
  getContext: () => StudyContext;
  /** Why this scope can't be quizzed here (e.g. a visual PAT subtest), or null. */
  blockedReason?: (ctx: StudyContext) => string | null;
  /** Record the answer; may return a short celebration line (e.g. newly mastered). */
  onAnswered?: (ctx: StudyContext, correct: boolean, testOut: boolean) => string | void;
  /** Record a finished test-out; returns the result message to show. */
  onTestOutDone?: (ctx: StudyContext, correct: number, total: number) => string;
  onChange?: (snapshot: QuizSnapshot | null) => void;
}

export interface Quiz {
  reset(notice?: string): void;
  restore(snapshot: QuizSnapshot): void;
  start(): void;
  startTestOut(): void;
}

export function mountQuiz(root: HTMLElement, deps: QuizDeps): Quiz {
  const bar = el('div', 'quiz-bar');
  const scoreEl = el('span', 'quiz-score');
  const nextBtn = el('button', 'primary', 'Start quiz');
  nextBtn.type = 'button';
  bar.append(scoreEl, nextBtn);
  const card = el('div', 'quiz-card');
  card.setAttribute('aria-live', 'polite');
  root.append(bar, card);

  let score = { correct: 0, total: 0 };
  let stems: string[] = [];
  let testOut: QuizSnapshot['testOut'] = null;
  let current: QuizSnapshot | null = null;
  let busy = false;
  let generation = 0;

  const changed = () => deps.onChange?.(current);

  function renderScore() {
    if (testOut) scoreEl.textContent = `Test-out: ${testOut.answered} / ${TESTOUT_QUESTIONS} answered`;
    else scoreEl.textContent = score.total ? `Score: ${score.correct} / ${score.total}` : 'No questions answered yet';
  }

  function reset(notice?: string) {
    generation++;
    score = { correct: 0, total: 0 };
    stems = [];
    testOut = null;
    current = null;
    busy = false;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Start quiz';
    card.replaceChildren(
      el('p', 'hint', notice ?? 'Choose what to study (above or in Progress), then press Start quiz. Questions come one at a time.'),
    );
    renderScore();
    changed();
  }

  function showQuestion(snap: QuizSnapshot, replayPick: boolean) {
    const { question: q, model, ctx } = snap;
    card.replaceChildren();
    const where = `${ctx.subject.trim()} · ${ctx.topic.trim() || 'any topic'} · ${model}`;
    const meta = el(
      'div',
      'msg-label',
      testOut ? `Test-out · question ${Math.min(testOut.answered + (snap.picked === null ? 1 : 0), TESTOUT_QUESTIONS)} of ${TESTOUT_QUESTIONS} · ${where}` : where,
    );
    const stem = el('div', 'quiz-stem md');
    stem.innerHTML = renderMarkdown(q.question);
    const list = el('div', 'choices');
    const rows = q.choices.map((choice, i) => {
      const row = el('div', 'choice-row');
      const btn = el('button', 'choice');
      btn.type = 'button';
      const text = el('span', 'choice-text');
      text.innerHTML = renderInlineMarkdown(choice);
      btn.append(el('span', 'choice-letter', LETTERS[i]), text);
      btn.addEventListener('click', () => answer(i, true));
      row.append(btn);
      list.append(row);
      return { row, btn };
    });
    card.append(meta, stem, list);
    nextBtn.disabled = true; // answer first

    function answer(picked: number, fresh: boolean) {
      if (snap.picked !== null && fresh) return;
      const correct = picked === q.answerIndex;
      let cheer: string | void = undefined;
      if (fresh) {
        snap.picked = picked;
        score = { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 };
        if (testOut) testOut = { answered: testOut.answered + 1, correct: testOut.correct + (correct ? 1 : 0) };
        snap.score = score;
        snap.testOut = testOut;
        cheer = deps.onAnswered?.(ctx, correct, testOut !== null);
        changed();
      }
      renderScore();

      rows.forEach(({ row, btn }, i) => {
        btn.disabled = true;
        if (i === q.answerIndex) btn.classList.add('is-correct');
        else if (i === picked) btn.classList.add('is-wrong');
        const exp = el('div', 'choice-explanation md');
        exp.innerHTML = renderMarkdown(q.explanations[i]);
        row.append(exp);
      });

      const verdict = el(
        'div',
        `verdict ${correct ? 'verdict-right' : 'verdict-wrong'}`,
        correct ? `✓ Correct — ${LETTERS[q.answerIndex]}` : `✗ You picked ${LETTERS[picked]}; the answer is ${LETTERS[q.answerIndex]}`,
      );
      stem.after(verdict);
      if (cheer) verdict.after(el('div', 'celebrate', cheer));
      const solution = el('div', 'solution');
      solution.append(el('div', 'solution-title', 'Worked solution'));
      const body = el('div', 'md');
      body.innerHTML = renderMarkdown(q.solution);
      solution.append(body);
      card.append(solution);

      nextBtn.disabled = false;
      nextBtn.textContent = testOut && testOut.answered >= TESTOUT_QUESTIONS ? 'See result' : 'Next question';
      if (fresh) nextBtn.focus();
    }

    if (replayPick && snap.picked !== null) answer(snap.picked, false);
  }

  function finishTestOut() {
    const done = testOut!;
    const msg = deps.onTestOutDone?.(deps.getContext(), done.correct, TESTOUT_QUESTIONS) ?? '';
    testOut = null;
    current = null;
    card.replaceChildren(el('div', 'testout-result', msg));
    nextBtn.textContent = 'Keep practising';
    renderScore();
    changed();
  }

  async function next() {
    if (busy) return;
    if (testOut && testOut.answered >= TESTOUT_QUESTIONS) return finishTestOut();
    const key = deps.getKey();
    if (!key) {
      card.replaceChildren(el('p', 'error', 'Paste your OpenRouter API key at the top first.'));
      return;
    }
    const ctx = deps.getContext();
    if (!ctx.subject.trim()) {
      card.replaceChildren(el('p', 'error', 'Choose something to study first: pick a subtopic in Progress, or enter a subject above.'));
      return;
    }
    const blocked = deps.blockedReason?.(ctx);
    if (blocked) {
      card.replaceChildren(el('p', 'hint', blocked));
      return;
    }
    const mine = generation;
    busy = true;
    nextBtn.disabled = true;
    card.replaceChildren(el('p', 'hint', 'Writing a question… (the model works out the answer first, so this can take a moment)'));
    try {
      const { question, model } = await generateQuizQuestion(key, deps.getModel(), ctx, stems);
      if (mine !== generation) return;
      stems.push(question.question);
      current = { ctx, question, model, picked: null, score, stems, testOut };
      showQuestion(current, false);
      changed();
    } catch (err) {
      if (mine !== generation) return;
      card.replaceChildren(el('p', 'error', err instanceof Error ? err.message : String(err)));
      nextBtn.disabled = false;
      nextBtn.textContent = 'Try again';
    } finally {
      if (mine === generation) busy = false;
    }
  }

  function restore(snap: QuizSnapshot) {
    generation++;
    score = snap.score;
    stems = snap.stems;
    testOut = snap.testOut;
    current = snap;
    renderScore();
    showQuestion(snap, true);
    if (snap.picked === null) nextBtn.textContent = 'Next question';
    changed(); // mounting reported "no question"; re-save so a second reload still resumes
  }

  nextBtn.addEventListener('click', () => void next());

  // A–E keys answer — handy when drilling many questions.
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const i = LETTERS.indexOf(e.key.toUpperCase() as (typeof LETTERS)[number]);
    const buttons = card.querySelectorAll<HTMLButtonElement>('button.choice');
    if (i !== -1 && buttons[i] && !buttons[i].disabled) buttons[i].click();
  });

  reset();
  return {
    reset,
    restore,
    start: () => void next(),
    startTestOut() {
      reset('Test-out: answer 5 questions. Get 4 or more right and this subtopic counts as mastered (a later review will confirm it).');
      testOut = { answered: 0, correct: 0 };
      renderScore();
      void next();
    },
  };
}
