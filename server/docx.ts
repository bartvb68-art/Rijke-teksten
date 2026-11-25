import { AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { Lesmateriaal } from './types.ts';
import { GROEPEN } from './types.ts';

const ACCENT = 'FF4D2E';
const p = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number; color?: string } = {}) =>
  new Paragraph({ children: [new TextRun({ text, ...opts })], spacing: { after: 160, line: 360 } });
const kop = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel] = HeadingLevel.HEADING_2) =>
  new Paragraph({ heading: level, children: [new TextRun({ text, color: level === HeadingLevel.HEADING_1 ? '17171B' : ACCENT })], spacing: { before: 320, after: 160 } });

function hoofdtekst(t: string): Paragraph[] {
  return t
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => (r.startsWith('## ') ? kop(r.slice(3), HeadingLevel.HEADING_3) : p(r)));
}

export async function maakDocx(m: Lesmateriaal, versie: 'leerling' | 'leerkracht'): Promise<Buffer> {
  const docent = versie === 'leerkracht';
  const kinderen: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: `Basislab Teksten · ${GROEPEN[m.groep]?.label ?? ''}${docent ? ' · Leerkrachtversie' : ''}`, size: 18, color: '6B6B78' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: ACCENT, space: 4 } },
      spacing: { after: 240 },
    }),
    kop(m.titel, HeadingLevel.HEADING_1),
  ];
  if (docent) {
    kinderen.push(kop('Introductie (voorlezen)'), p(m.introductie, { italics: true }));
    if (m.beeldmateriaal.length) {
      kinderen.push(kop('Video als introductie'));
      for (const v of m.beeldmateriaal)
        kinderen.push(new Paragraph({ children: [new ExternalHyperlink({ link: v.url, children: [new TextRun({ text: `${v.titel} (${v.bron})`, style: 'Hyperlink' })] })], spacing: { after: 120 } }));
    }
    kinderen.push(kop('De tekst'));
  }
  kinderen.push(...hoofdtekst(m.hoofdtekst));

  kinderen.push(kop('Woordenlijst'));
  for (const w of m.woorden) kinderen.push(new Paragraph({ children: [new TextRun({ text: `${w.woord}: `, bold: true }), new TextRun(w.uitleg)], spacing: { after: 100, line: 320 } }));

  kinderen.push(kop('Vragen bij de tekst'));
  m.vragen.forEach((v, i) => {
    kinderen.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. `, bold: true }), new TextRun(v.vraag)], spacing: { before: 120, after: 60, line: 320 } }));
    if (docent) kinderen.push(p(`${v.soort} – Antwoord: ${v.antwoord}`, { italics: true, color: '166534' }));
    else kinderen.push(p('…………………………………………………………………………………………', { color: 'A7A7B3' }));
  });

  kinderen.push(kop('Meerkeuzevragen'));
  m.meerkeuze.forEach((v, i) => {
    kinderen.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${v.vraag}`, bold: true })], spacing: { before: 160, after: 60 } }));
    for (const [letter, tekst] of Object.entries(v.opties)) kinderen.push(new Paragraph({ children: [new TextRun(`${letter}  ${tekst}`)], indent: { left: 400 }, spacing: { after: 40 } }));
    if (docent) kinderen.push(p(`Goed antwoord: ${v.antwoord}. ${v.uitleg}`, { italics: true, color: '166534' }));
  });

  if (docent) {
    kinderen.push(kop('Differentiatie'), p('Extra ondersteuning', { bold: true }), p(m.differentiatie.ondersteuning), p('Extra uitdaging', { bold: true }), p(m.differentiatie.uitdaging));
  }

  kinderen.push(kop('Bronnen'));
  for (const b of m.bronnen)
    kinderen.push(new Paragraph({ children: [new TextRun(`${b.bron}: `), new ExternalHyperlink({ link: b.url, children: [new TextRun({ text: b.titel, style: 'Hyperlink' })] })], spacing: { after: 80 } }));
  kinderen.push(new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'Gemaakt met Basislab Teksten op basis van erkende kinderbronnen. Controleer de tekst altijd voordat je hem in de klas gebruikt.', size: 16, color: '6B6B78' })], spacing: { before: 300 } }));

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Verdana', size: 24 } } } },
    sections: [{ children: kinderen }],
  });
  return Packer.toBuffer(doc);
}
