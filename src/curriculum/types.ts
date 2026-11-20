// Curriculum model (ADR-0010 QST-COACH-SCOPE A: curriculum as data).
// subject → topic → subtopic; the subtopic is the unit of tracking (ADR-0011).

/** How a subject can be practised inside the app. */
export type Practice =
  | 'ai' // Learn + AI quiz questions
  | 'passage' // Learn now; AI reading passages in a later phase
  | 'external'; // Learn teaches strategy; practice happens in a dedicated outside tool

export interface Subtopic {
  id: string;
  title: string;
  detail?: string;
  custom?: boolean;
}

export interface Topic {
  id: string;
  code?: string; // the official outline numbering, e.g. "IV"
  title: string;
  subtopics: Subtopic[];
  custom?: boolean;
}

export interface Subject {
  id: string;
  title: string;
  /** Item count on the real exam — the only official weighting (ADR-0012). */
  items: number;
  practice: Practice;
  note?: string;
  topics: Topic[];
}

export interface Curriculum {
  id: string;
  name: string;
  source: string;
  subjects: Subject[];
}

/** Where a subtopic sits, for labels and prompts. */
export interface SubtopicPath {
  subject: Subject;
  topic: Topic;
  subtopic: Subtopic;
}
