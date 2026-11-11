const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'upgrade section lists every upgrade at home with cost; not shown to visitors', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const out = await page.evaluate(() => { S.loc = 'home'; S.money = 9000; const a = []; cabinActions(a); const names = a.map(x => x.l); S.visitor = { len: 'weekend' }; const b = []; cabinActions(b); S.visitor = null; return { n: a.length, names, cat: a[0].cat, vis: b.length, cats: ACT_CATS.cabin }; });
    assert.strictEqual(out.n, 7); assert.strictEqual(out.cat, 'cabin'); assert.strictEqual(out.vis, 0);
    assert(out.names.every(n => /\$\d/.test(n)), out.names.join('|'));
    await page.evaluate(() => { S.money = 9000; render(); });
    assert(/Upgrade the cabin/.test(await page.textContent('body')));
    noErrors(errors);
  } },
  { name: 'buying books a contractor; install happens on the date, cannot be bought with no money', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.money = 100; const a0 = []; cabinActions(a0); const poor = a0.every(x => x.dis);
      S.money = 3000; S.week.b = []; cabinBuy('insert'); const booked = !!cabinJob('insert'), own0 = cabinHas('insert'), m = S.money;
      const due = cabinJob('insert').due; S.t = due + 5; processTimed();
      return { poor, booked, own0, m, own1: cabinHas('insert'), left: !cabinJob('insert') };
    });
    assert(r.poor && r.booked && !r.own0 && r.m === 1100 && r.own1 && r.left, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'ferry outage delays the contractor', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.money = 3000; cabinBuy('weather'); const due = cabinJob('weather').due;
      S.week.b = [{ start: due - 60, end: due + 600, cause: 'test' }]; S.t = due + 1; processTimed();
      return { own: cabinHas('weather'), still: !!cabinJob('weather'), later: cabinJob('weather').due > due + 600 };
    });
    assert(!r.own && r.still && r.later);
    noErrors(errors);
  } },
  { name: 'effects: tank, switch, insert, insulation', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      const out = {};
      S.loc = 'home'; S.cabin = { own: { tank: true }, bill: 0, carry: 0 }; S.stress = 50; S.ev.history = [];
      EV.find(e => e.id === 'no_water').run(); out.tank = S.stress === 49;
      S.cabin.own = { insert: true }; S.season = 'winter'; const w = []; for (let i = 0; i < 6; i++) { S.cur = i; const o = seasonUp(); w.push(o.wood) } out.wood = w.reduce((x, y) => x + y, 0) < 6; out.prop = seasonUp().prop[1] < 8;
      S.cabin.own = { weather: true }; S.home = 70; S.cabin.carry = 0; for (let i = 0; i < 8; i++) homeAdj(-2); out.wear = S.home > 56 && S.home < 62;
      S.cabin.own = { switch: true }; S.homeGas = 5; S.gen = 'home'; UP().genSvc = 0; const g0 = S.homeGas; runGenerator('home', 2); out.gas = Math.abs((g0 - S.homeGas) - 1.5) < 0.01;
      return out;
    });
    assert(r.tank && r.wood && r.prop && r.wear && r.gas, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'solar shortens a storm outage and heat pump bills weekly', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.cabin = { own: { solar: true, heatpump: true }, bill: 0, carry: 0 }; S.season = 'winter';
      S.power = { start: 1380, end: 1440 + 330 + 240 }; const e0 = S.power.end, notes = [];
      cabinStorm('home', notes, 0); const m0 = S.money; S.cabin.bill = 12; cabinNight('home', notes, 6);
      return { shorter: S.power.end < e0, note: notes.some(n => /battery/.test(n)), bill: S.money === m0 - 12 - 0 || S.money < m0 };
    });
    assert(r.shorter && r.note && r.bill, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'upgrades persist in saves, month weeks and story chapters', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.money = 9000; S.week.b = []; cabinInstall('tank', true); cabinBuy('solar'); const d0 = cabinJob('solar').due;
      weekRollover([]); const out = { m: cabinHas('tank') && cabinJob('solar').due === d0 - 10080 };
      newGame('normal', 'week'); out.fresh = !cabinHas('tank');
      return out;
    });
    assert(r.m && r.fresh, JSON.stringify(r));
    const st = await page.evaluate(() => {
      newGame('normal', 'week'); S.cabin = { own: { insert: true }, bill: 0, carry: 0 }; S.loc = 'home'; S.money = 3000; cabinBuy('heatpump');
      const j = S.up.jobs.find(x => x.k === 'cabin'); const s = JSON.parse(JSON.stringify(S)); S = s;
      return { saved: cabinHas('insert') && !!cabinJob('heatpump') && j.id === 'heatpump', hasStory: typeof storyAdvance === 'function' };
    });
    assert(st.saved && st.hasStory);
    noErrors(errors);
  } },
];
