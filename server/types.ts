export const GROEPEN = {
  '3': { label: 'Groep 3', avi: 'AVI M3–E3', woorden: 'korte zinnen (max. 8–10 woorden), alledaagse woorden, veel herhaling' },
  '4': { label: 'Groep 4', avi: 'AVI M4–E4', woorden: 'korte zinnen, concrete woorden, een enkel nieuw woord dat in de tekst wordt uitgelegd' },
  '5': { label: 'Groep 5', avi: 'AVI M5–E5', woorden: 'afwisselende zinslengte, enkele vaktermen die in de tekst worden uitgelegd' },
  '6': { label: 'Groep 6', avi: 'AVI M6–E6', woorden: 'samengestelde zinnen, vaktaal met uitleg, verbanden (doordat, omdat, daardoor)' },
  '7': { label: 'Groep 7', avi: 'AVI M7–E7', woorden: 'rijke woordenschat, abstractere begrippen, oorzaak-gevolg en vergelijkingen' },
  '8': { label: 'Groep 8', avi: 'AVI Plus', woorden: 'rijke en precieze woordenschat, abstracte begrippen, meerdere perspectieven, voorbereiding op het voortgezet onderwijs' },
} as const;
export type GroepId = keyof typeof GROEPEN;

export const LENGTES = {
  kort: { label: 'Kort (± 300 woorden)', woorden: 300 },
  middel: { label: 'Middel (± 500 woorden)', woorden: 500 },
  lang: { label: 'Lang (± 800 woorden)', woorden: 800 },
  extra: { label: 'Extra lang (± 1200 woorden)', woorden: 1200 },
} as const;
export type LengteId = keyof typeof LENGTES;

export const TEKSTSOORTEN = {
  informatief: 'Informatieve tekst (zakelijk, legt uit hoe het zit)',
  nieuws: 'Nieuwsartikel (actueel, wie/wat/waar/wanneer/waarom)',
  uitleg: 'Uitlegtekst (hoe werkt het? stap voor stap)',
  betoog: 'Betoog / mening (twee kanten en argumenten)',
  verhalend: 'Verhalend-informatief (informatie verpakt in een verhaal)',
} as const;
export type TekstsoortId = keyof typeof TEKSTSOORTEN;

export interface Aanvraag {
  thema: string;
  groep: GroepId;
  lengte: LengteId;
  tekstsoort: TekstsoortId;
  bronnen: string[];
}

export interface GevondenBron {
  nr: number;
  titel: string;
  url: string;
  bron: string; // naam van de erkende bron
  video: boolean;
}

export interface Lesmateriaal {
  titel: string;
  introductie: string;
  hoofdtekst: string; // met ## tussenkopjes
  woorden: { woord: string; uitleg: string }[];
  vragen: { soort: string; vraag: string; antwoord: string }[];
  meerkeuze: { vraag: string; opties: { A: string; B: string; C: string; D: string }; antwoord: 'A' | 'B' | 'C' | 'D'; uitleg: string }[];
  differentiatie: { ondersteuning: string; uitdaging: string };
  bronnen: GevondenBron[]; // alleen echt gevonden en gecontroleerde bronnen
  beeldmateriaal: GevondenBron[];
  groep: GroepId;
  thema: string;
}
