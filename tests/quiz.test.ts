// Quiz generation and validation (ADR-0006, generalized by ADR-0008). The failure modes tested
// here are the ones LLMs actually produce when asked for JSON: prose/fences around it, letter
// labels inside choices, wrong option counts, and a non-letter answer.
import { describe, expect, it } from 'vitest';
import { generateQuizQuestion, parseQuizQuestion, QuizFormatError } from '../src/study/quiz';
import { describeScope, learnSystemPrompt, quizMessages } from '../src/study/prompts';

const good = {
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
    const q = parseQuizQuestion(text);
    expect(q.answerIndex).toBe(3);
    expect(q.choices[3]).toBe('0.48');
  });

  it('strips "A." / "(B)" labels the model adds to choices, so the UI does not show "A  A. ..."', () => {
    const labelled = { ...good, choices: ['A. 0.16', '(B) 0.24', 'C) 0.36', 'D. 0.48', 'E) 0.84'] };
    expect(parseQuizQuestion(JSON.stringify(labelled)).choices).toEqual(good.choices);
  });

  it('accepts a decorated answer letter such as "(D)"', () => {
    expect(parseQuizQuestion(JSON.stringify({ ...good, answer: '(D)' })).answerIndex).toBe(3);
  });

  it('rejects a question without exactly five choices (ADR-0008 QST-CHOICES kept five)', () => {
    const four = { ...good, choices: good.choices.slice(0, 4), explanations: good.explanations.slice(0, 4) };
    expect(() => parseQuizQuestion(JSON.stringify(four))).toThrow(QuizFormatError);
  });

  it('rejects an answer that is not a single letter A–E, rather than grading against a guess', () => {
    expect(() => parseQuizQuestion(JSON.stringify({ ...good, answer: 'Answer: D' }))).toThrow(QuizFormatError);
  });
});

describe('generateQuizQuestion', () => {
  const okResponse = (content: string) =>
    new Response(JSON.stringify({ model: 'some/model', choices: [{ message: { content } }] }), { status: 200 });
  const ctx = { subject: 'Biology', topic: '' };

  it('retries once when the first reply is not valid quiz JSON', async () => {
    const replies = ['Sure! Here is a great question about genetics...', JSON.stringify(good)];
    let calls = 0;
    const fakeFetch = async () => okResponse(replies[calls++]);

    const { question, model } = await generateQuizQuestion('k', 'm', ctx, [], fakeFetch);
    expect(calls).toBe(2);
    expect(question.answerIndex).toBe(3);
    expect(model).toBe('some/model');
  });

  it('gives up with a readable error after a second malformed reply', async () => {
    const fakeFetch = async () => okResponse('not json at all');
    await expect(generateQuizQuestion('k', 'm', ctx, [], fakeFetch)).rejects.toThrow(/usable quiz question/);
  });
});

describe('prompts', () => {
  it('describes every combination of user-entered subject and topic', () => {
    expect(describeScope({ subject: 'US History', topic: 'Reconstruction' })).toBe(
      'the topic "Reconstruction" in US History',
    );
    expect(describeScope({ subject: ' Microeconomics ', topic: '  ' })).toBe('Microeconomics (any topic)');
    expect(describeScope({ subject: '', topic: 'Recursion' })).toBe('the topic "Recursion"');
    expect(describeScope({ subject: '', topic: '' })).toBeNull();
  });

  it('quiz prompt asks for the solution before the answer, and names the scope and target position', () => {
    const [system, user] = quizMessages({ subject: 'Linear Algebra', topic: 'Eigenvalues' }, [], 'C');
    expect(system.content.indexOf('"solution"')).toBeLessThan(system.content.indexOf('"answer"'));
    expect(user.content).toContain('position C');
    expect(user.content).toContain('"Eigenvalues" in Linear Algebra');
  });

  it('quiz prompt lists earlier questions so the session does not repeat itself', () => {
    const [, user] = quizMessages({ subject: 'Biology', topic: '' }, ['What organelle makes ATP?'], 'A');
    expect(user.content).toContain('What organelle makes ATP?');
  });

  it('learn prompt still works with no subject entered, as a general tutor', () => {
    const prompt = learnSystemPrompt({ subject: '', topic: '' });
    expect(prompt).toContain('whatever subject they ask about');
    expect(prompt).not.toContain('outside this scope');
  });
});
