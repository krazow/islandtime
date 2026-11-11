// Dale sells a car battery and buys gas and diesel cans; diesel cans in and out of the shed (68-dale-shed.js)
const { open, newGame, noErrors, assert } = require('./helpers');
const at = (page, loc, m) => page.evaluate(([loc, m]) => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
  S.cur = 1; S.t = 1440 + m; S.phoneT = S.t; S.loc = loc; S.money = 500; S.daleStock = { 1: 6 }; S.daleBat = { 1: 1 }; S.daleBought = {}; S.log = [];
  const c = S.cars.find(c => c.id === 'isl'); c.loc = loc; render(); }, [loc, m]);
const act = (page, re) => page.evaluate(src => { const a = actions().find(a => new RegExp(src).test(a.l)); return a ? { l: a.l, s: a.s, dis: !!a.dis } : null; }, re.source);
const press = (page, re) => page.evaluate(src => { actions().find(a => new RegExp(src).test(a.l)).fn(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); }, re.source);

module.exports = [
  { name: 'dale: a new car battery for $189, installed in 20 min with the car in his driveway; one in stock', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'dale', 720);
    await page.evaluate(() => { S.cars.find(c => c.id === 'isl').bat = 'weak'; });
    let a = await act(page, /^Buy a new car battery from Dale/);
    assert.ok(a && !a.dis, JSON.stringify(a)); assert.match(a.l, /\$189/); assert.match(a.s, /jump-starts/);
    await press(page, /^Buy a new car battery from Dale/);
    const r = await page.evaluate(() => ({ m: S.money, b: S.cars.find(c => c.id === 'isl').bat, t: tod() }));
    assert.deepStrictEqual(r, { m: 311, b: 'ok', t: 740 });
    a = await act(page, /^Buy a new car battery from Dale/);
    assert.ok(a.dis && /Try tomorrow/.test(a.s), 'sold out after one: ' + JSON.stringify(a));
    // the car has to be here; closed at night
    await at(page, 'dale', 720);
    await page.evaluate(() => { S.cars.find(c => c.id === 'isl').loc = 'home'; });
    a = await act(page, /^Buy a new car battery from Dale/); assert.ok(a.dis && /Bring the car/.test(a.s));
    await at(page, 'dale', 1300);
    assert.strictEqual(await act(page, /^Buy a new car battery from Dale/), null);
    noErrors(errors);
  } },
  { name: 'dale: buys gas cans ($40, adding 5 gal to his stock) and diesel cans ($35), up to 4 a day', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'dale', 720);
    assert.strictEqual(await act(page, /^Sell Dale a gas can/), null, 'nothing to sell');
    await page.evaluate(() => { S.cargo.gas = 3; S.cargo.diesel = 3; });
    await press(page, /^Sell Dale a gas can/);
    let r = await page.evaluate(() => ({ m: S.money, gas: S.cargo.gas, stock: S.daleStock[1], t: tod() }));
    assert.deepStrictEqual(r, { m: 540, gas: 2, stock: 11, t: 730 });
    await press(page, /^Sell Dale a diesel can/);
    await press(page, /^Sell Dale a diesel can/);
    await press(page, /^Sell Dale a gas can/);
    r = await page.evaluate(() => ({ m: S.money, gas: S.cargo.gas, diesel: S.cargo.diesel }));
    assert.deepStrictEqual(r, { m: 650, gas: 1, diesel: 1 });
    const a = await act(page, /^Sell Dale a gas can/);
    assert.ok(a.dis && /move today/.test(a.s), 'a fifth can is refused: ' + JSON.stringify(a));
    noErrors(errors);
  } },
  { name: 'diesel in the shed: buy a can at the gas station, store it at home, take it back out', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'gas', 600);
    await press(page, /^Buy a 5-gal diesel can for the shed/);
    let r = await page.evaluate(() => ({ m: S.money, d: S.cargo.diesel }));
    assert.deepStrictEqual(r, { m: 473.55, d: 1 });
    await at(page, 'home', 1000);
    await page.evaluate(() => { S.cargo.diesel = 1; S.homeDiesel = 0; });
    assert.strictEqual(await act(page, /^Take a diesel can out of the shed/), null);
    await press(page, /^Store a diesel can in the shed/);
    r = await page.evaluate(() => ({ shed: S.homeDiesel, d: S.cargo.diesel, tag: /gal diesel in shed/.test(document.body.textContent) }));
    assert.deepStrictEqual(r, { shed: 5, d: 0, tag: true });
    await press(page, /^Take a diesel can out of the shed/);
    r = await page.evaluate(() => ({ shed: S.homeDiesel, d: S.cargo.diesel }));
    assert.deepStrictEqual(r, { shed: 0, d: 1 });
    noErrors(errors);
  } },
];
