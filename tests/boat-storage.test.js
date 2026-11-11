const { open, noErrors, assert } = require('./helpers');

const game = (page, season = 'fall') => page.evaluate(s => {
  newGame('normal', 'week', s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, season);
const press = (page, re) => page.evaluate(src => { const r = new RegExp(src); const i = MB.findIndex(b => r.test(b.l)); if (i < 0) throw new Error('no button ' + src + ' in ' + MB.map(b => b.l).join(' | ')); MBTN(i); }, re.source);
const modalText = page => page.evaluate(() => { const m = document.querySelector('#mbg'); return m ? m.textContent : ''; });
const act = (page, re) => page.evaluate(src => { const r = new RegExp(src); const a = actions().find(a => r.test(a.l)); if (!a) throw new Error('no action ' + src + ' in ' + actions().map(a => a.l).join(' | ')); if (a.dis) throw new Error('disabled: ' + a.l + ' / ' + a.s); a.fn(); }, re.source);
const finishCross = async page => { await page.waitForSelector('.cross'); await page.click('.cross'); await page.waitForFunction(() => !document.querySelector('.cross')); };
// a calm, clear day at 10 AM with a skiff kept as `store`
const setup = (page, store, extra) => page.evaluate(([store, x]) => {
  wxR = () => 0.9; S.week.storm = null; S.week.fog = S.week.fog.map(() => 0); S.cur = 1; S.t = 1440 + 600; S.money = 5000;
  const home = store !== 'slip';
  S.boat = { own: true, store, at: home ? 'home' : 'marina', on: store === 'buoy' || !home ? 'water' : 'trailer', hitch: null, trLoc: 'home', fuel: 6, cond: 100, trips: 0, paidThru: dayKey() + 28, cover: false, rain: 0, swamped: false };
  S.loc = home ? 'home' : 'marina'; boatSync();
  Math.random = () => 0.9; boatLow = () => false; if (x) eval(x);
}, [store, extra || '']);

module.exports = [
  { name: 'boat storage: slip, yard, buoy (needs the cabin buoy) or garage (only with garageBay); a comparison in the modal; change later', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => { S.loc = 'marina'; S.money = 5000; S.cur = 1; S.t = 1440 + 600; boatBuy(); return { txt: document.querySelector('#mbg').textContent, btn: MB.map(b => [b.l, !!b.dis]) }; });
    assert.match(r.txt, /Cost[\s\S]*Launch[\s\S]*Risk/); assert.match(r.txt, /\$90\/month/); assert.match(r.txt, /gale can swamp/);
    assert.ok(r.btn.some(([l, d]) => /buoy/.test(l) && d), 'buoy needs the upgrade'); assert.ok(!r.btn.some(([l]) => /garage/.test(l)), 'no garage bay yet');
    await press(page, /Not now/);
    // with the mooring buoy and a garage bay
    const r2 = await page.evaluate(() => { S.cabin = { own: { mooring: true }, bill: 0, carry: 0 }; window.garageBay = () => true; boatBuy(); return MB.map(b => [b.l, !!b.dis]); });
    assert.ok(r2.some(([l, d]) => /buoy/.test(l) && !d)); assert.ok(r2.some(([l, d]) => /garage/.test(l) && !d));
    await press(page, /Tie it to your buoy/);
    const b = await page.evaluate(() => ({ store: S.boat.store, at: S.boat.at, on: S.boat.on, home: boatAtHome(), where: boatWhere(), money: S.money }));
    assert.deepStrictEqual(b, { store: 'buoy', at: 'home', on: 'water', home: true, where: 'on your buoy', money: 2500 });
    // change later, at the marina: to a slip charges the first month; back to the yard is free
    await page.evaluate(() => { actions().find(a => /Change where you keep/.test(a.l)).fn(); });
    assert.match(await modalText(page), /Where do you keep the skiff[\s\S]*Cost/);
    await press(page, /Rent a slip/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.store, S.money, S.boat.at]), ['slip', 2410, 'home']);
    await page.evaluate(() => boatStoreModal()); await press(page, /garage/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.store, S.money]), ['garage', 2410]);
    // garage only shows while garageBay() is true
    const g = await page.evaluate(() => { window.garageBay = () => false; return boatStoreOpts().map(o => o.id); });
    assert.deepStrictEqual(g, ['slip', 'yard', 'buoy']);
    noErrors(errors);
  } },
  { name: 'boat storage: the buoy keeps its promise: row out from home, cross to Sunnyside and back to the buoy, no marina', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await setup(page, 'buoy', "S.cabin = { own: { mooring: true }, bill: 0, carry: 0 }");
    const t0 = await page.evaluate(() => S.t);
    await act(page, /Row out to the skiff and cross to Sunnyside/);
    assert.match(await modalText(page), /your buoy[\s\S]*row the dinghy out/);
    await press(page, /Cast off/); await finishCross(page);
    const r = await page.evaluate(() => ({ loc: S.loc, at: S.boat.at, where: boatWhere(), home: boatAtHome() }));
    assert.deepStrictEqual(r, { loc: 'sunny', at: 'sunny', where: 'at the Sunnyside float', home: false });
    assert.ok((await page.evaluate(() => S.t)) - t0 >= 35, 'rowing out adds 10 min');
    await act(page, /Take the skiff home to your buoy/);
    await press(page, /Cast off/); await finishCross(page);
    assert.deepStrictEqual(await page.evaluate(() => [S.loc, S.boat.at, boatAtHome()]), ['home', 'home', true]);
    // the cabin upgrade says what it does now
    assert.match(await page.evaluate(() => CABIN_UP.find(u => u.id === 'mooring').d), /row out and cross straight to Sunnyside/);
    noErrors(errors);
  } },
  { name: 'boat storage: a gale night swamps or sinks a skiff on the buoy, unless it was hauled up the beach', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const storm = "S.cabin = { own: { mooring: true }, bill: 0, carry: 0 }; S.week.storm = { day: 1, start: 1440 + 1000, end: 2880 + 300 }";
    await setup(page, 'buoy', storm);
    // the warning: hauling it up is the primary action, and on the to-do list
    const w = await page.evaluate(() => ({ a: actions().find(a => /Haul the skiff up the beach/.test(a.l)), todo: todoItems().some(i => /before the gale/.test(i.l)) }));
    assert.strictEqual(w.a.cls, 'primary'); assert.ok(w.todo);
    // swamped
    const s = await page.evaluate(() => { Math.random = () => 0.5; const notes = []; boatNight('home', notes, 1); return { cond: S.boat.cond, sw: S.boat.swamped, notes: notes.join(' ') }; });
    assert.strictEqual(s.cond, 60); assert.ok(s.sw); assert.match(s.notes, /swamped/);
    await page.evaluate(() => boatCross('sunny')); assert.match(await modalText(page), /Swamped/); await press(page, /OK/);
    await act(page, /Bail out the swamped skiff/);
    assert.strictEqual(await page.evaluate(() => S.boat.swamped), false);
    // sunk: a salvage bill
    await setup(page, 'buoy', storm);
    const k = await page.evaluate(() => { Math.random = () => 0.1; const m0 = S.money, notes = []; boatNight('home', notes, 1); return { paid: m0 - S.money, cond: S.boat.cond, on: S.boat.on, where: boatWhere(), notes: notes.join(' ') }; });
    assert.strictEqual(k.paid, 350); assert.strictEqual(k.cond, 60); assert.strictEqual(k.on, 'beach'); assert.match(k.notes, /sank/);
    // hauled up the beach first: no harm
    await setup(page, 'buoy', storm);
    await act(page, /Haul the skiff up the beach/);
    const h = await page.evaluate(() => { Math.random = () => 0.1; const m0 = S.money, notes = []; boatNight('home', notes, 1); return { paid: m0 - S.money, cond: S.boat.cond, sw: S.boat.swamped, where: boatWhere(), home: boatAtHome() }; });
    assert.deepStrictEqual(h, { paid: 0, cond: 100, sw: false, where: 'hauled up your beach', home: true });
    // and back on the buoy
    await act(page, /Put the skiff back on the buoy/);
    assert.strictEqual(await page.evaluate(() => S.boat.on), 'water');
    noErrors(errors);
  } },
  { name: 'boat storage: a hitch per car (the beater can’t tow); tow to the Riv ramp and launch; low tide: come back; haul out and tow home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await setup(page, 'yard');
    // no hitch yet
    const no = await page.evaluate(() => actions().find(a => /Tow the skiff to the Riv ramp/.test(a.l)));
    assert.ok(no.dis); assert.match(no.s, /needs a tow hitch/);
    // the gas station: the beater can't, the Subaru can
    const g = await page.evaluate(() => { S.cars.push({ id: 'beat', name: 'Mainland beater (2004 Corolla)', loc: 'gas', fuel: 5, tank: 12, diesel: false }); S.loc = 'gas';
      const beat = actions().find(a => /Tow hitch/.test(a.l)); S.cars = S.cars.filter(c => c.id !== 'beat'); S.cars[0].loc = 'gas'; const m0 = S.money; actions().find(a => /Tow hitch for the Subaru/.test(a.l)).fn();
      return { beatDis: beat.dis, beatS: beat.s, paid: m0 - S.money, hitch: S.cars[0].hitch }; });
    assert.ok(g.beatDis); assert.match(g.beatS, /Corolla/); assert.strictEqual(g.paid, 250); assert.strictEqual(g.hitch, true);
    // the diesel pickup has one already
    assert.strictEqual(await page.evaluate(() => carHasHitch({ id: 'isl', diesel: true }) && carCanTow({ id: 'isl', diesel: true })), true);
    // tow to the Riv and launch
    const t0 = await page.evaluate(() => { S.loc = 'home'; S.cars[0].loc = 'home'; S.t = 1440 + 600; return S.t; });
    await act(page, /Tow the skiff to the Riv ramp and launch/);
    const r = await page.evaluate(() => ({ loc: S.loc, car: S.cars[0].loc, on: S.boat.on, at: S.boat.at, hitch: S.boat.hitch, where: boatWhere(), dt: S.t }));
    assert.strictEqual(r.loc, 'marina'); assert.strictEqual(r.car, 'marina'); assert.strictEqual(r.on, 'water'); assert.strictEqual(r.at, 'marina'); assert.strictEqual(r.hitch, 'isl');
    assert.ok(r.dt - t0 >= 30, 'drive + 20 min at the ramp');
    // haul out at low tide: too shallow; come back later
    await page.evaluate(() => { boatLow = () => true; });
    await act(page, /Haul out and tow it home/);
    assert.match(await modalText(page), /too shallow/);
    await press(page, /Come back later/);
    assert.deepStrictEqual(await page.evaluate(() => [S.loc, S.boat.on]), ['marina', 'water']);
    // or wait for the tide
    await act(page, /Haul out and tow it home/);
    await page.evaluate(() => { boatLow = () => false; });
    await press(page, /Wait for the tide/);
    const h = await page.evaluate(() => ({ loc: S.loc, car: S.cars[0].loc, on: S.boat.on, at: S.boat.at, hitch: S.boat.hitch, where: boatWhere() }));
    assert.deepStrictEqual(h, { loc: 'home', car: 'home', on: 'trailer', at: 'home', hitch: null, where: 'on its trailer in your yard' });
    // launching at low tide: come back later leaves it on the trailer behind the car, at the Riv
    await page.evaluate(() => { boatLow = () => true; });
    await act(page, /Tow the skiff to the Riv ramp and launch/);
    await press(page, /Come back later/);
    const c = await page.evaluate(() => ({ at: S.boat.at, on: S.boat.on, where: boatWhere(), launch: !!actions().find(a => /Launch the skiff at the Riv ramp/.test(a.l)) }));
    assert.strictEqual(c.at, 'marina'); assert.strictEqual(c.on, 'trailer'); assert.match(c.where, /behind the Subaru/); assert.ok(c.launch);
    noErrors(errors);
  } },
  { name: 'boat storage: the trailer on the ferry pays the length fare; the boat travels with the car; launch at Sunnyside; parks itself at home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await setup(page, 'yard', "S.cars[0].hitch = true");
    const f = await page.evaluate(() => {
      const plain = fareCar(); actions().find(a => /Hitch the skiff to the Subaru/.test(a.l)).fn();
      S.cars[0].loc = 'stDock'; S.loc = 'stDock'; render();
      const o = { plain, at: S.boat.at, where: boatWhere(), loaded: fareCar() };
      S.boat.on = 'water'; o.empty = fareCar(); S.boat.on = 'trailer';
      S.cars[0].diesel = true; o.truck = fareCar(); S.cars[0].diesel = false;
      return o; });
    assert.strictEqual(f.plain, 24.94); assert.strictEqual(f.at, 'road'); assert.match(f.where, /behind the Subaru/);
    assert.strictEqual(f.loaded, 77.96); assert.strictEqual(f.empty, 49.35); assert.strictEqual(f.truck, 77.96);
    // board at Steilacoom with the skiff in tow
    const m0 = await page.evaluate(() => { const m = S.money; board('M', { abs: S.t, dep: tod(), d: day() }, 'drive'); return m; });
    await finishCross(page);
    const b = await page.evaluate(() => ({ paid: S.money, car: S.cars[0].loc, at: S.boat.at, log: S.log.map(l => l.s).join(' ') }));
    assert.strictEqual(Math.round((m0 - b.paid) * 100) / 100, 77.96); assert.strictEqual(b.car, 'aiDock'); assert.strictEqual(b.at, 'road'); assert.match(b.log, /30 to under 40 ft/);
    // drive home: the trailer is backed into the yard
    await page.evaluate(() => { S.cars[0].loc = 'home'; S.loc = 'home'; render(); });
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.at, S.boat.hitch, boatAtHome()]), ['home', null, true]);
    // summer is peak
    await game(page, 'summer');
    await setup(page, 'yard', "S.cars[0].hitch = true; S.boat.hitch = 'isl'; S.cars[0].loc = 'stDock'; S.loc = 'stDock'");
    assert.strictEqual(await page.evaluate(() => fareCar()), 107.10);
    // at Sunnyside: launch, then unhitch the empty trailer in the lot
    await page.evaluate(() => { S.cars[0].loc = 'sunny'; S.loc = 'sunny'; render(); });
    await act(page, /Launch the skiff at Sunnyside/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.on, S.boat.at, boatWhere()]), ['water', 'sunny', 'at the Sunnyside float']);
    await act(page, /Unhitch the empty trailer/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.hitch, S.boat.trLoc]), [null, 'sunny']);
    // and haul out again (the trailer is right here)
    await act(page, /Haul out at Sunnyside/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.on, S.boat.hitch, boatWhere()]), ['trailer', 'isl', 'on its trailer behind the Subaru (at Sunnyside)']);
    noErrors(errors);
  } },
  { name: 'boat storage: rain fills an uncovered skiff on the trailer (bail it, or an $80 cover); winter wears the outboard outside', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await setup(page, 'yard');
    const r = await page.evaluate(() => { const n = []; UP().rain = dayKey(); boatNight('home', n, 1); boatNight('home', n, 1); return { rain: S.boat.rain, notes: n.join(' '), bail: !!actions().find(a => /Bail the rainwater/.test(a.l)), todo: todoItems().some(i => /Bail the rain/.test(i.l)) }; });
    assert.strictEqual(r.rain, 70); assert.match(r.notes, /Rain has been filling/); assert.ok(r.bail); assert.ok(r.todo);
    await act(page, /Bail the rainwater/);
    assert.strictEqual(await page.evaluate(() => S.boat.rain), 0);
    // a cover at Home Depot keeps it dry
    const c = await page.evaluate(() => { S.loc = 'depot'; S.t = 1440 + 700; const m0 = S.money; actions().find(a => /boat cover/.test(a.l)).fn(); UP().rain = dayKey(); boatNight('home', [], 1); return { paid: m0 - S.money, rain: S.boat.rain }; });
    assert.deepStrictEqual(c, { paid: 80, rain: 0 });
    // in the garage it stays dry and out of the winter
    await game(page, 'winter');
    await setup(page, 'yard');
    const w = await page.evaluate(() => { UP().rain = -1; boatNight('home', [], 1); const yard = S.boat.cond; window.garageBay = () => true; S.boat.store = 'garage'; S.boat.cond = 100; UP().rain = dayKey(); boatNight('home', [], 1); return { yard, garage: S.boat.cond, rain: S.boat.rain, where: boatWhere() }; });
    assert.deepStrictEqual(w, { yard: 99, garage: 100, rain: 0, where: 'in the garage bay' });
    noErrors(errors);
  } },
  { name: 'boat storage: old saves with a "trailer" boat load as a yard boat at home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.boat = { own: true, store: 'trailer', at: 'marina', fuel: 3, cond: 70, trips: 2, paidThru: 28 };
      const d = migrate(JSON.parse(JSON.stringify(packSave())));
      const b = d.S.boat;
      // a boat that was left at Sunnyside stays there, afloat
      S.boat = { own: true, store: 'trailer', at: 'sunny', fuel: 3, cond: 70, trips: 2, paidThru: 28 }; render();
      return { store: b.store, at: b.at, on: b.on, notes: d.notes.join(' '), live: [S.boat.store, S.boat.at, S.boat.on] };
    });
    assert.deepStrictEqual([r.store, r.at, r.on], ['yard', 'home', 'trailer']); assert.match(r.notes, /trailer is in your yard/);
    assert.deepStrictEqual(r.live, ['yard', 'sunny', 'water']);
    noErrors(errors);
  } },
];
