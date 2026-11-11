// Multi-vehicle travel gaps: vehicles card, parked cars in travel, paid terminal lot, visitor hint, boat as way home, outage backlog, friend drives a car
const { open, newGame, noErrors, assert } = require('./helpers');
const clr = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const setup = page => page.evaluate(c => { eval(c)(); S.cur = 1; S.t = 1440 + 600; S.loc = 'home'; S.drive = null; S.phone = 90; S.money = 500;
  S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'home', fuel: 6, tank: 14, diesel: false },
            { id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'stDock', fuel: 9, tank: 12, diesel: false }];
  tab = 'act'; render(); }, `(${clr})`);

module.exports = [
  { name: 'gaps: the vehicles card lists cars and the boat with state and what is due, and fits 390px', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.setViewportSize({ width: 390, height: 800 });
    await newGame(page); await setup(page);
    const r = await page.evaluate(() => { S.cars[0].bat = 'weak'; S.cars[1].spare = 'on'; S.boat = { own: true, store: 'slip', at: 'sunny', fuel: 3, cond: 35, trips: 0, paidThru: dayKey() + 1 }; render();
      const d = document.querySelector('details.vcard'); d.open = true; const w = d.getBoundingClientRect().width;
      return { txt: d.innerText, due: vgDue(), w, sw: document.documentElement.scrollWidth }; });
    assert.match(r.txt, /Subaru/); assert.match(r.txt, /Corolla/); assert.match(r.txt, /skiff/);
    assert.match(r.txt, /weak/); assert.match(r.txt, /on the spare/); assert.match(r.txt, /Sunnyside/);
    assert.ok(r.due.some(x => /Moorage/.test(x)) && r.due.some(x => /tire/.test(x)) && r.due.some(x => /battery/.test(x)) && r.due.some(x => /Service/.test(x)));
    assert.ok(r.sw <= 392, 'no horizontal overflow ' + r.sw);
    noErrors(errors);
  } },
  { name: 'gaps: parked cars show in Go-somewhere and map; far-landing cars in ferry/skiff options', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await setup(page);
    const r = await page.evaluate(() => { S.loc = 'aiDock'; S.boat = { own: true, store: 'slip', at: 'marina', fuel: 3, cond: 70, trips: 0, paidThru: dayKey() + 20 };
      const walk = actions().find(a => /^Walk on the next/.test(a.l)).s;
      S.loc = 'stDock'; S.cars[1].loc = 'stDock'; S.cars[0].loc = 'home';
      const dest = travelOpts('stDock'); S.loc = 'aiDock'; const n = parkedNote('stDock');
      S.cars[1].loc = 'sunny'; S.loc = 'marina'; const sk = actions().find(a => /^Take the skiff/.test(a.l)).s;
      return { walk, n, sk, dest: dest.length }; });
    assert.match(r.n, /Corolla is here/); assert.match(r.sk, /Corolla is parked at Sunnyside/);
    const r2 = await page.evaluate(() => { S.cars[1].loc = 'stDock'; S.loc = 'aiDock'; return actions().find(a => /^Walk on the next/.test(a.l)).s });
    assert.match(r2, /Corolla is waiting at the Steilacoom terminal/); assert.match(r2, /\$8/);
    const r3 = await page.evaluate(() => { S.loc = 'home'; S.cars[0].loc = 'food'; setPref('goOpen', true); render(); return travelOpts('food').find(o => o.s) });
    assert.ok(r3 && /Subaru is here/.test(r3.s));
    noErrors(errors);
  } },
  { name: 'gaps: terminal lot fee per car overnight; none for the car you sleep in; boat owner tip once', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await setup(page);
    const r = await page.evaluate(c => { const m0 = S.money; S.loc = 'home'; const cs = parkFeeDue('home').length; 
      S.cars[1].loc = 'stDock'; S.loc = 'stDock'; const cs2 = parkFeeDue('terminal').length; S.cars[0].loc = 'stDock'; const cs3 = parkFeeDue('terminal').length;
      return { cs, cs2, cs3 }; }, `(${clr})`);
    assert.deepStrictEqual(r, { cs: 1, cs2: 0, cs3: 1 });
    const m = await page.evaluate(() => { S.cars[0].loc = 'home'; S.loc = 'home'; const m0 = S.money; endDay('home'); eval('(' + (() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()) }) + ')()'); return m0 - S.money; });
    assert.ok(m >= 8 && m < 40, 'fee charged ' + m);
    // tip once
    await newGame(page); await setup(page);
    const t = await page.evaluate(() => { S.boat = { own: true, store: 'slip', at: 'marina', fuel: 3, cond: 70, trips: 0, paidThru: dayKey() + 20 }; S.loc = 'stDock'; render(); render();
      return S.log.filter(l => /Tip: you own a boat/.test(l.s)).length });
    assert.strictEqual(t, 1);
    noErrors(errors);
  } },
  { name: 'gaps: visitor terminal hint once; leave-your-car prompt skipped when the skiff waits across', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const v = await page.evaluate(c => { visitorNew('weekend', 'tacoma', 'normal'); eval(c)(); S.loc = 'stDock'; S.cars.forEach(c => { c.loc = 'stDock'; c.fuel = 8; }); render(); render();
      return S.log.filter(l => /At the terminal: driving on/.test(l.s)).length }, `(${clr})`);
    assert.strictEqual(v, 1);
    await newGame(page); await setup(page);
    const p = await page.evaluate(c => { S.loc = 'aiDock'; S.cars[0].loc = 'aiDock'; S.cars[0].fuel = 8; S.cars[1].loc = 'home'; S.t = 1440 + 600; S.boat = { own: true, store: 'slip', at: 'sunny', fuel: 3, cond: 70, trips: 0, paidThru: dayKey() + 20 };
      waitFerry('walk'); const withBoat = document.querySelectorAll('.modal-bg').length && /Leave your car behind/.test(document.body.innerText); eval(c)();
      S.boat.at = 'marina'; waitFerry('walk'); const noBoat = /Leave your car behind/.test(document.body.innerText); eval(c)(); return { withBoat: !!withBoat, noBoat } }, `(${clr})`);
    assert.deepStrictEqual(p, { withBoat: false, noBoat: true });
    noErrors(errors);
  } },
  { name: 'gaps: ferry backlog: the 3 sailings after an outage are fuller, then it fades; ferry app mentions it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await setup(page);
    const r = await page.evaluate(() => { const d = 1; S.week.b = [{ start: d * 1440 + 400, end: d * 1440 + 700, cause: 'a hydraulic leak' }]; S.week.storm = null;
      const ds = deps('M', d).filter(x => d * 1440 + x >= d * 1440 + 700).slice(0, 5), ps = ds.map(x => backlogP('M', d, x));
      S.t = d * 1440 + 710; const bn = !!backlogNext('M'); tab = 'ferry'; render(); const txt = document.querySelector('.content').innerText;
      return { ps, bn, txt: /Backlog after the outage/.test(txt) }; });
    assert.deepStrictEqual(r.ps.slice(0, 3).map(x => x > 0), [true, true, true]);
    assert.ok(r.ps[0] >= r.ps[1] && r.ps[1] >= r.ps[2]);
    assert.ok(r.ps.slice(3).every(x => x === 0));
    assert.ok(r.bn && r.txt);
    noErrors(errors);
  } },
  { name: 'gaps: a friend drives your second car across: fare, favor, arrives at the far terminal', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await setup(page);
    const r = await page.evaluate(() => { S.week.b = []; S.friends.sam = { name: 'Sam', how: 'x', day: 0, lvl: 1, pts: 3 }; S.loc = 'home'; S.t = 1440 + 600;
      const a = actions().find(a => /^Ask Sam to bring the 2004 Corolla across/.test(a.l)); if (!a) return { none: true };
      const m0 = S.money; a.fn(); const paid = Math.round((m0 - S.money) * 100) / 100; const run = S.vg.runs[0];
      S.t = run.abs + 1; processTimed(); return { paid, fare: fareCar(), loc: S.cars[1].loc, left: S.vg.runs.length, again: actions().some(a => /^Ask Sam/.test(a.l)) }; });
    assert.ok(!r.none);
    assert.strictEqual(r.paid, r.fare); assert.strictEqual(r.loc, 'aiDock'); assert.strictEqual(r.left, 0); assert.strictEqual(r.again, false);
    noErrors(errors);
  } },
];
