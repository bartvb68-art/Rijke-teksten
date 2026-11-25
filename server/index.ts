import express, { type NextFunction, type Request, type Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createHash, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { BRONNEN } from './bronnen.ts';
import { GROEPEN, LENGTES, TEKSTSOORTEN, type Aanvraag, type Lesmateriaal } from './types.ts';
import { GebruikersFout, genereer, MODEL } from './generator.ts';
import { genereerMock } from './mock.ts';
import { maakDocx } from './docx.ts';

const MOCK = process.env.MOCK === '1';
const POORT = Number(process.env.PORT || 8080);
const TOEGANGSCODE = process.env.TOEGANGSCODE || '';
const hier = path.dirname(fileURLToPath(import.meta.url));

if (!MOCK && !process.env.ANTHROPIC_API_KEY) {
  console.warn('Let op: ANTHROPIC_API_KEY is niet ingesteld. Start met MOCK=1 om zonder sleutel te testen.');
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(hier, '..', 'public'), { extensions: ['html'] }));

const hash = (s: string) => createHash('sha256').update(s).digest();
function codeOk(req: Request) {
  if (!TOEGANGSCODE) return true;
  const gegeven = String(req.get('x-toegangscode') ?? '');
  return timingSafeEqual(hash(gegeven), hash(TOEGANGSCODE));
}
function vereisCode(req: Request, res: Response, next: NextFunction) {
  if (codeOk(req)) return next();
  res.status(401).json({ fout: 'De toegangscode klopt niet.' });
}

app.get('/api/config', (_req, res) => {
  res.json({
    bronnen: BRONNEN,
    groepen: Object.entries(GROEPEN).map(([id, g]) => ({ id, label: `${g.label} (${g.avi})` })),
    lengtes: Object.entries(LENGTES).map(([id, l]) => ({ id, label: l.label })),
    tekstsoorten: Object.entries(TEKSTSOORTEN).map(([id, label]) => ({ id, label })),
    codeNodig: !!TOEGANGSCODE,
    testmodus: MOCK,
  });
});

app.post('/api/controleer-code', (req, res) => {
  res.status(codeOk(req) ? 200 : 401).json({ ok: codeOk(req) });
});

function leesAanvraag(body: any): Aanvraag | string {
  const thema = String(body?.thema ?? '').trim().replace(/\s+/g, ' ');
  if (thema.length < 2 || thema.length > 150) return 'Vul een thema in (maximaal 150 tekens).';
  if (!(body.groep in GROEPEN)) return 'Kies een groep.';
  if (!(body.lengte in LENGTES)) return 'Kies een lengte.';
  if (!(body.tekstsoort in TEKSTSOORTEN)) return 'Kies een tekstsoort.';
  const bronnen = Array.isArray(body.bronnen) ? body.bronnen.map(String) : [];
  return { thema, groep: body.groep, lengte: body.lengte, tekstsoort: body.tekstsoort, bronnen };
}

app.post('/api/genereer', vereisCode, async (req, res) => {
  const aanvraag = leesAanvraag(req.body);
  if (typeof aanvraag === 'string') return void res.status(400).json({ fout: aanvraag });

  // Voortgang als NDJSON: elke regel is één JSON-bericht.
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  const stuur = (o: unknown) => res.write(JSON.stringify(o) + '\n');
  const meld = (tekst: string) => stuur({ type: 'status', tekst });
  const hartslag = setInterval(() => stuur({ type: 'hartslag' }), 15000);

  try {
    const onderzoekId = typeof req.body.onderzoekId === 'string' ? req.body.onderzoekId : undefined;
    const r = await (MOCK ? genereerMock : genereer)(aanvraag, onderzoekId, meld);
    stuur({ type: 'klaar', ...r });
  } catch (e) {
    let fout = 'Er ging iets mis bij het maken van de tekst. Probeer het nog eens.';
    if (e instanceof GebruikersFout) fout = e.message;
    else if (e instanceof Anthropic.AuthenticationError) fout = 'De API-sleutel van de server is ongeldig. Neem contact op met de beheerder.';
    else if (e instanceof Anthropic.RateLimitError) fout = 'Het is even te druk. Probeer het over een minuut opnieuw.';
    else if (e instanceof Anthropic.APIError) fout = `De AI-dienst gaf een fout (${e.status ?? 'onbekend'}). Probeer het nog eens.`;
    console.error('[genereer]', e);
    stuur({ type: 'fout', fout });
  } finally {
    clearInterval(hartslag);
    res.end();
  }
});

app.post('/api/docx', vereisCode, async (req, res) => {
  const m = req.body?.materiaal as Lesmateriaal | undefined;
  const versie = req.body?.versie === 'leerkracht' ? 'leerkracht' : 'leerling';
  if (!m || typeof m.titel !== 'string' || typeof m.hoofdtekst !== 'string' || !Array.isArray(m.vragen)) {
    return void res.status(400).json({ fout: 'Geen geldig lesmateriaal.' });
  }
  try {
    const buf = await maakDocx(m, versie);
    const naam = `${m.titel}${versie === 'leerkracht' ? ' - leerkracht' : ''}`.replace(/[^\p{L}\p{N} _-]/gu, '').slice(0, 80) || 'tekst';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="tekst.docx"; filename*=UTF-8''${encodeURIComponent(naam)}.docx`);
    res.send(buf);
  } catch (e) {
    console.error('[docx]', e);
    res.status(500).json({ fout: 'Het Word-bestand kon niet worden gemaakt.' });
  }
});

app.get('/gezond', (_req, res) => res.send('ok'));

app.listen(POORT, () => {
  console.log(`Basislab Teksten draait op http://localhost:${POORT}${MOCK ? ' (testmodus)' : ` (model: ${MODEL})`}`);
});
