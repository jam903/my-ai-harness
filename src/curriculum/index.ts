// Curriculum helpers: merge user-added topics/subtopics into the built-in tree and look things up.
import type { Curriculum, SubtopicPath } from './types';

export interface CustomNode {
  id: string;
  kind: 'topic' | 'subtopic';
  /** A subject id (for a topic) or a topic id (for a subtopic). */
  parentId: string;
  title: string;
}

/** A new tree with custom nodes attached; the built-in curriculum object is never mutated. */
export function withCustom(base: Curriculum, custom: CustomNode[]): Curriculum {
  const subjects = base.subjects.map((s) => ({
    ...s,
    topics: s.topics.map((t) => ({ ...t, subtopics: [...t.subtopics] })),
  }));
  for (const node of custom.filter((n) => n.kind === 'topic')) {
    subjects.find((s) => s.id === node.parentId)?.topics.push({ id: node.id, title: node.title, subtopics: [], custom: true });
  }
  for (const node of custom.filter((n) => n.kind === 'subtopic')) {
    for (const s of subjects) {
      s.topics.find((t) => t.id === node.parentId)?.subtopics.push({ id: node.id, title: node.title, custom: true });
    }
  }
  return { ...base, subjects };
}

export function findSubtopic(c: Curriculum, id: string): SubtopicPath | null {
  for (const subject of c.subjects)
    for (const topic of subject.topics)
      for (const subtopic of topic.subtopics) if (subtopic.id === id) return { subject, topic, subtopic };
  return null;
}

export function allSubtopicIds(c: Curriculum): string[] {
  return c.subjects.flatMap((s) => s.topics.flatMap((t) => t.subtopics.map((st) => st.id)));
}

/** "Biology › Genetics › Classical genetics" — omits the subtopic when it just repeats the topic. */
export function pathLabel(p: SubtopicPath): string {
  const parts = [p.subject.title, p.topic.title];
  if (p.subtopic.title !== p.topic.title) parts.push(p.subtopic.title);
  return parts.join(' › ');
}
