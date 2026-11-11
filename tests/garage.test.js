// The cabin's two-car garage, and choosing which car to drive (69-garage.js)
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const twoAtHome = page => page.evaluate(clr => { eval(clr)();
  S.cur = 1; S.t = 1440 + 480; S.loc = 'home'; S.drive = null;
  S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'home', fuel: 6, tank: 14, diesel: false },
            { id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'home', fuel: 9, tank: 12, diesel: false }];
  tab = 'act'; render(); }, `(${clear})`);

module.exports = [
  { name: 'garage: two cars at the cabin: the garage lists both, and you choose which one to drive', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await twoAtHome(page);
    let r = await page.evaluate(() => ({ car: carHere().id, garage: (actions().find(a => /^Garage:/.test(a.l)) || {}).l,
      take: actions().filter(a => /^Take the .* instead/.test(a.l)).map(a => a.l) }));
    assert.strictEqual(r.car, 'isl');
    assert.match(r.garage, /Subaru · .*2004 Corolla \(2\/2\)/);
    assert.deepStrictEqual(r.take, ['Take the 2004 Corolla instead']);
    await page.evaluate(() => actions().find(a => /^Take the 2004 Corolla instead/.test(a.l)).fn());
    r = await page.evaluate(() => ({ car: carHere().id, drive: S.drive, take: actions().filter(a => /^Take the .* instead/.test(a.l)).map(a => a.l) }));
    assert.deepStrictEqual(r, { car: 'beat', drive: 'beat', take: ['Take the Subaru instead'] });
    // leaving home drives the chosen car; the other one stays in the garage
    r = await page.evaluate(clr => { eval(clr)(); S.battery = 'ok'; Math.random = () => 0.99; go('food', { m: 'car', l: 'car', min: 8 }); eval(clr)();
      return { loc: S.loc, beat: S.cars.find(c => c.id === 'beat').loc, isl: S.cars.find(c => c.id === 'isl').loc }; }, `(${clear})`);
    assert.deepStrictEqual(r, { loc: 'food', beat: 'food', isl: 'home' });
    // with one car here, there's nothing to choose
    assert.ok(!(await page.evaluate(() => actions().some(a => /^Take the .* instead/.test(a.l)))));
    noErrors(errors);
  } },
  { name: 'garage: a garaged car is half as likely to have a dead battery leaving home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await twoAtHome(page);
    const r = await page.evaluate(() => { S.battery = 'weak'; const e = EV.find(e => e.id === 'dead_battery'); const car = S.cars.find(c => c.id === 'isl');
      const home = e.chance({ from: 'home', car }); car.loc = 'food'; S.loc = 'food'; const away = e.chance({ from: 'food', car }); return { home, away }; });
    assert.deepStrictEqual(r, { home: 0.15, away: 0.3 });
    noErrors(errors);
  } },
  { name: 'garage: not shown on a visit (the rental cabin has no garage of yours)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(clr => { eval(clr)(); visitorNew('weekend', 'tacoma', 'normal'); eval(clr)(); S.loc = 'home'; S.cars[0].loc = 'home'; }, `(${clear})`);
    assert.ok(!(await page.evaluate(() => actions().some(a => /^Garage:/.test(a.l)))));
    noErrors(errors);
  } },
];
