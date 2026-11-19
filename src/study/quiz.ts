// Quiz question generation and validation (ADR-0006 QST-QUIZ-FORMAT A: structured, solve first;
// five choices kept per ADR-0008 QST-CHOICES).
import { sendChat } from '../openrouter';
import { quizMessages, type StudyContext } from './prompts';

export const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

export interface QuizQuestion {
  question: string;
  choices: string[];
  solution: string;
  answerIndex: number;
  explanations: string[];
}

export class QuizFormatError extends Error {}

const FORMAT_HELP = "The model's reply wasn't a usable quiz question";

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

function extractJson(text: string): Record<string, unknown> {
  // Tolerate prose or ```json fences around the object — common even when told not to.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new QuizFormatError(`${FORMAT_HELP} (no JSON found).`);
  try {
    const parsed: unknown = JSON.parse(text.slice(start, end + 1));
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
  } catch {
    /* fall through */
  }
  throw new QuizFormatError(`${FORMAT_HELP} (invalid JSON).`);
}

/** Strip a leading "A." / "B)" / "(C)" label the model added despite instructions. */
function stripLetterLabel(choice: string): string {
  return choice.replace(/^\s*\(?[A-Ea-e][.)]\s+/, '').trim();
}

export function parseQuizQuestion(text: string): QuizQuestion {
  const { question, choices, solution, answer, explanations } = extractJson(text);
  const n = LETTERS.length;

  if (!isText(question)) throw new QuizFormatError(`${FORMAT_HELP} (missing question).`);
  if (!isText(solution)) throw new QuizFormatError(`${FORMAT_HELP} (missing worked solution).`);
  if (!Array.isArray(choices) || choices.length !== n || !choices.every(isText))
    throw new QuizFormatError(`${FORMAT_HELP} (needs exactly ${n} choices).`);
  if (!Array.isArray(explanations) || explanations.length !== n || !explanations.every(isText))
    throw new QuizFormatError(`${FORMAT_HELP} (needs one explanation per choice).`);

  const letter = typeof answer === 'string' ? answer.toUpperCase().replace(/[^A-Z]/g, '') : '';
  const answerIndex = LETTERS.indexOf(letter as (typeof LETTERS)[number]);
  if (answerIndex === -1) throw new QuizFormatError(`${FORMAT_HELP} (answer must be a letter A–E).`);

  return {
    question: question.trim(),
    choices: choices.map(stripLetterLabel),
    solution: solution.trim(),
    answerIndex,
    explanations: explanations.map((e) => e.trim()),
  };
}

export interface GeneratedQuestion {
  question: QuizQuestion;
  model: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Ask the model for one question. The correct position is chosen here (models otherwise
 * favor B/C); a malformed reply is retried once before giving up. HTTP errors are not retried.
 */
export async function generateQuizQuestion(
  apiKey: string,
  model: string,
  ctx: StudyContext,
  previousStems: string[],
  fetchImpl: FetchLike = fetch,
  random: () => number = Math.random,
): Promise<GeneratedQuestion> {
  const targetLetter = LETTERS[Math.floor(random() * LETTERS.length)];
  const messages = quizMessages(ctx, previousStems, targetLetter);

  for (let attempt = 1; ; attempt++) {
    const reply = await sendChat(apiKey, model, messages, fetchImpl);
    try {
      return { question: parseQuizQuestion(reply.content), model: reply.model };
    } catch (err) {
      if (!(err instanceof QuizFormatError) || attempt >= 2) throw err;
    }
  }
}
