// Quiz answer log — the raw material for the future study tracker (ADR-0007 Decision).
// Browser-local; guarded like storage.ts so a blocked localStorage never breaks the quiz.

export interface QuizResult {
  subject: string;
  topic: string;
  correct: boolean;
  timestamp: number;
}

const ITEM = 'quiz-results';

export function loadQuizResults(): QuizResult[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ITEM) ?? '[]');
    return Array.isArray(parsed) ? (parsed as QuizResult[]) : [];
  } catch {
    return [];
  }
}

export function recordQuizResult(result: QuizResult): void {
  try {
    localStorage.setItem(ITEM, JSON.stringify([...loadQuizResults(), result]));
  } catch {
    /* not recorded; the quiz still works */
  }
}
