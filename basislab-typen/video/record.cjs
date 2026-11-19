// Neemt de uitlegvideo op door de echte app te bedienen met Playwright.
// Per segment worden schermbeelden (CDP screencast) met tijdstempels opgeslagen in video/out/frames/<id>/.
// Gebruik: BASE=http://localhost:3100 node video/record.cjs [segment-id ...]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = path.join(__dirname, process.env.VIDEO_OUT || 'out');
const timing = JSON.parse(fs.readFileSync(path.join(OUT, 'timing.json'), 'utf8'));
const only = process.argv.slice(2);
const VIEW = { width: 1440, height: 810 };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CURSOR = `
(() => {
  if (window.__cursor) return;
  window.__cursor = true;
  const add = () => {
    const c = document.createElement('div');
    c.id = 'demo-cursor';
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5L9 20z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:transform .02s linear;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))';
    document.documentElement.appendChild(c);
    const ring = document.createElement('div');
    ring.style.cssText = 'position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:3px solid #ffc23d;z-index:2147483646;pointer-events:none;opacity:0;transition:opacity .35s, transform .35s';
    document.documentElement.appendChild(ring);
    let x = -100; let y = -100;
    addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; c.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)'; }, true);
    addEventListener('mousedown', () => { ring.style.transition = 'none'; ring.style.opacity = 1; ring.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(.5)'; requestAnimationFrame(() => { ring.style.transition = 'opacity .45s, transform .45s'; ring.style.opacity = 0; ring.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(1.4)'; }); }, true);
  };
  if (document.documentElement) add(); else addEventListener('DOMContentLoaded', add);
})();`;

class Recorder {
  constructor(page) {
    this.page = page;
    this.frames = [];
    this.dir = null;
  }
  async start(id) {
    this.dir = path.join(OUT, 'frames', id);
    fs.rmSync(this.dir, { recursive: true, force: true });
    fs.mkdirSync(this.dir, { recursive: true });
    this.frames = [];
    this.marks = {};
    this.cdp = await this.page.context().newCDPSession(this.page);
    this.cdp.on('Page.screencastFrame', async ({ data, sessionId }) => {
      const t = Date.now();
      const file = `${String(this.frames.length).padStart(6, '0')}.jpg`;
      this.frames.push({ file, t });
      fs.writeFile(path.join(this.dir, file), Buffer.from(data, 'base64'), () => {});
      try { await this.cdp.send('Page.screencastFrameAck', { sessionId }); } catch { /* gesloten */ }
    });
    await this.cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
    this.t0 = Date.now();
    // forceer een eerste frame
    await this.page.evaluate(() => { document.body.style.outline = '0px solid transparent'; });
  }
  async stop() {
    const end = Date.now();
    await sleep(150);
    await this.cdp.send('Page.stopScreencast');
    await this.cdp.detach();
    fs.writeFileSync(path.join(this.dir, 'frames.json'), JSON.stringify({ start: this.t0, end, marks: this.marks, frames: this.frames }));
    return (end - this.t0) / 1000;
  }
}

