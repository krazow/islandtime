// Out of gas on the island: call Dale (50% over his shop price) or post in the Island Group (reputation −5)
const { open, newGame, noErrors, assert } = require('./helpers');
const setup = page => page.evaluate(() => {
  S.cur = 1; S.t = 1440 + 720; S.loc = 'food'; S.phone = 80; S.phoneT = S.t; S.money = 500; S.rep = 10;
  const c = S.cars.find(c => c.id === 'isl'); c.loc = 'food'; c.fuel = 0.2; c.diesel = false; S.daleStock = { 1: 8 }; S.log = []; render();
});
const act = (page, re) => page.evaluate(src => { const a = actions().find(a => new RegExp(src).test(a.l)); return a ? { l: a.l, s: a.s, dis: !!a.dis } : null; }, re.source);
const press = (page, re) => page.evaluate(src => actions().find(a => new RegExp(src).test(a.l)).fn(), re.source);
module.exports = [
  { name: 'gas help: call Dale to the Riv: 5 gal at $18/gal (50% over his $12 shop price), 40 minutes', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    const a = await act(page, /^Call Dale to bring gas/);
    assert.ok(a && !a.dis, JSON.stringify(a)); assert.match(a.l, /5 gal for \$90/); assert.match(a.s, /\$18\/gal/);
    await press(page, /^Call Dale to bring gas/);
    const r = await page.evaluate(() => ({ m: S.money, fuel: S.cars.find(c => c.id === 'isl').fuel, t: tod(), stock: S.daleStock[1], log: S.log.map(l => l.s).join(' ') }));
    assert.deepStrictEqual([r.m, r.fuel, r.t, r.stock], [410, 5.2, 760, 3]);
    assert.match(r.log, /Delivery’s extra/);
    // closed hours, no stock, diesel, dead phone
    const off = await page.evaluate(() => { const c = S.cars.find(c => c.id === 'isl'); c.fuel = 0.2; const out = {};
      S.t = 1440 + 1290; out.late = actions().find(a => /^Call Dale/.test(a.l)).dis;
      S.t = 1440 + 720; S.daleStock[1] = 0; out.empty = actions().find(a => /^Call Dale/.test(a.l)).dis;
      S.daleStock[1] = 8; c.diesel = true; out.diesel = !actions().some(a => /^Call Dale/.test(a.l)); c.diesel = false;
      S.phone = 0; out.dead = actions().find(a => /^Call Dale/.test(a.l)).dis; return out; });
    assert.deepStrictEqual(off, { late: true, empty: true, diesel: true, dead: true });
    noErrors(errors);
  } },
  { name: 'gas help: post in the Island Group: 3 gal in 25 minutes, reputation −5; needs the app', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    const no = await act(page, /^Post in the Island Group for immediate help/);
    assert.ok(no.dis); assert.match(no.s, /App Store/);
    await page.evaluate(() => { const l = S.loc, t = S.t; phoneInstall('group'); S.loc = l; S.t = t; render(); });
    await press(page, /^Post in the Island Group for immediate help/);
    const r = await page.evaluate(() => ({ rep: S.rep, fuel: S.cars.find(c => c.id === 'isl').fuel, t: tod(), m: S.money, known: S.repx.known[0].why }));
    assert.deepStrictEqual([r.rep, r.fuel, r.t, r.m], [5, 3.2, 745, 500]);
    assert.match(r.known, /emergency gas request/);
    noErrors(errors);
  } },
  { name: 'fuel: real miles ÷ mpg (island 25 mph, mainland 32 mph; Subaru 24 mpg, beater 22, diesel 18)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => ({ isl: fuelFor({ id: 'isl' }, 60, 'I'), beat: fuelFor({ id: 'beat' }, 60, 'M'), dsl: fuelFor({ id: 'isl', diesel: true }, 60, 'I') }));
    assert.ok(Math.abs(r.isl - 25 / 24) < 1e-9 && Math.abs(r.beat - 32 / 22) < 1e-9 && Math.abs(r.dsl - 25 / 18) < 1e-9, JSON.stringify(r));
    noErrors(errors);
  } },
];
