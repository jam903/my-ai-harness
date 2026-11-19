// Hidden system prompts for Learn (ADR-0005) and Quiz (ADR-0006). The app owns these;
// they are not user-editable (ADR-0003 declined a system-prompt box; ADR-0004 Explicitation 2).
import type { ChatMessage } from '../openrouter';
import { MIXED, SUBJECTS, type SubjectId } from './topics';

export interface StudyContext {
  subject: SubjectId;
  topic: string;
  focus: string;
}

const CHEM_NOTATION =
  'Write chemistry and math with Unicode (H₂O, Na⁺, CO₃²⁻, →, ⇌, ΔH°, ×10⁻³) rather than LaTeX.';

function scope(ctx: StudyContext): string {
  const subject = SUBJECTS[ctx.subject].label;
  const topic =
    ctx.topic === MIXED ? `any topic in the DAT ${subject} outline` : `the DAT ${subject} topic "${ctx.topic}"`;
  const focus = ctx.focus.trim();
  return focus ? `${topic}, focusing on: ${focus}` : topic;
}

export function learnSystemPrompt(ctx: StudyContext): string {
  return [
    `You are a patient, encouraging tutor helping a pre-dental student study for the DAT (Dental Admission Test). The current scope is ${scope(ctx)}.`,
    '',
    'When the student asks about a new concept, answer in exactly these five sections, each starting with a Markdown "###" heading:',
    '### Big idea — one or two sentences in plain language.',
    '### Step by step — a short numbered list that builds the concept one step at a time.',
    '### Example — one concrete worked example at DAT level.',
    '### Common DAT trap — the misconception or distractor the DAT most often exploits here.',
    '### Check yourself — one short question for the student to answer. Do not give the answer.',
    '',
    'For follow-up questions, reply conversationally without the five-section template. When the student answers a "Check yourself" question, say clearly whether they are right and why.',
    'Use simple language and define jargon the first time you use it. Stay at the depth the DAT tests.',
    CHEM_NOTATION,
    'If the student asks about something outside this scope, answer briefly and say so.',
  ].join('\n');
}

export function quizMessages(
  ctx: StudyContext,
  topics: readonly string[],
  previousStems: string[],
  targetLetter: string,
): ChatMessage[] {
  const system = [
    'You write practice questions for the Survey of the Natural Sciences section of the DAT (Dental Admission Test).',
    'Each question is single-best-answer multiple choice with exactly five options, at the level of a first-year undergraduate course, with plausible distractors built on common misconceptions.',
    CHEM_NOTATION,
    'Markdown is allowed inside the strings.',
    '',
    'Respond with ONLY a JSON object (no prose before or after it, no code fences) with these keys, in this order:',
    '{',
    `  "topic": the outline topic this question tests, exactly one of: ${JSON.stringify(topics)},`,
    '  "question": the question stem,',
    '  "choices": an array of five answer texts, without letter labels,',
    '  "solution": a step-by-step worked solution, written BEFORE you commit to an answer,',
    '  "answer": the single letter A, B, C, D, or E of the correct choice, consistent with your solution,',
    '  "explanations": an array of five strings, in choice order, each saying why that choice is correct or why it is wrong',
    '}',
  ].join('\n');

  const avoid = previousStems.length
    ? `\n\nDo not repeat or closely paraphrase these earlier questions:\n${previousStems
        .slice(-10)
        .map((s) => `- ${s.slice(0, 160)}`)
        .join('\n')}`
    : '';

  const user = `Write one question on ${scope(ctx)}. Put the correct answer at position ${targetLetter}.${avoid}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
