// Recent subject/topic suggestions (ADR-0008). They exist so free-text entry doesn't fragment
// the future study tracker into "Enzymes" / "enzymes" / "Enzymes " as separate topics.
import { describe, expect, it } from 'vitest';
import { addRecent } from '../src/study/recent';

describe('addRecent', () => {
  it('puts the newest entry first', () => {
    expect(addRecent(['Biology'], 'Chemistry')).toEqual(['Chemistry', 'Biology']);
  });

  it('treats different capitalization or spacing as the same subject, keeping the latest spelling', () => {
    expect(addRecent(['enzymes', 'Genetics'], '  Enzymes ')).toEqual(['Enzymes', 'Genetics']);
  });

  it('ignores blank input and caps the list length', () => {
    expect(addRecent(['A'], '   ')).toEqual(['A']);
    expect(addRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });
});
