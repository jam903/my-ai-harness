// Status rules (ADR-0011 QST-MASTERY B): exposure ≠ mastery; mastery needs evidence over time,
// or a passed test-out. These are the rules that decide what the coach tells you to study.
import { describe, expect, it } from 'vitest';
import { emptyProgress, rollup, statusOf } from '../src/progress/model';
import { addCustomTopic, recordAttempt, recordLearn, recordTestOut, removeCustom } from '../src/progress/store';

const DAY = 24 * 60 * 60 * 1000;
const MON = new Date(2026, 10, 16, 10).getTime();
const ID = 'dat.gc.ii.ideal-gas-law';

describe('subtopic status', () => {
  it('a Learn session alone is exposure ("Learning"), not mastery', () => {
    const p = emptyProgress();
    recordLearn(p, ID, MON);
    expect(statusOf(p.records[ID])).toBe('learning');
  });

  it('five right answers in one sitting are NOT mastery — that only shows short-term memory', () => {
    const p = emptyProgress();
    for (let i = 0; i < 5; i++) recordAttempt(p, ID, true, 'quiz', MON + i * 60_000);
    expect(statusOf(p.records[ID])).toBe('practicing');
  });

  it('4 of the last 5 right, across two different days, is mastery — and the call reports the change', () => {
    const p = emptyProgress();
    recordAttempt(p, ID, true, 'quiz', MON);
    recordAttempt(p, ID, false, 'quiz', MON + 1000);
    recordAttempt(p, ID, true, 'quiz', MON + 2000);
    recordAttempt(p, ID, true, 'quiz', MON + DAY * 2);
    const last = recordAttempt(p, ID, true, 'quiz', MON + DAY * 2 + 1000);
    expect(last).toEqual({ before: 'practicing', after: 'mastered' });
  });

  it('old successes do not keep a subtopic mastered when recent answers are mostly wrong', () => {
    const p = emptyProgress();
    for (let i = 0; i < 5; i++) recordAttempt(p, ID, true, 'quiz', MON + i * DAY);
    expect(statusOf(p.records[ID])).toBe('mastered');
    for (let i = 0; i < 2; i++) recordAttempt(p, ID, false, 'quiz', MON + 10 * DAY + i);
    expect(statusOf(p.records[ID])).toBe('practicing');
  });

  it('a test-out of 4/5 marks mastery at once; 3/5 does not', () => {
    const pass = emptyProgress();
    expect(recordTestOut(pass, ID, 4, 5, MON).after).toBe('mastered');
    const fail = emptyProgress();
    expect(recordTestOut(fail, ID, 3, 5, MON).after).toBe('practicing');
  });
});

describe('rollups', () => {
  it('separates coverage (started) from mastery', () => {
    const p = emptyProgress();
    recordLearn(p, 'a', MON);
    recordTestOut(p, 'b', 5, 5, MON);
    const r = rollup(['a', 'b', 'c', 'd'], p);
    expect(r.coverage).toBe(0.5);
    expect(r.mastery).toBe(0.25);
    expect(r.counts).toEqual({ 'not-started': 2, learning: 1, practicing: 0, mastered: 1 });
  });
});

describe('custom topics', () => {
  it('a new custom topic is immediately studyable, and removing it also removes its progress', () => {
    const p = emptyProgress();
    const topic = addCustomTopic(p, 'dat.bio', '  Kaplan ch. 7 extras ')!;
    const sub = p.custom.find((n) => n.parentId === topic.id)!;
    expect(sub.title).toBe('Kaplan ch. 7 extras');
    recordLearn(p, sub.id, MON);
    removeCustom(p, topic.id);
    expect(p.custom).toEqual([]);
    expect(p.records[sub.id]).toBeUndefined();
  });
});
