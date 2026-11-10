const { open, newGame, noErrors, assert } = require('./helpers');

// put the player at home on a given day/time with no modals in the way
const atHome = (page, d = 1, m = 600) => page.evaluate(([d, m]) => {
  S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; S.loc = 'home'; S.cars[0].loc = 'home'; MQ = [];
  document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [d, m]);
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });

module.exports = [
  { name: 'bills: show at home and in To-do, pay online from the fold-out', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 1, 600);
    const r = await page.evaluate(() => ({ open: hhOpenBills(), hh: !!S.hh, todo: todoItems().filter(x => /bill$/.test(x.l)).map(x => x.l) }));
    assert.ok(r.hh, 'new game has S.hh');
    assert.deepStrictEqual(r.open.sort(), ['elec', 'ins', 'net', 'phone']);
    assert.strictEqual(r.todo.length, 4, 'four bills in To-do: ' + r.todo);
    await page.click('details.upk:has(summary:text("🏠")) > summary');
    const btn = page.locator('details.upk button.act', { hasText: 'Pay bills (4)' });
    assert.ok(await btn.evaluate(b => b.classList.contains('due')), 'phone bill due tomorrow marks Pay bills as due');
    await btn.click();
    const m0 = await page.evaluate(() => S.money);
    await page.locator('#mbg button.act', { hasText: 'Pay them all online' }).click();
    const after = await page.evaluate(() => ({ money: S.money, open: hhOpenBills().length, paid: Object.keys(HH_BILLS).every(k => HB(k).paid), todoOk: todoItems().filter(x => /bill$/.test(x.l)).every(x => x.ok) }));
    assert.strictEqual(after.open, 0);
    assert.ok(after.paid && after.todoOk);
    assert.strictEqual(Math.round(m0 - after.money), 118 + 69 + 55 + 84);
    noErrors(errors);
  } },
  { name: 'bills: late fee and stress, disconnect notice, collections after two weeks', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      HH().bills = {}; for (const k of ['net', 'phone', 'ins']) HB(k).paid = true; const due = hhDue('elec'); S.weekNo = Math.floor(due / 7); S.cur = due % 7; S.stress = 20;
      const notes = []; hhBillsNight(notes, due);
      const fee = HB('elec').fees, stress = S.stress, owed = hhOwed('elec'), late1 = notes.join(' ');
      for (let i = 1; i < 6; i++) hhBillsNight([], due + i);
      const n7 = []; S.stress = 20; hhBillsNight(n7, due + 6);
      for (let i = 7; i < 13; i++) hhBillsNight([], due + i);
      const m0 = S.money, n14 = []; hhBillsNight(n14, due + 13);
      return { fee, stress, owed, late1, n7: n7.join(' '), paid: HB('elec').paid, how: HB('elec').how, charged: Math.round(m0 - S.money), n14: n14.join(' ') };
    });
    assert.strictEqual(r.fee, 15);
    assert.ok(r.stress > 20, 'late bill adds stress');
    assert.strictEqual(r.owed, await page.evaluate(() => hhAmt('elec')) + 15);
    assert.match(r.late1, /late fee/);
    assert.match(r.n7, /DISCONNECT NOTICE/);
    assert.ok(r.paid && r.how === 'collections');
    assert.strictEqual(r.charged, r.owed + 60);
    assert.match(r.n14, /reconnect fee/);
    noErrors(errors);
  } },
  { name: 'bills: a mailed check arrives in two days; mailed too late still costs a fee', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.cur = 0; S.t = 600; hhPay('ins', 'mail');                       // ins due Wed (2): arrives in time
      S.cur = 3; S.t = 3 * 1440 + 600; hhPay('net', 'mail');            // net due Fri (4): arrives Sat, late
      const m0 = S.money; const notes = [];
      for (let d = 0; d <= 5; d++) { S.cur = d; hhBillsNight(d === 4 ? notes : [], d) }
      return { ins: HB('ins'), net: HB('net'), fee: Math.round(m0 - S.money), notes: notes.join(' ') };
    });
    assert.ok(r.ins.paid && r.ins.late === 0, 'on-time check');
    assert.ok(r.net.paid && r.net.late === 1, 'late check: ' + JSON.stringify(r.net));
    assert.ok(r.fee >= 10, 'late fee charged to the card');
    assert.match(r.notes, /still in the mail/);
    noErrors(errors);
  } },
  { name: 'bills: unpaid bills are settled at the end of the game', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { const m0 = S.money; HB('elec').fees = 15; S.cur = 6; S.t = 6 * 1440 + 1300; finish(); return { d: Math.round(m0 - S.money), over: S.over }; });
    assert.ok(r.over);
    assert.strictEqual(r.d, 118 + 15 + 69 + 55 + 84);
    noErrors(errors);
  } },
  { name: 'mail: USPS brings statements and letters to your mailbox at home after 1 PM', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { DELIVERY_WRONG = 0; const H = HH(); H.box = []; for (let d = 0; d < 4; d++) hhMailNight(d, d); H.box.push({ k: 'seeds', at: 4 }, { k: 'jury', at: 4 }); });
    const box = await page.evaluate(() => HH().box.map(x => x.k));
    assert.ok(box.includes('bill'), 'bill statements: ' + box);
    await page.evaluate(() => { S.cur = 4; S.t = 4 * 1440 + 700; S.loc = 'home'; tab = 'act'; render(); });
    assert.ok(!(await page.evaluate(() => hhMailHere().some(x => x.k === 'seeds'))), 'today’s mail isn’t here before 1 PM');
    await page.evaluate(() => { S.t = 4 * 1440 + 800; render(); });
    const n = await page.evaluate(() => hhMailHere().length);
    await page.evaluate(() => { const a = actions().find(a => /^Check the mailbox/.test(a.l)); a.fn(); });
    const m = await page.textContent('#mbg');
    assert.ok(n >= 3);
    assert.match(m, /seed catalog/);
    assert.match(m, /jury summons/);
    assert.match(m, /A statement from/);
    assert.strictEqual(await page.evaluate(() => hhMailHere().length), 0, 'box emptied');
    assert.strictEqual(await page.evaluate(() => actions().some(a => /P\.O\. box/.test(a.l))), false, 'no P.O. box anywhere');
    noErrors(errors);
  } },
  { name: 'mail: 1 in 10 pieces goes to the wrong mailbox', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { const H = HH(); H.box = []; H.missing = [];
      DELIVERY_WRONG = 1; for (let d = 0; d < 4; d++) hhMailNight(d, d); const all = { box: H.box.length, miss: H.missing.filter(x => x.kind === 'mail').length };
      DELIVERY_WRONG = 0.1; H.box = []; H.missing = []; let n = 0; for (let i = 0; i < 400; i++) { H.box.push({ k: 'flyer', at: 100 + i }); hhMailNight(99 + i, 0); n++; }
      return { all, rate: H.missing.length / n }; });
    assert.strictEqual(r.all.box, 0); assert.ok(r.all.miss >= 1);
    assert.ok(r.rate > 0.04 && r.rate < 0.17, 'about 10%: ' + r.rate);
    noErrors(errors);
  } },
  { name: 'packages: hold at the Steilacoom pickup counter', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 1, 1100);
    await page.evaluate(() => { UP().trapsOwned = false; hhShopModal(); });
    await page.locator('#mbg button.act', { hasText: 'Mouse traps' }).click();
    await page.locator('#mbg button.act', { hasText: 'Steilacoom pickup counter' }).click();
    assert.deepStrictEqual(await page.evaluate(() => HH().pkgs.map(p => [p.k, p.via])), [['traps', 'counter']]);
    // not there yet the next day
    await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 900; S.loc = 'stDock'; render(); });
    assert.strictEqual(await page.locator('.content button.act', { hasText: 'shipping counter' }).count(), 0);
    await page.evaluate(() => { S.cur = 3; S.t = 3 * 1440 + 900; render(); });
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Pick up your packages')));
    await page.locator('.content button.act', { hasText: 'Pick up 1 package' }).click();
    assert.deepStrictEqual(await page.evaluate(() => [UP().trapsOwned, HH().pkgs.length]), [true, 0]);
    noErrors(errors);
  } },
  { name: 'packages: UPS to the porch on a weekday; FedEx skips Sunday; wrong address goes missing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 1, 1100);
    await page.evaluate(() => { DELIVERY_WRONG = 0; UP().trapsOwned = false; S.money = 500; hhShopModal(); });
    await page.locator('#mbg button.act', { hasText: 'Mouse traps' }).click();
    await page.locator('#mbg button.act', { hasText: 'UPS Ground' }).click();
    const p = await page.evaluate(() => HH().pkgs[0]);
    assert.strictEqual(p.via, 'ups'); assert.strictEqual(p.at % 7, 3, 'Tuesday + 2 days = Thursday');
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Packages on the way')));
    await page.evaluate(() => { S.cur = 3; S.t = 3 * 1440 + 900; render(); });
    assert.strictEqual(await page.evaluate(() => hhPorch().length), 0, 'not before 4 PM');
    await page.evaluate(() => { S.t = 3 * 1440 + 970; render(); });
    await page.evaluate(() => actions().find(a => a.l === 'Bring in 1 package from the porch').fn());
    assert.deepStrictEqual(await page.evaluate(() => [UP().trapsOwned, HH().pkgs.length]), [true, 0]);
    // ordered Fri/Sat: nobody delivers Sunday, UPS not Saturday either, so all three land Monday
    const at = await page.evaluate(() => [hhArrive('fedex', 5), hhArrive('ups', 4), hhArrive('usps', 4)].map(x => x % 7));
    assert.deepStrictEqual(at, [0, 0, 0]); assert.strictEqual(await page.evaluate(() => hhArrive('usps', 2) % 7), 5, 'USPS does Saturdays');
    // wrong address
    const w = await page.evaluate(() => { const H = HH(); H.missing = []; H.pkgs = [{ k: 'bank', at: 3, via: 'fedex', w: true, st: 'transit' }]; S.log = []; render();
      return { pk: H.pkgs.length, miss: H.missing.map(x => [x.kind, x.k, x.via]), log: S.log.map(l => l.s).join(' '), bank: H.bank }; });
    assert.strictEqual(w.pk, 0); assert.deepStrictEqual(w.miss, [['pkg', 'bank', 'fedex']]); assert.match(w.log, /wrong house/); assert.strictEqual(w.bank, false);
    noErrors(errors);
  } },
  { name: 'trash: dump run on an open day; too much trash brings raccoons', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    // Tuesday: transfer station closed
    await atHome(page, 1, 600);
    await page.evaluate(() => { HH().trash = 7; render(); });
    assert.ok(await page.evaluate(() => actions().find(a => /Dump run/.test(a.l)).dis), 'closed on Tuesday');
    // Wednesday 10 AM: open
    await atHome(page, 2, 600);
    const r = await page.evaluate(() => { const a = actions().find(a => /Dump run/.test(a.l)); const f0 = S.cars[0].fuel, m0 = S.money; a.fn(); return { due: a.due, dis: !!a.dis, trash: HH().trash, fuel: f0 - S.cars[0].fuel, paid: m0 - S.money }; });
    assert.ok(r.due && !r.dis);
    assert.strictEqual(r.trash, 0);
    assert.ok(r.fuel > 0.5 && r.paid > 0);
    // raccoons
    const rc = await page.evaluate(() => { HH().trash = 12; S.home = 60; S.stress = 20; S.ev.force = ['raccoons']; const notes = []; fireHook('night', { where: 'home', notes }); return { home: S.home, stress: S.stress, notes: notes.join(' ') }; });
    assert.match(rc.notes, /Raccoons/);
    assert.ok(rc.home <= 54 && rc.stress >= 25, JSON.stringify(rc));
    // no reputation loss, but an hour of cleanup first thing next morning (and only at home)
    const mc = await page.evaluate(() => { const r0 = S.rep; S.cur = day() + 1; S.t = S.cur * 1440 + 360; S.loc = 'home'; S.log = []; startDay();
      return { rep: S.rep - r0, t: tod(), log: S.log.map(l => l.s).join(' '), again: (() => { const t = S.t; startDay(); return S.t - t; })() }; });
    assert.strictEqual(mc.rep, 0, 'raccoons are not your fault');
    assert.strictEqual(mc.t, 420, 'an hour of cleanup: 6:00 → 7:00');
    assert.match(mc.log, /an hour in rubber gloves/);
    assert.strictEqual(mc.again, 0, 'only once');
    // trash builds up overnight at home and costs a little Home when it piles up
    const n = await page.evaluate(() => { HH().trash = 8; S.home = 60; const notes = []; hhNight('home', notes, 2); return { trash: HH().trash, home: S.home }; });
    assert.deepStrictEqual(n, { trash: 9, home: 59 });
    noErrors(errors);
  } },
  { name: 'dog: adopt, care brings companionship, neglect costs Home and stress', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 1, 1000);
    // the litter event puts an adopt action in the house fold-out
    await page.evaluate(() => { S.cur = 3; S.t = 3 * 1440 + 400; const e = EV.find(x => x.id === 'puppy_litter'); if (e.cond({})) e.run({}); render(); });
    assert.ok(await page.evaluate(() => HH().puppy >= dayKey()));
    await page.evaluate(() => actions().find(a => /Adopt one of the neighbors/.test(a.l)).fn());
    const dog = await page.evaluate(() => { for (const k in HH_BILLS) HB(k).paid = true; return HH().dog; });
    assert.ok(dog && dog.n && dog.kibble === 10);
    // a good day: fed, walked
    const good = await page.evaluate(() => { S.cur = 4; S.t = 4 * 1440 + 900; actions().find(a => /^Feed /.test(a.l)).fn(); actions().find(a => /^Walk /.test(a.l)).fn();
      S.stress = 30; S.home = 60; hhNight('home', [], 4); return { stress: S.stress, home: S.home, kibble: HH().dog.kibble }; });
    assert.ok(good.stress < 30, 'companionship lowers stress: ' + JSON.stringify(good));
    assert.strictEqual(good.kibble, 9);
    // a bad day: neither
    const bad = await page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 900; S.stress = 30; S.home = 60; const notes = []; hhNight('home', notes, 5); return { stress: S.stress, home: S.home, notes: notes.join(' ') }; });
    assert.ok(bad.stress > 30 && bad.home < 59, 'neglect: ' + JSON.stringify(bad));
    assert.match(bad.notes, /didn’t get dinner/);
    // a walk at the lake counts
    await page.evaluate(() => { S.loc = 'lake'; render(); });
    await page.locator('.content button.act', { hasText: 'around Lake Josephine' }).click();
    assert.ok(await page.evaluate(() => HH().dog.walked === dayKey()));
    noErrors(errors);
  } },
  { name: 'dog: ignoring it is free if you never adopt', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { S.stress = 30; S.home = 60; HH().trash = 0; HH().bills = {}; S.cur = 0; hhNight('home', [], 0); return [S.stress, S.home, actions().some(a => /Feed|Walk /.test(a.l))]; });
    assert.deepStrictEqual(r, [30, 60, false]);
    noErrors(errors);
  } },
  { name: 'cooking: a real dinner and a batch cook on a day off', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 1, 600);
    assert.ok(await page.evaluate(() => actions().find(a => /Cook a real dinner/.test(a.l)).dis), 'not at 10 AM');
    await atHome(page, 1, 1080);
    const r = await page.evaluate(() => { S.pantry = 2; S.health = 70; S.stress = 30; const p0 = S.pantry; actions().find(a => a.l === 'Cook a real dinner').fn(); return { h: S.health, s: S.stress, p: S.pantry - p0, again: actions().find(a => /Cooked a real dinner ✓/.test(a.l)).dis }; });
    assert.deepStrictEqual(r, { h: 72, s: 26, p: 0, again: true });
    // batch cook: Saturday is a day off for the Lakewood job
    await atHome(page, 5, 600);
    const b = await page.evaluate(() => { S.pantry = 4; const t0 = S.t; actions().find(a => a.l === 'Batch-cook for the week').fn(); const out = { pantry: S.pantry, batch: HH().batch, min: S.t - t0 };
      for (const k in HH_BILLS) HB(k).paid = true; S.health = 70; S.stress = 30; hhNight('home', [], 5); out.h = S.health; out.s = S.stress; out.left = HH().batch; return out; });
    assert.deepStrictEqual(b, { pantry: 5, batch: 5, min: 120, h: 71, s: 29, left: 4 });
    assert.ok(await page.evaluate(() => { S.cur = 1; S.t = 1440 + 600; return !actions().some(a => /Batch-cook/.test(a.l)); }), 'no batch cooking on a workday');
    noErrors(errors);
  } },
  { name: 'storm prep: water jugs, power bank and generator each soften the storm', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 2, 600);
    await page.evaluate(() => { S.week.storm = { day: 2, start: 2 * 1440 + 960, end: 2 * 1440 + 960 + 960 }; render(); });
    const labels = await page.evaluate(() => actions().filter(a => a.cat === 'home' || a.cat === 'yard').map(a => a.l));
    assert.ok(labels.includes('Fill water jugs and the bathtub'));
    assert.ok(labels.includes('Charge the power bank'));
    assert.ok(!labels.includes('Top off and test the generator'), 'no generator, no top-off');
    let todo = await page.evaluate(() => todoItems().find(x => x.l === 'Be ready for the storm').s);
    assert.match(todo, /Storm prep: 💧 water — · 🔋 power bank \(none\)/);
    // water jugs: the morning with no well pump is easy
    const w = await page.evaluate(() => { const e = EV.find(x => x.id === 'no_water'); S.stress = 30; e.run({}); const without = S.stress;
      actions().find(a => /Fill water jugs/.test(a.l)).fn(); S.stress = 30; e.run({}); return { without, with: S.stress, left: HH().water }; });
    assert.deepStrictEqual(w, { without: 35, with: 29, left: false });
    // power bank: phone survives the storm night
    const ph = await page.evaluate(() => { HH().bank = true; HH().water = true; actions().find(a => /Charge the power bank/.test(a.l)).fn();
      return todoItems().find(x => x.l === 'Be ready for the storm').s; });
    assert.match(ph, /💧 water ✓ · 🔋 power bank ✓/);
    await page.evaluate(() => { S.phone = 3; S.alarm.phone.on = true; S.t = 2 * 1440 + 1300; endDay('home'); });
    await clearModals(page);
    assert.ok(await page.evaluate(() => S.cur === 3 && S.phone >= 90), 'phone charged by the power bank');
    noErrors(errors);
  } },
  { name: 'storm prep: no power bank means a dead phone; a topped-off generator starts', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await atHome(page, 2, 600);
    await page.evaluate(() => { S.week.storm = { day: 2, start: 2 * 1440 + 960, end: 2 * 1440 + 960 + 960 }; S.phone = 3; S.alarm.phone.on = true; S.t = 2 * 1440 + 1300; endDay('home'); });
    await clearModals(page);
    assert.ok(await page.evaluate(() => S.phone <= 3), 'phone not charged without power');
    // generator: badly overdue for service, but topped off and tested before the storm
    await atHome(page, 3, 600);
    const g = await page.evaluate(() => { S.week.storm = { day: 3, start: 3 * 1440 + 960, end: 3 * 1440 + 960 + 960 }; S.gen = 'home'; S.homeGas = 10; UP().genSvc = 40;
      const a = actions().find(a => /Top off and test the generator/.test(a.l)); const due = a.due; a.fn(); S.t = 3 * 1440 + 1300; endDay('home'); return { due, ran: S.ev.flags.genRan, gas: S.homeGas }; });
    assert.ok(g.due);
    assert.strictEqual(g.ran, 3, 'generator ran on the storm night');
    assert.strictEqual(g.gas, 7);
    noErrors(errors);
  } },
  { name: 'old save without S.hh loads and everything renders', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await page.evaluate(() => saveGame());
    const ok = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('islandtime.save'));
      delete d.S.hh; d.app = '1.12.0';
      const r = migrate(d);
      if (!r.S.hh || !Array.isArray(r.S.hh.box) || typeof r.S.hh.trash !== 'number') return 'hh missing';
      adopt(r); S.loc = 'home';
      for (const k of ['act', 'ferry', 'todo', 'log']) setTab(k);
      const notes = []; hhNight('home', notes, 0);
      S.loc = 'store'; setTab('act'); S.loc = 'stDock'; setTab('act');
      return document.querySelector('.hud') ? 'ok' : 'no hud';
    });
    assert.strictEqual(ok, 'ok');
    noErrors(errors);
  } },
  { name: 'a full week of nights with everything ignored costs only a little', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { S.stress = 30; S.home = 70; const m0 = S.money; const notes = [];
      for (let d = 0; d < 7; d++) { S.cur = d; S.t = d * 1440 + 1300; hhNight('home', notes, d); }
      return { stress: S.stress - 30, home: 70 - S.home, money: Math.round(m0 - S.money) }; });
    assert.ok(r.stress <= 20, 'stress ' + r.stress);
    assert.ok(r.home <= 6, 'home ' + r.home);
    assert.ok(r.money <= 60, 'fees ' + r.money);
    noErrors(errors);
  } },
];
