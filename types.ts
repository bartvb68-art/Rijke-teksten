
export enum Groep {
  GROEP_4 = 'Groep 4 (Avi E4)',
  GROEP_5 = 'Groep 5 (Avi E5)',
  GROEP_6 = 'Groep 6 (Avi E6)',
  GROEP_7 = 'Groep 7 (Avi E7)',
  GROEP_8 = 'Groep 8 (Avi plus)',
}

export enum Lengte {
  KORT = 'Kort (500 woorden)',
  MIDDEL = 'Middel (750 woorden)',
  LANG = 'Lang (1250 woorden)',
}

export interface MediaSuggestion {
  titel: string;
  beschrijving: string;
  url: string;
}

export interface Vraag {
  type: string;
  vraag: string;
}

export interface CitoVraag {
  vraag: string;
  opties: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  antwoord: string;
}

export interface GeneratedContent {
  titel: string;
  introductie: {
    tekst: string;
    beeldmateriaal: MediaSuggestion[];
  };
  hoofdtekst: string;
  vragen: Vraag[];
  citoVragen: CitoVraag[];
  differentiatie: {
    uitdaging: string;
    ondersteuning: string;
  };
  bronvermelding: string[];
}

export interface AppState {
  groep: Groep | '';
  thema: string;
  lengte: Lengte | '';
  isGenerating: boolean;
  content: GeneratedContent | null;
  audioBlob: Blob | null;
  error: string | null;
}
