// Recently used subjects/topics, offered as suggestions so users reuse the same names —
// free-text entry otherwise fragments the future tracker ("Enzymes" vs "enzymes"; ADR-0008).
import { loadPref, savePref } from '../storage';

const MAX = 20;

/** Most recent first; a case-insensitive repeat replaces the older entry. */
export function addRecent(list: string[], value: string, max = MAX): string[] {
  const v = value.trim();
  if (!v) return list;
  return [v, ...list.filter((x) => x.toLowerCase() !== v.toLowerCase())].slice(0, max);
}

function load(name: string): string[] {
  try {
    const parsed: unknown = JSON.parse(loadPref(name) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

const topicsKey = (subject: string) => `recent-topics:${subject.trim().toLowerCase()}`;

export const recentSubjects = () => load('recent-subjects');
export const recentTopics = (subject: string) => load(topicsKey(subject));

export function rememberScope(subject: string, topic: string): void {
  if (subject.trim()) savePref('recent-subjects', JSON.stringify(addRecent(recentSubjects(), subject)));
  if (topic.trim()) savePref(topicsKey(subject), JSON.stringify(addRecent(recentTopics(subject), topic)));
}
