// The DAT curriculum must match the official ADA outline (March 2026 User's Manual, Figures 1–4).
// These pin the official structure, so a careless edit to src/curriculum/dat.ts is caught.
import { describe, expect, it } from 'vitest';
import { DAT_CURRICULUM } from '../src/curriculum/dat';
import { allSubtopicIds, findSubtopic, pathLabel, withCustom } from '../src/curriculum';

const subject = (id: string) => DAT_CURRICULUM.subjects.find((s) => s.id === id)!;

describe('DAT curriculum vs. the official ADA outline', () => {
  it('has all four tests with the official item counts', () => {
    expect(DAT_CURRICULUM.subjects.map((s) => [s.title, s.items])).toEqual([
      ['Biology', 40],
      ['General Chemistry', 30],
      ['Organic Chemistry', 30],
      ['Quantitative Reasoning', 40],
      ['Perceptual Ability', 90],
      ['Reading Comprehension', 50],
    ]);
  });

  it('has the official topic counts and subtopic counts for the sciences', () => {
    expect(subject('dat.bio').topics.map((t) => t.subtopics.length)).toEqual([8, 8, 12, 10, 5]);
    expect(subject('dat.gc').topics).toHaveLength(13);
    expect(subject('dat.oc').topics).toHaveLength(7);
    expect(subject('dat.qr').topics.find((t) => t.title === 'Algebra')!.subtopics).toHaveLength(6);
  });

  describe('Regression tests', () => {
    it('Biology has no top-level "Developmental Biology" (fixes the ADR-0004 list)', () => {
      // Bug: the ADR-0004 topic list, written from memory, had "Developmental Biology" as a topic.
      // The official outline puts it under Genetics (IV.F "Developmental mechanisms").
      // Fixed by sourcing src/curriculum/dat.ts from the manual (ADR-0010).
      const bio = subject('dat.bio');
      expect(bio.topics.map((t) => t.title)).not.toContain('Developmental Biology');
      expect(bio.topics.find((t) => t.title === 'Genetics')!.subtopics.map((s) => s.title)).toContain(
        'Developmental mechanisms',
      );
    });

    it('Organic Chemistry includes spectroscopy (missing from the ADR-0004 list)', () => {
      const titles = subject('dat.oc').topics.flatMap((t) => t.subtopics.map((s) => s.title));
      expect(titles).toEqual(expect.arrayContaining(['Spectroscopy: ¹H NMR', 'Spectroscopy: infrared']));
    });
  });

  it('every subtopic id is unique and every topic is studyable (has a subtopic)', () => {
    const ids = allSubtopicIds(DAT_CURRICULUM);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of DAT_CURRICULUM.subjects) for (const t of s.topics) expect(t.subtopics.length).toBeGreaterThan(0);
  });

  it('marks PAT as practised outside the app, since its puzzles are visual', () => {
    expect(subject('dat.pat').practice).toBe('external');
    expect(subject('dat.bio').practice).toBe('ai');
  });
});

describe('custom topics', () => {
  it('attaches custom topics and subtopics without changing the built-in curriculum', () => {
    const before = JSON.stringify(DAT_CURRICULUM);
    const c = withCustom(DAT_CURRICULUM, [
      { id: 'custom.t1', kind: 'topic', parentId: 'dat.bio', title: 'Kaplan ch. 7 extras' },
      { id: 'custom.s1', kind: 'subtopic', parentId: 'custom.t1', title: 'Hormone cascades' },
      { id: 'custom.s2', kind: 'subtopic', parentId: 'dat.gc.ii', title: 'Real gases' },
    ]);
    expect(pathLabel(findSubtopic(c, 'custom.s1')!)).toBe('Biology › Kaplan ch. 7 extras › Hormone cascades');
    expect(findSubtopic(c, 'custom.s2')!.topic.title).toBe('Gases');
    expect(JSON.stringify(DAT_CURRICULUM)).toBe(before);
  });
});
