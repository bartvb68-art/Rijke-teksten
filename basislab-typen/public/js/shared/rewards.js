// Beloningen: winkel (hangar) en badges. Gedeeld door server en browser.

export const SHOP = {
  body: [
    { id: 'wit', name: 'Wit', price: 0, color: '#eef1f8' },
    { id: 'rood', name: 'Rood', price: 0, color: '#e34948' },
    { id: 'blauw', name: 'Blauw', price: 0, color: '#3987e5' },
    { id: 'groen', name: 'Groen', price: 40, color: '#1baf7a' },
    { id: 'oranje', name: 'Oranje', price: 40, color: '#eb6834' },
    { id: 'roze', name: 'Roze', price: 60, color: '#e87ba4' },
    { id: 'paars', name: 'Paars', price: 80, color: '#9085e9' },
    { id: 'goud', name: 'Goud', price: 250, color: '#f2c14e' },
  ],
  pattern: [
    { id: 'geen', name: 'Geen', price: 0 },
    { id: 'strepen', name: 'Strepen', price: 50 },
    { id: 'stippen', name: 'Stippen', price: 50 },
    { id: 'sterren', name: 'Sterren', price: 120 },
    { id: 'bliksem', name: 'Bliksem', price: 180 },
  ],
  window: [
    { id: 'blauw', name: 'Blauw raam', price: 0, color: '#86b6ef' },
    { id: 'groen', name: 'Groen raam', price: 30, color: '#7fe0b8' },
    { id: 'goud', name: 'Gouden raam', price: 90, color: '#ffe08a' },
  ],
  flame: [
    { id: 'vuur', name: 'Vuur', price: 0, color: '#ff9a3c' },
    { id: 'ijs', name: 'IJsvlam', price: 80, color: '#7fd3ff' },
    { id: 'neon', name: 'Neon', price: 140, color: '#b7ff5a' },
    { id: 'paars', name: 'Plasma', price: 200, color: '#d08bff' },
  ],
};

export const DEFAULT_AVATAR = { body: 'blauw', pattern: 'geen', window: 'blauw', flame: 'vuur' };

export function shopItem(slot, id) {
  return (SHOP[slot] || []).find((i) => i.id === id) || null;
}

export function isFree(slot, id) {
  const item = shopItem(slot, id);
  return !!item && item.price === 0;
}

// icon verwijst naar een icoon in js/icons.js
export const BADGES = [
  { id: 'eerste-lancering', name: 'Eerste lancering', desc: 'Je eerste oefening gedaan.', icon: 'rocket' },
  { id: 'planeet-1', name: 'Thuisbasis veroverd', desc: 'Alle lessen van de Thuisbasis gehaald.', icon: 'planet' },
  { id: 'planeet-2', name: 'Klinker-kenner', desc: 'Alle lessen van Planeet Klinker gehaald.', icon: 'planet' },
  { id: 'planeet-3', name: 'Komeetkust-kampioen', desc: 'Alle lessen van de Komeetkust gehaald.', icon: 'planet' },
  { id: 'planeet-4', name: 'Hoofdletterheld', desc: 'Alle lessen van de Hoofdletterhaven gehaald.', icon: 'planet' },
  { id: 'planeet-5', name: 'Cijferkoning', desc: 'Alle lessen van de Cijferkomeet gehaald.', icon: 'planet' },
  { id: 'diploma', name: 'Typediploma', desc: 'Het typediploma gehaald!', icon: 'diploma' },
  { id: 'scherpschutter', name: 'Scherpschutter', desc: 'Een oefening van 50+ tekens zonder één fout.', icon: 'target' },
  { id: 'snel-60', name: 'Turbo 60', desc: '60 aanslagen per minuut in een sterrentest.', icon: 'bolt' },
  { id: 'snel-100', name: 'Turbo 100', desc: '100 aanslagen per minuut in een sterrentest.', icon: 'bolt' },
  { id: 'snel-150', name: 'Lichtsnelheid', desc: '150 aanslagen per minuut in een sterrentest.', icon: 'bolt' },
  { id: 'reeks-3', name: 'Drie dagen op rij', desc: '3 dagen achter elkaar geoefend.', icon: 'flame' },
  { id: 'reeks-7', name: 'Week vol vuur', desc: '7 dagen achter elkaar geoefend.', icon: 'flame' },
  { id: 'weekdoel', name: 'Weekdoel gehaald', desc: 'Het weekdoel van je juf of meester gehaald.', icon: 'calendar' },
  { id: 'drie-sterren-5', name: 'Sterrenverzamelaar', desc: '5 lessen met 3 sterren.', icon: 'star' },
  { id: 'meteoren-1000', name: 'Meteorenjager', desc: '1000 punten bij Meteorenstorm.', icon: 'meteor' },
  { id: 'meteoren-5000', name: 'Planeetredder', desc: '5000 punten bij Meteorenstorm.', icon: 'meteor' },
  { id: 'race-winnaar', name: 'Racewinnaar', desc: 'Eerste geworden bij de Raketrace.', icon: 'trophy' },
];

export const BADGE_BY_ID = Object.fromEntries(BADGES.map((b) => [b.id, b]));
