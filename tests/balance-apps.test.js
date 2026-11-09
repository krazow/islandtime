const { open, newGame, noErrors, assert } = require('./helpers');

// App balance pass: loose ends (storm To-do, ticket labels, job text, dead CSS) and the four app achievements.
const at = (page, loc, d, m) => page.evaluate(([loc, d, m]) => {
  S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; S.phone = 100; S.loc = loc; MQ = [];
  document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [loc, d, m]);
const install = (page, ...ids) => page.evaluate(ids => { const l = S.loc, t = S.t; ids.forEach(id => phoneInstall(id)); S.loc = l; S.t = t; }, ids);
const stormTodo = page => page.evaluate(() => (todoItems().find(x => x.l === 'Be ready for the storm') || {}).s || null);
const prepActs = page => page.evaluate(() => actions().filter(a => /Fill water jugs|Charge the power bank|Top off and test/.test(a.l)).length);
const fresh = page => page.evaluate(() => { localStorage.removeItem(ACH_KEY); });

module.exports = [
  { name: 'storm To-do and storm prep: only once the gale is known (a day early with Tides & Weather)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.week.storm = { day: 3, start: 3 * 1440 + 1000, end: 3 * 1440 + 1960 }; });
    await at(page, 'home', 0, 600);
    assert.strictEqual(await stormTodo(page), null, 'Monday: nobody knows about Thursday’s gale');
    assert.strictEqual(await prepActs(page), 0);
    await at(page, 'home', 2, 600);
    assert.strictEqual(await stormTodo(page), null, 'the day before, without the app: still nothing');
    assert.strictEqual(await prepActs(page), 0);
    await install(page, 'weather');
    let s = await stormTodo(page);
    assert.match(s, /Gale tomorrow \(Thursday\)/, 'the day before, with the app');
    assert.ok(await prepActs(page) >= 1, 'storm prep offered a day early with the app');
    await page.evaluate(() => phoneUninstall('weather'));
    await at(page, 'home', 3, 600);
    s = await stormTodo(page);
    assert.match(s, /Gale today, from about 4:40 PM/);
    assert.ok(await prepActs(page) >= 1, 'storm day: prep offered to everyone');
    await at(page, 'home', 4, 1300);
    assert.strictEqual(await stormTodo(page), null, 'gone once it’s over');
    noErrors(errors);
  } },
  { name: 'dock buttons show the Ferry Pass ticket instead of the cash fare when a book covers it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'stDock', 0, 1000);
    await page.evaluate(() => { const c = S.cars.find(c => c.id === 'isl'); c.loc = 'stDock'; c.fuel = 8; render(); });
    const sub = re => page.evaluate(src => { const a = actions().find(a => new RegExp(src).test(a.l)); return a ? a.s : ''; }, re.source);
    assert.match(await sub(/Drive on the next/), /\$24\.94/);
    assert.match(await sub(/Walk on the next/), /\$8\.14/);
    await install(page, 'ferrypass');
    await page.evaluate(() => { FP().car = 3; render(); });
    assert.match(await sub(/Drive on the next/), /🎟️ ticket \(3 left\)/);
    assert.doesNotMatch(await sub(/Drive on the next/), /\$26/);
    assert.match(await sub(/Walk on the next/), /\$8\.14/, 'no walk-on rides in the book: cash');
    await page.evaluate(() => { FP().walk = 10; });
    assert.match(await sub(/Walk on the next/), /🎟️ ticket \(10 left\)/);
    await page.evaluate(() => { S.phone = 0; });
    assert.match(await sub(/Drive on the next/), /\$24\.94/, 'dead phone: cash');
    // the island side is free either way
    await at(page, 'aiDock', 0, 600);
    assert.match(await sub(/Walk on the next/), /free/);
    noErrors(errors);
  } },
  { name: 'looking for work points at Gig Work or the bulletin board; retired-app CSS is gone', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.emp = null; const todo = todoItems().find(x => x.l === 'Find a job').s;
      // fired at the end of the day: the note shows in the morning summary
      S.emp = 'lakewood'; S.job = 1; S.cur = 0; S.t = 1300; S.worked[0] = true; S.stress = 0;
      S.job = 0; endDay('home');
      const seen = document.body.textContent + JSON.stringify(MQ) + S.log.map(e => e.s).join(' ');
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const css = [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].map(r => r.selectorText || ''); } catch (e) { return []; } }).join(' ');
      return { todo, fired: S.stats.firings || 0, emp: S.emp, css, seen };
    });
    assert.match(r.todo, /Gig Work app or on the bulletin board/);
    assert.doesNotMatch(r.todo, /on your phone/);
    assert.strictEqual(r.emp, null); assert.strictEqual(r.fired, 1);
    assert.match(r.seen, /Gig Work app has the listings, or try the bulletin board/);
    for (const c of ['.ph-flash', '.ph-todo', '.ph-add', '.ph-ck']) assert.ok(!r.css.includes(c), c + ' removed');
    noErrors(errors);
  } },
  { name: 'achievements: 20 in all; Commuter pro and Gig economy count real use', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await fresh(page);
    const n = await page.evaluate(() => ({ len: ACH.length, ids: ['commuter_pro', 'autopay', 'gig_economy', 'weather_wise'].every(id => ACH.some(a => a.id === id)) }));
    assert.deepStrictEqual(n, { len: 20, ids: true });
    await page.evaluate(() => achModal());
    assert.match(await page.locator('#mbg h2').textContent(), /\(0\/20\)/);
    await page.evaluate(() => { document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    await at(page, 'stDock', 0, 600);
    await install(page, 'ferrypass', 'gigs');
    const r = await page.evaluate(() => {
      FP().car = 10; const out = {};
      for (let i = 0; i < 9; i++) fpUseRide('drive');
      achCheck(); out.nine = !!achGot().commuter_pro;
      fpUseRide('walk'); out.walkNoBook = S.stats.fpRides;   // no walk-on rides: not counted
      fpUseRide('drive'); achCheck(); out.ten = !!achGot().commuter_pro; out.rides = S.stats.fpRides;
      // gigs: real pay counts
      S.money = 0; let days = 0;
      while ((S.stats.gigPay || 0) < 100 && days < 10) { S.phone = 100; if (!gigDo('tag')) { S.cur++; S.t = S.cur * 1440 + 600; days++; } }
      out.gigPay = S.stats.gigPay; out.money = S.money; achCheck(); out.gig = !!achGot().gig_economy;
      return out;
    });
    assert.strictEqual(r.nine, false); assert.strictEqual(r.walkNoBook, 9);
    assert.strictEqual(r.ten, true); assert.strictEqual(r.rides, 10);
    assert.ok(r.gigPay >= 100 && r.gig, 'Gig economy at $100: ' + r.gigPay);
    assert.strictEqual(r.money, r.gigPay);
    noErrors(errors);
  } },
  { name: 'achievements: Never late on a bill needs autopay all month and no late bill', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await fresh(page);
    await at(page, 'home', 0, 600);
    await install(page, 'bank');
    const r = await page.evaluate(() => {
      icuAutoToggle(); const out = { since: PH().icu.since };
      const t = c => ACH.find(a => a.id === 'autopay').t(c);
      out.midGame = !!t({});
      S.weekNo = 3; S.cur = 6;
      out.end = t({ end: true, lost: false });
      out.lost = t({ end: true, lost: true });
      S.stats.lateBills = 1; out.late = t({ end: true }); S.stats.lateBills = 0;
      PH().icu.since = 9; out.lateStart = t({ end: true });
      PH().icu.since = 0; icuAutoToggle(); out.off = t({ end: true }); out.sinceOff = PH().icu.since;
      // a bill that goes unpaid past its due day is counted as late
      for (const k in HH_BILLS) HB(k).paid = k !== 'phone'; const b = HB('phone'); b.check = -1; b.late = 0; hhBillsNight([], hhDue('phone'));
      out.counted = S.stats.lateBills;
      return out;
    });
    assert.deepStrictEqual(r, { since: 0, midGame: false, end: true, lost: false, late: false, lateStart: false, off: false, sinceOff: -1, counted: 1 });
    noErrors(errors);
  } },
  { name: 'achievements: Weather-wise needs the evening-before warning and the night at home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await fresh(page);
    await at(page, 'home', 1, 600);
    const night = (where, warn) => page.evaluate(([where, warn]) => {
      S.stats.wxWise = 0; S.cur = 1; S.t = 1440 + 1000; S.phone = 100; S.phoneT = S.t; S.loc = 'home';
      S.week.storm = { day: 2, start: 2 * 1440 + 1000, end: 2 * 1440 + 1960 };
      if (warn) phoneInstall('weather'); else phoneUninstall('weather');
      if (S.ph && S.ph.wx) { S.ph.wx.eve = -1; S.ph.wx.warn = -1; }
      S.t = 1440 + 1100; processTimed();
      const warned = !!(S.ph.wx && S.ph.wx.warn === 2);
      S.t = 1440 + 1300; endDay('home'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.cur = 2; S.t = 2 * 1440 + 1300; endDay(where); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      return { warned, wise: S.stats.wxWise || 0 };
    }, [where, warn]);
    assert.deepStrictEqual(await night('home', false), { warned: false, wise: 0 }, 'no app, no warning');
    assert.deepStrictEqual(await night('motel', true), { warned: true, wise: 0 }, 'warned, but not home for it');
    assert.deepStrictEqual(await night('home', true), { warned: true, wise: 1 });
    await page.evaluate(() => achCheck());
    assert.ok(await page.evaluate(() => !!achGot().weather_wise));
    noErrors(errors);
  } },
];
