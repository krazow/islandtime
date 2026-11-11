const { open, newGame, noErrors, assert } = require('./helpers');
const setup = (home, len = 'weekend') => ([h, l]) => { S.visitor = vsInit(l, h); S.cars[0].loc = 'vhome'; S.cars[0].fuel = 12; S.loc = 'vhome'; MQ = []; render(); };

module.exports = [
  { name: 'vhome exists only in visitor mode', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'stDock'; render();
      const off = document.querySelector('.content').textContent.includes('Your place');
      S.visitor = vsInit('weekend', 'seattle'); render();
      const on = document.querySelector('.content').textContent.includes('Your place (Seattle)');
      return { off, on };
    });
    assert.strictEqual(r.off, false); assert.strictEqual(r.on, true);
    noErrors(errors);
  } },
  { name: 'visitor travel: drive times by home, uses fuel', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const out = {};
      for (const h of ['seattle', 'tacoma', 'olympia']) {
        S.visitor = vsInit('weekend', h); out[h] = dist('vhome', 'stDock');
        S.cars[0].loc = 'vhome'; S.cars[0].fuel = 12; S.loc = 'vhome'; S.cur = 2; S.t = 2 * 1440 + 600; // Wed 10 AM
        Math.random = () => 0.5; const f0 = S.cars[0].fuel; const t0 = S.t;
        go('stDock', travelOpts('stDock').find(o => o.m === 'car'));
        out[h + 'Spent'] = S.t - t0; out[h + 'Fuel'] = f0 - S.cars[0].fuel; MQ = [];
      }
      return out;
    });
    assert.ok(r.seattle >= 70 && r.seattle <= 80, 'seattle ' + r.seattle);
    assert.ok(r.tacoma >= 20 && r.tacoma <= 28, 'tacoma ' + r.tacoma);
    assert.ok(r.olympia >= 32 && r.olympia <= 40, 'olympia ' + r.olympia);
    assert.ok(r.seattleFuel > r.olympiaFuel && r.olympiaFuel > r.tacomaFuel && r.tacomaFuel > 0.4);
    assert.ok(r.seattleSpent >= r.seattle && r.seattleSpent < r.seattle + 10);
    noErrors(errors);
  } },
  { name: 'visitor travel: I-5 traffic is worse at rush hour, applied on the drive, can crash', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.visitor = vsInit('weekend', 'seattle'); S.loc = 'vhome';
      const at = (d, m) => vtTraffic('vhome', 'stDock', d * 1440 + m).min;
      const o = { mid: at(2, 600), am: at(1, 450), pm: at(2, 1000), fri: at(4, 900), sun: at(6, 600) };
      S.season = 'summer'; o.sat = at(5, 600); S.season = 'fall'; o.satFall = at(5, 600);
      S.visitor = vsInit('weekend', 'olympia'); o.oly = at(1, 450);
      // the drive itself
      S.visitor = vsInit('weekend', 'seattle'); S.cars[0].loc = 'vhome'; S.cars[0].fuel = 12; S.cur = 1; S.t = 1440 + 450;
      Math.random = () => 0.5; const label = travelOpts('stDock').find(x => x.m === 'car'); o.label = label.l; o.sub = label.s;
      const t0 = S.t; go('stDock', label); o.rushSpent = S.t - t0; MQ = [];
      S.loc = 'vhome'; S.cars[0].loc = 'vhome'; S.cur = 2; S.t = 2 * 1440 + 600; const t1 = S.t;
      go('stDock', travelOpts('stDock').find(x => x.m === 'car')); o.calmSpent = S.t - t1; MQ = [];
      S.loc = 'vhome'; S.cars[0].loc = 'vhome'; S.t = 2 * 1440 + 600; const t2 = S.t;
      Math.random = () => 0; go('stDock', travelOpts('stDock').find(x => x.m === 'car')); o.crashSpent = S.t - t2; MQ = [];
      return o;
    });
    assert.ok(r.am > r.mid && r.pm > r.mid && r.fri > r.mid && r.sat > r.satFall, JSON.stringify(r));
    assert.ok(r.oly < r.am);
    assert.match(r.sub, /WSDOT: I-5 southbound/);
    assert.ok(r.rushSpent > r.calmSpent + 15, JSON.stringify(r));
    assert.ok(r.crashSpent >= 76 + 30, 'crash ' + r.crashSpent);
    noErrors(errors);
  } },
  { name: 'visitor travel: packing food adds carried food, capped by visit length', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.visitor = vsInit('weekend', 'tacoma'); S.loc = 'vhome'; S.carried = 0; S.money = 200; S.cur = 4; S.t = 4 * 1440 + 480; render();
      const labels = () => actions().map(a => a.l);
      const o = { labels: labels() };
      const m0 = S.money; actions().find(a => /cooler with 3 days/.test(a.l)).fn(); MQ = [];
      o.carried = S.carried; o.packed = VS().packed; o.cost = m0 - S.money; o.cooler = S.cooler;
      o.after = labels().filter(l => /Pack food/.test(l));
      S.visitor = vsInit('day', 'tacoma'); o.day = labels().filter(l => /Pack/.test(l));
      return o;
    });
    assert.ok(r.labels.some(l => /cooler with 1 day/.test(l)) && r.labels.some(l => /cooler with 3 days/.test(l)));
    assert.strictEqual(r.carried, 3); assert.strictEqual(r.packed, 3); assert.strictEqual(r.cost, 24); assert.ok(r.cooler);
    assert.deepStrictEqual(r.after, []);
    assert.deepStrictEqual(r.day, ['Pack a lunch — $8']);
    noErrors(errors);
  } },
  { name: 'visitor travel: walk-on is cheaper, car stays; on foot only nearby, bike reaches all', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.visitor = vsInit('weekend', 'tacoma'); S.cars[0].loc = 'stDock'; S.cars[0].fuel = 8; S.loc = 'stDock'; S.cur = 5; S.t = 5 * 1440 + 480;
      const o = { walk: fareWalk(), car: fareCar() };
      const m0 = S.money; waitFerry('walk'); o.walkDisplayed = true; return o;
    });
    assert.ok(r.walk < r.car);
    await page.waitForTimeout(300);
    const r2 = await page.evaluate(() => {
      // skip the crossing animation: land on the island on foot
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.loc = 'aiDock'; S.cars[0].loc = 'stDock'; VS().bike = false;
      const far = travelOpts('lake').find(o => o.m === 'walk'), near = travelOpts('store').find(o => o.m === 'walk'), noBike = travelOpts('lake').some(o => o.m === 'bike');
      VS().bike = true;
      const bike = travelOpts('lake').find(o => o.m === 'bike');
      return { far: !!far.dis, near: !near.dis, noBike, bike: bike && bike.min, walkMin: far.min };
    });
    assert.ok(r2.far && r2.near && !r2.noBike);
    assert.ok(r2.bike && r2.bike < r2.walkMin);
    noErrors(errors);
  } },
  { name: 'visitor travel: after the last boat the island host option works (rep gates it)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.visitor = vsInit('day', 'tacoma'); S.loc = 'aiDock'; S.cars[0].loc = 'stDock'; S.cur = 5; S.t = 5 * 1440 + Math.max(...deps("I", 5)) + 5; S.week.b = [];
      const find = () => actions().find(a => /Island Group/.test(a.l));
      const o = { shown: !!find(), bench: actions().some(a => /bench at the landing/.test(a.l)) };
      VS().rep = -5; Math.random = () => 0.01; find().fn(); MQ = []; o.badRep = document.querySelector('.modal-bg') === null || !/Somebody answered/.test(document.body.textContent);
      o.askedDisabled = !!find().dis; VS().asked = -1; VS().rep = 5;
      Math.random = () => 0.01; find().fn(); o.modal = /Somebody answered/.test(document.body.textContent);
      Math.random = () => 0.5; VS().rep = 10; o.ride = typeof vtRideOffer === 'function' && (Math.random = () => 0.1, vtRideOffer());
      VS().rep = 0; o.noRide = !vtRideOffer();
      return o;
    });
    assert.ok(r.shown && r.bench && r.badRep && r.askedDisabled && r.modal && r.ride && r.noRide, JSON.stringify(r));
    noErrors(errors);
  } },
];
