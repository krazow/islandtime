const { open, newGame, noErrors, assert } = require('./helpers');

// 🎟️ going out in Lakewood (src/js/42-fun-lakewood.js)
const IDS = ['lw_yis', 'lw_hess', 'lw_playhouse', 'lw_lakewold', 'lw_fsp'];
// jump to a place on a given weekday (0 Mon) and clock time, with money and stress set
const at = (page, id, d, h, m = 0) => page.evaluate(([id, d, h, m]) => {
  S.cur = d; S.t = d * 1440 + h * 60 + m; S.loc = id; S.money = 300; S.stress = 60; S.ateOut = -1; S.fun = null; MQ = []; render();
}, [id, d, h, m]);
const acts = page => page.evaluate(() => actions().map(a => ({ l: a.l, dis: !!a.dis, s: a.s })));
const doAct = (page, re) => page.evaluate(re => { const a = actions().find(x => new RegExp(re).test(x.l) && !x.dis); if (!a) throw new Error('no act ' + re); a.fn(); }, re);

module.exports = [
  { name: 'five Lakewood places exist on the mainland and are in the travel list', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(ids => {
      S.loc = 'market'; S.cur = 2; S.t = 2 * 1440 + 600; S.money = 500;
      return ids.map(id => ({ id, town: FUN[id].town, side: L[id].side, kind: FUN[id].kind, mp: !!MP[id], inList: Object.keys(L).filter(k => k !== S.loc && L[k].side === L[S.loc].side).includes(id), d: dist('market', id), noDigits: !/\d{3,}/.test(L[id].desc + L[id].name) }));
    }, IDS);
    assert.strictEqual(r.length, 5);
    for (const p of r) { assert.strictEqual(p.town, 'Lakewood'); assert.strictEqual(p.side, 'M'); assert.ok(p.mp && p.inList && p.noDigits && p.d > 0, JSON.stringify(p)); }
    assert.strictEqual(r.filter(p => p.kind === 'restaurant').length, 2);
    assert.strictEqual(r.filter(p => p.kind === 'fun').length, 3);
    noErrors(errors);
  }},
  { name: 'closed hours show closed', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    await at(page, 'lw_hess', 6, 12);            // Sunday: bakery closed
    let a = await acts(page); assert.ok(a.some(x => /is closed/.test(x.l) && x.dis)); assert.ok(!a.some(x => /sandwich/.test(x.l)));
    await at(page, 'lw_yis', 2, 6);              // 6 AM: not open yet
    a = await acts(page); assert.ok(a.some(x => /is closed/.test(x.l)));
    await at(page, 'lw_playhouse', 1, 19);       // Tuesday night: no show
    a = await acts(page); assert.ok(a.some(x => /is closed/.test(x.l)));
    await at(page, 'lw_yis', 2, 12);
    a = await acts(page); assert.ok(!a.some(x => /is closed/.test(x.l)) && a.some(x => /Seolleongtang/.test(x.l)));
    noErrors(errors);
  }},
  { name: 'a restaurant meal costs money and time and counts as eating out', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    await at(page, 'lw_yis', 2, 18);
    const b = await page.evaluate(() => ({ m: S.money, t: S.t }));
    await doAct(page, 'Seolleongtang');
    const r = await page.evaluate(() => ({ m: S.money, t: S.t, ate: S.ateOut, day: day(), at: S.ateOutAt }));
    assert.ok(r.m < b.m && b.m - r.m >= 10); assert.ok(r.t - b.t >= 30);
    assert.strictEqual(r.ate, r.day); assert.match(r.at, /Yi/);
    noErrors(errors);
  }},
  { name: 'stress drops only once per day per place', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    await at(page, 'lw_fsp', 2, 11);
    const s0 = await page.evaluate(() => S.stress);
    await doAct(page, 'Walk the loop');
    const s1 = await page.evaluate(() => S.stress);
    assert.ok(s1 < s0, 'first outing relaxes');
    await doAct(page, 'Sit on a bench');
    assert.strictEqual(await page.evaluate(() => S.stress), s1, 'second outing the same day: no more stress relief');
    await page.evaluate(() => { S.cur++; S.t = S.cur * 1440 + 11 * 60; });
    await doAct(page, 'Sit on a bench');
    assert.ok(await page.evaluate(() => S.stress) < s1, 'next day relaxes again');
    noErrors(errors);
  }},
  { name: 'visitor mode: going out adds the Out on the town line', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
    const before = await page.evaluate(() => visitScore());
    assert.ok(!before.lines.some(l => /Out on the town/.test(l)));
    await page.evaluate(() => { S.loc = 'lw_fsp'; S.cur = 4; S.t = 4 * 1440 + 11 * 60; S.money = 300; });
    await doAct(page, 'Walk the loop');
    const after = await page.evaluate(() => visitScore());
    assert.ok(after.lines.some(l => /Out on the town: 1 place/.test(l)), after.lines.join('|'));
    assert.strictEqual(after.parts.fun, 60);
    noErrors(errors);
  }},
];