function helpers(page) {
  const h = {
    async move(sel, opts = {}) {
      const el = typeof sel === 'string' ? page.locator(sel).first() : sel;
      await el.scrollIntoViewIfNeeded();
      const b = await el.boundingBox();
      if (!b) throw new Error(`niet gevonden: ${sel}`);
      const x = b.x + b.width * (opts.fx ?? 0.5);
      const y = b.y + b.height * (opts.fy ?? 0.5);
      await page.mouse.move(x, y, { steps: opts.steps ?? 22 });
      await sleep(opts.pause ?? 250);
      return { x, y };
    },
    async click(sel, opts = {}) {
      await h.move(sel, opts);
      await page.mouse.down();
      await sleep(90);
      await page.mouse.up();
      await sleep(opts.after ?? 600);
    },
    async type(text, { apm = 180, jitter = 0.35 } = {}) {
      for (const ch of text) {
        await page.keyboard.type(ch);
        await sleep((60000 / apm) * (1 - jitter / 2 + Math.random() * jitter));
      }
    },
    /** Typ wat de app als volgende teken verwacht, met af en toe een fout. */
    async typeLesson({ apm = 60, errorEvery = 0, maxChars = 10000, sel = '.ch.cur' } = {}) {
      let n = 0;
      let stuck = 0;
      let lastPos = null;
      const neighbours = 'asdfghjklqwertyuiopzxcvbnm';
      while (n < maxChars) {
        const [ch, pos] = await page.evaluate((s) => { const el = document.querySelector(s); return [el?.textContent ?? null, el?.dataset.i]; }, sel);
        if (ch == null) break;
        stuck = pos === lastPos ? stuck + 1 : 0;
        lastPos = pos;
        if (stuck > 8) throw new Error('typen loopt vast');
        if (errorEvery && n > 3 && n % errorEvery === 0) {
          let wrong = neighbours[Math.floor(Math.random() * neighbours.length)];
          if (wrong === ch) wrong = 'q';
          await page.keyboard.type(wrong);
          await sleep(60000 / apm * 1.6);
        }
        await page.keyboard.type(ch);
        n += 1;
        const extra = ch === ' ' ? 1.25 : 1;
        await sleep((60000 / apm) * extra * (0.75 + Math.random() * 0.5));
      }
      return n;
    },
    async scroll(dy, ms = 900) {
      const steps = Math.max(1, Math.round(ms / 30));
      for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, dy / steps);
        await sleep(30);
      }
      await sleep(250);
    },
    async dismiss() {
      const btn = page.locator('.modal-backdrop .btn-primary').first();
      if (await btn.count()) { await h.click(btn, { after: 600 }); }
    },
    async scrollTo(sel, ms = 1000, offset = 90) {
      const top = await page.evaluate(([s, o]) => {
        const el = document.querySelector(s);
        return el ? el.getBoundingClientRect().top - o : 0;
      }, [sel, offset]);
      await h.scroll(top, ms);
    },
    sleep,
  };
  return h;
}

