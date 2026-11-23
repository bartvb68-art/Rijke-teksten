// Voorlezen met de spraak van de browser (geen externe dienst). Werkt als het apparaat een Nederlandse stem heeft.
let voice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const voices = speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang === 'nl-NL') || voices.find((v) => v.lang?.startsWith('nl')) || null;
  return voice;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}
export const canSpeak = () => 'speechSynthesis' in window;

export function htmlToSpeech(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('.gap').forEach((g) => { g.textContent = ' puntje puntje ' ; });
  div.querySelectorAll('.alinea').forEach((a) => { a.textContent = `Alinea ${a.textContent}. `; });
  div.querySelectorAll('br, p, h3, li, tr').forEach((el) => el.append(' . '));
  return div.textContent.replace(/\s+/g, ' ').replace(/(\s\.)+/g, '.').trim();
}

export function speak(text, { onend } = {}) {
  if (!canSpeak()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'nl-NL';
  if (voice || pickVoice()) u.voice = voice;
  u.rate = 0.92;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}
export function stopSpeaking() { if (canSpeak()) speechSynthesis.cancel(); }
