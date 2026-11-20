// @vitest-environment jsdom
// Export / import (ADR-0010). The hard requirement: an export must never contain the API key.
import { describe, expect, it } from 'vitest';
import { saveKey } from '../src/storage';
import { emptyProgress } from '../src/progress/model';
import { addCustomTopic, loadProgress, recordAttempt, recordLearn, saveProgress } from '../src/progress/store';
import { exportProgress, ImportError, parseImport } from '../src/progress/transfer';

const KEY = 'sk-or-v1-THIS-MUST-NEVER-BE-EXPORTED';

describe('export', () => {
  it('never contains the API key, even with the key saved in the same browser', () => {
    saveKey(KEY);
    const p = emptyProgress();
    recordLearn(p, 'dat.bio.iv.classical-genetics');
    recordAttempt(p, 'dat.bio.iv.classical-genetics', true);
    saveProgress(p);

    const exported = exportProgress(loadProgress());
    expect(exported).not.toContain(KEY);
    expect(exported).not.toMatch(/sk-or-/);
  });
});

describe('import', () => {
  it('round-trips progress, including custom topics', () => {
    const p = emptyProgress();
    addCustomTopic(p, 'dat.gc', 'Real gases');
    recordAttempt(p, 'dat.gc.ii.ideal-gas-law', false, 'quiz', 1_700_000_000_000);
    expect(parseImport(exportProgress(p))).toEqual(p);
  });

  it('rejects files that are not exports from this app, with a readable reason', () => {
    expect(() => parseImport('not json')).toThrow(ImportError);
    expect(() => parseImport('{"hello": "world"}')).toThrow(/isn't a study-progress export/);
    expect(() => parseImport(JSON.stringify({ kind: 'study-progress-export', version: 99, progress: {} }))).toThrow(
      /version 99/,
    );
  });

  it('drops unknown fields, so a hand-edited file cannot smuggle data (e.g. a key) back in', () => {
    const p = emptyProgress();
    recordLearn(p, 'x', 1);
    const file = JSON.parse(exportProgress(p));
    file.progress.apiKey = KEY;
    file.progress.records.x.note = KEY;
    const imported = parseImport(JSON.stringify(file));
    expect(JSON.stringify(imported)).not.toContain(KEY);
  });
});
