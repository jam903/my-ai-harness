// The DAT curriculum, transcribed from the official ADA *DAT User's Manual* (© 2026, March 2026),
// Figures 1–4 (pp. 31–34) and the test descriptions (pp. 2–3). Extracted with
// scripts/ephemeral/2026-11-19-extract-ada-dat-spec.mjs. ADR-0010.
//
// Where the official outline nests a fourth level (e.g. Organic V.A "Alkene/Alkyne" → general /
// one-step / multi-step), it is folded into the subtopic's title or `detail` so the tree stays
// subject → topic → subtopic. The PAT and Reading Comprehension have no content figures in the
// manual; their topics are marked as such below.
import type { Curriculum, Practice, Subject, Topic } from './types';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function topic(subjectId: string, code: string, title: string, subtopics: Array<string | [string, string]>): Topic {
  const id = `${subjectId}.${code.toLowerCase()}`;
  return {
    id,
    code,
    title,
    subtopics: subtopics.map((s) => {
      const [t, detail] = typeof s === 'string' ? [s, undefined] : s;
      return { id: `${id}.${slug(t)}`, title: t, ...(detail ? { detail } : {}) };
    }),
  };
}

function subject(
  id: string,
  title: string,
  items: number,
  practice: Practice,
  topics: Array<[string, string, Array<string | [string, string]>]>,
  note?: string,
): Subject {
  return { id, title, items, practice, ...(note ? { note } : {}), topics: topics.map(([c, t, s]) => topic(id, c, t, s)) };
}

const STEPS = 'General, one-step, and multi-step reactions';

