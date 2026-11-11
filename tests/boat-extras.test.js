const { open, newGame, noErrors, assert } = require('./helpers');

const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
const setup = (page, opts = {}) => page.evaluate(o => {
  newGame('normal', o.mode || 'week', o.season || 'fall'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act';
  wxR = () => 0.9; S.week.storm = null; S.week.fog = S.week.fog.map(() => 0); S.cur = 1; S.t = 1440 + 600; S.loc = o.loc || 'marina'; S.money = o.money || 5000;
  S.boat = { own: true, store: 'slip', at: 'marina', fuel: 6, cond: 100, trips: 0, paidThru: dayKey() + 28 }; boatSync(); BX();
  boatLow = () => false; Math.random = () => 0.9; render();
}, opts);
const press = (page, re) => page.evaluate(src => { const r = new RegExp(src); const i = MB.findIndex(b => r.test(b.l)); if (i < 0) throw new Error('no button ' + src + ' in ' + MB.map(b => b.l).join(' | ')); MBTN(i); }, re.source);
const modalText = page => page.evaluate(() => { const m = document.querySelector('#mbg'); return m ? m.textContent : ''; });
const act = (page, re) => page.evaluate(src => { const a = actions().find(a => new RegExp(src).test(a.l)); if (!a) throw new Error('no action ' + src); if (a.dis) throw new Error('disabled ' + src); a.fn(); }, re.source);
const has = (page, re) => page.evaluate(src => !!actions().find(a => new RegExp(src).test(a.l)), re.source);
const finishCross = async page => { await page.waitForSelector('.cross'); await page.click('.cross'); await page.waitForFunction(() => !document.querySelector('.cross')); };

module.exports = [
  { name: 'boat extras: two gas cans and a cooler may ride the skiff; three cans or other cargo may not', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => { S.cargo.gas = 2; S.cooler = true; S.carried = 3; });
    await act(page, /Take the skiff across/);
    const t = await modalText(page);
    assert.match(t, /2 gas cans aboard/); assert.match(t, /cooler/); assert.ok(!/Too much to carry/.test(t));
    await press(page, /Cast off/); await finishCross(page);
    assert.deepStrictEqual(await page.evaluate(() => [S.loc, S.cargo.gas, S.carried]), ['sunny', 2, 3]);
    await setup(page); await page.evaluate(() => { S.cargo.gas = 3; });
    await act(page, /Take the skiff across/); assert.match(await modalText(page), /Too much to carry/);
    await setup(page); await page.evaluate(() => { S.cargo.gas = 1; S.cargo.food = 1; });
    await act(page, /Take the skiff across/); assert.match(await modalText(page), /Too much to carry/);
    noErrors(errors);
  } },
  { name: 'boat extras: choppy water with gas cans: slow down (+10 min) or toss a can', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const toss of [false, true]) {
      await setup(page);
      await page.evaluate(() => { wxR = () => 0.1; S.cargo.gas = 2; });   // choppy, not refused
      await act(page, /Take the skiff across/);
      await press(page, /Go anyway/);
      assert.match(await modalText(page), /Chop, with gas cans aboard/);
      const t0 = await page.evaluate(() => S.t);
      await press(page, toss ? /Toss a can/ : /Slow down/);
      await finishCross(page);
      const r = await page.evaluate(() => ({ gas: S.cargo.gas, dt: S.t - 0, rep: S.rep }));
      assert.strictEqual(r.gas, toss ? 1 : 2);
      if (!toss) assert.ok(r.dt - t0 >= 25 + 10 + 8);
    }
    noErrors(errors);
  } },
  { name: 'boat extras: the bill of sale covers 60 days; after that a ticket, until you take the course (card for life)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    const r = await page.evaluate(() => { const o = { left: bxCardLeft(), ok: bxCardOk() }; BX().bought = bxAbs() - 61; o.ok2 = bxCardOk(); return o; });
    assert.strictEqual(r.left, 60); assert.ok(r.ok); assert.ok(!r.ok2);
    // crossing without the card: ticket (random forced low)
    await act(page, /Take the skiff across/);
    assert.match(await modalText(page), /No Boater Education Card/);
    await page.evaluate(() => { Math.random = () => 0.1; });
    const m0 = await page.evaluate(() => S.money);
    await press(page, /Cast off/); await finishCross(page);
    const t = await page.evaluate(() => ({ d: S.money - 0, tix: S.stats.boatTix, rep: S.rep }));
    assert.strictEqual(t.tix, 1); assert.ok(m0 - t.d >= 87 - 1, 'money ' + m0 + ' -> ' + t.d);
    // the course, at home
    await page.evaluate(() => { S.loc = 'home'; Math.random = () => 0.9; S.money = 500; render(); });
    const t0 = await page.evaluate(() => S.t);
    await act(page, /boater education course/); await press(page, /Take the course/);
    const c = await page.evaluate(() => ({ card: BX().card, money: S.money, dt: S.t })); assert.ok(c.card); assert.strictEqual(c.money, 490); assert.strictEqual(c.dt - t0, 120);
    assert.ok(!(await has(page, /boater education course/)));
    // with the card: no ticket even at the worst roll; card survives story chapters
    const s = await page.evaluate(() => { S.loc = 'marina'; Math.random = () => 0.01; const before = S.stats.boatTix || 0; boatArrive('sunny', 30, []); return S.stats.boatTix === before; });
    assert.ok(s);
    noErrors(errors);
  } },
  { name: 'boat extras: the card, registration and upgrades carry through story chapters', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      newGame('normal', 'month'); storyNew('normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.boat = { own: true, store: 'slip', at: 'marina', fuel: 4, cond: 80, trips: 0, paidThru: 28 }; boatSync(); BX().card = true; BX().up.lights = true; BX().ins = true; BX().insThru = bxAbs() + 28;
      const reg0 = BX().reg, ab0 = bxAbs(); S.money = 2000; storyAdvance(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      return { card: BX().card, lights: BX().up.lights, own: boatOwn(), reg0, yr: bxYear(), ab: bxAbs() > ab0, regOk: bxRegOk(), ins: BX().insThru === bxAbs() + 28 };
    });
    assert.ok(r.card && r.lights && r.own && r.ab && r.ins, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'boat extras: annual registration, winterizing, hull cleaning and insurance', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    // registration lapses in a new year; $40 renews it
    await page.evaluate(() => { BX().reg = bxYear() - 1; render(); });
    const m0 = await page.evaluate(() => S.money);
    await act(page, /Renew the boat registration/);
    assert.deepStrictEqual(await page.evaluate(() => [bxRegOk(), S.money]), [true, m0 - 40]);
    // winterizing: DIY ($15, 1 h) or marina ($120)
    await page.evaluate(() => { S.week.storm = null; BX().winter = false; });
    assert.ok(await has(page, /Winterize the outboard yourself/) && await has(page, /marina winterize/));
    const t0 = await page.evaluate(() => S.t), m1 = await page.evaluate(() => S.money);
    await act(page, /Winterize the outboard yourself/);
    assert.deepStrictEqual(await page.evaluate(() => [BX().winter, S.t - 0, S.money]), [true, t0 + 60, m1 - 15]);
    await page.evaluate(() => { BX().winter = false; }); const m2 = await page.evaluate(() => S.money);
    await act(page, /marina winterize/); assert.strictEqual(await page.evaluate(() => S.money), m2 - 120);
    // an unwinterized outboard in a hard freeze
    const f = await page.evaluate(() => { BX().winter = false; S.season = 'winter'; const e = EV.find(x => x.id === 'bx_freeze'); const c = e.cond(); const notes = []; const cond0 = S.boat.cond; e.run({ notes }); const o = { c, dc: cond0 - S.boat.cond, n: notes.length }; BX().winter = true; o.safe = !e.cond(); return o; });
    assert.ok(f.c && f.dc === 35 && f.n === 1 && f.safe, JSON.stringify(f));
    // hull fouling by the season; $60
    const h = await page.evaluate(() => { BX().hull = 'old'; return { fouled: bxFouled(), need: boatNeed() }; });
    assert.ok(h.fouled && h.need > 1.2);
    const m3 = await page.evaluate(() => S.money); await act(page, /Clean the hull/);
    assert.deepStrictEqual(await page.evaluate(() => [bxFouled(), S.money]), [false, m3 - 60]);
    // insurance: $15 a month; covers storm damage and theft
    await act(page, /Insure the boat/);
    const ins = await page.evaluate(() => { const o = { on: BX().ins }; const m = S.money; EV.find(x => x.id === 'bx_storm').run({ notes: [] }); o.storm = m - S.money; S.boat.at = 'sunny'; const m2 = S.money; EV.find(x => x.id === 'bx_theft').run({ notes: [] }); o.theft = m2 - S.money; BX().ins = false; const m3 = S.money; EV.find(x => x.id === 'bx_storm').run({ notes: [] }); o.bare = m3 - S.money; return o; });
    assert.ok(ins.on); assert.strictEqual(ins.storm, 50); assert.strictEqual(ins.theft, 50); assert.strictEqual(ins.bare, 250);
    noErrors(errors);
  } },
  { name: 'boat extras: the lot next door and the third garage bay (garageBay), built by a contractor who rides the ferry', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { loc: 'home', money: 100 });
    assert.strictEqual(await page.evaluate(() => garageBay()), false);
    await page.evaluate(() => { S.weekNo = 1; S.week.b = []; });
    const seen = await page.evaluate(() => { const e = EV.find(x => x.id === 'bx_lot'); const c = e.cond(); e.run({ notes: [] }); return [c, BX().lot.seen]; });
    assert.deepStrictEqual(seen, [true, true]);
    await page.evaluate(() => { render(); });
    const lot = await page.evaluate(() => actions().find(a => /Buy the lot next door/.test(a.l)));
    assert.ok(lot && lot.dis, 'goal visible, too poor');
    await page.evaluate(() => { S.money = 30000; S.phone = 100; });
    await act(page, /Buy the lot next door/);
    assert.deepStrictEqual(await page.evaluate(() => [BX().lot.own, S.money]), [true, 15000]);
    assert.strictEqual(await page.evaluate(() => garageBay()), false);
    await page.evaluate(() => { S.phone = 100; });
    await act(page, /Build a third garage bay/);
    const j = await page.evaluate(() => ({ job: UP().jobs.find(j => j.k === 'bay'), money: S.money, now: S.t }));
    assert.ok(j.job && j.money === 3000 && j.job.due - j.now >= 6 * 1440 && j.job.due - j.now <= 15 * 1440);
    // a ferry outage delays the builder
    const d = await page.evaluate(() => { const due = UP().jobs[0].due; S.week.b = [{ start: due - 60, end: due + 600 }]; S.t = due + 1; processTimed(); return { built: garageBay(), jobs: UP().jobs.length, due: UP().jobs[0] && UP().jobs[0].due - due }; });
    assert.ok(!d.built && d.jobs === 1 && d.due > 0, JSON.stringify(d));
    await page.evaluate(() => { S.week.b = []; S.t = UP().jobs[0].due + 1; processTimed(); });
    assert.strictEqual(await page.evaluate(() => garageBay()), true);
    // benefits: service at home, firewood, the garage card shows three bays
    const g = await page.evaluate(() => { S.boat.store = 'garage'; S.boat.at = 'home'; S.boat.cond = 40; S.money = 500; S.cars = [{ id: 'isl', name: 'Island car (old Subaru)', loc: 'home', fuel: 6, tank: 14, diesel: false }]; const A = actions(); const card = A.find(a => /^Garage:/.test(a.l)); return { card: card && card.l, serve: !!A.find(a => /Service the outboard at home/.test(a.l)), wood: !!A.find(a => /big load of firewood/.test(a.l)) }; });
    assert.match(g.card, /3 bays/); assert.match(g.card, /skiff/); assert.ok(g.serve);
    await act(page, /Service the outboard at home/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat.cond, S.money]), [100, 475]);
    // a garaged boat isn't hit by storms, theft or freezes, and doesn't wear idle
    const gg = await page.evaluate(() => { S.week.storm = { day: day(), start: 1, end: 2 }; BX().winter = false; S.season = 'winter'; return ['bx_storm', 'bx_theft', 'bx_freeze'].map(id => !!EV.find(e => e.id === id).cond()); });
    assert.deepStrictEqual(gg, [false, false, false]);
    noErrors(errors);
  } },
  { name: 'boat extras: upgrades at the marina (lights, fog kit, 25 hp) and resale by condition and upgrades', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    // lights: a crossing after dark loses the dark risk
    await page.evaluate(() => { S.t = 1440 + 22 * 60; });
    assert.ok(await page.evaluate(() => boatConditions('sunny').H.some(h => h.k === 'dark')));
    await act(page, /Navigation lights/);
    assert.ok(!(await page.evaluate(() => boatConditions('sunny').H.some(h => h.k === 'dark'))));
    await page.evaluate(() => { S.t = 1440 + 600; });
    // fog kit: fog risk mostly gone
    await page.evaluate(() => { S.week.fog[1] = 1; });
    await act(page, /Fog horn and handheld GPS/);
    await page.evaluate(() => { Math.random = () => 0.1; });
    await act(page, /Take the skiff across/); await press(page, /Go anyway/);
    await finishCross(page);
    assert.ok(await page.evaluate(() => S.log.some(l => /GPS blinks/.test(l.s))));
    // 25 hp: faster, thirstier
    await setup(page);
    const base = await page.evaluate(() => boatNeed());
    await act(page, /25 hp outboard/);
    const up = await page.evaluate(() => ({ need: boatNeed(), eng: BX().up.eng25 }));
    assert.ok(up.eng && up.need > base * 1.3);
    await act(page, /Take the skiff across/); await press(page, /Cast off/);
    const t0 = await page.evaluate(() => S.t); await finishCross(page);
    const dt = await page.evaluate(() => S.t) - t0; assert.ok(dt <= 28, 'faster: ' + dt);
    // resale
    const p = await page.evaluate(() => { const plain = (() => { const u = BX().up; BX().up = {}; const v = bxSellValue(); BX().up = u; return v })(); return { plain, withUp: bxSellValue() }; });
    assert.ok(p.withUp > p.plain + 1000);
    await page.evaluate(() => { S.loc = 'marina'; S.boat.at = 'marina'; });
    const m0 = await page.evaluate(() => S.money);
    await act(page, /Sell the skiff/); await press(page, /Sell for/);
    assert.deepStrictEqual(await page.evaluate(() => [S.boat, S.money - 0 > 0, BX().up.eng25 || false]), [null, true, false]);
    assert.ok((await page.evaluate(() => S.money)) > m0);
    noErrors(errors);
  } },
  { name: 'boat extras: fish and crab from the skiff, take a friend out', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => { TX().lic = 1; S.friends = { sam: { name: 'Sam', lvl: 2, pts: 4, day: 0 } }; render(); });
    const m0 = await page.evaluate(() => [S.money, S.boat.fuel, S.t]);
    await act(page, /Fish from your skiff/);
    assert.match(await modalText(page), /A hit off the kelp bed/);
    const r = await page.evaluate(() => ({ money: S.money, fuel: S.boat.fuel, t: S.t }));
    assert.strictEqual(r.money, m0[0] - 4); assert.strictEqual(r.fuel, 5.6); assert.strictEqual(r.t - m0[2], 90);
    await press(page, /Set the hook/);
    // crabbing: a pot set from the boat is flagged
    await setup(page);
    await page.evaluate(() => { TX().lic = 1; S.season = 'summer'; crabSeason = () => true; S.week.fog = S.week.fog.map(() => 0); S.t = 1440 + 600; render(); });
    await act(page, /Set a crab pot from the skiff/); await press(page, /Set the pot from the boat/);
    assert.ok(await page.evaluate(() => TX().pot && TX().pot.boat === true));
    // a friend on the water
    await setup(page);
    await page.evaluate(() => { S.friends = { sam: { name: 'Sam', lvl: 2, pts: 4, day: 0 } }; S.stress = 60; render(); });
    const p0 = await page.evaluate(() => [S.friends.sam.pts, S.stress, S.boat.fuel]);
    await act(page, /Take a friend out/); await press(page, /Invite Sam/);
    const p1 = await page.evaluate(() => [S.friends.sam.pts, S.stress, S.boat.fuel]);
    assert.ok(p1[0] > p0[0]); assert.strictEqual(p1[1], p0[1] - 8); assert.strictEqual(p1[2], 5.5);
    assert.ok(!(await page.evaluate(() => { const a = actions().find(a => /Take a friend out/.test(a.l)); return !a.dis; })), 'once a day');
    noErrors(errors);
  } },
  { name: 'boat extras: a boat beat for Sam (towing his sailboat) and the Hendersons (shoreline photos)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { loc: 'home' });
    await page.evaluate(() => { S.friends = { sam: { name: 'Sam', lvl: 2, pts: 4, day: 0 }, hendersons: { name: 'The Hendersons', lvl: 2, pts: 4, day: 0 } }; FST().sam.b = 1; FST().hendersons.b = 1; S.t = 1440 + 600; });
    const c = await page.evaluate(() => ({ sam: EV.find(e => e.id === 'bx_sam_tow').cond(), hend: EV.find(e => e.id === 'bx_hend_photos').cond() }));
    assert.deepStrictEqual(c, { sam: true, hend: true });
    await page.evaluate(() => EV.find(e => e.id === 'bx_sam_tow').run({}));
    assert.match(await modalText(page), /Windfall/);
    const h0 = await page.evaluate(() => [FST().sam.h, S.friends.sam.pts, S.boat.fuel]);
    await press(page, /Tow Sam in/);
    const h1 = await page.evaluate(() => [FST().sam.h, S.friends.sam.pts, S.boat.fuel, BX().beat.sam != null]);
    assert.strictEqual(h1[0], h0[0] + 1); assert.ok(h1[1] > h0[1]); assert.strictEqual(h1[2], 5.4); assert.ok(h1[3]);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    await page.evaluate(() => EV.find(e => e.id === 'bx_hend_photos').run({}));
    assert.match(await modalText(page), /shoreline/);
    await press(page, /Take the photos/);
    assert.ok(await page.evaluate(() => FST().hendersons.h >= 1 && BX().beat.hend != null && !EV.find(e => e.id === 'bx_hend_photos').cond()));
    noErrors(errors);
  } },
];
