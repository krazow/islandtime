// 1.22 car-storage fixes: islander-only car deals, the city car moving with you, selling/swapping cars, skiff gas, Monday propane
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const atTerminal = page => page.evaluate(clr => { eval(clr)(); S.cur = 1; S.t = 1440 + 600; S.loc = 'stDock'; S.money = 3000; tab = 'act'; render(); }, `(${clear})`);

module.exports = [
  { name: 'car-storage: visitors and Weekend regulars are not offered the islander’s car deals', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    let r = await page.evaluate(() => { S.cars[0].loc = 'stDock'; S.cur = 1; S.t = 1440 + 600; S.loc = 'stDock'; S.money = 3000; return actions().map(a => a.l).filter(l => /beater|diesel pickup/.test(l)); });
    assert.strictEqual(r.length, 2);
    for (const len of ['week', 'regular']) {
      r = await page.evaluate(([len, clr]) => { visitorNew(len, 'tacoma', 'normal'); eval(clr)(); S.cur = 1; S.t = 1440 + 600; S.loc = 'stDock'; S.cars[0].loc = 'stDock'; S.money = 3000;
        return { on: visitorOn(), deals: actions().map(a => a.l).filter(l => /beater|diesel pickup/.test(l)) }; }, [len, `(${clear})`]);
      assert.strictEqual(r.on, true); assert.deepStrictEqual(r.deals, [], len);
    }
    noErrors(errors);
  } },
  { name: 'car-storage: the Weekend regular’s city car moves to the island with its fuel, battery and spare', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(clr => { visitorNew('regular', 'tacoma', 'normal'); eval(clr)(); const c = S.cars[0]; c.fuel = 7.5; c.bat = 'weak'; c.spare = 'on'; VS().result = 'moved';
      regStartResident(); const car = S.cars.find(c => c.id === 'isl'); const modalText = document.querySelector('#mbg') ? document.body.textContent : '';
      return { n: S.cars.length, car: { name: car.name, loc: car.loc, fuel: car.fuel, bat: car.bat, spare: car.spare }, visitor: visitorOn() }; }, `(${clear})`);
    assert.deepStrictEqual(r, { n: 1, car: { name: 'Your car (city car)', loc: 'home', fuel: 7.5, bat: 'weak', spare: 'on' }, visitor: false });
    // the move-in modal offers to sell it instead: $2,500 and the old Subaru
    const s = await page.evaluate(clr => { const m0 = S.money; const i = MB.findIndex(b => /Sell it/.test(b.l)); if (i < 0) { /* the welcome modal is first */ MBTN(0); }
      const j = MB.findIndex(b => /Sell it/.test(b.l)); MBTN(j); const car = S.cars.find(c => c.id === 'isl'); eval(clr)(); return { gain: S.money - m0, name: car.name, fuel: car.fuel, bat: car.bat, n: S.cars.length }; }, `(${clear})`);
    assert.deepStrictEqual(s, { gain: 2500, name: 'Island car (old Subaru)', fuel: 4.5, bat: 'ok', n: 1 });
    noErrors(errors);
  } },
  { name: 'car-storage: sell the beater back ($350, leaves S.cars, S.drive cleared); the garage copes', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atTerminal(page);
    const r = await page.evaluate(() => { S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'stDock', fuel: 6, tank: 14, diesel: false }, { id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'stDock', fuel: 9, tank: 12, diesel: false }];
      S.drive = 'beat'; const m0 = S.money; actions().find(a => /^Sell the mainland beater/.test(a.l)).fn();
      const after = { gain: S.money - m0, ids: S.cars.map(c => c.id), drive: S.drive, car: carHere().id }; S.loc = 'home'; S.cars[0].loc = 'home'; S.drive = 'beat'; after.garage = actions().find(a => /^Garage:/.test(a.l)).l; return after; });
    assert.strictEqual(r.gain, 350); assert.deepStrictEqual(r.ids, ['isl']); assert.strictEqual(r.drive, null); assert.strictEqual(r.car, 'isl');
    assert.match(r.garage, /\(1\/2\)/);
    noErrors(errors);
  } },
  { name: 'car-storage: trade the diesel pickup back for an old gas Subaru and get $600', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atTerminal(page);
    const r = await page.evaluate(() => { S.cars = [{ id: 'isl', name: 'Island truck (old diesel pickup)', loc: 'stDock', fuel: 9, tank: 20, diesel: true }];
      const before = actions().some(a => /^Trade the diesel pickup back/.test(a.l)), none = !actions().some(a => /Trade the Subaru for an old diesel/.test(a.l)); const m0 = S.money;
      actions().find(a => /^Trade the diesel pickup back/.test(a.l)).fn(); const c = S.cars[0];
      return { before, none, gain: S.money - m0, diesel: c.diesel, tank: c.tank, fuel: c.fuel, name: c.name, again: actions().some(a => /^Trade the diesel pickup back/.test(a.l)), forward: actions().some(a => /Trade the Subaru for an old diesel/.test(a.l)) }; });
    assert.deepStrictEqual(r, { before: true, none: true, gain: 600, diesel: false, tank: 14, fuel: 9, name: 'Island car (old Subaru)', again: false, forward: true });
    noErrors(errors);
  } },
  { name: 'car-storage: shed gas only fills a skiff that is at home; a gas can can be poured in at the marina', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { S.cur = 1; S.t = 1440 + 600; S.loc = 'marina'; S.week.storm = null; S.money = 5000;
      S.boat = { own: true, store: 'slip', at: 'marina', fuel: 1, cond: 100, trips: 0, paidThru: dayKey() + 28 }; boatSync(); S.homeGas = 4; S.cargo.gas = 0;
      const shed = () => actions().some(a => /Fill the skiff.s tank from your shed/.test(a.l)), pour = () => actions().some(a => /^Pour a gas can into the skiff/.test(a.l)); const o = {};
      const saved = window.boatAtHome; window.boatAtHome = () => false; o.awayShed = shed(); o.awayPour = pour();
      S.cargo.gas = 1; o.canPour = pour(); actions().find(a => /^Pour a gas can into the skiff/.test(a.l)).fn(); o.fuel = S.boat.fuel; o.cans = S.cargo.gas; o.homeGas = S.homeGas;
      S.boat.fuel = 1; window.boatAtHome = saved; S.loc = 'home'; Object.assign(S.boat, { store: 'yard', at: 'home', on: 'trailer' }); o.homeShed = shed(); S.loc = 'marina'; Object.assign(S.boat, { store: 'slip', at: 'marina', on: 'water' }); S.boat.fuel = 6; o.full = pour(); S.cargo.gas = 2; o.fullPour = pour(); return o; });
    assert.deepStrictEqual(r, { awayShed: false, awayPour: false, canPour: true, fuel: 6, cans: 0, homeGas: 4, homeShed: true, full: false, fullPour: false });
    noErrors(errors);
  } },
  { name: 'car-storage: propane is delivered on the Monday fuel run', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(clr => { eval(clr)(); const o = {}; S.money = 3000; S.phone = 100; const U = UP(); U.propane = 10;
      const order = () => { U.jobs = []; upSchedule('propane', 100, 'Propane fill-up.'); return U.jobs[0].due; };
      S.cur = 0; S.t = 8 * 60; o.monAM = order(); S.cur = 0; S.t = 10 * 60; o.monLate = order(); S.cur = 3; S.t = 3 * 1440 + 600; o.thu = order();
      return o; }, `(${clear})`);
    assert.strictEqual(r.monAM, 13 * 60);              // ordered before the run: that Monday
    assert.strictEqual(r.monLate, 7 * 1440 + 13 * 60); // after the run: next Monday
    assert.strictEqual(r.thu, 7 * 1440 + 13 * 60);
    // the notice says so, and the truck arrives (day rolls to the Monday)
    const n = await page.evaluate(() => { S.cur = 4; S.t = 4 * 1440 + 600; UP().jobs = []; UP().propane = 10; const sayOrig = say; let text = ''; say = (...a) => { text += a[0]; return sayOrig(...a); };
      upSchedule('propane', 100, 'Propane fill-up.'); say = sayOrig; return text; });
    assert.match(n, /Monday fuel run/); assert.match(n, /next Monday/);
    noErrors(errors);
  } },
];