async function card(page, title, sub, kind = 'title') {
  await page.goto(`${BASE}/api/health`);
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: Fredoka; src: url('${BASE}/fonts/fredoka-latin-600-normal.woff2'); font-weight: 600; }
    @font-face { font-family: Lexend; src: url('${BASE}/fonts/lexend-latin-400-normal.woff2'); font-weight: 400; }
    html,body{margin:0;height:100%;overflow:hidden}
    body{display:grid;place-items:center;background:radial-gradient(1000px 600px at 70% 0%,#23307a,transparent 60%),radial-gradient(800px 500px at 0% 100%,#3b1d5e,transparent 55%),#0b1230;color:#eef1f8;font-family:Lexend;text-align:center}
    h1{font-family:Fredoka;font-weight:600;font-size:${kind === 'title' ? 96 : 64}px;margin:0 0 12px;opacity:0;animation:in .8s .2s forwards}
    h1 span{color:#ffc23d}
    p{font-size:30px;color:#aab3d6;margin:0;opacity:0;animation:in .8s .6s forwards;max-width:1000px;line-height:1.5}
    img{width:${kind === 'title' ? 170 : 120}px;animation:float 3s ease-in-out infinite, in .8s forwards;opacity:0}
    .stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#fff;opacity:.7}
    @keyframes in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
    @keyframes float{50%{transform:translateY(-12px)}}
  </style></head><body><div class="stars">${Array.from({ length: 90 }, () => `<i style="left:${Math.random() * 100}%;top:${Math.random() * 100}%"></i>`).join('')}</div>
  <div><img src="${BASE}/img/icon.svg" alt=""><h1>${title}</h1><p>${sub}</p></div></body></html>`);
}

const BUILTIN_SEGMENTS = {
  async s01({ student: page }) {
    await card(page, 'Basislab <span>Typen</span>', 'Leren typen met tien vingers in een ruimte-avontuur<br>voor groep 6, 7 en 8 &middot; met volgsysteem en beheer');
  },

  async s02({ student: page }, h) {
    await page.goto(`${BASE}/#/`);
    await sleep(1600);
    await h.click('[data-testid=choose-student]', { after: 900 });
    await page.fill('input[name=code]', '');
    await h.move('input[name=code]');
    await h.type('MAAN-42K', { apm: 200 });
    await sleep(400);
    await h.click('button[type=submit]', { after: 1200 });
    await h.click('.name-tile:has-text("Emma")', { after: 900 });
    await h.type('raket12', { apm: 220 });
    await sleep(400);
    await h.click('button[type=submit]', { after: 900 });
    await page.waitForSelector('.planets');
  },

  async s03({ student: page }, h) {
    await page.goto(`${BASE}/#/kaart`);
    await page.waitForSelector('.planets');
    await sleep(800);
    await h.move('.planet:nth-child(1) .lesson-node:nth-child(1)');
    await sleep(500);
    await h.move('.planet:nth-child(1) .lesson-node:nth-child(5)');
    await sleep(600);
    await h.move('.lesson-node.current');
    await sleep(900);
    await h.scroll(520, 2400);
    await h.move('.planet:nth-child(4) .lesson-node:nth-child(1)');
    await sleep(800);
    await h.scroll(600, 2200);
    await h.move('.planet:nth-child(6) .lesson-node:nth-child(2)');
    await sleep(900);
    await h.scroll(-1400, 2000);
    await h.move('.goal-ring');
    await sleep(1200);
    await h.move('[data-testid=game-meteoren]');
    await sleep(900);
    await h.move('[data-testid=game-race]');
    await sleep(700);
    await h.move('[data-testid=continue]');
  },

  async s04({ student: page }, h) {
    await h.click('[data-testid=continue]', { after: 1800 });
    await page.waitForSelector('[data-start]');
    await sleep(2500);
    await page.keyboard.press(' ');
    await sleep(700);
    await h.typeLesson({ apm: 105, errorEvery: 9 });
    await page.waitForSelector('[data-testid=result]');
  },

  async s05({ student: page }, h) {
    await page.keyboard.press('Escape');
    await page.goto(`${BASE}/#/les/6`);
    await page.waitForSelector('[data-step]');
    await sleep(900);
    await h.click('button[data-step="4"]', { after: 1500 });
    await sleep(2500);
    await page.keyboard.press(' ');
    await sleep(500);
    h.mark('fastFrom');
    await h.typeLesson({ apm: 100, errorEvery: 61 });
    await page.waitForSelector('[data-testid=result]');
    h.mark('fastTo');
    await sleep(2600);
    await h.dismiss();
  },

  async s06({ student: page }, h, targetMs, t0) {
    await page.keyboard.press('Escape');
    await page.goto(`${BASE}/#/spel/meteoren`);
    await page.waitForSelector('[data-go]');
    await sleep(1800);
    await h.click('[data-go]', { after: 300 });
    const apm = 130;
    while (Date.now() - t0 < targetMs - 800) {
      const next = await page.evaluate(() => {
        const g = window.__stGame;
        if (!g || g.state !== 'play') return null;
        let m = g.target;
        if (!m) m = [...g.meteors].filter((x) => x.y > 70).sort((a, b) => b.y - a.y)[0];
        return m ? m.word[m.typed] : '';
      });
      if (next === null) break;
      if (!next) { await sleep(120); continue; }
      await page.keyboard.type(next);
      await sleep((60000 / apm) * (0.7 + Math.random() * 0.6));
    }
  },

  async s07({ student: page }, h) {
    await page.goto(`${BASE}/#/spel/race`);
    await page.waitForSelector('[data-go]');
    await sleep(2500);
    await page.keyboard.press(' ');
    await sleep(3400);
    h.mark('fastFrom');
    await h.typeLesson({ apm: 75, errorEvery: 47 });
    h.mark('fastTo');
    await page.waitForSelector('[data-again]', { timeout: 60000 });
    await sleep(1500);
  },

  async s08({ student: page }, h) {
    await page.keyboard.press('Escape');
    await page.goto(`${BASE}/#/kaart`);
    await page.waitForSelector('.planets');
    await sleep(300);
    await h.click('.hud nav a[href="#/hangar"]', { after: 1300 });
    await h.click('.shop-item[data-slot=body][data-id=paars]', { after: 1500 });
    await h.click('.shop-item[data-slot=pattern][data-id=sterren]', { after: 1500 });
    await h.click('.shop-item[data-slot=window][data-id=goud]', { after: 1300 });
    await h.scroll(380, 1000);
    await h.move('[data-set=largeText]');
    await sleep(700);
    await h.move('[data-set=dyslexia]');
    await sleep(900);
    await h.click('.hud nav a[href="#/erekast"]', { after: 1500 });
    await h.move('.badge-card:not(.locked)');
    await sleep(1200);
    await h.move('.leader-row.me');
    await sleep(1500);
  },

  async s09({ teacher: page }, h) {
    await card(page, 'Voor leerkrachten', 'Het volgsysteem', 'chapter');
    await sleep(2600);
    await page.goto(`${BASE}/#/leraar`);
    await page.waitForSelector('input[name=email]');
    await sleep(500);
    await h.click('input[name=email]', { after: 200 });
    await h.type('demo@basislab.nl', { apm: 500 });
    await h.click('input[name=password]', { after: 200 });
    await h.type('basislab-typen', { apm: 500 });
    await h.click('button[type=submit]', { after: 1500 });
    await page.waitForSelector('.class-cards');
    await h.move('.class-card:nth-child(1) .chip.warning');
    await sleep(1000);
    await h.move('.class-card:nth-child(1) .meta');
  },

  async s10({ teacher: page }, h) {
    await h.click('.class-card:has-text("Groep 7b")', { after: 1500 });
    await page.waitForSelector('[data-table] table');
    await h.move('.tile:nth-child(2)');
    await sleep(700);
    await h.move('.tile:nth-child(4)');
    await sleep(900);
    await h.move('.alert-item:nth-child(1)');
    await sleep(900);
    await h.move('.alert-item:nth-child(3)');
    await sleep(900);
    await h.move('[data-daily] .hit[data-i="8"]');
    await sleep(1200);
    await h.scrollTo('[data-table]', 1300);
    await h.click('th[data-sort=recentApm]', { after: 1200 });
    await h.click('th[data-sort=alerts]', { after: 1500 });
    await h.scrollTo('[data-planets]', 1800, 120);
    await h.move('[data-planets] .hit[data-i="2"]');
    await sleep(1200);
    await h.move('[data-keys] .heat-key:has-text("P")');
    await sleep(1400);
    await h.scrollTo('[data-table]', 1200);
  },

  async s11({ teacher: page }, h) {
    await h.click('tr[data-student]:has-text("Noah")', { after: 1500 });
    await page.waitForSelector('[data-keys] .heat-kb');
    await h.move('[data-apm] .hit', { fx: 0.85 });
    await sleep(900);
    await h.move('[data-acc] .hit', { fx: 0.6 });
    await sleep(900);
    await h.scrollTo('[data-keys]', 1200, 80);
    await h.move('[data-keys] .heat-key:has-text("E")');
    await sleep(1200);
    await h.move('[data-fingers]');
    await sleep(1000);
    await h.scrollTo('[data-advice]', 1200, 80);
    await h.move('[data-advice] li:nth-child(1)');
    await sleep(2000);
    await h.move('[data-cal]');
    await sleep(1000);
    await h.scrollTo('.lesson-grid', 1300, 140);
    await h.move('.lesson-cell:nth-child(8)');
    await sleep(1500);
    await h.scrollTo('[data-settings]', 2000, 120);
    await h.move('select[name=tempo]');
    await page.selectOption('select[name=tempo]', '0.8');
    await sleep(900);
    await h.click('textarea[name=note]', { after: 200 });
    await h.type('Oefent goed thuis. Let op houding linkerhand.', { apm: 420 });
    await h.click('[data-settings] button[type=submit]', { after: 1500 });
  },

  async s12({ teacher: page }, h) {
    await page.goto(`${BASE}/#/dashboard`);
    await page.waitForSelector('[data-new]');
    await sleep(600);
    await h.click('[data-new]', { after: 700 });
    await h.type('Groep 7c', { apm: 300 });
    await h.click('.modal .btn-primary', { after: 1400 });
    await page.waitForSelector('[data-add]');
    await h.click('[data-add]', { after: 700 });
    await h.type('Ayoub\nLotte\nFenna\nJens\nSofia', { apm: 400 });
    await sleep(300);
    await h.click('.modal .btn-primary', { after: 1600 });
    await h.click('.modal .btn-primary', { after: 1500 });
    await page.waitForSelector('.login-card');
    await h.move('.login-card:nth-child(1)');
    await sleep(1200);
    await h.move('[data-print]');
    await sleep(800);
    await h.click('.print-bar a', { after: 1200 });
    await h.move('a[href*="export.csv"]');
    await sleep(1200);
  },

  async s13({ teacher: page }, h) {
    await h.click('[data-testid=nav-beheer]', { after: 1500 });
    await page.waitForSelector('[data-daily] svg');
    await h.move('.tile:nth-child(2)');
    await sleep(900);
    await h.move('.tile:nth-child(3)');
    await sleep(900);
    await h.move('[data-daily] .hit[data-i="26"]');
    await sleep(1500);
    await h.scrollTo('.table-wrap', 1400, 160);
    await h.move('tr[data-class]:nth-child(2)');
    await sleep(1500);
    await h.scroll(-1200, 900);
    await h.click('[data-tab=leerkrachten]', { after: 1200 });
    await h.click('[data-add]', { after: 600 });
    await h.type('Juf Noor de Wit', { apm: 420 });
    await h.click('input[name=tmail]', { after: 200 });
    await h.type('noor@basislab.nl', { apm: 420 });
    await h.click('.modal .btn-primary', { after: 3200 });
    await h.click('.modal .btn-ghost', { after: 1000 });
    await h.click('[data-tab=school]', { after: 1300 });
    await h.move('.logo-preview');
    await sleep(1800);
    await h.move('[data-signup]');
    await sleep(1500);
    await h.move('input[name=sname]');
  },

  async s14({ teacher: page }) {
    await card(page, 'Basislab <span>Typen</span>', 'Op school en thuis &middot; 20 lessen &middot; spellen &middot; volgsysteem &middot; beheer<br>Geen advertenties, geen trackers');
  },
};

const SEGMENTS = process.env.SEGMENTS
  ? require(path.resolve(process.env.SEGMENTS))({ BASE, sleep, card })
  : BUILTIN_SEGMENTS;

(async () => {
  const browser = await chromium.launch();
  const mk = async () => {
    const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 4 / 3 });
    await ctx.addInitScript(CURSOR);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error('PAGEERR', e.message));
    return page;
  };
  const pages = { student: await mk(), teacher: await mk() };
  const report = {};
  for (const id of Object.keys(SEGMENTS)) {
    const needsRun = !only.length || only.includes(id);
    const fn = SEGMENTS[id];
    const usesTeacher = /teacher/.test(fn.toString().split(')')[0]);
    const page = usesTeacher ? pages.teacher : pages.student;
    const h = helpers(page);
    const t = timing[id];
    const targetMs = t.duration * 1000 + Number(process.env.PAD_MS || 600);
    if (!needsRun) {
      // zorg dat de app in de juiste toestand komt voor latere segmenten (inloggen)
      if (id === 's02') await SEGMENTS.s02(pages, h).catch(() => {});
      if (id === 's09') {
        await pages.teacher.goto(`${BASE}/#/leraar`);
        await pages.teacher.fill('input[name=email]', 'demo@basislab.nl');
        await pages.teacher.fill('input[name=password]', 'basislab-typen');
        await pages.teacher.click('button[type=submit]');
        await pages.teacher.waitForSelector('.class-cards');
      }
      continue;
    }
    const rec = new Recorder(page);
    h.mark = (k) => { rec.marks[k] = Date.now(); };
    await page.evaluate(() => document.querySelectorAll('.modal-backdrop').forEach((m) => m.remove())).catch(() => {});
    await rec.start(id);
    const t0 = Date.now();
    await fn(pages, h, targetMs, t0);
    const fast = rec.marks.fastFrom && rec.marks.fastTo ? (rec.marks.fastTo - rec.marks.fastFrom) * (1 - 1 / (t.speed || 1)) : 0;
    const left = targetMs - (Date.now() - t0 - fast);
    if (left > 0) await sleep(left);
    const secs = await rec.stop();
    report[id] = { seconds: Math.round(secs * 10) / 10, frames: rec.frames.length, target: Math.round(targetMs / 100) / 10 };
    console.log(id, report[id]);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
