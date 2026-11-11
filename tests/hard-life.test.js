// Ferry Hell only: weekly rent (LV('rent')) and morning car trouble (LV('carTrouble')), 33-hard-life.js
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const rentAct = page => page.evaluate(() => { const a = actions().find(a => /^Pay rent by phone/.test(a.l)); return a ? { l: a.l, s: a.s, dis: !!a.dis } : null; });
const rentTodo = page => page.evaluate(() => { const i = todoItems().find(i => /^Pay rent/.test(i.l)); return i ? { l: i.l, s: i.s, ok: i.ok, urgent: i.urgent } : null; });
// go to bed on Sunday night (healthy, fed), returns the rent state afterwards
const sunday = page => page.evaluate(clr => { eval(clr)();
  S.cur = 6; S.t = 6 * 1440 + 1320; S.loc = 'home'; S.health = 100; S.stress = 0; S.job = 100; S.pantry = 10; S.log = [];
  endDay('home');
  return Object.assign({}, S.hl.rent, { over: S.over, weekNo: S.weekNo, log: S.log.map(l => l.s).join(' '), end: (document.querySelector('.end h1') || {}).textContent || '', lost: !!(S.ending && S.ending.lost) });
}, `(${clear})`);
// start a morning drive from home to the island landing in the island car
const drive = (page, opt = {}) => page.evaluate(([clr, o]) => { eval(clr)();
  S.loc = 'home'; S.t = S.cur * 1440 + (o.at || 420); S.phone = 100; S.injury = null;
  const c = S.cars.find(c => c.id === 'isl'); c.loc = 'home'; c.fuel = 10;
  if (o.rnd != null) Math.random = () => o.rnd;
  const t0 = S.t; go('aiDock', { m: 'car', min: dist('home', 'aiDock') });
  return { dt: S.t - t0, loc: S.loc, title: (document.querySelector('#mbg h2') || {}).textContent || '', hl: S.ev.history.filter(h => /^hl_/.test(h.id)).map(h => h.id), rolled: Object.keys(S.hl.car.rolled) };
}, [`(${clear})`, opt]);
const pressModal = (page, re) => page.evaluate(src => { const i = MB.findIndex(b => new RegExp(src).test(b.l)); if (i < 0) return 'missing: ' + MB.map(b => b.l).join(' | '); MBTN(i); return 'ok'; }, re.source);

