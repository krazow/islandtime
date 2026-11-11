// Easy-level helpers: warming shelter, ferry warnings, forgiving job, slower house wear, faster recovery. None of it on Normal.
const { open, newGame, noErrors, assert } = require('./helpers');
const stormSetup = page => page.evaluate(() => {
  S.cur = 2; S.t = 2 * 1440 + 1000; S.loc = 'home'; S.gen = null; S.homeGas = 0; UP().wood = 0; UP().propane = 0; S.health = 60; S.stress = 40; S.pantry = 5; S.injuryRolled = true;
  S.week.storm = { day: 2, start: 2 * 1440 + 1080, end: 3 * 1440 + 1320 }; S.ph = S.ph || {}; render();
  return actions().some(a => /warming shelter/.test(a.l));
});
module.exports = [
  { name: 'easy-help: shelter on Easy: offered in a gale with no generator or wood, avoids the cold-night damage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'easy');
    assert.ok(await stormSetup(page));
    await page.evaluate(() => { actions().find(a => /^Go to the warming shelter/.test(a.l)).fn(); });
    const r = await page.evaluate(() => ({ loc: S.loc, hasSleep: actions().some(a => /at the (warming )?shelter/.test(a.l)) }));
    assert.deepStrictEqual(r, { loc: 'legion', hasSleep: true });
    const h0 = await page.evaluate(() => { const h = S.health; actions().find(a => /at the (warming )?shelter/.test(a.l) && /Ends the day/.test(a.s)).fn(); return h });
    const after = await page.evaluate(() => ({ h: S.health, loc: S.loc, ph: S.phone, log: S.log.map(l => l.s).join(' ') }));
    assert.ok(after.h >= h0, `health ${h0} -> ${after.h}`);
    assert.strictEqual(after.loc, 'home'); assert.strictEqual(after.ph, 100);
    assert.match(after.log, /Legion warming shelter/);
    noErrors(errors);
  } },
  { name: 'easy-help: shelter text from an islander; absent on Normal, and Normal still takes the cold damage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'easy');
    await stormSetup(page);
    const t = await page.evaluate(() => { S.phone = 80; S.t = 2 * 1440 + 900; phoneTimed(); return JSON.stringify(S.ph.msg) });
    assert.match(t, /warming shelter/);
    await newGame(page, 'normal');
    assert.strictEqual(await stormSetup(page), false);
    const r = await page.evaluate(() => { phoneTimed(); const h = S.health; endDay('home'); return { h0: h, h1: S.health, msg: JSON.stringify((S.ph||{}).msg||{}) } });
    assert.ok(r.h1 < r.h0 + 3, JSON.stringify(r)); assert.ok(!/warming shelter/.test(r.msg));
    noErrors(errors);
  } },
  { name: 'easy-help: ferry warning an hour before an outage on Easy, once; none on Normal', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const run = async diff => { await newGame(page, diff);
      return page.evaluate(() => { S.cur = 1; S.loc = 'aiDock'; S.phone = 90; S.week.b = [];
        const dep = deps('I', 1).find(x => x > 700), start = 1440 + dep - 10;
        S.week.b.push({ start, end: start + 120, cause: 'propulsion control fault' });
        S.t = start - 90; phoneTimed(); const none = (S.easyWarn || []).length;
        S.t = start - 45; phoneTimed(); const w1 = (S.easyWarn || []).length; const n1 = S.log.filter(l => /Ferry heads-up/.test(l.s)).length;
        S.t = start - 30; phoneTimed(); const n2 = S.log.filter(l => /Ferry heads-up/.test(l.s)).length;
        return { none, w1, n1, n2 } }) };
    assert.deepStrictEqual(await run('easy'), { none: 0, w1: 1, n1: 1, n2: 1 });
    assert.deepStrictEqual(await run('normal'), { none: 0, w1: 0, n1: 0, n2: 0 });
    noErrors(errors);
  } },
  { name: 'easy-help: job grace on Easy: first 2 lates cost nothing, third costs; no firing in first 7 days; Normal unchanged', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const late = () => page.evaluate(() => { const J = curJob(); S.cur = J.days[0]; S.loc = J.loc; S.worked = {}; S.t = S.cur * 1440 + J.start + 20; S.job = 60;
      const a = actions().find(a => /^Work a full shift/.test(a.l)); const txt = a.s; a.fn(); return { txt, job: S.job } });
    await newGame(page, 'easy');
    await page.evaluate(() => { S.emp = 'lakewood'; S.empStart = 0 });
    const e1 = await late(), e2 = await late(), e3 = await late();
    assert.match(e1.txt, /Easy: forgiven, 1 left/); assert.match(e2.txt, /Easy: forgiven, 0 left/); assert.doesNotMatch(e3.txt, /Easy/);
    assert.ok(e1.job >= 60 && e2.job >= 60, JSON.stringify([e1, e2])); assert.ok(e3.job < e1.job, JSON.stringify([e1, e3]));
    const f = await page.evaluate(() => { S.empStart = dayKey() - 2; S.job = 3; adj('job', -20); const a = S.job; S.empStart = dayKey() - 9; S.job = 3; adj('job', -20); return [a, S.job] });
    assert.deepStrictEqual(f, [1, 0]);
    await newGame(page, 'normal');
    await page.evaluate(() => { S.emp = 'lakewood'; S.empStart = 0 });
    const n1 = await late();
    assert.doesNotMatch(n1.txt, /Easy/); assert.ok(n1.job < 60, JSON.stringify(n1));
    assert.strictEqual(await page.evaluate(() => { S.empStart = dayKey(); S.job = 3; adj('job', -20); return S.job }), 0);
    noErrors(errors);
  } },
  { name: 'easy-help: house wear ×0.7 and nightly recovery ×1.3 on Easy; Normal exact', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const wear = () => page.evaluate(() => { S.home = 80; S.wearCarry = 0; for (let i = 0; i < 10; i++) homeAdj(-3); homeAdj(5); return { h: S.home, rec: [nightRec(10), nightRec(3)] } });
    await newGame(page, 'easy');
    assert.deepStrictEqual(await wear(), { h: 80 - 21 + 5, rec: [13, 4] });
    await newGame(page, 'normal');
    assert.deepStrictEqual(await wear(), { h: 80 - 30 + 5, rec: [10, 3] });
    // a real night at home: Easy recovers more stress than Normal
    const night = async diff => { await newGame(page, diff); return page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 1200; S.loc = 'home'; S.stress = 80; S.health = 50; S.pantry = 5; endDay('home'); return S.stress }) };
    const se = await night('easy'), sn = await night('normal');
    assert.ok(se < sn, `easy ${se} vs normal ${sn}`);
    noErrors(errors);
  } },
];
