// Hidden system prompts for Learn (ADR-0005) and Quiz (ADR-0006), generalized to any
// user-entered subject and topic (ADR-0008). The app owns these; they are not user-editable.
import type { ChatMessage } from '../openrouter';

export interface StudyContext {
  /** Free text, e.g. "Organic Chemistry" or "US History". May be blank in Learn mode. */
  subject: string;
  /** Free text, e.g. "Stereochemistry". Blank means the whole subject. */
  topic: string;
}

const NOTATION =
  'Write math and science notation with Unicode (x², √2, π, H₂O, Na⁺, →, ⇌, ≤, ΔH°) rather than LaTeX.';

const LEVEL =
  'Match the level implied by the subject (for example "AP Biology" or "graduate statistics"); if none is implied, aim for introductory university level.';

/** Human-readable scope, or null when neither subject nor topic is set. */
export function describeScope(ctx: StudyContext): string | null {
  const subject = ctx.subject.trim();
  const topic = ctx.topic.trim();
  if (subject && topic) return `the topic "${topic}" in ${subject}`;
  if (subject) return `${subject} (any topic)`;
  if (topic) return `the topic "${topic}"`;
  return null;
}

export function learnSystemPrompt(ctx: StudyContext): string {
  const scope = describeScope(ctx);
  return [
    `You are a patient, encouraging tutor helping a student study ${scope ?? 'whatever subject they ask about'}.`,
    '',
    'When the student asks about a new concept, answer in exactly these five sections, each starting with a Markdown "###" heading:',
    '### Big idea — one or two sentences in plain language.',
    '### Step by step — a short numbered list that builds the concept one step at a time.',
    '### Example — one concrete worked example.',
    '### Common mistake — the misconception or error students most often make here.',
    '### Check yourself — one short question for the student to answer. Do not give the answer.',
    '',
    'For follow-up questions, reply conversationally without the five-section template. When the student answers a "Check yourself" question, say clearly whether they are right and why.',
    'Use simple language and define jargon the first time you use it.',
    LEVEL,
    NOTATION,
    ...(scope ? ['If the student asks about something outside this scope, answer briefly and say so.'] : []),
  ].join('\n');
}

export function quizMessages(ctx: StudyContext, previousStems: string[], targetLetter: string): ChatMessage[] {
  const system = [
    'You write multiple-choice practice questions to help a student study.',
    'Each question is single-best-answer with exactly five options, with plausible distractors built on common misconceptions.',
    LEVEL,
    NOTATION,
    'Markdown is allowed inside the strings.',
    '',
    'Respond with ONLY a JSON object (no prose before or after it, no code fences) with these keys, in this order:',
    '{',
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

  const scope = describeScope(ctx) ?? 'a subject of your choice';
  const user = `Write one question on ${scope}. Put the correct answer at position ${targetLetter}.${avoid}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
