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
];
