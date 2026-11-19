// Quiz generation and validation (ADR-0006). The failure modes tested here are the ones
// LLMs actually produce when asked for JSON: prose/fences around it, letter labels inside
// choices, wrong option counts, and a non-letter answer.
import { describe, expect, it } from 'vitest';
import { generateQuizQuestion, parseQuizQuestion, QuizFormatError } from '../src/dat/quiz';
import { learnSystemPrompt, quizMessages } from '../src/dat/prompts';
import { MIXED, topicsFor } from '../src/dat/topics';

const BIO = topicsFor('biology');

const good = {
  topic: 'Genetics',
  question: 'In a population in Hardy-Weinberg equilibrium, q² = 0.16. What fraction is heterozygous?',
  choices: ['0.16', '0.24', '0.36', '0.48', '0.84'],
  solution: 'q = 0.4, so p = 0.6. Heterozygotes = 2pq = 2(0.6)(0.4) = 0.48.',
  answer: 'D',
  explanations: [
    'That is q², the homozygous recessive fraction.',
    'That is pq, missing the factor of 2.',
    'That is p², the homozygous dominant fraction.',
    'Correct: 2pq = 0.48.',
    'That is 1 − q², everyone showing the dominant phenotype.',
  ],
};

describe('parseQuizQuestion', () => {
  it('reads a question even when the model wraps the JSON in prose and a code fence', () => {
    const text = 'Here is your question:\n```json\n' + JSON.stringify(good) + '\n```\nGood luck!';
    const q = parseQuizQuestion(text, BIO);
    expect(q.answerIndex).toBe(3);
    expect(q.choices[3]).toBe('0.48');
    expect(q.topic).toBe('Genetics');
  });

  it('strips "A." / "(B)" labels the model adds to choices, so the UI does not show "A  A. ..."', () => {
    const labelled = { ...good, choices: ['A. 0.16', '(B) 0.24', 'C) 0.36', 'D. 0.48', 'E) 0.84'] };
    expect(parseQuizQuestion(JSON.stringify(labelled), BIO).choices).toEqual(good.choices);
  });

  it('accepts a decorated answer letter such as "(D)"', () => {
    expect(parseQuizQuestion(JSON.stringify({ ...good, answer: '(D)' }), BIO).answerIndex).toBe(3);
  });

  it('rejects a question without exactly five choices — DAT items have five', () => {
    const four = { ...good, choices: good.choices.slice(0, 4), explanations: good.explanations.slice(0, 4) };
    expect(() => parseQuizQuestion(JSON.stringify(four), BIO)).toThrow(QuizFormatError);
  });

  it('rejects an answer that is not a single letter A–E, rather than grading against a guess', () => {
    expect(() => parseQuizQuestion(JSON.stringify({ ...good, answer: 'Answer: D' }), BIO)).toThrow(
      QuizFormatError,
    );
  });

  it('drops a topic that is not in the outline, so the results log only holds stable topic names', () => {
    expect(parseQuizQuestion(JSON.stringify({ ...good, topic: 'population genetics stuff' }), BIO).topic).toBeNull();
  });
});

describe('generateQuizQuestion', () => {
  const okResponse = (content: string) =>
    new Response(JSON.stringify({ model: 'some/model', choices: [{ message: { content } }] }), { status: 200 });

  it('retries once when the first reply is not valid quiz JSON', async () => {
    const replies = ['Sure! Here is a great question about genetics...', JSON.stringify(good)];
    let calls = 0;
    const fakeFetch = async () => okResponse(replies[calls++]);

    const { question, model } = await generateQuizQuestion(
      'k',
      'm',
      { subject: 'biology', topic: MIXED, focus: '' },
      [],
      fakeFetch,
    );
    expect(calls).toBe(2);
    expect(question.answerIndex).toBe(3);
    expect(model).toBe('some/model');
  });

  it('gives up with a readable error after a second malformed reply', async () => {
    const fakeFetch = async () => okResponse('not json at all');
    await expect(
      generateQuizQuestion('k', 'm', { subject: 'biology', topic: MIXED, focus: '' }, [], fakeFetch),
    ).rejects.toThrow(/usable quiz question/);
  });
});

describe('prompts', () => {
  it('quiz prompt asks for the solution before the answer, and names the target position', () => {
    const [system, user] = quizMessages({ subject: 'genchem', topic: 'Gases', focus: '' }, topicsFor('genchem'), [], 'C');
    expect(system.content.indexOf('"solution"')).toBeLessThan(system.content.indexOf('"answer"'));
    expect(user.content).toContain('position C');
    expect(user.content).toContain('"Gases"');
  });

  it('quiz prompt lists earlier questions so the session does not repeat itself', () => {
    const [, user] = quizMessages(
      { subject: 'biology', topic: MIXED, focus: '' },
      BIO,
      ['What organelle makes ATP?'],
      'A',
    );
    expect(user.content).toContain('What organelle makes ATP?');
  });

  it('learn prompt carries the optional focus into the scope', () => {
    const prompt = learnSystemPrompt({ subject: 'biology', topic: 'Genetics', focus: 'Hardy-Weinberg' });
    expect(prompt).toContain('"Genetics"');
    expect(prompt).toContain('focusing on: Hardy-Weinberg');
  });
});
