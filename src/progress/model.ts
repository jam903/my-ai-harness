// Progress data and status rules (ADR-0011). Status is COMPUTED from stored evidence — never
// stored — so a rule change can never corrupt saved data. Pure functions: no storage, no DOM.
import type { CustomNode } from '../curriculum';
import type { Curriculum } from '../curriculum/types';

export const PROGRESS_VERSION = 1;

export interface Attempt {
  t: number; // epoch ms
  correct: boolean;
  /** 'testout' answers come from an "I already know this" check (QST-MASTERY B). */
  kind: 'quiz' | 'testout';
}

export interface TestOut {
  t: number;
  correct: number;
  total: number;
}

export interface SubtopicRecord {
  /** Learn conversations on this subtopic = exposure, not mastery (ADR-0011 Explicitation 1). */
  learnSessions: number;
  lastLearnAt?: number;
  attempts: Attempt[];
  testOuts: TestOut[];
}

export interface Progress {
  version: number;
  custom: CustomNode[];
  records: Record<string, SubtopicRecord>;
}

export const emptyProgress = (): Progress => ({ version: PROGRESS_VERSION, custom: [], records: {} });
export const emptyRecord = (): SubtopicRecord => ({ learnSessions: 0, attempts: [], testOuts: [] });

export type Status = 'not-started' | 'learning' | 'practicing' | 'mastered';

/** Neutral wording on purpose — never "failing" or "forgotten" (ADR-0011 Explicitation 5). */
export const STATUS_LABEL: Record<Status, string> = {
  'not-started': 'Not started',
  learning: 'Learning',
  practicing: 'Practicing',
  mastered: 'Mastered',
};

export const MASTERY_WINDOW = 5;
export const MASTERY_MIN_CORRECT = 4;
export const MASTERY_MIN_DAYS = 2;
export const TESTOUT_QUESTIONS = 5;
export const TESTOUT_PASS = 4;

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Mastered (ADR-0011 QST-MASTERY B) when EITHER
 *  - evidence: ≥4 of the last 5 answers correct, with correct answers on ≥2 different days
 *    (right after a lesson only proves short-term memory), OR
 *  - test-out: the latest "test me" check scored ≥4/5.
 * Phase 2 adds: and the latest spaced review was correct.
 */
export function isMastered(r: SubtopicRecord): boolean {
  const lastTestOut = r.testOuts.at(-1);
  if (lastTestOut && lastTestOut.correct >= TESTOUT_PASS) return true;

  const recent = r.attempts.slice(-MASTERY_WINDOW);
  if (recent.length < MASTERY_WINDOW) return false;
  const correct = recent.filter((a) => a.correct);
  if (correct.length < MASTERY_MIN_CORRECT) return false;
  return new Set(correct.map((a) => dayKey(a.t))).size >= MASTERY_MIN_DAYS;
}

export function statusOf(r: SubtopicRecord | undefined): Status {
  if (!r || (r.learnSessions === 0 && r.attempts.length === 0 && r.testOuts.length === 0)) return 'not-started';
  if (isMastered(r)) return 'mastered';
  if (r.attempts.length > 0 || r.testOuts.length > 0) return 'practicing';
  return 'learning';
}

export interface Rollup {
  total: number;
  counts: Record<Status, number>;
  /** Share of subtopics touched at all (exposure). */
  coverage: number;
  /** Share of subtopics with demonstrated mastery. */
  mastery: number;
}

export function rollup(ids: string[], p: Progress): Rollup {
  const counts: Record<Status, number> = { 'not-started': 0, learning: 0, practicing: 0, mastered: 0 };
  for (const id of ids) counts[statusOf(p.records[id])]++;
  const total = ids.length;
  return {
    total,
    counts,
    coverage: total ? (total - counts['not-started']) / total : 0,
    mastery: total ? counts.mastered / total : 0,
  };
}

export const subjectIds = (c: Curriculum, subjectId: string) =>
  c.subjects.find((s) => s.id === subjectId)?.topics.flatMap((t) => t.subtopics.map((st) => st.id)) ?? [];
