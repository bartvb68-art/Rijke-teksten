// Beloningen: winkel (studio) en badges. Gedeeld door server en browser.

export const SHOP = {
  body: [
    { id: 'rood', name: 'Rood', price: 0, color: '#e34948' },
    { id: 'blauw', name: 'Blauw', price: 0, color: '#3987e5' },
    { id: 'hout', name: 'Hout', price: 0, color: '#c98a4b' },
    { id: 'groen', name: 'Groen', price: 40, color: '#1baf7a' },
    { id: 'oranje', name: 'Oranje', price: 40, color: '#eb6834' },
    { id: 'roze', name: 'Roze', price: 60, color: '#e87ba4' },
    { id: 'paars', name: 'Paars', price: 80, color: '#9085e9' },
    { id: 'zwart', name: 'Zwart', price: 100, color: '#2b2b33' },
    { id: 'goud', name: 'Goud', price: 250, color: '#f2c14e' },
  ],
  pattern: [
    { id: 'geen', name: 'Geen', price: 0 },
    { id: 'strepen', name: 'Racestrepen', price: 50 },
    { id: 'stippen', name: 'Stippen', price: 50 },
    { id: 'noten', name: 'Muzieknoten', price: 120 },
    { id: 'bliksem', name: 'Bliksem', price: 180 },
  ],
  guard: [
    { id: 'wit', name: 'Witte slagplaat', price: 0, color: '#f4f1ea' },
    { id: 'zwart', name: 'Zwarte slagplaat', price: 30, color: '#1c1c22' },
    { id: 'parel', name: 'Parelmoer', price: 90, color: '#d9f0f2' },
  ],
  waves: [
    { id: 'geel', name: 'Gele klanken', price: 0, color: '#ffc23d' },
    { id: 'aqua', name: 'Aqua klanken', price: 80, color: '#7fd3ff' },
    { id: 'neon', name: 'Neon klanken', price: 140, color: '#b7ff5a' },
    { id: 'plasma', name: 'Plasma klanken', price: 200, color: '#d08bff' },
  ],
};

export const DEFAULT_AVATAR = { body: 'rood', pattern: 'geen', guard: 'wit', waves: 'geel' };

export function shopItem(slot, id) {
  return (SHOP[slot] || []).find((i) => i.id === id) || null;
}

export function isFree(slot, id) {
  const item = shopItem(slot, id);
  return !!item && item.price === 0;
}

// icon verwijst naar een icoon in js/icons.js
export const BADGES = [
  { id: 'eerste-noot', name: 'Eerste noot', desc: 'Je eerste oefening gedaan.', icon: 'note' },
  { id: 'podium-1', name: 'Oefenhok-held', desc: 'Alle lessen van het Oefenhok gehaald.', icon: 'stage' },
  { id: 'podium-2', name: 'Repetitiekampioen', desc: 'Alle lessen van de Repetitieruimte gehaald.', icon: 'stage' },
  { id: 'podium-3', name: 'Clubster', desc: 'Alle lessen van het Clubpodium gehaald.', icon: 'stage' },
  { id: 'podium-4', name: 'Festivalfan', desc: 'Alle lessen van de Festivaltent gehaald.', icon: 'stage' },
  { id: 'podium-5', name: 'Hoofdact', desc: 'Alle lessen van het Hoofdpodium gehaald.', icon: 'stage' },
  { id: 'diploma', name: 'Ontleeddiploma', desc: 'Het ontleeddiploma gehaald!', icon: 'diploma' },
  { id: 'foutloos', name: 'Foutloos optreden', desc: 'Een optreden zonder één fout.', icon: 'target' },
  { id: 'vlot', name: 'Vlotte ontleder', desc: 'Een optreden met 90% goed in gemiddeld minder dan 12 seconden per zin.', icon: 'bolt' },
  { id: 'proefkoning', name: 'Proefkampioen', desc: '100 zinsdelen goed benoemd.', icon: 'check' },
  { id: 'reeks-3', name: 'Drie dagen op rij', desc: '3 dagen achter elkaar geoefend.', icon: 'flame' },
  { id: 'reeks-7', name: 'Week vol muziek', desc: '7 dagen achter elkaar geoefend.', icon: 'flame' },
  { id: 'weekdoel', name: 'Weekdoel gehaald', desc: 'Het weekdoel van je juf of meester gehaald.', icon: 'calendar' },
  { id: 'drie-sterren-5', name: 'Sterrenverzamelaar', desc: '5 lessen met 3 sterren.', icon: 'star' },
  { id: 'notenregen-1000', name: 'Ritmegevoel', desc: '1000 punten bij Notenregen.', icon: 'note' },
  { id: 'notenregen-5000', name: 'Ritmemeester', desc: '5000 punten bij Notenregen.', icon: 'note' },
  { id: 'combo-15', name: 'Combokoning', desc: '15 zinsdelen achter elkaar goed bij Notenregen.', icon: 'bolt' },
  { id: 'battle-winnaar', name: 'Battlewinnaar', desc: 'Eerste geworden bij de Bandbattle.', icon: 'trophy' },
];

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));
