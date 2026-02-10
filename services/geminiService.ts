
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GeneratedContent, Groep, Lengte } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateDidacticContent = async (
  groep: Groep,
  thema: string,
  lengte: Lengte
): Promise<GeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Je bent een didactische tekstgenerator voor leerkrachten in het primair onderwijs. 
    Genereer een rijke tekst en bijbehorende materialen op basis van de volgende inputs:
    
    1. Doelgroep: ${groep}
    2. Thema: ${thema}
    3. Lengte: ${lengte}
    
    KWALITEITSEISEN VOOR DE TEKST:
    - Bedenk een pakkende, informatieve titel.
    - Schrijf de tekst met duidelijke tussenkopjes (## Kopje).
    - De tekst moet een 'rijke tekst' zijn: betekenisvol, uitdagend maar toegankelijk, met een rijke woordenschat passend bij ${groep}.
    - Gebruik GEEN nieuwe informatie die niet in de context van de bronnen staat.
    - Formattering: Titel, dan een lege regel. Voor elk tussenkopje een lege regel, na elk tussenkopje direct de tekst op een nieuwe regel.
    
    VERIFICATIE VAN VIDEO-LINKS (CRITICAL):
    - Gebruik de Google Search tool om te zoeken naar video's op schooltv.nl of beeldengeluid.nl over "${thema}".
    - Je MOET de URL's die je vindt letterlijk overnemen. 
    - Controleer of de link begint met 'https://schooltv.nl/video/' of een geldige Beeld en Geluid link is.
    - Als je geen 100% werkende, bestaande link kunt vinden, laat het veld 'url' dan leeg of geef een link naar de algemene zoekpagina van SchoolTV voor dit thema. Verzin NOOIT zelf een URL die op een video-id lijkt.
    
    VRAGEN:
    - 6 standaard didactische vragen (Reproductie, Begrijpend lezen, Woordenschat, Denk/Mening, Toepassing, SLO Burgerschap).
    - 5 CITO-stijl meerkeuzevragen (A t/m D) met het juiste antwoord apart vermeld.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          titel: { type: Type.STRING },
          introductie: {
            type: Type.OBJECT,
            properties: {
              tekst: { type: Type.STRING },
              beeldmateriaal: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    titel: { type: Type.STRING },
                    beschrijving: { type: Type.STRING },
                    url: { type: Type.STRING }
                  },
                  required: ["titel", "beschrijving", "url"]
                }
              }
            },
            required: ["tekst", "beeldmateriaal"]
          },
          hoofdtekst: { type: Type.STRING },
          vragen: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                vraag: { type: Type.STRING }
              },
              required: ["type", "vraag"]
            }
          },
          citoVragen: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                vraag: { type: Type.STRING },
                opties: {
                  type: Type.OBJECT,
                  properties: {
                    A: { type: Type.STRING },
                    B: { type: Type.STRING },
                    C: { type: Type.STRING },
                    D: { type: Type.STRING }
                  },
                  required: ["A", "B", "C", "D"]
                },
                antwoord: { type: Type.STRING }
              },
              required: ["vraag", "opties", "antwoord"]
            }
          },
          differentiatie: {
            type: Type.OBJECT,
            properties: {
              uitdaging: { type: Type.STRING },
              ondersteuning: { type: Type.STRING }
            },
            required: ["uitdaging", "ondersteuning"]
          },
          bronvermelding: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["titel", "introductie", "hoofdtekst", "vragen", "citoVragen", "differentiatie", "bronvermelding"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Geen respons van de AI ontvangen.");
  return JSON.parse(text);
};

export const generateAudio = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Strip markdown headings for cleaner TTS
  const cleanText = text.replace(/##\s+/g, '').replace(/\n+/g, ' ');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Lees deze tekst voor op een rustig, duidelijk tempo voor basisschoolleerlingen: ${cleanText}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("Kon geen audio genereren.");
  return base64Audio;
};
