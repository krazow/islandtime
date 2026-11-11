const { open, noErrors, reload, assert } = require('./helpers');

const clearM = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };

// a second, independent page whose own Math.random uses a different seed
async function openOther(ctx, seed) {
  const context = await ctx.context.browser().newContext({ viewport: { width: 400, height: 800 } });
  context.setDefaultTimeout(5000);
  const r = await open({ context, target: ctx.target }, { seed });
  r.close = () => context.close();
  return r;
}
const start = (page, id) => page.evaluate(([id, clr]) => {
  eval(clr); const c = challengeStart(id); clearM(); tab = 'act'; render();
  return { c, week: JSON.stringify(S.week), state: JSON.stringify(Object.assign({}, S, { log: null, name: null })) };
}, [id, 'var clearM=' + clearM.toString()]);
// The same scripted actions every day: up to two of the first non-travel actions, a rest, then bed.
// Records prices, the log and the meters for each day.
const play = (page, from, to) => page.evaluate(([from, to, clr]) => {
  eval(clr); const out = [];
  for (let d = from; d <= to && !S.over; d++) {
    const px = {}; for (const g in GOODS) px[g] = [price(g, 'M').buy, price(g, 'I').buy];
    for (const re of [/^Do the dishes/, /^Rest for an hour/, /^Rest for an hour/]) { const a = actions().find(x => re.test(x.l) && !x.dis); if (a) { a.fn(); clearM(); } }
    S.loc = 'home'; S.t = d * 1440 + 1300; endDay('home'); clearM();
    out.push({ d, px, money: S.money, health: S.health, stress: S.stress, home: S.home, ev: S.ev.history.map(h => h.id + '@' + h.t), log: S.log.map(l => l.t + ' ' + l.s) });
  }
  return out;
}, [from, to, 'var clearM=' + clearM.toString()]);

