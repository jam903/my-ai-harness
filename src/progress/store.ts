// Progress persistence + mutations (ADR-0010 Phase 1). Browser-local, like everything else
// (ADR-0007 answer: this browser). The API key lives under a different localStorage item and is
// never read here — so it cannot leak into progress or exports (see transfer.ts).
import type { CustomNode } from '../curriculum';
import { emptyProgress, emptyRecord, PROGRESS_VERSION, statusOf, type Progress, type Status } from './model';

const ITEM = 'study-progress';
const ATTEMPT_CAP = 200; // per subtopic; old attempts beyond this add nothing to the rules

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(ITEM);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw) as Progress;
    return parsed?.version === PROGRESS_VERSION ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(ITEM, JSON.stringify(p));
  } catch {
    /* storage full or blocked — progress for this session stays in memory */
  }
}

function record(p: Progress, id: string) {
  return (p.records[id] ??= emptyRecord());
}

/** A Learn conversation on this subtopic got its first reply (exposure). */
export function recordLearn(p: Progress, id: string, now = Date.now()): void {
  const r = record(p, id);
  r.learnSessions++;
  r.lastLearnAt = now;
}

/** Returns the status before and after, so callers can celebrate a newly mastered subtopic. */
export function recordAttempt(
  p: Progress,
  id: string,
  correct: boolean,
  kind: 'quiz' | 'testout' = 'quiz',
  now = Date.now(),
): { before: Status; after: Status } {
  const r = record(p, id);
  const before = statusOf(r);
  r.attempts.push({ t: now, correct, kind });
  if (r.attempts.length > ATTEMPT_CAP) r.attempts.splice(0, r.attempts.length - ATTEMPT_CAP);
  return { before, after: statusOf(r) };
}

export function recordTestOut(p: Progress, id: string, correct: number, total: number, now = Date.now()) {
  const r = record(p, id);
  const before = statusOf(r);
  r.testOuts.push({ t: now, correct, total });
  return { before, after: statusOf(r) };
}

const newId = () => `custom.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** A custom topic is created with one subtopic of the same name, so it is studyable at once. */
export function addCustomTopic(p: Progress, subjectId: string, title: string): CustomNode | null {
  const t = title.trim();
  if (!t) return null;
  const topic: CustomNode = { id: newId(), kind: 'topic', parentId: subjectId, title: t };
  p.custom.push(topic, { id: newId(), kind: 'subtopic', parentId: topic.id, title: t });
  return topic;
}

export function addCustomSubtopic(p: Progress, topicId: string, title: string): CustomNode | null {
  const t = title.trim();
  if (!t) return null;
  const node: CustomNode = { id: newId(), kind: 'subtopic', parentId: topicId, title: t };
  p.custom.push(node);
  return node;
}

/** Removes a custom node, its custom children, and their progress records. */
export function removeCustom(p: Progress, id: string): void {
  const doomed = new Set([id, ...p.custom.filter((n) => n.parentId === id).map((n) => n.id)]);
  p.custom = p.custom.filter((n) => !doomed.has(n.id));
  for (const d of doomed) delete p.records[d];
}
