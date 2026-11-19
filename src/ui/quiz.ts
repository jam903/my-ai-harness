// Quiz tab (ADR-0006): one question at a time, clickable choices, instant grading,
// and — per Jana's QST-QUIZ-FEEDBACK answer — every choice explained after every answer.
import { generateQuizQuestion, LETTERS, type QuizQuestion } from '../study/quiz';
import type { StudyContext } from '../study/prompts';
import { recordQuizResult } from '../study/results';
import { renderInlineMarkdown, renderMarkdown } from '../markdown';
import { el } from './dom';

export interface QuizDeps {
  getKey: () => string | null;
  getModel: () => string;
  getContext: () => StudyContext;
}

export interface Quiz {
  reset(notice?: string): void;
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
  let busy = false;
  let generation = 0;

  function renderScore() {
    scoreEl.textContent = score.total ? `Score: ${score.correct} / ${score.total}` : 'No questions answered yet';
  }

  function reset(notice?: string) {
    generation++;
    score = { correct: 0, total: 0 };
    stems = [];
    busy = false;
    nextBtn.disabled = false;
    nextBtn.textContent = 'Start quiz';
    card.replaceChildren(
      el('p', 'hint', notice ?? 'Enter a subject (and optionally a topic) above, then press Start quiz. Questions come one at a time.'),
    );
    renderScore();
  }

  function showQuestion(q: QuizQuestion, model: string, ctx: StudyContext) {
    card.replaceChildren();
    const meta = el('div', 'msg-label', `${ctx.subject.trim()} · ${ctx.topic.trim() || 'any topic'} · ${model}`);
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
      btn.addEventListener('click', () => answer(i));
      row.append(btn);
      list.append(row);
      return { row, btn };
    });
    card.append(meta, stem, list);
    nextBtn.disabled = true; // answer first

    let answered = false;
    function answer(picked: number) {
      if (answered) return;
      answered = true;
      const correct = picked === q.answerIndex;
      score = { correct: score.correct + (correct ? 1 : 0), total: score.total + 1 };
      renderScore();
      recordQuizResult({
        subject: ctx.subject.trim(),
        topic: ctx.topic.trim(),
        correct,
        timestamp: Date.now(),
      });

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
      const solution = el('div', 'solution');
      solution.append(el('div', 'solution-title', 'Worked solution'));
      const body = el('div', 'md');
      body.innerHTML = renderMarkdown(q.solution);
      solution.append(body);
      stem.after(verdict);
      card.append(solution);

      nextBtn.disabled = false;
      nextBtn.textContent = 'Next question';
      nextBtn.focus();
    }
  }

  async function next() {
    if (busy) return;
    const key = deps.getKey();
    if (!key) {
      card.replaceChildren(el('p', 'error', 'Paste your OpenRouter API key at the top first.'));
      return;
    }
    const ctx = deps.getContext();
    if (!ctx.subject.trim()) {
      card.replaceChildren(el('p', 'error', 'Enter a subject above first — for example "Biology" or "Microeconomics".'));
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
      showQuestion(question, model, ctx);
    } catch (err) {
      if (mine !== generation) return;
      card.replaceChildren(el('p', 'error', err instanceof Error ? err.message : String(err)));
      nextBtn.disabled = false;
      nextBtn.textContent = 'Try again';
    } finally {
      if (mine === generation) busy = false;
    }
  }

  nextBtn.addEventListener('click', () => void next());

  // A–E keys answer, Enter/N moves on — handy when drilling many questions.
  root.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    const i = LETTERS.indexOf(e.key.toUpperCase() as (typeof LETTERS)[number]);
    const buttons = card.querySelectorAll<HTMLButtonElement>('button.choice');
    if (i !== -1 && buttons[i] && !buttons[i].disabled) buttons[i].click();
  });

  reset();
  return { reset };
}
