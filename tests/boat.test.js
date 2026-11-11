const { open, noErrors, assert } = require('./helpers');

const game = (page, season = 'fall', mode = 'week') => page.evaluate(([s, m]) => {
  newGame('normal', m, s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [season, mode]);
const press = (page, re) => page.evaluate(src => { const r = new RegExp(src); const i = MB.findIndex(b => r.test(b.l)); if (i < 0) throw new Error('no button ' + src + ' in ' + MB.map(b => b.l).join(' | ')); MBTN(i); }, re.source);
const modalText = page => page.evaluate(() => { const m = document.querySelector('#mbg'); return m ? m.textContent : ''; });
const labels = page => page.evaluate(() => MB.map(b => b.l));
// a calm, clear day at 10 AM with a boat in the slip
const calm = (page, extra) => page.evaluate(x => {
  wxR = () => 0.9; S.week.storm = null; S.week.fog = S.week.fog.map(() => 0); S.cur = 1; S.t = 1440 + 600; S.loc = 'marina'; S.money = 5000;
  S.boat = { own: true, store: 'slip', at: 'marina', fuel: 6, cond: 100, trips: 0, paidThru: dayKey() + 28 }; boatSync();
  Math.random = () => 0.9; if (!window.realLow) window.realLow = boatLow; boatLow = () => false; if (x) eval(x);
}, extra || '');
const finishCross = async page => { await page.waitForSelector('.cross'); await page.click('.cross'); await page.waitForFunction(() => !document.querySelector('.cross')); };

module.exports = [
  { name: 'boat: a used skiff for $2,500, slip or trailer; the launch appears once you own one', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.loc = 'marina'; S.money = 5000; const out = { before: Object.keys(L).includes('sunny') };
      S.loc = 'stDock'; render(); out.listedBefore = document.querySelector('.content').textContent.includes('Sunnyside Beach boat');
      S.loc = 'marina'; out.sale = !!actions().find(a => /used skiff/.test(a.l)); actions().find(a => /used skiff/.test(a.l)).fn(); return out;
    });
    assert.strictEqual(r.before, false); assert.strictEqual(r.listedBefore, false); assert.ok(r.sale);
    await press(page, /Rent a slip/);
    const b = await page.evaluate(() => { S.loc = 'stDock'; render(); return { boat: S.boat, money: S.money, enum: Object.keys(L).includes('sunny'), listed: document.querySelector('.content').textContent.includes('Sunnyside Beach'), d: dist('stDock', 'sunny') }; });
    assert.strictEqual(b.boat.store, 'slip'); assert.strictEqual(b.money, 5000 - 2590); assert.ok(b.enum); assert.ok(b.listed); assert.ok(b.d > 0 && b.d < 20);
    // trailer purchase
    await game(page);
    await page.evaluate(() => { S.loc = 'marina'; S.money = 2600; boatBuy(); });
    await press(page, /Keep it on the trailer/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.store, S.money]), ['trailer', 100]);
    // can't afford it
    await game(page);
    const poor = await page.evaluate(() => { S.loc = 'marina'; S.money = 2000; boatBuy(); return MB.slice(0, 2).map(b => !!b.dis); });
    assert.deepStrictEqual(poor, [true, true]);
    noErrors(errors);
  } },
  { name: 'boat: a calm-day crossing takes 25-40 minutes and a gallon of gas, and leaves the car behind', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page);
    const t0 = await page.evaluate(() => S.t);
    await page.evaluate(() => actions().find(a => /Take the skiff across/.test(a.l)).fn());
    assert.match(await modalText(page), /Calm water/);
    await press(page, /Cast off/);
    await finishCross(page);
    const r = await page.evaluate(() => ({ loc: S.loc, t: S.t, fuel: S.boat.fuel, at: S.boat.at, car: S.cars[0].loc, trips: S.boat.trips }));
    assert.strictEqual(r.loc, 'sunny'); assert.ok(r.t - t0 >= 25 && r.t - t0 <= 40, 'took ' + (r.t - t0)); assert.strictEqual(r.fuel, 4.8);
    assert.strictEqual(r.at, 'sunny'); assert.strictEqual(r.car, 'home'); assert.strictEqual(r.trips, 1);
    // the way home
    const back = await page.evaluate(() => { const a = actions().find(a => /Take the skiff home/.test(a.l)); return !!a; });
    assert.ok(back);
    await page.evaluate(() => actions().find(a => /Take the skiff home/.test(a.l)).fn());
    await press(page, /Cast off/); await finishCross(page);
    assert.deepStrictEqual(await page.evaluate(() => [S.loc, S.boat.at, S.boat.fuel]), ['marina', 'marina', 3.6]);
    noErrors(errors);
  } },
  { name: 'boat: a storm or small craft advisory refuses the crossing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page, 'S.week.storm = { day: 1, start: 1440 + 800, end: 1440 + 1700 }');
    await page.evaluate(() => actions().find(a => /Take the skiff across/.test(a.l)).fn());
    assert.match(await modalText(page), /Not today[\s\S]*gale/);
    assert.deepStrictEqual(await labels(page), ['OK, ferry it is']);
    await press(page, /OK/);
    assert.strictEqual(await page.evaluate(() => S.loc), 'marina');
    // a small craft advisory day
    await calm(page); await page.evaluate(() => { wxR = () => 0.01; actions().find(a => /Take the skiff across/.test(a.l)).fn(); });
    assert.match(await modalText(page), /small craft advisory/);
    noErrors(errors);
  } },
  { name: 'boat: fog, chop and darkness are your call; tide at the launch can be waited out', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page, 'S.week.fog[1] = 45');
    await page.evaluate(() => { S.t = 1440 + 500; actions().find(a => /Take the skiff across/.test(a.l)).fn(); });
    assert.match(await modalText(page), /Fog/); assert.ok((await labels(page)).includes('Go anyway'));
    await press(page, /Not now/);
    await calm(page); await page.evaluate(() => { wxR = () => 0.12; actions().find(a => /Take the skiff across/.test(a.l)).fn(); });
    assert.match(await modalText(page), /Choppy/); await press(page, /Not now/);
    await calm(page); await page.evaluate(() => { S.t = 1440 + 1300; actions().find(a => /Take the skiff across/.test(a.l)).fn(); });
    assert.match(await modalText(page), /Dark/); await press(page, /Not now/);
    // low tide at Sunnyside: wait for it
    await calm(page); await page.evaluate(() => { boatLow = window.realLow; });
    const low = await page.evaluate(() => { for (let m = 600; m < 1300; m += 5) { S.t = 1440 + m; if (boatLow()) return true } return false });
    assert.ok(low, 'a low tide exists');
    await page.evaluate(() => actions().find(a => /Take the skiff across/.test(a.l)).fn());
    assert.match(await modalText(page), /Low tide/);
    const t0 = await page.evaluate(() => S.t);
    await press(page, /Wait for the tide/);
    const w = await page.evaluate(() => ({ dt: S.t, low: boatLow() }));
    assert.ok(w.dt > t0); assert.strictEqual(w.low, false);
    // or drag it through the mud
    await calm(page); await page.evaluate(() => { boatLow = window.realLow; for (let m = 600; m < 1300; m += 5) { S.t = 1440 + m; if (boatLow()) break } S.stress = 20; actions().find(a => /Take the skiff across/.test(a.l)).fn(); });
    await press(page, /drag it through the mud/i); await finishCross(page);
    const m = await page.evaluate(() => ({ loc: S.loc, stress: S.stress }));
    assert.strictEqual(m.loc, 'sunny'); assert.ok(m.stress >= 24);
    noErrors(errors);
  } },
  { name: 'boat: dark and fog crossings can go wrong', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page);
    const r = await page.evaluate(() => { Math.random = () => 0.1; boatGo('sunny', { dark: true, fog: true }); return null; });
    await page.waitForSelector('#mbg, .cross'); // a mechanical trouble modal may come first (random 0.1 < 0.07 is false)
    await finishCross(page);
    const o = await page.evaluate(() => ({ cond: S.boat.cond, stress: S.stress, t: S.t - (1440 + 600), log: S.log.map(l => l.s).join(' ') }));
    assert.ok(o.cond < 80); assert.ok(o.t >= 25 + 30 + 35); assert.match(o.log, /drift log/); assert.match(o.log, /fog/i);
    noErrors(errors);
  } },
  { name: 'boat: the outboard can quit: pull the cord, row, or get towed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page);
    await page.evaluate(() => { Math.random = () => 0.01; boatGo('sunny', {}); });
    assert.match(await modalText(page), /outboard quits/);
    assert.ok((await labels(page)).some(l => /tow service/.test(l)));
    const m0 = await page.evaluate(() => S.money); const t0 = await page.evaluate(() => S.t);
    await press(page, /tow service/); await finishCross(page);
    const r = await page.evaluate(() => ({ m: S.money, t: S.t, loc: S.loc }));
    assert.strictEqual(r.m, m0 - 150); assert.ok(r.t - t0 >= 45 + 25); assert.strictEqual(r.loc, 'sunny');
    // row it in, or with Sam as a friend get towed
    await calm(page); await page.evaluate(() => { S.friends.sam = { name: 'Sam, your new neighbor', how: 'x', day: 0, lvl: 1, pts: 0 }; Math.random = () => 0.01; boatGo('sunny', {}); });
    assert.ok((await labels(page)).some(l => /Text Sam/.test(l)));
    await press(page, /Row it in/); await finishCross(page);
    assert.ok((await page.evaluate(() => S.t)) - (1440 + 600) >= 70);
    noErrors(errors);
  } },
  { name: 'boat: gas is the catch (shed gas, Dale, the Steilacoom pump); no gas, no crossing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page, 'S.boat.fuel = 0.5; S.homeGas = 4');
    await page.evaluate(() => actions().find(a => /Take the skiff across/.test(a.l)).fn());
    assert.match(await modalText(page), /Out of gas/); await press(page, /OK/);
    const r = await page.evaluate(() => {
      window.boatAtHome = () => true; // shed gas is only for a skiff kept at home (car-storage.test.js covers the away case)
      actions().find(a => /Fill the skiff.s tank from your shed/.test(a.l)).fn(); const shed = { fuel: S.boat.fuel, home: S.homeGas };
      S.boat.fuel = 1; S.loc = 'dale'; S.t = 1440 + 600; const dale = actions().find(a => /gal for the skiff/.test(a.l)); const m0 = S.money; dale.fn();
      return { shed, dale: S.boat.fuel, paid: m0 - S.money };
    });
    assert.strictEqual(r.shed.fuel, 4.5); assert.strictEqual(r.shed.home, 0); assert.strictEqual(r.dale, 4); assert.strictEqual(r.paid, 36);
    // the mainland pump only works with the boat on that side
    const g = await page.evaluate(() => { S.loc = 'gas'; S.t = 1440 + 600; S.boat.fuel = 1; const none = !actions().some(a => /portable tank/.test(a.l)); S.boat.at = 'sunny'; const a = actions().find(a => /portable tank/.test(a.l)); a.fn(); return { none, fuel: S.boat.fuel }; });
    assert.ok(g.none); assert.strictEqual(g.fuel, 6);
    noErrors(errors);
  } },
  { name: 'boat: a trailer adds launch time; moorage is billed monthly; overnight at the float is ticketed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page, "S.boat.store = 'trailer'");
    const t0 = await page.evaluate(() => S.t);
    await page.evaluate(() => boatGo('sunny', {})); await finishCross(page);
    assert.ok((await page.evaluate(() => S.t)) - t0 >= 45);
    // moorage
    const mo = await page.evaluate(() => { S.boat.store = 'slip'; S.boat.paidThru = dayKey() + 5; const m0 = S.money; boatMoorage(); const a = S.money - m0; S.boat.paidThru = dayKey(); boatMoorage(); return { early: a, due: S.money - m0, thru: S.boat.paidThru - dayKey() }; });
    assert.strictEqual(mo.early, 0); assert.strictEqual(mo.due, -90); assert.strictEqual(mo.thru, 28);
    // a night at the public float
    const n = await page.evaluate(() => { S.boat.at = 'sunny'; const notes = []; const m0 = S.money; EV.find(e => e.id === 'boat_overnight').run({ notes }); return { d: S.money - m0, notes: notes.length }; });
    assert.strictEqual(n.d, -35); assert.strictEqual(n.notes, 1);
    noErrors(errors);
  } },
  { name: 'boat: residents only, and no cargo aboard', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page);
    const c = await page.evaluate(() => { S.cargo.food = 2; actions().find(a => /Take the skiff across/.test(a.l)).fn(); return document.querySelector('#mbg').textContent; });
    assert.match(c, /Too much to carry/); await press(page, /OK/);
    const v = await page.evaluate(() => { S.cargo.food = 0; S.visitor = vsInit('weekend', 'tacoma'); S.loc = 'marina'; boatSync(); return { a: actions().map(a => a.l).join('|'), listed: Object.keys(L).includes('sunny'), sale: actions().some(a => /skiff/i.test(a.l)) }; });
    assert.strictEqual(v.sale, false); assert.strictEqual(v.listed, false);
    noErrors(errors);
  } },
  { name: 'boat: a canceled sailing points to the skiff; selling it gives cash back', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    await calm(page);
    const r = await page.evaluate(() => { S.week.b = [{ start: 0, end: 5000, cause: 'a breakdown' }]; const a = actions().find(a => /Take the skiff across/.test(a.l)); const txt = a.s; S.boat.cond = 50; const m0 = S.money;
      actions().find(a => /Sell the skiff/.test(a.l)).fn(); return { txt }; });
    assert.match(r.txt, /ferry’s down/);
    await press(page, /Sell for/);
    const s = await page.evaluate(() => ({ boat: S.boat, listed: Object.keys(L).includes('sunny') }));
    assert.strictEqual(s.boat, null); assert.strictEqual(s.listed, false);
    noErrors(errors);
  } },
];
