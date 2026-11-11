const { open, noErrors, assert } = require('./helpers');

// 📅 Weekend regular: a whole month played through (state-driven: work the weekdays, pay rent, spend each weekend on
// the island), the long weekend (a vacation Monday on the island, 47-regular-long.js), the Hard goal, and a missed
// Sunday boat that must not end the month.
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const start = (page, home, diff) => page.evaluate(([h, d, clr]) => { eval(clr)(); crossing = (a, b, c, done) => done();
  visitorNew('regular', h, d); eval(clr)(); tab = 'act'; render(); }, [home, diff, `(${clear})`]);
const act = (page, re) => page.evaluate(([src, clr]) => { eval(clr)(); const a = actions().find(x => new RegExp(src).test(x.l) && !x.dis);
  if (!a) return 'missing: ' + actions().map(x => x.l + (x.dis ? ' (dis)' : '')).join(' | '); a.fn(); eval(clr)(); return 'ok'; }, [re.source, `(${clear})`]);
// put the player somewhere at a time, then let the game react as after any action
const put = (page, d, m, loc) => page.evaluate(([d, m, loc, clr]) => { eval(clr)(); S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; S.loc = loc;
  S.cars[0].loc = loc; S.health = Math.max(S.health, 90); S.stress = Math.min(S.stress, 20); afterAction(); eval(clr)(); }, [d, m, loc, `(${clear})`]);
const sleep = (page, where) => page.evaluate(([w, clr]) => { eval(clr)(); S.pantry = Math.max(S.pantry, 3); S.health = Math.max(S.health, 90); endDay(w); eval(clr)(); }, [where, `(${clear})`]);
const st = page => page.evaluate(() => { const V = VS(), R = V && V.reg; return { over: S.over, wk: S.weekNo, cur: S.cur, money: Math.round(S.money),
  W: R && { on: R.W.on, done: R.W.done, n: R.W.n }, weekends: R && R.weekends, vac: R && R.vac, last: V && V.last, rental: V && V.rental && { in: V.rental.in, out: V.rental.out, ci: V.rental.checkedIn, co: V.rental.checkedOut },
  long: R && R.long ? R.long.wk : null, end: (document.querySelector('.end h1') || {}).textContent || '' }; });

// one weekday: commute, a full shift, home, sleep
async function weekday(page, d) {
  const J = await page.evaluate(() => { const j = curJob(); return { start: j.start, loc: j.loc }; });
  await put(page, d, J.start - 5, J.loc);
  const r = await act(page, /^Work a full shift/); if (r !== 'ok') throw new Error(`day ${d}: ${r}`);
  await put(page, d, 1140, 'vhome');
  await sleep(page, 'vhome');
}
// a weekend on the island: Friday evening boat, check in, Saturday at the lake, Sunday check out and home, rent paid
async function weekend(page) {
  await put(page, 4, 1140, 'home');
  assert.strictEqual(await act(page, /^Check in/), 'ok');
  await sleep(page, 'home');
  await put(page, 5, 600, 'lake');
  await put(page, 5, 1200, 'home');
  await sleep(page, 'home');
  await put(page, 6, 600, 'home');
  assert.strictEqual(await act(page, /^Check out and take the trash out/), 'ok');
  await put(page, 6, 720, 'stDock');
  await put(page, 6, 800, 'vhome');
  assert.strictEqual(await act(page, /^Pay rent/), 'ok');
  await sleep(page, 'vhome');
}

