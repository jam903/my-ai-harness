// DAT Survey of the Natural Sciences subjects and outline topics (ADR-0004 QST-TOPICS).
// Candidate headings from the ADA DAT Guide outline; only partly verified (ADR-0004 Open
// Follow-ups) — this is the one file to edit if your study materials word them differently.

export const MIXED = 'Mixed (all topics)';

export const SUBJECTS = {
  biology: {
    label: 'Biology',
    topics: [
      'Cell and Molecular Biology',
      'Diversity of Life',
      'Structure and Function of Systems',
      'Developmental Biology',
      'Genetics',
      'Evolution, Ecology, and Behavior',
    ],
  },
  genchem: {
    label: 'General Chemistry',
    topics: [
      'Stoichiometry and General Concepts',
      'Gases',
      'Liquids and Solids',
      'Solutions',
      'Acids and Bases',
      'Chemical Equilibria',
      'Thermodynamics and Thermochemistry',
      'Chemical Kinetics',
      'Oxidation-Reduction Reactions',
      'Atomic and Molecular Structure',
      'Periodic Properties',
      'Nuclear Reactions',
      'Laboratory',
    ],
  },
  orgo: {
    label: 'Organic Chemistry',
    topics: [
      'Mechanisms',
      'Chemical and Physical Properties of Molecules',
      'Stereochemistry',
      'Nomenclature',
      'Reactions of Major Functional Groups and Synthesis',
      'Acid-Base Chemistry',
      'Aromatics and Bonding',
    ],
  },
} as const satisfies Record<string, { label: string; topics: readonly string[] }>;

export type SubjectId = keyof typeof SUBJECTS;

export const SUBJECT_IDS = Object.keys(SUBJECTS) as SubjectId[];

export function isSubjectId(value: string | null): value is SubjectId {
  return value !== null && value in SUBJECTS;
}

export function topicsFor(subject: SubjectId): readonly string[] {
  return SUBJECTS[subject].topics;
}
