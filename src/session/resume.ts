// "Resume exactly where I left off" (ADR-0010 Phase 1): the open tab, study scope, Learn
// conversation, and current quiz question survive a reload. Device-local working state — not
// part of the progress export.
import type { QuizSnapshot } from '../ui/quiz';
import type { StoredMessage } from '../ui/conversation';

export type Scope = { kind: 'curriculum'; subtopicId: string } | { kind: 'free'; subject: string; topic: string };

export interface SessionState {
  tab?: string;
  scope?: Scope;
  learn?: StoredMessage[];
  chat?: StoredMessage[];
  quiz?: QuizSnapshot | null;
}

const ITEM = 'session-state';

export function loadSession(): SessionState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(ITEM) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as SessionState) : {};
  } catch {
    return {};
  }
}

export function saveSession(patch: Partial<SessionState>): void {
  try {
    localStorage.setItem(ITEM, JSON.stringify({ ...loadSession(), ...patch }));
  } catch {
    /* storage full or blocked; resume just won't work this time */
  }
}
