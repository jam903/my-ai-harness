// Export / import of study progress (ADR-0010). The export is built ONLY from the Progress object,
// which never contains the API key (it lives under its own localStorage item, ADR-0002) — and
// importing validates shape before anything is replaced.
import { PROGRESS_VERSION, type Progress } from './model';

export const EXPORT_KIND = 'study-progress-export';

export function exportProgress(p: Progress, now = new Date()): string {
  return JSON.stringify({ kind: EXPORT_KIND, version: PROGRESS_VERSION, exportedAt: now.toISOString(), progress: p }, null, 2);
}

export function exportFilename(now = new Date()): string {
  return `study-progress-${now.toISOString().slice(0, 10)}.json`;
}

export class ImportError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseImport(text: string): Progress {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("That file isn't valid JSON — pick a file exported from this app.");
  }
  if (!isObj(data) || data.kind !== EXPORT_KIND) throw new ImportError("That file isn't a study-progress export from this app.");
  if (data.version !== PROGRESS_VERSION)
    throw new ImportError(`That export is version ${String(data.version)}; this app reads version ${PROGRESS_VERSION}.`);
  const p = data.progress;
  if (!isObj(p) || !Array.isArray(p.custom) || !isObj(p.records)) throw new ImportError('That export is missing its progress data.');

  for (const [id, r] of Object.entries(p.records)) {
    if (!isObj(r) || typeof r.learnSessions !== 'number' || !Array.isArray(r.attempts) || !Array.isArray(r.testOuts))
      throw new ImportError(`That export has a damaged record (${id}).`);
  }
  // Rebuild rather than trust: only known fields survive an import.
  return {
    version: PROGRESS_VERSION,
    custom: (p.custom as unknown[]).filter(isObj).map((n) => ({
      id: String(n.id),
      kind: n.kind === 'topic' ? 'topic' : 'subtopic',
      parentId: String(n.parentId),
      title: String(n.title),
    })),
    records: Object.fromEntries(
      Object.entries(p.records as Record<string, Record<string, unknown>>).map(([id, r]) => [
        id,
        {
          learnSessions: r.learnSessions as number,
          ...(typeof r.lastLearnAt === 'number' ? { lastLearnAt: r.lastLearnAt } : {}),
          attempts: (r.attempts as unknown[]).filter(isObj).map((a) => ({
            t: Number(a.t),
            correct: a.correct === true,
            kind: a.kind === 'testout' ? ('testout' as const) : ('quiz' as const),
          })),
          testOuts: (r.testOuts as unknown[]).filter(isObj).map((x) => ({
            t: Number(x.t),
            correct: Number(x.correct),
            total: Number(x.total),
          })),
        },
      ]),
    ),
  };
}
