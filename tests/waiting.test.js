const { open, newGame, noErrors, assert } = require('./helpers');

// ⏩ less waiting (src/js/51-waiting.js)
const setup = (page, o) => page.evaluate(o => {
  crossing = (a, b, c, done) => done();
  S.week.b = []; S.week.fog = S.week.fog.map(() => 0); S.week.px && 0;
  S.cur = o.d; S.t = o.d * 1440 + o.m; S.phoneT = S.t; S.phone = 100; S.loc = o.loc;
  if (o.car) S.cars[0].loc = o.car; S.cars.forEach(c => { c.fuel = c.tank; });
  MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, o);
const labels = page => page.evaluate(() => actions().map(a => a.l));

module.exports = [
  { name: 'at the terminal: a clear "Wait for the 10:35 boat (35 min)" action boards it (via Ketron)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' });
    const l = (await labels(page)).find(x => /^Wait for the/.test(x));
    assert.match(l, /^Wait for the 10:35 AM boat \(35 min\)$/);
    const m0 = await page.evaluate(() => S.money);
    await page.click('.act:has-text("Wait for the 10:35")');
    const r = await page.evaluate(() => ({ loc: S.loc, t: S.t % 1440, money: S.money, car: S.cars[0].loc, waited: S.stats.waited }));
    assert.strictEqual(r.loc, 'aiDock'); assert.strictEqual(r.t, 635 + 30); assert.strictEqual(r.car, 'aiDock');
    assert.ok(r.money < m0, 'fare paid'); assert.ok(r.waited >= 35);
    noErrors(errors);
  } },
  { name: 'it is the walk-on boat when you have no car here, and absent when no boat is left tonight', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'home' });
    assert.ok((await labels(page)).some(x => /^Wait for the 10:35 AM boat/.test(x)));
    await page.click('.act:has-text("Wait for the 10:35")');
    assert.strictEqual(await page.evaluate(() => S.loc), 'aiDock');
    await setup(page, { d: 1, m: 1400, loc: 'stDock', car: 'stDock' });
    assert.ok(!(await labels(page)).some(x => /^Wait for the/.test(x)), 'nothing to wait for after the last boat');
    await setup(page, { d: 1, m: 600, loc: 'market', car: 'market' });
    assert.ok(!(await labels(page)).some(x => /^Wait for the/.test(x)), 'only at a terminal');
    noErrors(errors);
  } },
  { name: 'waiting still hits outages: a breakdown before departure stops you with a rider alert', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' });
    await page.evaluate(() => { S.week.b = [{ start: S.d0 = 1 * 1440 + 612, end: 1 * 1440 + 612 + 300, cause: 'generator failure' }]; });
    await page.click('.act:has-text("Wait for the 10:35")');
    assert.strictEqual(await page.evaluate(() => S.loc), 'stDock');
    assert.match(await page.textContent('#mbg'), /Rider Alert/);
    noErrors(errors);
  } },
  { name: 'last-boat warnings: once at 60 and once at 20 minutes, only away from the terminal and only when you need the boat', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const run = (t, loc) => page.evaluate(([t, loc]) => { S.week.b = []; S.cur = 2; S.t = 2 * 1440 + t; S.phoneT = S.t; S.phone = 100; if (loc) S.loc = loc; const n = S.log.length; processTimed(); return S.log.slice(n).filter(x => /Last boat/.test(x.s)).map(x => x.s); }, [t, loc]);
    // resident on the mainland: the last boat from Steilacoom is 10:20 PM (1340)
    assert.strictEqual((await run(1200, 'market')).length, 0, 'too early');
    const a = await run(1290, 'market'); assert.strictEqual(a.length, 1); assert.match(a[0], /Last boat home/); assert.match(a[0], /10:20 PM/);
    assert.strictEqual((await run(1300, 'market')).length, 0, 'not twice');
    const b = await run(1322, 'market'); assert.strictEqual(b.length, 1, '20-minute warning');
    assert.strictEqual((await run(1330, 'market')).length, 0);
    await page.evaluate(() => { S.lbWarn = {}; });
    assert.strictEqual((await run(1290, 'stDock')).length, 0, 'at the terminal: no warning');
    assert.strictEqual((await run(1290, 'home')).length, 0, 'already home: no warning');
    // jumping straight into the last 20 minutes only gives the 20-minute warning
    await page.evaluate(() => { S.lbWarn = {}; });
    assert.strictEqual((await run(1325, 'market')).length, 1);
    assert.strictEqual((await run(1330, 'market')).length, 0);
    // dead phone: nothing
    await page.evaluate(() => { S.lbWarn = {}; });
    assert.strictEqual(await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 1300; S.loc = 'market'; S.phone = 0; const n = S.log.length; processTimed(); return S.log.slice(n).filter(x => /Last boat/.test(x.s)).length; }), 0);
    noErrors(errors);
  } },
  { name: 'last-boat warning: Easy mode outage heads-up is not doubled; visitors warn on the final day from the island', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'easy');
    const r = await page.evaluate(() => { S.week.b = []; S.cur = 2; S.t = 2 * 1440 + 1290; S.phoneT = S.t; S.phone = 100; S.loc = 'market'; S.easyWarn = [`${S.weekNo || 0}:${S.t + 30}`]; const n = S.log.length; processTimed(); return S.log.slice(n).filter(x => /Last boat/.test(x.s)).length; });
    assert.strictEqual(r, 0, 'Easy already warned about this stretch');
    await page.evaluate(() => { crossing = (a, b, c, done) => done(); visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    const v = await page.evaluate(() => { const V = VS(); S.week.b = []; S.cur = V.last; S.t = V.last * 1440 + 1330; S.phoneT = S.t; S.phone = 100; S.loc = 'lake'; const n = S.log.length; processTimed(); return S.log.slice(n).filter(x => /Last boat/.test(x.s)).map(x => x.s); });
    assert.strictEqual(v.length, 1); assert.match(v[0], /Last boat home/, 'a visitor lives on the mainland: leaving the island is going home');
    // a visitor staying at the rental cabin who is over on the mainland: the boat goes back to the island, not home
    const w = await page.evaluate(() => { const V = VS(); V.rental = V.rental || {}; V.rental.checkedIn = true; V.rental.checkedOut = false; S.lbWarn = {}; S.week.b = []; S.cur = V.arr; S.t = V.arr * 1440 + 1290; S.phoneT = S.t; S.phone = 100; S.loc = 'market'; const n = S.log.length; processTimed(); return S.log.slice(n).filter(x => /Last boat/.test(x.s)).map(x => x.s); });
    assert.strictEqual(w.length, 1, JSON.stringify(w)); assert.match(w[0], /back to the island/); assert.doesNotMatch(w[0], /Last boat home/); assert.match(w[0], /cabin/);
    noErrors(errors);
  } },
];
