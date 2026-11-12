const { open, noErrors, reload, assert } = require('./helpers');

// 🧳 visitor mode core (src/js/36-visitor.js): starting a visit, the budget, the rental cabin, the end of the visit, saves
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
const visit = (page, len, home = 'tacoma', diff = 'normal') => page.evaluate(([l, h, d]) => {
  visitorNew(l, h, d); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [len, home, diff]);
const pick = async (page, re) => { for (const x of await page.$$('#mbg .act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
const actLabels = page => page.evaluate(() => actions().map(a => a.l));
// the resident's life that must not show up in a visit
const RESIDENT = /^Work:|Find a job|Interview|Doctor|prescription|Pay rent|bill|House & yard|Keep the house|dump run|Check your mail|Take care of|Bring in your packages/i;

module.exports = [
  { name: 'title button → length → home → difficulty starts a visit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    assert.strictEqual(await page.$('#visitBtn'), null, 'Visit is one of the new-game modes now');
    await page.evaluate(() => newGameModal()); await page.click('#mbg >> text=Visit the island');
    assert.match(await page.textContent('#mbg'), /How long is your visit/);
    await pick(page, /Weekend/);
    assert.match(await page.textContent('#mbg'), /Where do you live/);
    await pick(page, /Seattle/);
    await pick(page, /Normal/);
    assert.match(await page.textContent('#mbg'), /Your visit: .*Weekend/);
    const r = await page.evaluate(() => ({ on: visitorOn(), len: VS().len, home: VS().home, diff: S.diff, tips: (S.tips || {}).seen }));
    assert.ok(r.on); assert.strictEqual(r.len, 'weekend'); assert.strictEqual(r.home, 'seattle'); assert.strictEqual(r.diff, 'normal');
    await clearModals(page);
    assert.match(await page.textContent('.hud-sub'), /Weekend · day 1 of 3/);
    assert.match(await page.textContent('.hud'), /Budget/);
    noErrors(errors);
  }},
  { name: 'each length starts on the right day, place and budget, with the rental paid', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const start = await page.evaluate(() => typeof L.vhome !== 'undefined' ? 'vhome' : 'stDock');
    const want = { day: [5, 150, 0, 5], weekend: [4, 660, 410, 6], week: [0, 1770, 1110, 6] };
    for (const len of ['day', 'weekend', 'week']) {
      await visit(page, len);
      const r = await page.evaluate(() => ({ cur: S.cur, t: S.t, loc: S.loc, money: S.money, V: VS(), car: S.cars[0], mode: S.mode, emp: S.emp, over: S.over, tod: tod(), name: L.home.name }));
      const [d, budget, rent, last] = want[len];
      assert.strictEqual(r.cur, d, len + ' day'); assert.strictEqual(r.loc, start); assert.strictEqual(r.car.loc, start);
      assert.strictEqual(r.V.budget, budget); assert.strictEqual(r.V.rentalCost, rent); assert.strictEqual(r.money, budget - rent);
      assert.strictEqual(r.V.last, last); assert.strictEqual(r.mode, 'week'); assert.strictEqual(r.emp, null); assert.ok(!r.over);
      assert.ok(r.tod >= 360 && r.tod <= 1080, len + ' time ' + r.tod);
      assert.strictEqual(r.name, 'Rental cabin');
      if (len === 'day') assert.strictEqual(r.V.rental.in, null); else assert.strictEqual(r.V.rental.in, d * 1440 + 900);
    }
    // difficulty scales the spending money a little (the cabin costs what it costs): $250 × 0.85 + $410
    await visit(page, 'weekend', 'olympia', 'hard');
    assert.strictEqual(await page.evaluate(() => VS().budget), 623);
    noErrors(errors);
  }},
  { name: 'no job, rent, bills, prescription, appointment or house chores in a visit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page, 'week', 'tacoma', 'hard');   // Ferry Hell has weekly rent for residents
    const todo = await page.evaluate(() => todoItems().map(x => x.l));
    for (const l of todo) assert.ok(!RESIDENT.test(l), 'resident to-do: ' + l);
    assert.ok(todo.includes('Get to the island')); assert.ok(todo.includes('Stay on budget'));
    assert.ok(todo.some(l => /Catch the last boat home: Sunday/.test(l)));
    for (const loc of ['stDock', 'pharmacy', 'clinic', 'work', 'food', 'store']) {
      const ls = await page.evaluate(l => { S.loc = l; S.t = S.cur * 1440 + 720; return actions().map(a => a.l); }, loc);
      for (const l of ls) assert.ok(!/job|rent|prescription|appointment|shift|Pay bills/i.test(l), loc + ': ' + l);
    }
    assert.ok(!(await page.evaluate(() => S.log.some(e => /Rent/.test(e.s)))));
    // a night: no missed work, no prescription, the cabin doesn't wear
    const night = await page.evaluate(() => {
      MQ = []; S.loc = 'home'; S.t = S.cur * 1440 + 1300; vCheckIn(); endDay('home');
      return { txt: document.getElementById('mbg').textContent, home: S.home, cur: S.cur, health: S.health, over: S.over };
    });
    assert.ok(!/missed work|prescription|chores|firewood|bill/i.test(night.txt), night.txt);
    assert.strictEqual(night.home, 70); assert.strictEqual(night.cur, 1); assert.ok(!night.over);
    // at the cabin: bed, alarm and rest, no upkeep
    await clearModals(page);
    const home = await actLabels(page);
    assert.ok(home.some(l => /Go to bed|Turn in early/.test(l)));
    assert.ok(!home.some(l => /dishes|laundry|firewood|gutters|Deep clean|mailbox|Dump run|Order something/i.test(l)), home.join('|'));
    noErrors(errors);
  }},
  { name: 'rental: check-in from 3 PM, house rules, check-out and the late fee', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page, 'weekend');
    // before 3 PM on Friday the door is locked
    let ls = await page.evaluate(() => { S.loc = 'home'; S.t = 4 * 1440 + 800; return actions().map(a => a.l); });
    assert.ok(ls.some(l => /Check-in opens at 3:00 PM/.test(l)), ls.join('|'));
    assert.ok(!ls.some(l => /Go to bed/.test(l)));
    await page.evaluate(() => { const a = actions().find(a => /Wait on the porch/.test(a.l)); a.fn(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    let r = await page.evaluate(() => ({ R: VS().rental, t: S.t, pantry: S.pantry, texts: VS().texts.length }));
    assert.ok(r.R.checkedIn); assert.strictEqual(r.t, 4 * 1440 + 900); assert.strictEqual(r.pantry, 1); assert.strictEqual(r.texts, 1);
    // a fire pit after 10 PM breaks quiet hours
    r = await page.evaluate(() => { S.t = 4 * 1440 + 1340; actions().find(a => /Fire pit/.test(a.l)).fn(); return { rules: VS().rules, rep: VS().rep }; });
    assert.deepStrictEqual(r.rules, { quiet: 1 }); assert.strictEqual(r.rep, -5);
    // Sunday 11:30 AM, still in the cabin: the late fee
    r = await page.evaluate(() => { MQ = []; S.cur = 6; S.t = 6 * 1440 + 690; S.loc = 'home'; const m = S.money; afterAction(); return { fee: m - S.money, late: VS().rental.late, txt: VS().texts.slice(-1)[0].x }; });
    assert.strictEqual(r.fee, 50); assert.ok(r.late); assert.match(r.txt, /late check-out fee/);
    // check out (with the trash): no second fee
    r = await page.evaluate(() => { const m = S.money; actions().find(a => /Check out and take the trash/.test(a.l)).fn(); return { fee: m - S.money, R: VS().rental, rules: VS().rules }; });
    assert.strictEqual(r.fee, 0); assert.ok(r.R.checkedOut); assert.ok(r.R.trash); assert.ok(!r.rules.trash);
    // on time, without the trash: no fee, a broken rule
    await visit(page, 'weekend');
    r = await page.evaluate(() => { const R = VS().rental; S.loc = 'home'; S.t = R.in; vCheckIn(); S.cur = 6; S.t = 6 * 1440 + 540; const m = S.money;
      actions().find(a => /Check out, leave the trash/.test(a.l)).fn(); return { fee: m - S.money, R: VS().rental, rules: VS().rules, rep: VS().rep }; });
    assert.strictEqual(r.fee, 0); assert.ok(!r.R.late); assert.deepStrictEqual(r.rules, { trash: 1 }); assert.strictEqual(r.rep, -3);
    // a day trip has no cabin
    await visit(page, 'day');
    ls = await page.evaluate(() => { S.loc = 'home'; S.t = 5 * 1440 + 960; return actions().map(a => a.l); });
    assert.deepStrictEqual(ls, ['Not your cabin today']);
    noErrors(errors);
  }},
  { name: 'end of visit: made it home on the ferry vs. missed the last boat', fn: async ctx => {
    const { page, errors } = await open(ctx);
    // a day trip: over on the morning boat, back on an evening boat
    await visit(page, 'day');
    await page.evaluate(() => { S.loc = 'aiDock'; S.t = 5 * 1440 + 1080; afterAction(); });
    assert.ok(await page.evaluate(() => VS().islandAt != null && !S.over));
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); waitFerry('walk'); });
    for (let i = 0; i < 20 && await page.evaluate(() => !S.over); i++) {
      await page.evaluate(() => { const c = document.querySelector('.cross'); if (c) c.click(); const m = document.getElementById('mbg'); if (m) { const b = m.querySelector('button.act'); b && b.click(); } });
      await page.waitForTimeout(100);
    }
    let r = await page.evaluate(() => ({ over: S.over, res: VS().result, loc: S.loc, end: document.querySelector('.end') && document.querySelector('.end').textContent }));
    assert.ok(r.over); assert.strictEqual(r.res, 'home'); assert.strictEqual(r.loc, 'stDock');
    assert.match(r.end, /you made it home/); assert.match(r.end, /Money left/); assert.match(r.end, /Photos/); assert.match(r.end, /Made it home/);
    assert.ok(!(await page.evaluate(() => !!loadSave())), 'a finished visit leaves no save');
    // a weekend: still on the island after the last boat
    await visit(page, 'weekend');
    r = await page.evaluate(() => { S.loc = 'lake'; S.cur = 6; S.t = vLastBoatAbs() + 5; afterAction();
      return { over: S.over, res: VS().result, end: document.querySelector('.end').textContent }; });
    assert.ok(r.over); assert.strictEqual(r.res, 'missed'); assert.match(r.end, /missed the last boat/i);
    // going to bed on the island on the last night is missing it too
    await visit(page, 'week');
    r = await page.evaluate(() => { const R = VS().rental; S.loc = 'home'; S.t = R.in; vCheckIn(); VS().islandAt = S.t; S.cur = 6; S.t = 6 * 1440 + 1250; endDay('home'); return { over: S.over, res: VS().result }; });
    assert.ok(r.over); assert.strictEqual(r.res, 'missed');
    // the last day before the boat: nothing ends yet
    await visit(page, 'weekend');
    r = await page.evaluate(() => { S.loc = 'lake'; S.cur = 6; S.t = 6 * 1440 + 900; afterAction(); return { over: S.over, res: VS().result }; });
    assert.ok(!r.over); assert.strictEqual(r.res, null);
    noErrors(errors);
  }},
  { name: 'saves keep visitor mode; a normal new game is a resident again', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page, 'weekend', 'seattle');
    await page.evaluate(() => { S.loc = 'home'; S.t = VS().rental.in; vCheckIn(); VS().rep = -2; saveGame(); });
    await reload(page);
    assert.match(await page.textContent('.title button.big'), /Weekend visit/);
    await page.evaluate(() => { resumeGame(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    const r = await page.evaluate(() => ({ on: visitorOn(), V: VS(), name: L.home.name, emp: S.emp, todo: todoItems().map(x => x.l), hud: document.querySelector('.hud-sub').textContent }));
    assert.ok(r.on); assert.strictEqual(r.V.len, 'weekend'); assert.strictEqual(r.V.home, 'seattle'); assert.ok(r.V.rental.checkedIn); assert.strictEqual(r.V.rep, -2);
    assert.strictEqual(r.name, 'Rental cabin'); assert.strictEqual(r.emp, null); assert.match(r.hud, /Weekend/);
    for (const l of r.todo) assert.ok(!RESIDENT.test(l), l);
    // a normal game afterwards: no visitor state, the house is home again
    await page.evaluate(() => { newGame('normal', 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
    const n = await page.evaluate(() => ({ v: S.visitor, on: visitorOn(), name: L.home.name, ic: L.home.ic, desc: L.home.desc, todo: todoItems().map(x => x.l), emp: S.emp, hud: document.querySelector('.hud-sub').textContent }));
    assert.strictEqual(n.v, undefined); assert.ok(!n.on); assert.strictEqual(n.name, 'Home'); assert.strictEqual(n.ic, '🏡'); assert.match(n.desc, /cedar cabin/);
    assert.ok(n.todo.some(l => /^Work:/.test(l))); assert.strictEqual(n.emp, 'lakewood'); assert.match(n.hud, /Day 1 of 7/);
    noErrors(errors);
  }},
  { name: 'a bot clicks through a week-long visit to the end screen without errors', fn: async ctx => {
    for (const seed of [7, 99]) {
      const { page, errors } = await open(ctx, { seed });
      await visit(page, 'week', 'olympia');
      const r = await page.evaluate(() => {
        const rnd = Math.random, skip = /exit|transfer|settings|change name|slot|Plan another|title/i;
        const ok = b => !b.disabled && !skip.test(b.textContent) && !/openSettings|openTransfer|confirmExit|nameModal/.test(b.getAttribute('onclick') || '');
        const pk = a => a[Math.floor(rnd() * a.length)]; let steps = 0;
        while (steps < 4000 && !S.over) {
          steps++;
          const cross = document.querySelector('.cross'); if (cross) { cross.click(); continue; }
          const m = document.getElementById('mbg');
          if (m) { const bs = [...m.querySelectorAll('button.act')].filter(ok); const p = bs.find(b => b.classList.contains('primary')); const b = p || pk(bs); if (b) b.click(); else m.remove(); continue; }
          if (rnd() < 0.05) { setTab(pk(['act', 'ferry', 'todo', 'log'])); continue; }
          if (tab !== 'act') setTab('act');
          if (tod() >= 1320 && S.loc === 'home') { endDay('home'); continue; }
          const bs = [...document.querySelectorAll('#app .content button.act, #app .content button.chip')].filter(ok);
          if (!bs.length) { endDay(L[S.loc].side === 'I' ? 'home' : 'terminal'); continue; }
          pk(bs).click();
        }
        return { steps, over: S.over, res: VS().result, end: !!document.querySelector('.end') };
      });
      assert.ok(r.over, 'not over after ' + r.steps); assert.ok(['home', 'missed', 'never', 'gameover'].includes(r.res), r.res); assert.ok(r.end);
      noErrors(errors);
      await page.close();
    }
  }},
];