module.exports = [
  { name: 'Weekend regular: a whole month plays through (4 work weeks, 4 island weekends) to an ending', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page, 'tacoma', 'normal');
    for (let w = 0; w < 4; w++) {
      for (let d = 0; d < 4; d++) await weekday(page, d);
      const J = await page.evaluate(() => { const j = curJob(); return { start: j.start, loc: j.loc }; });
      await put(page, 4, J.start - 5, J.loc); assert.strictEqual(await act(page, /^Work a full shift/), 'ok');
      await weekend(page);
      const s = await st(page);
      if (w < 3) { assert.ok(!s.over, `week ${w + 1}: still playing (${s.end})`); assert.strictEqual(s.wk, w + 1); assert.strictEqual(s.weekends, w + 1); }
      else { assert.ok(s.over, 'the month ends after week 4'); assert.match(s.end, /regular|island|resident|moved/i); }
    }
    noErrors(errors);
  } },
  { name: 'Weekend regular: a long weekend: take Monday off on Sunday, stay another night, check out Monday, and the new week is intact', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page, 'olympia', 'normal');
    for (let d = 0; d < 4; d++) await weekday(page, d);
    await put(page, 4, 1140, 'home'); assert.strictEqual(await act(page, /^Check in/), 'ok'); await sleep(page, 'home');
    await put(page, 5, 1200, 'home'); await sleep(page, 'home');
    // Sunday at the lake: the offer is there; at home on the mainland it isn't
    await put(page, 6, 600, 'lake');
    const m0 = await page.evaluate(() => S.money);
    assert.strictEqual(await act(page, /^Take Monday off and stay another night/), 'ok');
    let s = await st(page);
    assert.strictEqual(s.vac, 4); assert.strictEqual(s.long, 0); assert.strictEqual(s.rental.out, 7 * 1440 + 660);
    assert.strictEqual(Math.round(m0 - await page.evaluate(() => S.money)), 85, 'one more night at the cabin');
    assert.ok(!(await page.evaluate(() => actions().some(a => /^Take Monday off/.test(a.l)))), 'only once');
    // Sunday night at the cabin, then Monday morning: still the weekend, check-out by 11, Monday is a paid vacation day
    await put(page, 6, 1260, 'home'); await sleep(page, 'home');
    s = await st(page);
    assert.strictEqual(s.wk, 1); assert.strictEqual(s.cur, 0); assert.ok(s.W.on && !s.W.done, 'the weekend goes on'); assert.strictEqual(s.last, 0);
    assert.strictEqual(s.rental.out, 660); assert.ok(s.rental.ci && !s.rental.co);
    assert.ok(await page.evaluate(() => S.worked[0] === true), 'Monday counts as a paid vacation day');
    assert.strictEqual(await act(page, /^Check out and take the trash out/), 'ok');
    await put(page, 0, 780, 'stDock');
    s = await st(page);
    assert.strictEqual(s.weekends, 1); assert.ok(!s.W.on && !s.W.done, "this week's weekend is fresh"); assert.strictEqual(s.W.n, 1);
    assert.strictEqual(s.last, 6); assert.strictEqual(s.long, null);
    assert.deepStrictEqual([s.rental.in, s.rental.out, s.rental.ci, s.rental.co], [4 * 1440 + 900, 6 * 1440 + 660, false, false]);
    assert.ok(!s.over);
    noErrors(errors);
  } },
  { name: 'Weekend regular: on the island after the last boat Sunday, "next sailing" does not end the month', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page, 'tacoma', 'normal');
    await put(page, 6, 1400, 'aiDock');
    await page.evaluate(() => { const a = actions().find(x => /^Walk on the next sailing/.test(x.l)); if (a) a.fn(); });
    const s = await st(page);
    assert.ok(!s.over, 'still playing: ' + s.end);
    noErrors(errors);
  } },
  { name: 'Weekend regular: Hard asks for $3,500 saved and $3,000 down; Normal $4,000 and $3,500', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await start(page, 'tacoma', 'hard');
    assert.deepStrictEqual(await page.evaluate(() => [REG_GOAL.money, regDown()]), [3500, 3000]);
    assert.ok(await page.evaluate(() => todoItems().some(i => /Save \$3500/.test(i.l))));
    await start(page, 'tacoma', 'normal');
    assert.deepStrictEqual(await page.evaluate(() => [REG_GOAL.money, regDown()]), [4000, 3500]);
    noErrors(errors);
  } },
];
