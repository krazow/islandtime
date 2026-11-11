const { open, noErrors, assert } = require('./helpers');

const IDS = ['st_topside', 'st_bair', 'st_pub', 'st_museum', 'st_beach'];
const start = (page, ...a) => page.evaluate(([len, home, diff]) => { newGame(diff || 'normal', 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); }, a);

module.exports = [
  { name: 'steilacoom fun: five places on the mainland, in the travel list', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page);
    const r = await page.evaluate(ids => { S.loc = 'stDock'; render(); const txt = document.querySelector('.content').textContent;
      return { ok: ids.map(i => !!L[i] && L[i].side === 'M' && L[i].town === 'Steilacoom' && !!MP[i] && Math.hypot(...MP[i]) < 1.5), listed: ids.map(i => txt.includes(L[i].name)),
        kinds: ids.map(i => FUN[i].kind).sort().join() }; }, IDS);
    assert.ok(r.ok.every(Boolean)); assert.ok(r.listed.every(Boolean), 'all in the Go somewhere list');
    assert.strictEqual(r.kinds, 'fun,fun,fun,restaurant,restaurant');
    noErrors(errors);
  } },
  { name: 'steilacoom fun: closed hours show closed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page);
    const r = await page.evaluate(() => { S.loc = 'st_bair'; S.cur = 0; S.t = 600; const mon = actions().find(a => /closed/.test(a.l));   // Monday
      S.cur = 3; S.t = 3 * 1440 + 600; const thu = actions().some(a => /Breakfast/.test(a.l));
      S.loc = 'st_museum'; S.cur = 5; S.t = 5 * 1440 + 840; const m = actions().some(a => /Tour the museum/.test(a.l));   // November: closed for the season
      return { mon: !!(mon && mon.dis), thu, museumOpenInFall: m }; });
    assert.ok(r.mon); assert.ok(r.thu); assert.strictEqual(r.museumOpenInFall, false);
    noErrors(errors);
  } },
  { name: 'steilacoom fun: meal costs money and time, sets ateOut; stress once per day per place', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page);
    const r = await page.evaluate(() => { S.loc = 'st_topside'; S.cur = 1; S.t = 1440 + 17 * 60; S.money = 500; S.stress = 60; const m0 = S.money, t0 = S.t;
      const meal = () => actions().find(a => /Dinner on the deck/.test(a.l)); meal().fn();
      const a = { spent: m0 - S.money, mins: S.t - t0, ate: S.ateOut === day(), stress1: S.stress };
      S.loc = 'st_topside'; actions().find(a => /One beer/.test(a.l)).fn(); a.stress2 = S.stress; a.outings = S.stats.outings; return a; });
    assert.strictEqual(r.spent, 34); assert.ok(r.mins >= 75); assert.ok(r.ate); assert.ok(r.stress1 <= 52);
    assert.strictEqual(r.stress2, r.stress1, 'second outing the same day: no more stress relief');
    assert.strictEqual(r.outings, 2);
    noErrors(errors);
  } },
  { name: 'steilacoom fun: visitor gets Out on the town line', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => { visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
      const before = visitScore(); S.loc = 'st_beach'; S.t = S.cur * 1440 + 10 * 60; S.money = 300; actions().find(a => /Walk the beach/.test(a.l)).fn();
      const after = visitScore(); return { b: before.lines.some(l => /Out on the town/.test(l)), line: after.lines.find(l => /Out on the town/.test(l)), fun: after.parts.fun }; });
    assert.ok(!r.b); assert.match(r.line, /1 place/); assert.strictEqual(r.fun, 60);
    noErrors(errors);
  } }
];