module.exports = [
  { name: 'hard life: rent is on the to-do list and paid by phone from anywhere on Hard ($125, due Sunday)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    const todo = await rentTodo(page);
    assert.ok(todo && !todo.ok, JSON.stringify(todo)); assert.match(todo.l, /\$125 by Sunday/);
    assert.match(await page.evaluate(() => S.log.map(l => l.s).join(' ')), /Rent is \$125 a week, due Sunday/);
    await page.evaluate(() => { S.loc = 'work'; S.t = 1440 + 600; S.cur = 1; S.money = 650; S.phone = 50; });
    const a = await rentAct(page);
    assert.ok(a && !a.dis, JSON.stringify(a)); assert.match(a.l, /\$125/);
    const r = await page.evaluate(() => { const t = S.t; actions().find(a => /^Pay rent by phone/.test(a.l)).fn(); return { m: S.money, dt: S.t - t }; });
    assert.deepStrictEqual(r, { m: 525, dt: 5 });
    assert.strictEqual(await rentAct(page), null);
    assert.ok((await rentTodo(page)).ok);
    // a dead phone can't pay
    await page.evaluate(() => { S.hl.rent.wk = -1; S.phone = 0; });
    assert.ok((await rentAct(page)).dis);
    noErrors(errors);
  } },
  { name: 'hard life: rent never appears on Islander or Normal, and Sunday costs nothing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const diff of ['easy', 'normal']) {
      await newGame(page, diff, 'month');
      assert.strictEqual(await rentTodo(page), null, diff);
      assert.strictEqual(await rentAct(page), null, diff);
      assert.doesNotMatch(await page.evaluate(() => S.log.map(l => l.s).join(' ')), /Rent/);
      const r = await sunday(page);
      assert.deepStrictEqual([r.owed, r.strikes, r.fees], [0, 0, 0], diff);
      assert.doesNotMatch(r.log, /Darlene|landlord|NOTICE TO PAY/i);
    }
    noErrors(errors);
  } },
  { name: 'hard life: unpaid rent gets a $25 late fee and a landlord text, then an eviction warning; paying clears it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard', 'month');
    const m0 = await page.evaluate(() => S.money);
    let r = await sunday(page);
    assert.deepStrictEqual([r.owed, r.strikes, r.fees, r.weekNo, r.over], [150, 1, 25, 1, false]);
    assert.match(r.log, /Text from Darlene, your landlord.*\$25 late fee/);
    const t = await rentTodo(page);
    assert.ok(!t.ok && t.urgent); assert.match(t.s, /\$275 owed, \$150 of it overdue/);
    r = await sunday(page);
    assert.deepStrictEqual([r.owed, r.strikes, r.fees, r.weekNo, r.over], [300, 2, 50, 2, false]);
    assert.match(r.log, /NOTICE TO PAY RENT OR VACATE/);
    assert.match((await rentTodo(page)).s, /One more missed Sunday/);
    const p = await page.evaluate(() => { S.money = 1000; S.phone = 80; actions().find(a => /^Pay rent by phone/.test(a.l)).fn(); return { m: S.money, r: S.hl.rent }; });
    assert.strictEqual(p.m, 1000 - 425); // $125 this week + $300 behind
    assert.deepStrictEqual([p.r.owed, p.r.strikes], [0, 0]);
    r = await sunday(page);
    assert.deepStrictEqual([r.owed, r.strikes], [0, 0]); // paid this week: no fee
    assert.ok(m0 > 0);
    noErrors(errors);
  } },
  { name: 'hard life: three unpaid Sundays in a row is an eviction ending; a week game settles the rent at the end', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard', 'month');
    await sunday(page); await sunday(page);
    const r = await sunday(page);
    assert.ok(r.over && r.lost, JSON.stringify(r)); assert.strictEqual(r.end, 'Evicted');
    await newGame(page, 'hard', 'week');
    const w = await sunday(page);
    assert.ok(w.over && !w.lost, JSON.stringify(w));
    assert.deepStrictEqual([w.owed, w.wk], [0, 0]); // charged at the end (rent + late fee)
    noErrors(errors);
  } },
  { name: 'hard life: old saves without the new fields load and get rent on Hard', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    await page.evaluate(() => saveGame());
    const r = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('islandtime.save')); delete d.S.hl;
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); adopt(migrate(d));
      const a = rentOwed(); delete S.hl; const b = rentOwed(); S.hl = { rent: { wk: 0 } }; const c = rentOwed();
      for (const k of ['act', 'todo']) setTab(k);
      return { a, b, c, car: typeof S.hl.car.rolled, hud: !!document.querySelector('.hud') }; });
    assert.deepStrictEqual(r, { a: 125, b: 125, c: 0, car: 'object', hud: true });
    noErrors(errors);
  } },
  { name: 'hard life: car trouble never happens on Normal, even with every roll at zero or forced', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal');
    for (let d = 0; d < 5; d++) {
      await page.evaluate(d => { S.cur = d; forceEvent('hl_battery'); forceEvent('hl_flat'); }, d);
      const r = await drive(page, { rnd: 0 });
      assert.deepStrictEqual([r.hl, r.rolled], [[], []], JSON.stringify(r));
      assert.doesNotMatch(r.title, /won’t start|Flat tire/);
    }
    assert.strictEqual(await page.evaluate(() => carTroubleP({ id: 'beat' })), 0);
    noErrors(errors);
  } },
  { name: 'hard life: car trouble can hit a Hard morning drive: dead battery, a 30-minute jump', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    const p = await page.evaluate(() => [carTroubleP({ id: 'isl' }), carTroubleP({ id: 'isl', diesel: true }), carTroubleP({ id: 'beat' })]);
    assert.deepStrictEqual(p, [0.1, 0.1, 0.2]); // beater twice as likely
    await page.evaluate(() => { S.cur = 1; });
    const r = await drive(page, { rnd: 0.01 });
    assert.deepStrictEqual([r.hl, r.loc, r.dt], [['hl_battery'], 'home', 0]);
    assert.match(r.title, /The car won’t start/);
    await page.evaluate(() => { Math.random = () => 0.99; });
    assert.strictEqual(await pressModal(page, /for a jump/), 'ok');
    const after = await page.evaluate(() => ({ loc: S.loc, t: tod() }));
    assert.deepStrictEqual(after, { loc: 'aiDock', t: 420 + 30 + await page.evaluate(() => dist('home', 'aiDock')) });
    // only one roll per car per morning, and nothing again inside the 3-day cooldown
    const again = await drive(page, { rnd: 0.01 });
    assert.deepStrictEqual(again.hl, ['hl_battery']);
    assert.ok(!/won’t start/.test(again.title), again.title);
    // afternoons are safe
    await page.evaluate(() => { S.cur = 5; });
    const pm = await drive(page, { rnd: 0.01, at: 900 });
    assert.deepStrictEqual(pm.hl, ['hl_battery']);
    noErrors(errors);
  } },
  { name: 'hard life: flat tire: change it in 45 min, or a tow ($275 on the island, $150 on the mainland)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    await page.evaluate(() => { S.cur = 1; forceEvent('hl_flat'); });
    let r = await drive(page, { rnd: 0.99 });
    assert.deepStrictEqual(r.hl, ['hl_flat']); assert.match(r.title, /Flat tire/);
    assert.match(await page.evaluate(() => MB.map(b => b.l).join('|')), /Call the tow from the mainland: \$275/);
    assert.strictEqual(await pressModal(page, /Change it to the spare/), 'ok');
    assert.deepStrictEqual(await page.evaluate(() => ({ loc: S.loc, t: tod() })), { loc: 'aiDock', t: 420 + 45 + await page.evaluate(() => dist('home', 'aiDock')) });
    // mainland: the beater in the terminal lot, mobile tire service
    const m = await page.evaluate(clr => { eval(clr)(); S.cur = 5; S.loc = 'stDock'; S.t = 5 * 1440 + 480; S.money = 500;
      S.cars.push({ id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'stDock', fuel: 8, tank: 12, diesel: false });
      forceEvent('hl_flat'); go('work', { m: 'car', min: dist('stDock', 'work') });
      const btns = MB.map(b => b.l).join('|'); MBTN(MB.findIndex(b => /Tire & Auto/.test(b.l)));
      return { btns, m: S.money, loc: S.loc }; }, `(${clear})`);
    assert.match(m.btns, /Lakewood Tire & Auto: \$150/);
    assert.deepStrictEqual([m.m, m.loc], [350, 'work']);
    noErrors(errors);
  } },
];