export const DAT_CURRICULUM: Curriculum = {
  id: 'dat',
  name: 'DAT',
  source: "ADA DAT User's Manual, March 2026 — Figures 1–4",
  subjects: [
    subject('dat.bio', 'Biology', 40, 'ai', [
      ['I', 'Cell and Molecular Biology', [
        'Cell metabolism (including photosynthesis/enzymology)',
        'Cellular processes (including membrane transport, signal transduction)',
        'Thermodynamics',
        'Mitosis/Meiosis',
        'Cell structure and function',
        'Experimental cell biology',
        'Biomolecules',
        'Integrated relationships',
      ]],
      ['II', 'Diversity of Life', [
        'Viruses', 'Archaebacteria', 'Eubacteria', 'Fungi', 'Protista', 'Plantae', 'Animalia', 'Integrated relationships',
      ]],
      ['III', 'Structure and Function of Systems', [
        'Integumentary', 'Skeletal', 'Muscular', 'Circulatory', 'Lymphatic/immune', 'Digestive', 'Respiratory',
        'Urinary', 'Nervous/sensory', 'Endocrine', 'Reproductive', 'Integrated relationships',
      ]],
      ['IV', 'Genetics', [
        'Molecular genetics', 'Human genetics', 'Classical genetics', 'Chromosomal genetics', 'Genetic technology',
        'Developmental mechanisms', 'Genomics', 'Gene expression', 'Epigenetics', 'Integrated relationships',
      ]],
      ['V', 'Evolution and Ecology', [
        'Natural selection',
        'Population genetics/speciation',
        'Animal behavior',
        'Ecology (population, community, and ecosystem)',
        'Integrated relationships',
      ]],
    ]),
    subject('dat.gc', 'General Chemistry', 30, 'ai', [
      ['I', 'Stoichiometry and General Concepts', [
        'Percent composition', 'Empirical formulae', 'Balancing equations', 'Moles and molecular formulas', 'Molar mass',
        'Density', 'Calculations from balanced equations',
      ]],
      ['II', 'Gases', [
        'Kinetic molecular theory of gases', "Dalton's gas law", "Boyle's gas law", "Charles's gas law", 'Ideal gas law',
      ]],
      ['III', 'Liquids and Solids', ['Intermolecular forces', 'Phase changes', 'Vapor pressure', 'Structures', 'Polarity', 'Properties']],
      ['IV', 'Solutions', ['Polarity', 'Colligative properties', 'Non-colligative properties', 'Forces', 'Concentration calculations']],
      ['V', 'Acids and Bases', ['pH', 'Strength', 'Brønsted-Lowry reactions', 'Calculations']],
      ['VI', 'Chemical Equilibria', ['Molecular', 'Acid/base', 'Precipitation', 'Calculations', "Le Chatelier's principle"]],
      ['VII', 'Thermodynamics and Thermochemistry', [
        'Laws of thermodynamics', "Hess's law", 'Spontaneity', 'Enthalpies and entropies', 'Heat transfer',
      ]],
      ['VIII', 'Chemical Kinetics', ['Rate laws', 'Activation energy', 'Half-life']],
      ['IX', 'Oxidation-Reduction Reactions', [
        'Balancing equations', 'Determination of oxidation numbers', 'Electrochemical calculations',
        'Electrochemical concepts and terminology',
      ]],
      ['X', 'Atomic and Molecular Structure', [
        'Electron configuration', 'Orbital types', 'Lewis-dot diagrams', 'Atomic theory', 'Quantum theory',
        'Molecular geometry', 'Bond types', 'Sub-atomic particles',
      ]],
      ['XI', 'Periodic Properties', ['Representative elements', 'Transition elements', 'Periodic trends', 'Descriptive chemistry']],
      ['XII', 'Nuclear Reactions', ['Balancing equations', 'Binding energy', 'Decay processes', 'Particles', 'Terminology']],
      ['XIII', 'Laboratory', ['Basic techniques', 'Equipment', 'Error analysis', 'Safety', 'Data analysis']],
    ]),
    subject('dat.oc', 'Organic Chemistry', 30, 'ai', [
      ['I', 'Mechanisms: Energetics and Structure', [
        'Elimination', 'Addition', 'Free radical', 'Substitution mechanisms', 'Other mechanisms and reactions',
      ]],
      ['II', 'Chemical and Physical Properties of Molecules', [
        'Spectroscopy: ¹H NMR',
        'Spectroscopy: ¹³C NMR',
        'Spectroscopy: infrared',
        'Spectroscopy: multi-spectra',
        'Structure: polarity',
        ['Structure: intermolecular forces', 'Solubility, melting/boiling point, etc.'],
        ['Laboratory theory and techniques', 'TLC, separations, etc.'],
      ]],
      ['III', 'Stereochemistry (Structure Evaluation)', ['Chirality', 'Isomer relationships', 'Conformations']],
      ['IV', 'Nomenclature', ['IUPAC rules', 'Functional groups in molecules']],
      ['V', 'Reactions of the Major Functional Groups and Synthesis', [
        ['Alkene/alkyne reactions', STEPS],
        ['Aromatic reactions', STEPS],
        ['Substitution/elimination reactions', STEPS],
        ['Aldehyde/ketone reactions', STEPS],
        ['Carboxylic acids and derivatives', STEPS],
        ['Other functional group reactions', STEPS],
      ]],
      ['VI', 'Acid-Base Chemistry', [
        'Ranking acidity/basicity: structure analysis',
        'Ranking acidity/basicity: pH/pKa data analysis',
        'Prediction of products and equilibria',
      ]],
      ['VII', 'Aromatics and Bonding', [
        'Concept of aromaticity', 'Resonance', 'Atomic/molecular orbitals', 'Hybridization', 'Bond angles/lengths',
      ]],
    ]),
    subject('dat.qr', 'Quantitative Reasoning', 40, 'ai', [
      ['I.A', 'Algebra', [
        'Equations and expressions', 'Inequalities', 'Exponential notation', 'Absolute value', 'Ratios and proportions',
        'Graphical analysis',
      ]],
      ['I.B', 'Data Analysis, Interpretation, and Sufficiency', ['Data analysis, interpretation, and sufficiency']],
      ['I.C', 'Quantitative Comparison', ['Quantitative comparison']],
      ['I.D', 'Probability and Statistics', ['Probability and statistics']],
      ['II', 'Applied Mathematics (Word) Problems', ['Applied mathematics (word) problems']],
    ], 'No calculus; first-year college math (manual p. 3). 30 mathematics + 10 applied items.'),
    subject('dat.pat', 'Perceptual Ability', 90, 'external', [
      ['1', 'Apertures (object visualization)', ['Apertures strategy']],
      ['2', 'View recognition (object visualization)', ['View recognition strategy']],
      ['3', 'Angle discrimination', ['Angle discrimination strategy']],
      ['4', 'Paper folding', ['Paper folding strategy']],
      ['5', 'Cube counting (block counting)', ['Cube counting strategy']],
      ['6', '3D form development', ['Form development strategy']],
    ], 'The manual names these six factors but publishes no content figure. Learn teaches strategy; practise the visual puzzles in a dedicated PAT tool.'),
    subject('dat.rc', 'Reading Comprehension', 50, 'passage', [
      ['1', 'Reading Science Passages', [
        'Main idea and passage structure',
        'Detail and fact retrieval',
        'Inference and reasoning',
        ['Pacing', 'Three passages of about 1,100–1,400 words, ~15–20 items each'],
      ]],
    ], 'The manual publishes no content figure (passages cover undergraduate science). These are reading-skill topics, not official headings.'),
  ],
};