module.exports = [
  { name: 'challenge week ids (ISO, Monday-based, local time) and specs', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const w = (y, m, d) => challengeWeekId(new Date(y, m - 1, d, 12));
      return { a: w(2026, 11, 10), mon: w(2026, 11, 9), sun: w(2026, 11, 15), nextMon: w(2026, 11, 16),
        y1: w(2026, 1, 1), y2: w(2025, 12, 29), y3: w(2027, 1, 3), y4: w(2027, 1, 4), y5: w(2020, 12, 31), y6: w(2021, 1, 3),
        late: challengeWeekId(new Date(2026, 10, 15, 23, 59)), now: challengeWeekId() === challengeWeekId(new Date()),
        s1: challengeSpec('2026-W46'), s2: challengeSpec('2026-W46'), s3: challengeSpec('2026-W47'),
        seas: ['2026-W50', '2026-W51', '2026-W52', '2026-W53', '2027-W01', '2027-W02'].map(id => challengeSpec(id).season) };
    });
    assert.strictEqual(r.a, '2026-W46'); assert.strictEqual(r.mon, '2026-W46'); assert.strictEqual(r.sun, '2026-W46'); assert.strictEqual(r.nextMon, '2026-W47');
    assert.strictEqual(r.late, '2026-W46');
    assert.strictEqual(r.y1, '2026-W01'); assert.strictEqual(r.y2, '2026-W01'); assert.strictEqual(r.y3, '2026-W53'); assert.strictEqual(r.y4, '2027-W01');
    assert.strictEqual(r.y5, '2020-W53'); assert.strictEqual(r.y6, '2020-W53'); assert.ok(r.now);
    assert.deepStrictEqual(r.s1, r.s2);
    assert.deepStrictEqual(Object.keys(r.s1).sort(), ['diff', 'id', 'mode', 'season', 'seed']);
    assert.strictEqual(r.s1.diff, 'normal'); assert.strictEqual(r.s1.mode, 'week'); assert.ok(Number.isInteger(r.s1.seed) && r.s1.seed >= 0 && r.s1.seed < 2 ** 32);
    assert.notStrictEqual(r.s1.seed, r.s3.seed);
    // the seasons rotate fall → winter → spring → summer, straight across the new year
    const order = ['fall', 'winter', 'spring', 'summer'];
    for (let i = 1; i < r.seas.length; i++) assert.strictEqual(r.seas[i], order[(order.indexOf(r.seas[i - 1]) + 1) % 4], r.seas.join());
    noErrors(errors);
  } },
  { name: 'two players of the same challenge get the same week, prices and events; other weeks differ', fn: async ctx => {
    const A = await open(ctx, { seed: 1 }), B = await openOther(ctx, 987654);
    try {
      const a = await start(A.page, '2026-W46'), b = await start(B.page, '2026-W46');
      assert.deepStrictEqual(a.c, { id: '2026-W46', seed: a.c.seed, season: a.c.season, diff: 'normal' });
      assert.ok(await A.page.evaluate(() => challengeOn() && S.mode === 'week' && S.diff === 'normal'));
      assert.strictEqual(a.week, b.week); assert.strictEqual(a.state, b.state);
      const pa = await play(A.page, 0, 6), pb = await play(B.page, 0, 6);
      assert.strictEqual(pa.length, 7);
      for (let d = 0; d < 7; d++) assert.deepStrictEqual(pa[d], pb[d], 'day ' + d);
      const ra = await A.page.evaluate(() => challengeResult()), rb = await B.page.evaluate(() => challengeResult());
      assert.deepStrictEqual(ra, rb); assert.strictEqual(ra.id, '2026-W46'); assert.ok(ra.over);
      for (const k of ['score', 'money', 'workdays', 'stranded', 'rep']) assert.strictEqual(typeof ra[k], 'number', k);
      // the result matches the end screen
      const end = await A.page.textContent('.end');
      assert.ok(end.includes(String(ra.score)) && end.includes(ra.title), end.slice(0, 300));
      // a different week is a different world
      const c = await start(B.page, '2026-W47');
      assert.notStrictEqual(c.week, a.week);
      // a normal game in each page isn't seeded by the challenge
      const n = await Promise.all([A.page, B.page].map(p => p.evaluate(() => { newGame('normal', 'week', 'fall'); return [JSON.stringify(S.week), challengeOn()]; })));
      assert.notStrictEqual(n[0][0], n[1][0]); assert.ok(!n[0][1] && !n[1][1]);
      noErrors(A.errors); noErrors(B.errors);
    } finally { await B.close(); }
  } },
  { name: 'challenge streams: the week plan and mornings do not depend on extra actions', fn: async ctx => {
    const A = await open(ctx, { seed: 5 }), B = await openOther(ctx, 6);
    try {
      const a = await start(A.page, '2026-W48'), b = await start(B.page, '2026-W48');
      assert.strictEqual(a.week, b.week);
      // B burns a pile of rolls on day 0 that A doesn't
      await B.page.evaluate(() => { for (let i = 0; i < 50; i++) Math.random(); });
      await A.page.evaluate(() => { for (let i = 0; i < 3; i++) Math.random(); });
      const mornings = p => p.evaluate(() => { const out = []; for (let d = 0; d < 6; d++) { S.loc = 'home'; S.t = d * 1440 + 1300; S.health = 80; endDay('home'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); out.push([S.t, S.injury && S.injury.day, S.log.filter(l => l.t === S.t).map(l => l.s)]); } return out; });
      assert.deepStrictEqual(await mornings(A.page), await mornings(B.page));
      assert.strictEqual(await A.page.evaluate(() => JSON.stringify(S.week)), a.week);
      noErrors(A.errors); noErrors(B.errors);
    } finally { await B.close(); }
  } },
  { name: 'Math.random is the real one again outside a challenge', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const real = Math.random, out = {};
      challengeStart('2026-W46'); out.on = Math.random !== real;
      newGame('normal', 'week'); out.normal = Math.random === real && !challengeOn();
      challengeStart('2026-W46'); out.on2 = Math.random !== real;
      finish(); out.ended = Math.random === real && challengeOn() && challengeResult().over;
      challengeStart('2026-W46'); S = null; Math.random(); out.cleared = Math.random === real;
      return out;
    });
    assert.deepStrictEqual(r, { on: true, normal: true, on2: true, ended: true, cleared: true });
    noErrors(errors);
  } },
  { name: 'save and reload keep the challenge and its determinism', fn: async ctx => {
    const A = await open(ctx, { seed: 11 }), B = await openOther(ctx, 22);
    try {
      await start(A.page, '2026-W46'); await start(B.page, '2026-W46');
      const pa = await play(A.page, 0, 6);
      await play(B.page, 0, 2);
      await B.page.evaluate(() => saveGame());
      await reload(B.page);
      await B.page.click('text=Continue as T'); await B.page.waitForSelector('.hud');
      assert.deepStrictEqual(await B.page.evaluate(() => [S.challenge.id, challengeOn(), Math.random === chRand]), ['2026-W46', true, true]);
      const pb = await play(B.page, 3, 6);
      for (let d = 3; d < 7; d++) assert.deepStrictEqual(pb[d - 3], pa[d], 'day ' + d);
      // a normal game loaded after a challenge is not seeded
      noErrors(A.errors); noErrors(B.errors);
    } finally { await B.close(); }
  } },
];
