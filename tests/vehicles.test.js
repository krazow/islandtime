// 1.22: each vehicle has its own parts (battery, spare tire, trouble cooldown); the Monday fuel run is a propane tanker
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const twoCars = page => page.evaluate(clr => { eval(clr)(); S.cur = 1; S.t = 1440 + 600; S.loc = 'gas';
  S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'gas', fuel: 6, tank: 14, diesel: false },
            { id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'gas', fuel: 9, tank: 12, diesel: false }]; S.money = 500; tab = 'act'; render(); }, `(${clear})`);

module.exports = [
  { name: 'vehicles: each car has its own battery; an old save’s shared weak battery becomes the island car’s only', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { S.battery = 'weak';
      S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'home', fuel: 6, tank: 14, diesel: false },
                { id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'stDock', fuel: 9, tank: 12, diesel: false }];
      return [carBat(S.cars[0]), carBat(S.cars[1])]; });
    assert.deepStrictEqual(r, ['weak', 'ok']);
    noErrors(errors);
  } },
  { name: 'vehicles: a new battery at the gas station fixes only the car that is there (the one you chose)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await twoCars(page);
    const r = await page.evaluate(() => { S.cars.forEach(c => { c.bat = 'weak'; }); S.drive = 'beat'; render();
      const a = actions().find(a => /^Replace the .*battery/.test(a.l)); const label = a.l; a.fn();
      return { label, isl: S.cars[0].bat, beat: S.cars[1].bat, todo: todoItems().filter(i => /battery/.test(i.l)).map(i => i.l) }; });
    assert.match(r.label, /2004 Corolla/);
    assert.deepStrictEqual([r.isl, r.beat], ['weak', 'ok']);
    assert.deepStrictEqual(r.todo, ['Replace the Subaru’s battery']);
    noErrors(errors);
  } },
  { name: 'vehicles: the dead-battery morning uses the car’s own battery; a visitor’s newer car rarely dies', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { const e = EV.find(e => e.id === 'dead_battery'); S.power = null;
      const isl = { id: 'isl', name: 'Island car (old Subaru)', bat: 'ok', loc: 'home' }, beat = { id: 'beat', name: 'Mainland beater (2004 Corolla)', bat: 'weak', loc: 'stDock' }, mine = { id: 'isl2', name: 'Your car', bat: 'ok', loc: 'home' };
      return [e.chance({ car: isl, from: 'stDock' }), e.chance({ car: beat, from: 'stDock' }), e.chance({ car: mine, from: 'stDock' })]; });
    assert.deepStrictEqual(r, [0.06, 0.3, 0.015]);
    noErrors(errors);
  } },
  { name: 'vehicles: a flat puts that car on its donut; a new tire at the gas station takes it off; the other car is untouched', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await twoCars(page);
    let r = await page.evaluate(() => { const e = EV.find(e => e.id === 'flat_tire'); let add = 0; e.run({ car: S.cars[0], add: n => { add += n; } });
      return { add, isl: S.cars[0].spare, beat: carMech(S.cars[1]).spare, todo: todoItems().some(i => /new tire for the Subaru/.test(i.l)) }; });
    assert.deepStrictEqual(r, { add: 20, isl: 'on', beat: 'ok', todo: true });
    // a second flat on the donut = a tow ($275)
    r = await page.evaluate(() => { const e = EV.find(e => e.id === 'flat_tire'); const m = S.money; let add = 0; e.run({ car: S.cars[0], add: n => { add += n; } }); return { add, paid: m - S.money }; });
    assert.deepStrictEqual(r, { add: 100, paid: 275 });
    // buy a new tire for the car that's here
    r = await page.evaluate(() => { S.cars[0].spare = 'on'; S.drive = 'isl'; render(); const a = actions().find(a => /^New tire for the Subaru/.test(a.l)); a.fn(); return S.cars[0].spare; });
    assert.strictEqual(r, 'ok');
    noErrors(errors);
  } },
  { name: 'vehicles: Ferry Hell car trouble keeps a cooldown per car', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    const r = await page.evaluate(() => { const a = { id: 'isl', troubleLast: dayKey() }, b = { id: 'beat' };
      return [carTroubleOk({ mode: 'car', car: a }), carTroubleOk({ mode: 'car', car: b })]; });
    assert.deepStrictEqual(r, [false, true]);
    noErrors(errors);
  } },
  { name: 'fuel run: Monday’s notice says propane tanker and the times the game actually cancels', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const src = await page.evaluate(() => [...document.scripts].map(s => s.textContent).join('\n'));
    assert.match(src, /9:30 AM from Steilacoom and the 11:10 AM from the island are canceled/);
    assert.match(src, /propane tanker/);
    noErrors(errors);
  } },
  { name: 'vehicles: late on the mainland with a low tank, a weekend regular can fill up and drive home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(clr => { eval(clr)(); visitorNew('regular', 'seattle', 'normal'); eval(clr)();
      S.loc = 'stDock'; const c = S.cars[0]; c.loc = 'stDock'; c.fuel = 0.5; S.money = 300; S.cur = 6; S.t = 6 * 1440 + 1300;
      regMainlandLate(); const m = MQ.length ? MQ[0] : null; const btns = [...document.querySelectorAll('.modal-bg button')].map(b => b.textContent);
      const b = [...document.querySelectorAll('.modal-bg button')].find(b => /Fill up/.test(b.textContent)); if (b) b.click();
      return { btns, loc: c.loc, fuel: c.fuel }; }, `(${clear})`);
    assert.ok(r.btns.some(t => /Fill up, then drive home/.test(t)), r.btns.join(' | '));
    assert.strictEqual(r.loc, 'vhome');
    assert.ok(r.fuel > 0);
    noErrors(errors);
  } },
  { name: 'vehicles: on the donut, a flat is half as likely; the new-tire to-do is urgent', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { const c = S.cars[0]; const e = EV.find(e => e.id === 'flat_tire'); const ctx = { car: c, from: 'store' };
      c.spare = 'ok'; const p0 = e.chance(ctx); c.spare = 'on'; const p1 = e.chance(ctx);
      return { p0, p1, urgent: todoItems().find(i => /new tire/.test(i.l)).urgent }; });
    assert.ok(Math.abs(r.p1 - r.p0 / 2) < 1e-9, JSON.stringify(r));
    assert.strictEqual(r.urgent, true);
    noErrors(errors);
  } },
  { name: 'vehicles: drive-on gone but a walk-on still runs with too much to carry: says so, not "stuck"', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(clr => { eval(clr)(); S.loc = 'stDock'; S.cars[0].loc = 'stDock'; S.cars[0].fuel = 10; S.cur = 2; S.t = 2 * 1440 + 19 * 60;
      S.week.b.push({ start: S.t - 1100, end: S.t + 1000, cause: 'Engine trouble' }); S.carried = 9; render(); eval(clr)();
      waitFerry('drive'); return [...document.querySelectorAll('.modal-bg')].map(m => m.textContent).join(' '); }, `(${clear})`);
    assert.match(r, /No more car sailings tonight/);
    assert.match(r, /still takes walk-ons/);
    noErrors(errors);
  } },
];
