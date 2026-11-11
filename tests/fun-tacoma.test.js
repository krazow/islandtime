// Going out in Tacoma (src/js/43-fun-tacoma.js, on top of the shared helper in 40-fun.js)
const { open, newGame, noErrors, assert } = require('./helpers');
const IDS = ['tc_dukes', 'tc_cactus', 'tc_zoo', 'tc_glass', 'tc_grand'];
// put the player at a place on a given weekday (0 Mon) and minute; returns the action labels
const at = (page, o) => page.evaluate(o => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
  S.cur = o.d ?? 1; S.t = S.cur * 1440 + (o.m ?? 720); S.loc = o.loc; S.money = o.money ?? 300; S.stress = o.stress ?? 50; S.ateOut = -1;
  return actions().filter(a => /fun|here/.test(a.cat || '') || a.dis).map(a => ({ l: a.l, dis: !!a.dis, here: a.cat === 'here' }));
}, o);

module.exports = [
  { name: 'tacoma fun: five places on the mainland, in the travel list, two restaurants and three outings', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal');
    const r = await page.evaluate(ids => { S.loc = 'stDock'; render();
      return ids.map(id => ({ id, side: L[id].side, town: L[id].town, kind: FUN[id].kind, mp: MP[id], inList: /Go somewhere on the mainland/.test(document.body.innerHTML) && Object.keys(L).filter(k => k !== S.loc && L[k].side === 'M').includes(id), acts: FUN[id].acts.length })); }, IDS);
    for (const x of r) { assert.strictEqual(x.side, 'M', x.id); assert.strictEqual(x.town, 'Tacoma'); assert.ok(x.inList, x.id); assert.ok(x.acts >= 2 && x.acts <= 3); assert.ok(Array.isArray(x.mp)); }
    assert.strictEqual(r.filter(x => x.kind === 'restaurant').length, 2); assert.strictEqual(r.filter(x => x.kind === 'fun').length, 3);
    noErrors(errors);
  } },
  { name: 'tacoma fun: closed hours show closed (glass museum Monday, seafood at 6 AM, baseline open otherwise)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal');
    let a = await at(page, { loc: 'tc_glass', d: 0, m: 720 }); assert.ok(a.some(x => /is closed/.test(x.l) && x.dis), JSON.stringify(a));
    a = await at(page, { loc: 'tc_glass', d: 2, m: 720 }); assert.ok(a.some(x => x.here && !x.dis), JSON.stringify(a));
    a = await at(page, { loc: 'tc_dukes', d: 2, m: 360 }); assert.ok(a.some(x => /is closed/.test(x.l)));
    a = await at(page, { loc: 'tc_dukes', d: 2, m: 1140 }); assert.ok(a.some(x => x.here && !x.dis));
    a = await at(page, { loc: 'tc_grand', d: 2, m: 600 }); assert.ok(a.some(x => /is closed/.test(x.l)));
    a = await at(page, { loc: 'tc_zoo', d: 2, m: 1200 }); assert.ok(a.some(x => /is closed/.test(x.l)));
    noErrors(errors);
  } },
  { name: 'tacoma fun: a restaurant meal costs money and time, sets ateOut, stress drops once per day per place', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal');
    await at(page, { loc: 'tc_dukes', d: 2, m: 1080, money: 300, stress: 60 });
    const r1 = await page.evaluate(() => { const a = actions().find(a => /window seat/.test(a.l)), m = S.money, t = S.t, s = S.stress; a.fn();
      return { dm: m - S.money, dt: S.t - t, ds: S.stress - s, ate: S.ateOut === day(), at: S.ateOutAt }; });
    assert.ok(r1.dm >= 30 && r1.dm <= 60, JSON.stringify(r1)); assert.ok(r1.dt >= 60); assert.strictEqual(r1.ds, -8); assert.ok(r1.ate); assert.match(r1.at, /Duke/);
    const r2 = await page.evaluate(() => { S.loc = 'tc_dukes'; S.t = day() * 1440 + 1080; const s = S.stress; actions().find(a => /window seat/.test(a.l)).fn(); return S.stress - s; });
    assert.strictEqual(r2, 0, 'second visit same day: no more stress relief');
    const r3 = await page.evaluate(() => { S.cur++; S.t = day() * 1440 + 1080; S.loc = 'tc_dukes'; const s = S.stress; actions().find(a => /window seat/.test(a.l)).fn(); return S.stress - s; });
    assert.strictEqual(r3, -8, 'next day: relief again');
    // too poor: declined, no time passes
    const r4 = await page.evaluate(() => { S.cur++; S.t = day() * 1440 + 1080; S.loc = 'tc_cactus'; S.money = -CARD_LIMIT; const t = S.t; actions().find(a => /Tacos/.test(a.l)).fn(); return S.t - t; });
    assert.strictEqual(r4, 0);
    noErrors(errors);
  } },
  { name: 'tacoma fun: visitor mode adds "Out on the town" through visitScore()', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
    const before = await page.evaluate(() => visitScore());
    assert.ok(!before.lines.some(l => /Out on the town/.test(l)));
    const r = await page.evaluate(() => { S.loc = 'tc_grand'; S.t = day() * 1440 + 900; S.money = 200; actions().find(a => /See a film/.test(a.l)).fn();
      const v = visitScore(); return { lines: v.lines, fun: v.parts.fun }; });
    assert.ok(r.lines.some(l => /Out on the town: 1 place on the mainland \(\+60\)/.test(l)), JSON.stringify(r.lines));
    assert.strictEqual(r.fun, 60); assert.ok(!before.parts || !before.parts.fun);
    noErrors(errors);
  } },
];
