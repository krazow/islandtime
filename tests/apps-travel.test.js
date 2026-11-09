const { open, newGame, reload, noErrors, assert } = require('./helpers');

// Travel apps: ⛴️ Ferry Pass, 🚗 Island Rides, 🌦️ Tides & Weather.
const phoneText = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
const tap = (page, label) => page.locator('#phoneUI button', { hasText: label }).first().click();
const logTxt = page => page.evaluate(() => S.log.map(e => e.s).join(' '));
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
async function seasonGame(page, season) {
  await page.evaluate(s => { newGame('normal', 'week', s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); }, season);
}
async function storeInstall(page, name) {
  await page.evaluate(() => phoneOpen('store'));
  await page.locator('#phoneUI .ph-store', { hasText: name }).locator('button', { hasText: 'Install' }).click();
}

module.exports = [
  { name: 'all three install from the App Store and open without errors', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.t = 600; phoneOpen('store'); });
    const st = await phoneText(page);
    for (const n of ['Ferry Pass', 'Island Rides', 'Tides & Weather']) assert.ok(st.includes(n), 'store lists ' + n);
    for (const n of ['Ferry Pass', 'Island Rides', 'Tides & Weather']) await storeInstall(page, n);
    assert.deepStrictEqual(await page.evaluate(() => ['ferrypass', 'rides', 'weather'].map(phoneInstalled)), [true, true, true]);
    assert.strictEqual(await page.evaluate(() => phoneFree()), 2, 'each takes a slot');
    for (const id of ['ferrypass', 'rides', 'weather']) {
      await page.evaluate(id => { phoneHome(); phoneGo(id); }, id);
      const t = await phoneText(page);
      assert.ok(!/Something went wrong/.test(t), id + ': ' + t.slice(0, 200));
    }
    assert.match(await page.evaluate(() => { phoneHome(); phoneGo('ferrypass'); return document.getElementById('phoneUI').textContent; }), /Next sailings from Anderson Island.*Last boat tonight/s);
    noErrors(errors);
  } },
  { name: 'Ferry Pass: buy a walk-on book; a Steilacoom crossing uses a ride, not cash', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'stDock'; S.money = 500; phoneInstall('ferrypass'); phoneOpen('ferrypass'); });
    await tap(page, 'Passenger (walk-on)');
    const b = await page.evaluate(() => ({ m: S.money, walk: FP().walk, car: FP().car }));
    assert.deepStrictEqual(b, { m: 453.12, walk: 10, car: 0 }, '10 × $6.25 at 25% off = $46.88');
    assert.match(await phoneText(page), /10 walk-on rides/);
    await page.evaluate(() => phoneClose());
    // board the next walk-on boat from Steilacoom
    const m0 = await page.evaluate(() => {
      S.cur = 1; S.t = 1440 + 600; S.week.b = []; S.week.fog = [0, 0, 0, 0, 0, 0, 0]; S.priority = true; S.cargo = { food: 0, med: 0, gas: 0, diesel: 0, drugs: 0 }; S.carried = 0;
      S.cars[0].loc = 'home'; S.phone = 80; S.phoneT = S.t; S.log = [];
      const m = S.money; waitFerry('walk'); return m;
    });
    await page.locator('.cross').click();
    const r = await page.evaluate(() => ({ m: S.money, walk: FP().walk, loc: S.loc }));
    assert.strictEqual(r.m, m0, 'no cash fare'); assert.strictEqual(r.walk, 9); assert.strictEqual(r.loc, 'aiDock');
    assert.match(await logTxt(page), /scans your phone.*9 left/);
    // a dead phone: pay cash
    const dead = await page.evaluate(() => {
      S.loc = 'stDock'; S.t = 1440 + 900; S.phone = 0; S.phoneT = S.t; const m = S.money;
      const ok = fpUseRide('walk'); if (!ok) money(-FARE_WALK); return { paid: m - S.money, walk: FP().walk };
    });
    assert.deepStrictEqual(dead, { paid: 6.25, walk: 9 });
    // a car book, and boarding with the car uses it
    const car = await page.evaluate(() => { S.phone = 80; S.phoneT = S.t; S.money = 1000; fpBuy('car'); const m = S.money; const used = fpUseRide('drive'); return { cost: 1000 - m, used, left: FP().car }; });
    assert.deepStrictEqual(car, { cost: 198.75, used: true, left: 9 });
    noErrors(errors);
  } },
  { name: 'Ferry Pass: push alert once per outage, with battery, only when installed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const count = () => page.evaluate(() => S.log.filter(e => /Ferry Pass<\/b>.*rider alert/.test(e.s)).length);
    // not installed: nothing
    await page.evaluate(() => { S.loc = 'home'; S.cur = 1; S.t = 1440 + 500; S.phoneT = S.t; S.phone = 90; S.week.b = [{ start: 1440 + 520, end: 1440 + 800, cause: 'steering hydraulic leak' }]; S.log = []; S.t = 1440 + 530; processTimed(); });
    assert.strictEqual(await count(), 0, 'not installed');
    // installed, before the outage starts: nothing; then once it is known: one alert, not repeated
    await page.evaluate(() => { S.week.b = [{ start: 1440 + 600, end: 1440 + 900, cause: 'steering hydraulic leak' }]; phoneInstall('ferrypass'); S.t = 1440 + 590; processTimed(); });
    assert.strictEqual(await count(), 0, 'not yet known');
    await page.evaluate(() => { S.t = 1440 + 610; processTimed(); S.t += 30; processTimed(); S.t += 30; processTimed(); });
    assert.strictEqual(await count(), 1, 'exactly once');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('#tiles .tile')].some(t => /Ferry Pass/.test(t.textContent))), 'tile shown');
    // a second outage with a dead phone: no alert until it’s charged (if still going)
    await page.evaluate(() => { S.week.b.push({ start: 1440 + 1000, end: 1440 + 1200, cause: 'generator failure' }); S.t = 1440 + 1010; S.phone = 0; S.phoneT = S.t; processTimed(); });
    assert.strictEqual(await count(), 1, 'dead phone');
    await page.evaluate(() => { S.phone = 50; S.t += 5; S.phoneT = S.t; processTimed(); });
    assert.strictEqual(await count(), 2, 'delivered after charging');
    noErrors(errors);
  } },
  { name: 'Island Rides: request → travel option → ride to the landing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.cur = 1; S.t = 1440 + 600; S.phoneT = S.t; S.phone = 80; S.cars[0].fuel = 0; S.money = 100; phoneInstall('rides'); phoneOpen('rides'); });
    assert.match(await phoneText(page), /out of gas/);
    await tap(page, 'Request a ride');
    const R = await page.evaluate(() => S.ev.flags.irides);
    assert.ok(R && R.cost >= 8 && R.cost <= 12, JSON.stringify(R));
    const wait = R.at - await page.evaluate(() => S.t);
    assert.ok(wait >= 10 && wait <= 30, 'daytime pickup 10–30 min: ' + wait);
    assert.match(await phoneText(page), /on the way/);
    await page.evaluate(() => { phoneClose(); setTab('act'); });
    const opts = await page.evaluate(() => ({ dock: travelOpts('aiDock').map(o => o.l), lake: travelOpts('lake').map(o => o.l) }));
    assert.ok(opts.dock.some(l => /Island Rides/.test(l)), JSON.stringify(opts));
    assert.ok(!opts.lake.some(l => /Island Rides/.test(l)), 'only to the landing from home');
    const chip = page.locator('.dest', { hasText: 'Anderson Island Ferry Landing' }).locator('button.chip', { hasText: 'Island Rides' });
    assert.strictEqual(await chip.count(), 1, 'chip on the Go list');
    const before = await page.evaluate(() => ({ m: S.money, t: S.t }));
    await chip.evaluate(e => e.click()); await clear(page);   // the Go list may be folded
    const after = await page.evaluate(() => ({ m: S.money, t: S.t, loc: S.loc, flag: !!S.ev.flags.irides }));
    assert.strictEqual(after.loc, 'aiDock'); assert.strictEqual(after.flag, false, 'flag used up');
    assert.strictEqual(before.m - after.m, R.cost);
    assert.ok(after.t >= R.at + 12, 'waited for the pickup, then drove 12 min');
    assert.match(await logTxt(page), /pulls up in a dusty minivan/);
    // from the landing it offers rides anywhere on the island
    await page.evaluate(() => { S.ev.flags.irides = { at: S.t, until: S.t + 60, cost: 9, who: 1 }; });
    assert.ok(await page.evaluate(() => travelOpts('lake').some(o => o.m === 'irides')));
    noErrors(errors);
  } },
  { name: 'Island Rides: refused at night and on the mainland; slower early', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.cur = 1; S.phone = 80; phoneInstall('rides');
      S.t = 1440 + 1400; S.phoneT = S.t; const night = irRequest(); phoneOpen('rides'); const nightTxt = document.getElementById('phoneUI').textContent;
      S.t = 1440 + 200; S.phoneT = S.t; const early = irRequest();
      S.loc = 'stDock'; S.t = 1440 + 600; S.phoneT = S.t; const main = irRequest(); phoneRender(); const mainTxt = document.getElementById('phoneUI').textContent;
      const mainOpt = travelOpts('gas').some(o => o.m === 'irides');
      S.loc = 'home'; S.t = 1440 + 330; S.phoneT = S.t; const dawn = irRequest(); const w = S.ev.flags.irides.at - S.t;
      return { night, nightTxt, early, main, mainTxt, mainOpt, dawn, w };
    });
    assert.strictEqual(r.night, false); assert.match(r.nightTxt, /No drivers 11 PM–5 AM/);
    assert.strictEqual(r.early, false); assert.strictEqual(r.main, false); assert.strictEqual(r.mainOpt, false);
    assert.match(r.mainTxt, /only works on Anderson Island/);
    assert.strictEqual(r.dawn, true); assert.ok(r.w >= 25 && r.w <= 60, 'early morning pickup is slower: ' + r.w);
    noErrors(errors);
  } },
  { name: 'Weather: tomorrow’s storm a day early, evening-before buzz only when installed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.cur = 1; S.t = 1440 + 600; S.phoneT = S.t; S.phone = 80;
      S.week.storm = { day: 2, start: 2 * 1440 + 1000, end: 2 * 1440 + 1960 };
      const R0 = Math.random; let calls = 0; Math.random = () => { calls++; return R0(); };
      phoneInstall('weather'); calls = 0; phoneOpen('weather'); const txt = document.getElementById('phoneUI').textContent; const used = calls; Math.random = R0;
      S.log = []; S.t = 1440 + 1000; processTimed(); const before6 = S.log.length;
      S.t = 1440 + 1090; processTimed(); S.t += 30; processTimed();
      const n = S.log.filter(e => /Tides & Weather<\/b>.*Gale tomorrow/.test(e.s)).length;
      return { txt, used, before6, n };
    });
    assert.match(r.txt, /Tomorrow, Wednesday.*Gale warning/s);
    assert.strictEqual(r.used, 0, 'the forecast never calls Math.random');
    assert.strictEqual(r.before6, 0); assert.strictEqual(r.n, 1, 'one buzz the evening before');
    // not installed: no buzz
    const n2 = await page.evaluate(() => { phoneUninstall('weather'); S.cur = 2; S.t = 2 * 1440 + 1100; S.week.storm = { day: 3, start: 3 * 1440 + 1000, end: 3 * 1440 + 1960 }; S.log = []; processTimed(); return S.log.filter(e => /Tides & Weather/.test(e.s)).length; });
    assert.strictEqual(n2, 0);
    noErrors(errors);
  } },
  { name: 'Weather: winter ice, freeze and king tide; summer smoke', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'winter');
    const w = await page.evaluate(() => {
      S.loc = 'home'; S.cur = 1; S.t = 1440 + 600; S.phoneT = S.t; S.phone = 80; S.week.storm = null;
      const X = S.week.sea; X.snow = -1; X.ice[2] = 22; X.cold[1] = true; X.tide = { day: 2, start: 2 * 1440 + 480, end: 2 * 1440 + 630 };
      phoneInstall('weather'); phoneOpen('weather');
      const txt = document.getElementById('phoneUI').textContent, king = !!document.querySelector('#phoneUI .wx-king');
      S.log = []; S.t = 1440 + 1100; processTimed(); return { txt, king, log: S.log.map(e => e.s).join(' ') };
    });
    assert.match(w.txt, /Ice on the ferry ramp/); assert.match(w.txt, /Hard freeze tonight/); assert.match(w.txt, /King tide.*9:15 AM/);
    assert.ok(w.king, 'king tide highlighted in the tide table');
    assert.match(w.log, /Ice on the ramp tomorrow/); assert.match(w.log, /King tide tomorrow/); assert.match(w.log, /Hard freeze tonight/);
    await seasonGame(page, 'summer');
    const s = await page.evaluate(() => {
      S.loc = 'home'; S.cur = 1; S.t = 1440 + 600; S.phoneT = S.t; S.phone = 80; S.week.sea.smoke = 2;
      phoneInstall('weather'); phoneOpen('weather'); const txt = document.getElementById('phoneUI').textContent;
      S.log = []; S.t = 1440 + 1100; processTimed(); return { txt, log: S.log.map(e => e.s).join(' ') };
    });
    assert.match(s.txt, /Tomorrow, Wednesday.*Wildfire smoke and heat/s); assert.match(s.log, /Smoke tomorrow/);
    noErrors(errors);
  } },
  { name: 'an old save without travel-app state loads; apps work after', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { phoneInstall('ferrypass'); phoneInstall('rides'); phoneInstall('weather'); saveGame(); });
    const ok = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('islandtime.save'));
      delete d.S.ph.fp; delete d.S.ph.wx; delete d.S.ev.flags.irides; d.app = '1.13.0';
      adopt(migrate(d)); S.t += 30; processTimed();
      for (const id of ['ferrypass', 'rides', 'weather']) { phoneOpen(id); if (/Something went wrong/.test(document.getElementById('phoneUI').textContent)) return id; }
      return FP().walk === 0 ? 'ok' : 'bad';
    });
    assert.strictEqual(ok, 'ok');
    await page.evaluate(() => saveGame());
    await reload(page);
    await page.evaluate(() => resumeGame());
    assert.ok(await page.evaluate(() => phoneInstalled('weather')));
    noErrors(errors);
  } },
];
