const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'overtime: after a full shift only, time and a half, once a day, not for the Riv', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard', 'month');
    const r = await page.evaluate(() => {
      const ot = () => actions().find(a => /^Stay for overtime/.test(a.l));
      S.emp = 'lakewood'; S.loc = 'work'; S.t = 540; S.job = 70;
      const before = !!ot();
      // a half day doesn't qualify, even if you come back after 5
      actions().find(a => /^Work until/.test(a.l)).fn();
      S.t = 1020; const half = !!ot();
      // next day: full shift
      S.cur = 1; S.t = 1440 + 540; S.worked = {}; MQ = [];
      actions().find(a => /^Work a full shift/.test(a.l)).fn();
      const o = ot(); const m0 = S.money, s0 = S.stress, t0 = S.t;
      o.fn();
      const res = { before, half, label: o.l, pay: S.money - m0, stress: S.stress - s0, dt: S.t - t0, again: !!ot(),
        doneRow: !!actions().find(a => /^Overtime done/.test(a.l)), expected: Math.round(170 / 8 * 1.5 * 2) };
      // Riv main job: never overtime
      S.cur = 2; S.t = 2 * 1440 + 600; S.emp = 'riv'; S.loc = 'food'; S.worked = {};
      actions().find(a => /^Work a full shift/.test(a.l)).fn();
      res.riv = !!ot();
      return res;
    });
    assert.strictEqual(r.before, false, 'not before the shift');
    assert.strictEqual(r.half, false, 'not after a half day');
    assert.strictEqual(r.pay, r.expected, r.label);
    assert.ok(/\(2 h\)/.test(r.label), r.label);
    assert.strictEqual(r.stress, 10);
    assert.strictEqual(r.dt, 120);
    assert.strictEqual(r.again, false, 'max once a day');
    assert.ok(r.doneRow);
    assert.strictEqual(r.riv, false, 'no overtime for the Riv line cook');
    noErrors(errors);
  } },
  { name: 'second job: weekend evening shift at the Riv', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      const sh = () => actions().find(a => /^Work the weekend evening shift/.test(a.l));
      S.loc = 'food'; S.cur = 2; S.t = 2 * 1440 + 960; const wed = !!sh();
      S.cur = 5; S.t = 5 * 1440 + 800; const early = !!sh();
      S.t = 5 * 1440 + 930; S.rep = 0;
      const m0 = S.money, p0 = S.pantry, emp = S.emp, worked = JSON.stringify(S.worked), f0 = Object.keys(S.friends).length;
      sh().fn();
      const res = { wed, early, pay: S.money - m0, t: tod(), ate: S.ateOut === 5, rep: S.rep, emp: S.emp, worked: JSON.stringify(S.worked) === worked, again: !!sh(),
        friendsOk: Object.keys(S.friends).length >= f0 };
      // another shift the same week: no extra reputation
      S.cur = 4; S.t = 4 * 1440 + 960; S.eco.riv = -1; sh().fn(); res.rep2 = S.rep;
      // Riv as the main job: no second shift
      S.emp = 'riv'; S.cur = 5; S.t = 5 * 1440 + 930; S.eco.riv = -1; res.main = !!sh();
      // night: the staff meal spares the pantry
      return res;
    });
    assert.strictEqual(r.wed, false, 'Fri/Sat only');
    assert.strictEqual(r.early, false, 'evenings only');
    assert.ok(r.pay >= 58 && r.pay <= 98, 'pay + tips: ' + r.pay);
    assert.strictEqual(r.t, 1320, 'ends at 10 PM');
    assert.ok(r.ate, 'staff meal counts as dinner');
    assert.strictEqual(r.rep, 5);
    assert.strictEqual(r.rep2, 5, 'reputation once a week');
    assert.strictEqual(r.emp, 'lakewood', 'main job unchanged');
    assert.ok(r.worked, 'main-job attendance untouched');
    assert.strictEqual(r.again, false);
    assert.strictEqual(r.main, false);
    noErrors(errors);
  } },
  { name: 'firewood: sells a bundle once a day and keeps 4 nights', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const fw = () => actions().find(a => /firewood/i.test(a.l) && /bundle/i.test(a.l));
      S.loc = 'home'; S.t = 600; UP().wood = 4;
      const low = fw().dis;
      UP().wood = 6; const m0 = S.money; fw().fn();
      const res = { low, pay: S.money - m0, wood: UP().wood, again: fw().dis };
      S.cur = 1; S.t = 1440 + 600; fw().fn(); res.wood2 = UP().wood;
      S.cur = 2; S.t = 2 * 1440 + 600; res.guard = fw().dis; fw().fn(); res.wood3 = UP().wood;
      S.season = 'winter'; res.winter = woodPrice(); S.season = 'summer'; res.summer = woodPrice(); delete S.season;
      return res;
    });
    assert.strictEqual(r.low, true, 'can’t sell at 4 nights');
    assert.ok(r.pay >= 15 && r.pay <= 25, String(r.pay));
    assert.strictEqual(r.wood, 5);
    assert.strictEqual(r.again, true, 'once a day');
    assert.strictEqual(r.wood2, 4);
    assert.strictEqual(r.guard, true);
    assert.strictEqual(r.wood3, 4, 'never below 4 nights');
    assert.ok(r.winter > r.summer && r.winter <= 25 && r.summer >= 15, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'eggs: coop from Home Depot, feed, collect, sell a dozen', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const A = re => actions().find(a => re.test(a.l));
      S.loc = 'depot'; S.cur = 1; S.t = 1440 + 700; S.money = 500;
      A(/^Backyard coop/).fn();
      const res = { paid: 500 - S.money, booked: S.eco.coopBooked, hens0: S.eco.hens, again: !!A(/^Backyard coop/) };
      // delivery the next day (rides the ferry)
      S.week.b = []; S.t = 2 * 1440 + 700; S.cur = 2; processTimed();
      res.hens = S.eco.hens; res.feed = S.eco.feed;
      // lay for a few nights
      for (let i = 0; i < 6; i++) { const n = []; ecoNight('home', n); }
      res.feedAfter = S.eco.feed; res.nest = S.eco.nest;
      S.loc = 'home';
      A(/^Collect the eggs/).fn(); res.eggs = S.eco.eggs; res.nest2 = S.eco.nest;
      S.eco.eggs = 14; const m0 = S.money; A(/^Sell a dozen eggs/).fn();
      res.sale = S.money - m0; res.left = S.eco.eggs; res.sellAgain = A(/Sold a dozen today/).dis;
      // out of feed: no eggs, one note
      S.eco.feed = 0; S.eco.nest = 0; const n1 = [], n2 = []; ecoNight('home', n1); ecoNight('home', n2);
      res.strike = [n1.length, n2.length, S.eco.nest];
      S.loc = 'depot'; S.t = 3 * 1440 + 700; S.cur = 3; A(/^Chicken feed/).fn(); res.bag = S.eco.feed;
      return res;
    });
    assert.strictEqual(r.paid, 120);
    assert.strictEqual(r.booked, true);
    assert.strictEqual(r.hens0, 0, 'hens arrive on the ferry, not instantly');
    assert.strictEqual(r.again, false);
    assert.strictEqual(r.hens, 3);
    assert.strictEqual(r.feed, 14);
    assert.strictEqual(r.feedAfter, 8, 'feed is used up');
    assert.ok(r.nest > 0 && r.nest <= 12, String(r.nest));
    assert.strictEqual(r.nest2, 0);
    assert.strictEqual(r.eggs, r.nest);
    assert.strictEqual(r.sale, 6);
    assert.strictEqual(r.left, 2);
    assert.strictEqual(r.sellAgain, true, 'one dozen a day');
    assert.deepStrictEqual(r.strike, [1, 0, 0]);
    assert.strictEqual(r.bag, 20);
    noErrors(errors);
  } },
  { name: 'eggs: Sam (close friend) gives you hens', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.t = 700;
      const none = !actions().some(a => /Sam for a few of his hens/.test(a.l));
      S.friends.sam = { name: 'Sam, from next door', how: 'test', day: 0, lvl: 3, pts: 6 };
      const a = actions().find(a => /Sam for a few of his hens/.test(a.l)); const m0 = S.money; a.fn();
      return { none, cost: m0 - S.money, hens: S.eco.hens };
    });
    assert.deepStrictEqual(r, { none: true, cost: 40, hens: 3 });
    noErrors(errors);
  } },
  { name: 'reputation unlocks at +20, +35 and +60 (narrated once)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const A = re => actions().find(a => re.test(a.l || ''));
      const res = {};
      S.rep = 15; afterAction(); res.r2 = Object.keys(S.eco.perks).length;
      // rep 3: Gus first call, next day, never a no-show
      S.rep = 20; afterAction(); afterAction();
      res.r3msgs = S.log.filter(e => /first call/.test(e.s)).length;
      S.loc = 'home'; S.t = 600; S.money = 500;
      gusModal(); const body = document.querySelector('#mbg').textContent; res.gusModal = /First call/.test(body);
      MBTN(0); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const j = UP().jobs.find(j => j.k === 'gus'); res.gusSure = !!j.sure; res.gusDay = Math.floor(j.due / 1440);
      const orig = Math.random; Math.random = () => 0.01; // would always flake without first call
      S.t = j.due; S.cur = Math.floor(j.due / 1440); processTimed(); Math.random = orig;
      res.gusCame = !!S.friends.gus && !UP().jobs.some(j => j.k === 'gus');
      // rep 5: the co-op board, once a week
      S.loc = 'store'; S.t = S.cur * 1440 + 700; res.board4 = !!A(/co-op board/);
      S.rep = 35; afterAction(); res.r5 = !!S.eco.perks[35];
      UP().wood = 8; A(/^Post on the co-op board/).fn();
      res.boardAgain = A(/board post|Posted on the board/).dis;
      const bj = UP().jobs.find(j => j.k === 'board'); const m0 = S.money; S.t = bj.due; processTimed();
      res.boardSold = S.money - m0; res.woodLeft = UP().wood;
      // rep 8: island regular
      S.loc = 'food'; S.t = S.cur * 1440 + 720; res.take27 = /\$27/.test(A(/^Takeout/).l);
      S.rep = 60; afterAction(); res.r8 = !!S.eco.perks[60];
      res.take20 = A(/^Takeout/).l; const m1 = S.money; A(/^Takeout/).fn(); res.takePaid = m1 - S.money;
      S.loc = 'aiDock'; S.t = S.cur * 1440 + 800; const s0 = S.stress = 50; A(/^Free coffee/).fn(); res.coffee = s0 - S.stress; res.coffeeAgain = A(/coffee/).dis;
      // shown in the To-do tab and the Island Group app
      setTab('todo'); res.todo = document.querySelector('.content').textContent;
      res.app = phoneApp('group').view();
      res.unlockMsgs = S.log.filter(e => /Island regular/.test(e.s)).length;
      return res;
    });
    assert.strictEqual(r.r2, 0);
    assert.strictEqual(r.r3msgs, 1, 'narrated once');
    assert.ok(r.gusModal, 'modal mentions first call');
    assert.ok(r.gusSure);
    assert.strictEqual(r.gusDay, 1, 'next day');
    assert.ok(r.gusCame, 'never a no-show');
    assert.strictEqual(r.board4, false, 'board locked below +35');
    assert.ok(r.r5);
    assert.strictEqual(r.boardAgain, true, 'once a week');
    assert.strictEqual(r.boardSold, 3 * (woodPriceFor('fall') + 5));
    assert.strictEqual(r.woodLeft, 5);
    assert.ok(r.take27);
    assert.ok(r.r8);
    assert.ok(/\$20/.test(r.take20), r.take20);
    assert.strictEqual(r.takePaid, 20);
    assert.strictEqual(r.coffee, 4);
    assert.strictEqual(r.coffeeAgain, true);
    assert.ok(/Island reputation: .*Island regular · \+60/.test(r.todo) && /First call on Gus/.test(r.todo) && /Island regular/.test(r.todo), 'to-do tab');
    assert.ok(/What your reputation gets you/.test(r.app) && /✅/.test(r.app), 'Island Group app');
    assert.strictEqual(r.unlockMsgs, 1);
    noErrors(errors);
  } },
  { name: 'old save without economy fields loads and plays', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.t = 600; actions(); saveGame();
      const d = JSON.parse(localStorage.getItem('islandtime.save'));
      delete d.S.eco; delete d.S.rep; d.app = '1.12.0';
      const m = migrate(d); adopt(m); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      for (const k of ['act', 'ferry', 'todo', 'log']) setTab(k);
      const n = []; upkeepNight('home', n, day());
      S.loc = 'food'; S.cur = 5; S.t = 5 * 1440 + 930; render();
      const sh = actions().find(a => /weekend evening shift/.test(a.l)); sh.fn();
      phoneApp('group').view();
      return { eco: typeof S.eco, hud: !!document.querySelector('.hud') };
    });
    assert.deepStrictEqual(r, { eco: 'object', hud: true });
    noErrors(errors);
  } },
];
const woodPriceFor = s => ({ winter: 24, summer: 15 })[s] ?? 19;
