// 2026-11-19 — Extract text from the ADA DAT User's Manual PDF to read the official DAT
// content specifications (for ADR-0010's curriculum question). WebFetch could not decode the
// PDF and pdftotext/poppler is not installed; pdfjs-dist is installed in the session scratchpad
// (not the project) and passed in by path, so the project gains no dependency.
//
// Usage: node scripts/ephemeral/2026-11-19-extract-ada-dat-spec.mjs <pdfjs-dir> <pdf> <out.txt>
// The PDF is untrusted web content: this script only parses text out of it.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const [pdfjsDir, pdfPath, outPath] = process.argv.slice(2);
const pdfjs = await import(pathToFileURL(join(pdfjsDir, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs')).href);

const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(pdfPath)), isEvalSupported: false }).promise;
let out = '';
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();
  let line = '';
  let lastY = null;
  for (const item of content.items) {
    const y = item.transform[5];
    if (lastY !== null && Math.abs(y - lastY) > 2) {
      out += line.trimEnd() + '\n';
      line = '';
    }
    line += item.str;
    lastY = y;
  }
  out += line.trimEnd() + `\n\n=== end page ${p} ===\n\n`;
}
writeFileSync(outPath, out);
console.log(`pages: ${doc.numPages}, chars: ${out.length} -> ${outPath}`);

// OUTCOME (2026-11-19): worked — 38 pages; the manual is the © 2026 edition dated March 2026
// (covers 2025 attempts after the March 1, 2025 scoring change). Content specifications are
// Figures 1–4 on pp. 31–34: Biology (40 items, 5 areas), General Chemistry (30, 13 areas),
// Organic Chemistry (30, 7 areas), Quantitative Reasoning (40). PAT (90 items, 6 factors) and
// RCT (50 items, 3 passages) are described in prose only. Findings: the topic lists shipped in
// ADR-0004 were partly wrong — Biology has no top-level "Developmental Biology" (it is Genetics
// IV.F "Developmental mechanisms") and is titled "Evolution and Ecology"; Organic Chemistry
// includes spectroscopy (II.A). These figures became src/curriculum/dat.ts (ADR-0010).
// Run with: pdfjs-dist@4.10.38 installed --ignore-scripts in the session scratchpad.
