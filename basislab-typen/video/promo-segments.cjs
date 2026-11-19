// Fragmenten voor het reclamefilmpje voor kinderen (± 1 minuut).
// Gebruik: SEGMENTS=video/promo-segments.cjs VIDEO_OUT=out-promo BASE=... node video/record.cjs
module.exports = ({ BASE, sleep }) => {
  const SPACE_BG = "radial-gradient(1000px 600px at 70% 0%,#23307a,transparent 60%),radial-gradient(800px 500px at 0% 100%,#3b1d5e,transparent 55%),#0b1230";
  const ROCKET = `<svg width="190" height="240" viewBox="0 0 64 80"><path d="M18 46L6 62v4l12-4zM46 46l12 16v4l-12-4z" fill="#3987e5"/><path d="M32 4c10 8 14 22 14 34v26H18V38c0-12 4-26 14-34z" fill="#3987e5"/><path d="M27 50l1 2.4 2.5.2-1.9 1.6.6 2.5-2.2-1.4-2.2 1.4.6-2.5-1.9-1.6 2.5-.2z" fill="#fff8c4"/><circle cx="32" cy="30" r="8" fill="#ffe08a" stroke="#0b1230" stroke-width="3"/><path class="fl" d="M24 64c2 8 5 12 8 15 3-3 6-7 8-15z" fill="#ff9a3c"/></svg>`;

  async function scene(page, body, extraCss = '') {
    await page.goto(`${BASE}/api/health`);
    await page.setContent(`<!doctype html><html><head><style>
      @font-face { font-family: Fredoka; src: url('${BASE}/fonts/fredoka-latin-700-normal.woff2'); font-weight: 700; }
      @font-face { font-family: Lexend; src: url('${BASE}/fonts/lexend-latin-600-normal.woff2'); font-weight: 600; }
      html,body{margin:0;height:100%;overflow:hidden}
      body{background:${SPACE_BG};color:#fff;font-family:Lexend;display:grid;place-items:center;text-align:center}
      .stars i{position:absolute;border-radius:50%;background:#fff;animation:tw 1.6s ease-in-out infinite alternate}
      @keyframes tw{from{opacity:.25}to{opacity:1}}
      h1{font-family:Fredoka;font-weight:700;margin:0;line-height:1.05}
      h1 span{color:#ffc23d}
      .fl{animation:fl .12s infinite alternate;transform-origin:32px 64px}
      @keyframes fl{to{transform:scaleY(1.35)}}
      ${extraCss}
    </style></head><body><div class="stars">${Array.from({ length: 110 }, (_, i) => `<i style="left:${(i * 37) % 100}%;top:${(i * 53) % 100}%;width:${1 + (i % 3)}px;height:${1 + (i % 3)}px;animation-delay:${(i % 7) * 0.2}s"></i>`).join('')}</div>${body}</body></html>`);
  }

  async function typeFor(page, ms, apm = 120, errorEvery = 0) {
    const end = Date.now() + ms;
    let n = 0;
    while (Date.now() < end) {
      const ch = await page.evaluate(() => document.querySelector('.ch.cur')?.textContent ?? null);
      if (ch == null) break;
      if (errorEvery && n > 4 && n % errorEvery === 0) { await page.keyboard.type('q'); await sleep(60000 / apm * 1.5); }
      await page.keyboard.type(ch);
      n += 1;
      await sleep((60000 / apm) * (0.75 + Math.random() * 0.5));
    }
  }

  return {
    async p01({ student: page }) {
      // Off camera inloggen via de API (cookies gelden voor de hele browsercontext).
      await page.context().request.post(`${BASE}/api/auth/student/login`, {
        headers: { 'X-Requested-With': 'basislab-typen', 'Content-Type': 'application/json' },
        data: { code: 'MAAN-42K', name: 'Emma', password: 'raket12' },
      });
      await scene(page, `<div>
        <div class="rk">${ROCKET}</div>
        <h1 class="t1" style="font-size:92px">Ben jij klaar<br>voor de <span>start?</span></h1>
      </div>`, `
        .rk{animation:shake .08s infinite alternate, launch 1.6s 3.2s ease-in forwards}
        @keyframes shake{from{transform:translateX(-2px)}to{transform:translateX(2px)}}
        @keyframes launch{to{transform:translateY(-1200px)}}
        .t1{opacity:0;animation:pop .6s .3s forwards}
        @keyframes pop{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}`);
    },

    async p02({ student: page }, h) {
      await page.goto(`${BASE}/#/kaart`);
      await page.waitForSelector('.planets');
      await sleep(600);
      await h.move('.planet:nth-child(1) .lesson-node:nth-child(3)', { steps: 14 });
      await h.move('.lesson-node.current', { steps: 14 });
      await h.scroll(900, 1500);
      await h.move('.planet:nth-child(4) .planet-orb', { steps: 10 });
      await h.scroll(700, 1100);
      await h.move('.planet:nth-child(6) .planet-orb', { steps: 14 });
    },

    async p03({ student: page }, h) {
      await page.goto(`${BASE}/#/les/7`);
      await page.waitForSelector('[data-start]');
      await sleep(1300);
      await page.keyboard.press(' ');
      await sleep(300);
      await typeFor(page, 7600, 130, 7);
    },

    async p04({ student: page }, h) {
      await page.goto(`${BASE}/#/les/6`);
      await page.waitForSelector('button[data-step="4"]');
      await page.click('button[data-step="4"]');
      await page.waitForSelector('[data-start]');
      await sleep(400);
      await page.keyboard.press(' ');
      h.mark('fastFrom');
      await h.typeLesson({ apm: 110, errorEvery: 70 });
      await page.waitForSelector('[data-testid=result]');
      h.mark('fastTo');
      await sleep(2600);
      await page.keyboard.press('Escape');
    },

    async p05({ student: page }) {
      await page.goto(`${BASE}/#/spel/meteoren`);
      await page.waitForSelector('[data-go]');
      await page.click('[data-go]');
      const end = Date.now() + 5200;
      await sleep(900);
      while (Date.now() < end) {
        const next = await page.evaluate(() => {
          const g = window.__stGame;
          if (!g || g.state !== 'play') return null;
          let m = g.target;
          if (!m) m = [...g.meteors].filter((x) => x.y > 60).sort((a, b) => b.y - a.y)[0];
          return m ? m.word[m.typed] : '';
        });
        if (next === null) break;
        if (!next) { await sleep(90); continue; }
        await page.keyboard.type(next);
        await sleep(330 + Math.random() * 120);
      }
    },

    async p06({ student: page }, h) {
      await page.goto(`${BASE}/#/spel/race`);
      await page.waitForSelector('[data-go]');
      await sleep(300);
      await page.keyboard.press(' ');
      await sleep(3300);
      h.mark('fastFrom');
      await h.typeLesson({ apm: 80, errorEvery: 60 });
      h.mark('fastTo');
      await page.waitForSelector('[data-again]', { timeout: 60000 });
      await sleep(1800);
    },

    async p07({ student: page }, h) {
      await page.goto(`${BASE}/#/hangar`);
      await page.waitForSelector('.shop-item');
      await sleep(400);
      await h.click('.shop-item[data-slot=body][data-id=groen]', { after: 700, steps: 12 });
      await h.click('.shop-item[data-slot=pattern][data-id=bliksem]', { after: 800, steps: 12 });
      await h.click('.shop-item[data-slot=flame][data-id=neon]', { after: 800, steps: 12 });
      await h.move('.hangar-preview .rocket', { steps: 12 });
    },

    async p08({ student: page }, h) {
      await page.goto(`${BASE}/#/erekast`);
      await page.waitForSelector('.badge-card');
      await sleep(500);
      await h.move('.badge-card:not(.locked)', { steps: 12 });
      await sleep(700);
      await h.move('.badge-card:has-text("Typediploma")', { steps: 12 });
      await sleep(700);
      await h.move('.leader-row.me', { steps: 12 });
    },

    async p09({ student: page }) {
      await scene(page, `<div style="margin-top:-60px">
        <div class="logo"><img src="${BASE}/api/school/logo" alt="" style="height:90px;background:#fff;border-radius:16px;padding:10px 18px"></div>
        <div class="rk">${ROCKET.replace('width="190" height="240"', 'width="120" height="150"')}</div>
        <h1 style="font-size:110px">Basislab <span>Typen</span></h1>
        <p class="sub" style="font-size:40px;margin:18px 0 6px">Vraag je juf of meester om je inlogkaart!</p>
        <p class="url" style="font-size:34px;color:#ffc23d;margin:0">typen.basislab.nl</p>
      </div>`, `
        .logo{opacity:0;animation:pop .5s .2s forwards;margin-bottom:10px}
        .rk{animation:bob 1.6s ease-in-out infinite}
        @keyframes bob{50%{transform:translateY(-14px)}}
        h1{opacity:0;animation:pop .6s .4s forwards}
        .sub{opacity:0;animation:pop .6s 1.2s forwards}
        .url{opacity:0;animation:pop .6s 2s forwards}
        @keyframes pop{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}`);
    },
  };
};
