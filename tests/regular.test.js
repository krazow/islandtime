const { open, newGame, noErrors, reload, assert } = require('./helpers');

// 📅 Weekend regular (src/js/44-46): a month in a mainland city, the job on weekdays, the island on weekends
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
const reg = (page, home = 'tacoma', diff = 'normal') => page.evaluate(([h, d]) => {
  crossing = (a, b, c, done) => done();   // no ferry animation
  visitorNew('regular', h, d); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [home, diff]);
const pick = async (page, re) => { for (const x of await page.$$('#mbg .act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
const labels = page => page.evaluate(() => actions().map(a => a.l));
// jump to a day and time, as if the player had played up to it
const at = (page, d, m, loc) => page.evaluate(([d, m, loc]) => { S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; if (loc) { S.loc = loc; S.cars[0].loc = loc; } MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); }, [d, m, loc || null]);

module.exports = [
  { name: 'title: Weekend regular is the 4th length; then where you live and difficulty', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => newGameModal()); await page.click('#mbg >> text=Visit the island');
    assert.match(await page.textContent('#mbg'), /How long is your visit/);
    assert.match(await page.textContent('#mbg'), /Weekend regular: a month/);
    assert.strictEqual((await page.$$('#mbg .act')).length, 5, 'day, weekend, week, regular, never mind');
    await pick(page, /Weekend regular/);
    assert.match(await page.textContent('#mbg'), /Where do you live/);
    await pick(page, /Tacoma/); await pick(page, /Tourist/);
    assert.match(await page.textContent('#mbg'), /Your month/);
    const r = await page.evaluate(() => ({ on: visitorOn(), len: VS().len, home: VS().home, mode: S.mode, cur: S.cur, t: S.t, loc: S.loc, emp: S.emp, money: S.money, job: S.job, reg: !!VS().reg, rx: S.rx }));
    assert.ok(r.on); assert.strictEqual(r.len, 'regular'); assert.strictEqual(r.mode, 'month'); assert.strictEqual(r.cur, 0); assert.strictEqual(r.loc, 'vhome');
    assert.strictEqual(r.t, 390); assert.ok(r.emp && r.reg); assert.strictEqual(r.money, 3000);
    await clearModals(page);
    assert.match(await page.textContent('.hud-sub'), /Week 1\/4/);
    assert.match(await page.textContent('.hud'), /Job/);
    noErrors(errors);
  } },
  { name: 'the three cities: rent, commute, job and starting savings differ; the car starts at home', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const out = {};
    for (const h of ['seattle', 'tacoma', 'olympia']) {
      await reg(page, h);
      out[h] = await page.evaluate(() => ({ rent: regCity().rent, commute: dist('vhome', 'rwork'), emp: S.emp, pay: curJob().pay, start: curJob().start, car: S.cars[0].loc, money: S.money, rentOwed: regRentOwed() }));
    }
    assert.deepStrictEqual([out.seattle.rent, out.tacoma.rent, out.olympia.rent], [450, 325, 300]);
    assert.ok(out.seattle.commute > out.tacoma.commute && out.tacoma.commute > out.olympia.commute);
    assert.strictEqual(out.seattle.start, 510); assert.strictEqual(out.tacoma.start, 510);
    assert.ok(out.seattle.pay > out.tacoma.pay && out.tacoma.pay > out.olympia.pay);
    for (const h in out) { assert.strictEqual(out[h].car, 'vhome'); assert.strictEqual(out[h].money, 3000); assert.strictEqual(out[h].rentOwed, out[h].rent); }
    // the difficulty changes the savings you start with
    const m = await page.evaluate(() => ['easy', 'normal', 'hard'].map(d => { visitorNew('regular', 'tacoma', d); MQ = []; return S.money; }));
    assert.deepStrictEqual(m, [3500, 3000, 2500]);
    noErrors(errors);
  } },
  { name: 'work: the commute is a city drive, a shift is held for Friday, and the paycheck lands at 5 PM Friday', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.5;
      const o = { acts0: actions().map(a => a.l) };
      const m0 = S.money, c0 = S.cars[0].fuel;
      go('rwork', travelOpts('rwork').find(x => x.m === 'car'));
      o.loc = S.loc; o.t = S.t; o.fuel = c0 - S.cars[0].fuel;
      actions().find(a => /^Work a full shift/.test(a.l)).fn(); MQ = [];
      o.worked = !!S.worked[0]; o.cash = S.money - m0; o.pend = REG().pend; o.pay = curJob().pay;
      // Friday after work: the paycheck
      S.cur = 4; S.t = 4 * 1440 + 600; S.loc = 'rwork'; S.worked = { 1: true, 2: true, 3: true }; REG().pend = 585;
      regPaycheck(false); o.before = S.money - m0;
      S.t = 4 * 1440 + 1020; regPaycheck(false); o.after = S.money - m0; o.paid = REG().paidWk; o.pend2 = REG().pend;
      const m1 = S.money; regPaycheck(false); o.twice = S.money - m1;
      return o;
    });
    assert.ok(r.acts0.some(l => /^Pay rent/.test(l))); assert.ok(r.acts0.some(l => /vacation day/.test(l)));
    assert.strictEqual(r.loc, 'rwork'); assert.ok(r.t > 390 + 20 && r.t < 390 + 60, 'a city drive, no ferry: ' + r.t); assert.ok(r.fuel > 0.3);
    assert.ok(r.worked); assert.strictEqual(r.cash, 0, 'the shift’s pay is held for Friday'); assert.strictEqual(r.pend, r.pay);
    assert.strictEqual(r.before, 0); assert.strictEqual(r.after, 585); assert.strictEqual(r.paid, 0); assert.strictEqual(r.pend2, 0); assert.strictEqual(r.twice, 0);
    noErrors(errors);
  } },
  { name: 'work: late is docked like the resident job, a sick day costs the day, Friday you can leave early', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const o = {};
      // 40 minutes late at the Tacoma hospital (8:30)
      S.cur = 1; S.t = 1440 + 510 + 40; S.loc = 'rwork'; S.job = 60;
      const a = actions().find(x => /^Work a full shift/.test(x.l)); o.lateTxt = a.s; a.fn(); MQ = [];
      o.late = S.late[1]; o.job = S.job;
      // sick
      S.cur = 2; S.t = 2 * 1440 + 420; S.loc = 'vhome'; S.health = 30; S.job = 60; const j0 = S.job;
      const sick = actions().find(x => /^Call in sick/.test(x.l)); o.sickShown = !!sick; sick.fn(); MQ = [];
      o.sickWorked = S.worked[2]; o.sickJob = S.job - j0; o.pendAfterSick = REG().pend;
      // Friday: leave early
      S.cur = 4; S.t = 4 * 1440 + 530; S.loc = 'rwork'; S.health = 80;
      const e = actions().find(x => /^Leave work early/.test(x.l)); o.early = !!e; const p0 = REG().pend; e.fn(); MQ = [];
      o.earlyPay = REG().pend - p0; o.earlyT = tod();
      return o;
    });
    assert.match(r.lateTxt, /40 min late/); assert.strictEqual(r.late, 40);
    assert.ok(r.sickShown); assert.ok(r.sickWorked); assert.ok(r.sickJob >= -3 && r.sickJob <= 0); assert.ok(r.early); assert.ok(r.earlyPay > 0 && r.earlyPay < 150); assert.ok(r.earlyT >= 780);
    noErrors(errors);
  } },
  { name: 'rent: due Sunday on every difficulty, paid by phone, late fee, notice, eviction after 3 missed Sundays', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const diff of ['easy', 'normal']) {
      await reg(page, 'tacoma', diff);
      const r = await page.evaluate(() => {
        const o = { owed: regRentOwed() };
        const m0 = S.money; actions().find(a => /^Pay rent/.test(a.l)).fn(); MQ = [];
        o.paid = m0 - S.money; o.owed2 = regRentOwed();
        return o;
      });
      assert.strictEqual(r.owed, 325); assert.strictEqual(r.paid, 325); assert.strictEqual(r.owed2, 0);
    }
    await reg(page, 'tacoma', 'normal');
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const o = {}, R = REG(); S.loc = 'vhome';
      const sunday = () => { S.cur = 6; S.t = 6 * 1440 + 1200; const n = []; regRentNight(n, 6); return n; };
      o.n1 = sunday(); o.owed1 = regRentOwed(); o.strikes1 = R.rent.strikes;
      S.weekNo = 1; o.n2 = sunday(); o.owed2 = regRentOwed();
      S.weekNo = 2; o.n3 = sunday(); o.evict = R.rent.evict; o.owed3 = regRentOwed();
      return o;
    });
    assert.match(r.n1.join(' '), /late fee/); assert.strictEqual(r.owed1, 350); assert.strictEqual(r.strikes1, 1);
    assert.match(r.n2.join(' '), /NOTICE TO PAY RENT OR VACATE/);
    assert.match(r.n3.join(' '), /filed for eviction/); assert.ok(r.evict);
    // the eviction ends the month on the next night
    await reg(page, 'tacoma', 'normal');
    await page.evaluate(() => { Math.random = () => 0.99; const R = REG(); R.rent.evict = true; R.rent.strikes = 3; S.loc = 'vhome'; S.cur = 6; S.weekNo = 1; S.t = 6 * 1440 + 1300; endDay('vhome'); });
    assert.match(await page.textContent('.end'), /Evicted/);
    assert.match(await page.textContent('.end'), /MONTH CUT SHORT/);
    noErrors(errors);
  } },
  { name: 'bills: statements come by mail, pay online or by mailed check, late fees, collections; mail piles up', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const o = { open0: regBillsOpen(), due: regBillDue('phone') };
      const m0 = S.money; regBillPay('phone', 'online'); o.paid = m0 - S.money; o.paidFlag = RB('phone').paid;
      regBillPay('util', 'mail'); o.check = RB('util').check;
      // nights pass: mail piles up, the unpaid insurance bill is late
      S.loc = 'vhome'; const n = []; S.weekNo = 2;       // week 3: car insurance due Tuesday
      const mail0 = REG().mail; for (const d of [0, 1, 2]) { S.cur = d; regNight('vhome', n, d); }
      o.mail = REG().mail - mail0; S.cur = 2; o.late1 = RB('ins').late; o.fee = RB('ins').fees; o.n = n.join(' | ');
      o.owed = regBillOwed('ins');
      for (let i = 0; i < 14; i++) { S.cur = 2; regNight('vhome', n, 3); }
      o.coll = RB('ins').paid;
      return o;
    });
    assert.deepStrictEqual(r.open0, ['phone', 'util'].filter(k => r.open0.includes(k)), 'phone and utilities are out week 1'); assert.ok(r.open0.includes('phone'));
    assert.strictEqual(r.paid, 55); assert.ok(r.paidFlag); assert.ok(r.check >= 0);
    assert.ok(r.mail >= 3); assert.ok(r.late1 >= 1); assert.strictEqual(r.fee, 15); assert.ok(/late fee/.test(r.n)); assert.strictEqual(r.owed, 103); assert.ok(r.coll, 'collections after two weeks');
    noErrors(errors);
  } },
  { name: 'chores: dishes, laundry and trash pile up and can be cleared; the pantry and a cheap supermarket', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const R = REG(), o = {}; S.loc = 'vhome';
      for (let i = 0; i < 4; i++) { const n = []; regNight('vhome', n, 0); }
      o.dishes = R.chores.dishes; o.home = S.home; o.piling = actions().filter(a => /piling up/.test(a.l)).length;
      actions().find(a => /^Do the dishes/.test(a.l)).fn(); MQ = [];
      o.after = R.chores.dishes; o.home2 = S.home;
      // groceries: close and cheap, they go in the pantry when you get home
      S.pantry = 0; S.cars[0].loc = 'vhome';
      go('rmarket', travelOpts('rmarket').find(x => x.m === 'car')); MQ = [];
      o.market = S.loc; const buy = actions().find(a => /^Buy 5 days of groceries/.test(a.l)); o.price = buy.l; buy.fn(); MQ = [];
      o.carried = S.carried; go('vhome', travelOpts('vhome').find(x => x.m === 'car')); MQ = [];
      o.pantry = S.pantry; o.carried2 = S.carried;
      return o;
    });
    assert.ok(r.dishes >= 3); assert.ok(r.piling >= 2); assert.strictEqual(r.after, 0); assert.ok(r.home2 > r.home);
    assert.strictEqual(r.market, 'rmarket'); assert.match(r.price, /\$58/); assert.strictEqual(r.carried, 5); assert.strictEqual(r.pantry, 5); assert.strictEqual(r.carried2, 0);
    noErrors(errors);
  } },
  { name: 'vacation days: 5 a month, a Monday or Friday off is paid, Thursday night for tomorrow', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const R = REG(), o = { vac0: R.vac };
      S.loc = 'vhome'; const lbl = actions().find(a => /vacation day/.test(a.l)); o.mon = lbl && lbl.l;
      const p0 = R.pend; lbl.fn(); MQ = [];
      o.vac1 = R.vac; o.worked = S.worked[0]; o.paid = R.pend - p0;
      // Tuesday: no vacation day offered
      S.cur = 1; S.t = 1440 + 420; o.tue = actions().some(a => /vacation day/.test(a.l));
      // Thursday evening: take Friday off
      S.cur = 3; S.t = 3 * 1440 + 1100; const th = actions().find(a => /Take tomorrow \(Friday\) off/.test(a.l)); o.thu = !!th; th.fn(); MQ = [];
      o.vac2 = R.vac; o.fridayMarked = !!R.vacDays[3 * 0 + 4];
      // Friday morning: the day is already taken
      endDay('vhome'); MQ = []; o.fri = day(); o.friWorked = S.worked[4]; o.friPaid = R.pend;
      // none left
      R.vac = 0; S.cur = 0; S.worked = {}; S.t = 420; o.none = actions().some(a => /vacation day/.test(a.l));
      return o;
    });
    assert.strictEqual(r.vac0, 5); assert.match(r.mon, /\(5 left\)/); assert.strictEqual(r.vac1, 4); assert.ok(r.worked); assert.ok(r.paid > 150);
    assert.strictEqual(r.tue, false); assert.ok(r.thu); assert.strictEqual(r.vac2, 3); assert.strictEqual(r.fri, 4); assert.ok(r.friWorked); assert.strictEqual(r.none, false);
    noErrors(errors);
  } },
  { name: 'a weekend visit: boat over, rental charged at check-in, back on Sunday ends the weekend, the week goes on', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const o = {}, V = VS(), R = REG();
      S.worked = { 0: true, 1: true, 2: true, 3: true, 4: true }; REG().paidWk = 0;
      S.cur = 4; S.t = 4 * 1440 + 1000; S.loc = 'stDock'; S.cars[0].loc = 'stDock'; S.cars[0].fuel = 10;
      const m0 = S.money;
      waitFerry('drive'); o.onIsland = L[S.loc].side; o.fare = m0 - S.money;
      regTick(); o.wkOn = R.W.on; o.swapped = R.swapped;
      go('home', travelOpts('home').find(x => x.m === 'car')); MQ = [];
      const ci = actions().find(a => /^Check in/.test(a.l)); o.checkin = !!ci; const m1 = S.money; ci.fn(); MQ = [];
      o.cabin = m1 - S.money; o.rentalCost = V.rentalCost; o.checked = V.rental.checkedIn;
      // Sunday: check out, boat home
      S.cur = 6; S.t = 6 * 1440 + 600; S.loc = 'home'; S.cars[0].loc = 'home'; R.W.on = true;
      actions().find(a => /^Check out and take the trash/.test(a.l)).fn(); MQ = [];
      S.t = 6 * 1440 + 1000; go('aiDock', travelOpts('aiDock').find(x => x.m === 'car')); MQ = [];
      waitFerry('drive'); o.back = L[S.loc].side; MQ.length = 0;
      o.weekendDone = R.W.done; o.weekends = R.weekends; o.hist = R.hist.length; o.over = S.over; o.pantryRestored = !R.swapped;
      // go home and sleep: Monday of week 2, a fresh rental, the month goes on
      go('vhome', travelOpts('vhome').find(x => x.m === 'car')); MQ = [];
      endDay('vhome'); MQ = [];
      o.wk = S.weekNo; o.day = day(); o.loc = S.loc; o.rentalFresh = !VS().rental.checkedIn && !VS().rental.checkedOut; o.stillOn = visitorOn(); o.wReset = !REG().W.done; o.rentOwed = regRentOwed();
      return o;
    });
    assert.strictEqual(r.onIsland, 'I'); assert.ok(r.fare > 20); assert.ok(r.wkOn); assert.ok(r.swapped);
    assert.ok(r.checkin); assert.strictEqual(r.cabin, 410); assert.strictEqual(r.rentalCost, 410); assert.ok(r.checked);
    assert.strictEqual(r.back, 'M'); assert.ok(r.weekendDone); assert.strictEqual(r.weekends, 1); assert.strictEqual(r.hist, 1); assert.strictEqual(r.over, false); assert.ok(r.pantryRestored);
    assert.strictEqual(r.wk, 1); assert.strictEqual(r.day, 0); assert.strictEqual(r.loc, 'vhome'); assert.ok(r.rentalFresh); assert.ok(r.stillOn); assert.ok(r.wReset);
    assert.ok(r.rentOwed >= 325, 'Sunday’s rent was due: late fee or paid');
    noErrors(errors);
  } },
  { name: 'stranded Monday morning on the island (ferry outage) = missed work; a vacation day covers it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const o = {}; S.weekNo = 1; S.cur = 6; S.t = 6 * 1440 + 1425; S.loc = 'aiDock'; S.cars[0].loc = 'stDock';
      REG().W.on = true; REG().swapped = true; REG().cityFood = 3; REG().rent.wk = 1;
      regRentPay(); MQ = [];
      const dlg = regTick(); o.strandedModal = dlg; o.modal = (document.querySelector('#mbg h2') || {}).textContent;
      o.btns = MB.map(b => b.l);
      MBTN(MB.findIndex(b => /Sleep/.test(b.l)));
      o.wk = S.weekNo; o.d = day(); o.loc = S.loc; o.stressUp = S.stress;
      // Monday: the ferry is down, no way over
      const J = curJob(); S.week.b = [{ start: S.cur * 1440, end: S.cur * 1440 + 900, cause: 'steering hydraulic leak' }];
      S.t = S.cur * 1440 + J.start - 60; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      o.outage = !!activeOutage(); o.vac = actions().find(a => /vacation day/.test(a.l)); o.vacLabel = o.vac && o.vac.l; o.vac = 0;
      const job0 = S.job; S.t = S.cur * 1440 + 1380; REG().rent.wk = 1; REG().rent.owed = 0; endDay('terminal'); MQ = [];
      o.jobHit = S.job - job0; o.worked = !!S.worked[0];
      return o;
    });
    assert.ok(r.strandedModal); assert.match(r.modal, /Stranded on the island/); assert.ok(r.btns.some(b => /Island Group/.test(b)));
    assert.strictEqual(r.wk, 2); assert.strictEqual(r.d, 0); assert.strictEqual(r.loc, 'aiDock', 'you wake up on the island');
    assert.ok(r.outage); assert.match(r.vacLabel, /vacation day/, 'a vacation day is the way out');
    assert.ok(r.jobHit <= -10, 'job meter: ' + r.jobHit);
    noErrors(errors);
  } },
  { name: 'stranded: a friend can put you up for the night; no more game over when the last boat leaves', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.01;
      meet('walt', 'Walt, the Legion regular', 'test'); friendPts('walt', 6);
      const o = {}; S.cur = 6; S.t = 6 * 1440 + 1425; S.loc = 'lake'; REG().W.on = true; VS().rental.checkedOut = true; VS().rental.checkedIn = true;
      afterAction(); o.modal = (document.querySelector('#mbg h2') || {}).textContent; o.txt = document.querySelector('#mbg') && document.querySelector('#mbg').textContent;
      const i = MB.findIndex(b => /Text Walt/.test(b.l)); o.hasFriend = i >= 0; MBTN(i); MQ = [];
      o.over = S.over; o.stranded = REG().st.stranded; o.wk = S.weekNo; o.day = day(); o.loc = S.loc; o.hosted = REG().st.hosted;
      return o;
    });
    assert.match(r.modal, /Stranded/); assert.ok(r.hasFriend); assert.strictEqual(r.over, false); assert.strictEqual(r.stranded, 1); assert.strictEqual(r.hosted, 1); assert.strictEqual(r.loc, 'aiDock');
    noErrors(errors);
  } },
  { name: 'a friend hosts you instead of the cabin: free, no house rules, and it needs a friend', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.1;
      const o = {}; S.cur = 2; S.t = 2 * 1440 + 600; S.loc = 'vhome';
      o.noFriend = !regHostCan(); o.listed0 = actions().some(a => /Ask a friend to host/.test(a.l));
      meet('walt', 'Walt, the Legion regular', 'test'); friendPts('walt', 3);
      o.can = regHostCan(); const a = actions().find(x => /Ask a friend to host/.test(x.l)); o.listed = !!a; a.fn();
      MBTN(0); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const R = vRental(); o.hosted = R.hosted && R.hosted.id; o.name = L.home.name;
      // arrive Friday, settle in
      S.cur = 4; S.t = 4 * 1440 + 1100; S.loc = 'home'; const m0 = S.money;
      o.acts = actions().map(x => x.l); const ci = actions().find(x => /^Check in/.test(x.l)); ci.fn(); MQ = [];
      o.paid = m0 - S.money; o.rules = actions().some(x => /house rules|Fire pit/i.test(x.l)); o.checkedIn = R.checkedIn;
      S.cur = 6; S.t = 6 * 1440 + 700; const out = actions().find(x => /Say goodbye and check out/.test(x.l)); o.out = !!out; out.fn(); MQ = [];
      o.late = !!R.late; o.fees = VS().fees; o.rules2 = Object.keys(VS().rules);
      return o;
    });
    assert.strictEqual(r.noFriend, true); assert.strictEqual(r.listed0, false); assert.ok(r.can && r.listed); assert.strictEqual(r.hosted, 'walt'); assert.match(r.name, /Walt’s spare room/);
    assert.ok(r.checkedIn); assert.strictEqual(r.paid, 0); assert.strictEqual(r.rules, false); assert.ok(r.out); assert.strictEqual(r.late, false); assert.strictEqual(r.fees, 0); assert.deepStrictEqual(r.rules2, []);
    noErrors(errors);
  } },
  { name: 'helping out: reputation capped per day, a second day makes a friend; rep and friends carry across weekends', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      Math.random = () => 0.99;
      const o = {}, V = VS(); S.cur = 5; S.t = 5 * 1440 + 600; S.loc = 'legion'; S.cars[0].loc = 'legion';
      const a = actions().find(x => /^Volunteer at the Legion/.test(x.l)); o.listed = !!a; a.fn(); MQ = [];
      o.rep1 = V.rep; o.friend1 = !!S.friends.walt; o.again = actions().find(x => /^Volunteer at the Legion/.test(x.l)).dis;
      // the next day: they know your name
      S.cur = 6; S.t = 6 * 1440 + 600; actions().find(x => /^Volunteer at the Legion/.test(x.l)).fn(); MQ = [];
      o.friend2 = !!S.friends.walt; o.rep2 = V.rep;
      // the daily cap: lots of helping on one day
      S.cur = 5; S.t = 5 * 1440 + 800; S.weekNo = 1; const r0 = V.rep;
      for (const loc of ['store', 'farm', 'lake', 'legion']) { S.loc = loc; S.cars[0].loc = loc; S.t = 5 * 1440 + 800; const h = actions().find(x => /^(Volunteer|Help|Pick up trash)/.test(x.l)); if (h && !h.dis) h.fn(); MQ = []; }
      o.capped = V.rep - r0;
      // week rollover keeps everything
      S.cur = 6; S.weekNo = 0; S.loc = 'vhome'; const rep = V.rep, fr = Object.keys(S.friends).length; REG().rent.wk = 0; endDay('vhome'); MQ = [];
      o.same = V.rep === rep && Object.keys(S.friends).length === fr; o.wk = S.weekNo; o.rep = V.rep;
      return o;
    });
    assert.ok(r.listed); assert.strictEqual(r.rep1, 3); assert.strictEqual(r.friend1, false, 'a stranger the first day'); assert.ok(r.again);
    assert.ok(r.friend2); assert.ok(r.rep2 >= 6); assert.ok(r.capped <= 5, 'capped at 5 a day: ' + r.capped); assert.ok(r.same); assert.strictEqual(r.wk, 1);
    noErrors(errors);
  } },
  { name: 'the boss texts you on a day off on the island: answering costs stress, ignoring costs the job meter', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const o = {}; Math.random = () => 0.1;
      S.cur = 4; S.t = 4 * 1440 + 700; S.loc = 'lake'; S.worked[4] = true; REG().vacDays[4] = true; S.worked[4] = false;
      regBossTick(); o.modal = (document.querySelector('#mbg h2') || {}).textContent;
      const st0 = S.stress, j0 = S.job; MBTN(0); MQ = []; o.stress = S.stress - st0; o.job = S.job - j0; o.ans = REG().st.bossAnswered;
      // ignoring
      REG().bossAt = {}; S.stress = 20; S.job = 70; regBossTick(); MBTN(1); MQ = []; o.ig = S.job - 70; o.ign = REG().st.bossIgnored;
      return o;
    });
    assert.match(r.modal, /Text from your boss/); assert.ok(r.stress >= 4); assert.ok(r.job >= 1); assert.strictEqual(r.ans, 1); assert.strictEqual(r.ig, -6); assert.strictEqual(r.ign, 1);
    noErrors(errors);
  } },
  { name: 'the goal: $4,000 after rent and bills, reputation 40, 3 friends; progress in the to-do list and the Visit app', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const o = {}; o.g0 = regGoal(); o.todo = todoItems().map(x => x.l);
      S.money = 4200; REG().rent.wk = 0; o.net = regNet(); o.rentOwed = regRentOwed(); o.billsOwed = regBillsUnpaid().length;
      PH_NAV = [{ app: null }, { app: 'visit' }]; PH().apps = ['ferrypass', 'group']; o.view = visit0();
      function visit0() { return phoneApp('visit').view(); }
      return o;
    });
    assert.strictEqual(r.g0.all, false);
    assert.ok(r.todo.some(l => /Still have \$3000/.test(l))); assert.ok(r.todo.some(l => /Island reputation 40/.test(l))); assert.ok(r.todo.some(l => /3 island friends/.test(l))); assert.ok(r.todo.some(l => /Pay rent/.test(l)));
    assert.ok(!r.todo.some(l => /Doctor|House & yard|dump run/i.test(l)));
    assert.ok(r.net < 4200 && r.net > 3500, 'net of rent and the bills still to come: ' + r.net);
    assert.match(r.view, /Weekend regular · week 1 of 4/); assert.match(r.view, /Savings/); assert.match(r.view, /Reputation/); assert.match(r.view, /Island friends/); assert.match(r.view, /Last boat home Sunday/);
    noErrors(errors);
  } },
  { name: 'move-in: when all three are met a house comes up; buying it ends the month early with the great ending', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const o = {}, V = VS(), R = REG();
      S.money = 5200; REG().rent.wk = 0; for (const k in REG_BILLS) RB(k).paid = true; V.rep = 41;
      for (const id of ['walt', 'bev', 'sam']) meet(id, id, 'test');
      o.met = regGoal(); regGoalCheck(); o.offered = R.offered; o.modal = (document.querySelector('#mbg h2') || {}).textContent; o.btns = MB.map(b => b.l);
      MBTN(1); MQ = []; o.stillOver = S.over; o.action = actions().some(a => /^Buy the house in the Island Group/.test(a.l));
      return o;
    });
    assert.ok(r.met.all); assert.ok(r.offered); assert.match(r.modal, /A house in the Island Group/); assert.ok(r.btns.some(b => /Buy it/.test(b)) && r.btns.some(b => /Not yet/.test(b)));
    assert.strictEqual(r.stillOver, false); assert.ok(r.action, 'the offer stays up');
    await page.evaluate(() => { actions().find(a => /^Buy the house in the Island Group/.test(a.l)).fn(); });
    await pick(page, /Yes, buy it/);   // 🛡️ the "Are you sure?" prompt
    const end = await page.textContent('.end');
    assert.match(end, /you moved to the island/); assert.match(end, /Moved to the island/); assert.match(end, /Start life on the island/); assert.match(end, /Island reputation/); assert.match(end, /Savings after rent and bills/);
    const s = await page.evaluate(() => ({ over: S.over, res: VS().result, end: S.ending, money: S.money }));
    assert.ok(s.over); assert.strictEqual(s.res, 'moved'); assert.strictEqual(s.end.grade, 'A'); assert.ok(s.money < 3000 && s.money > 2000, 'the $2,500 down payment came out: ' + s.money);
    noErrors(errors);
  } },
  { name: 'handoff: "Start life on the island" starts a resident game with your money, friends and a reputation bonus', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page, 'olympia', 'hard');
    await page.evaluate(() => {
      const V = VS(); S.money = 4900; REG().rent.wk = 0; for (const k in REG_BILLS) RB(k).paid = true; V.rep = 44;
      for (const id of ['walt', 'bev', 'sam']) meet(id, id + ' (friend)', 'test');
      friendPts('walt', 4); regGoalCheck(); MBTN(0); MQ = [];
    });
    await pick(page, /Yes, buy it/);   // 🛡️ the "Are you sure?" prompt
    assert.match(await page.textContent('.end'), /you moved to the island/);
    await page.click('button:has-text("Start life on the island")');
    const r = await page.evaluate(() => ({ visitor: !!S.visitor, on: visitorOn(), over: S.over, money: S.money, friends: Object.keys(S.friends).sort(), lvl: S.friends.walt.lvl, rep: S.rep, diff: S.diff, mode: S.mode, loc: S.loc, emp: S.emp, hud: document.querySelector('.hud-sub').textContent, rent: typeof rentOn === 'function' && rentOn() }));
    assert.strictEqual(r.visitor, false); assert.strictEqual(r.on, false); assert.strictEqual(r.over, false); assert.strictEqual(r.money, 2900, 'savings minus the $2,000 Hard down payment: ' + r.money);
    assert.deepStrictEqual(r.friends, ['bev', 'sam', 'walt']); assert.ok(r.lvl >= 2); assert.ok(r.rep >= 15 && r.rep <= 40); assert.strictEqual(r.diff, 'hard'); assert.strictEqual(r.loc, 'home'); assert.strictEqual(r.emp, 'lakewood'); assert.strictEqual(r.rent, true);
    assert.match(await page.textContent('#mbg'), /Welcome home/);
    noErrors(errors);
  } },
  { name: 'month end: "A regular, not a resident yet" with progress, "The island wasn’t for you" with little', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const end = (money, rep, fr) => page.evaluate(([m, rep, fr]) => {
      visitorNew('regular', 'tacoma', 'normal'); MQ = []; const V = VS(); S.weekNo = 3; S.cur = 6; S.loc = 'vhome'; S.t = 6 * 1440 + 1300; S.money = m + 325 + 238 + 25; V.rep = rep;
      for (let i = 0; i < fr; i++) meet('f' + i, 'F' + i, 'test'); REG().rent.wk = 2; REG().rent.owed = 0; for (const k in REG_BILLS) RB(k).paid = true; REG().rent.wk = 3; REG().vacDays = {};
      endDay('vhome'); MQ = []; return { res: VS().result, over: S.over, h1: document.querySelector('.end h1').textContent, grade: S.ending.grade };
    }, [money, rep, fr]);
    const a = await end(3200, 30, 2);
    assert.strictEqual(a.res, 'regular'); assert.match(a.h1, /A regular, not a resident yet/); assert.strictEqual(a.grade, 'B');
    const b = await end(900, 5, 0);
    assert.strictEqual(b.res, 'notforyou'); assert.match(b.h1, /The island wasn’t for you/);
    assert.match(await page.textContent('.end'), /Back to title/);
    noErrors(errors);
  } },
  { name: 'losses: fired (job meter at 0), medevac (health 0)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    await page.evaluate(() => { Math.random = () => 0.99; S.cur = 1; S.t = 1440 + 1300; S.loc = 'vhome'; S.job = 3; REG().rent.wk = 0; endDay('vhome'); });
    assert.match(await page.textContent('.end'), /You’re fired/); assert.match(await page.textContent('.end'), /MONTH CUT SHORT/);
    await reg(page);
    await page.evaluate(() => { Math.random = () => 0.99; S.cur = 1; S.t = 1440 + 1300; gameOver('health'); });
    assert.match(await page.textContent('.end'), /Medevac/);
    noErrors(errors);
  } },
  { name: 'phone: bank, job listings and grocery delivery to the city home are back; the Visit app shows the goal; no island-only apps', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page);
    const r = await page.evaluate(() => {
      const o = {}; PH_OPEN = true; phoneRender(); PH_OPEN = false; o.installed = PH().apps.slice(); o.inst2 = PHONE_APPS.filter(a => phoneInstalled(a.id)).map(a => a.id); o.hidden = ['rides', 'telehealth'].map(id => phoneInstalled(id) || phoneStoreApps().some(a => a.id === id));
      o.bank = phoneApp('bank').view(); o.gigs = phoneApp('gigs').view(); o.market = phoneApp('market').view();
      // order groceries: they arrive at the door
      S.cur = 1; S.t = 1440 + 600; S.pantry = 0; PH().apps = PH().apps.concat('market');
      const m0 = S.money; PH_ACTS = []; const mk = phoneApp('market').view(); const idx = PH_ACTS.length - 2; PH_ACTS[idx](); MQ = [];
      o.cost = m0 - S.money; o.pending = !!REG().mkt; S.t += 130; phoneTimed(); o.pantry = S.pantry; o.delivered = !REG().mkt;
      return o;
    });
    for (const id of ['bank', 'gigs']) assert.ok(r.installed.includes(id) || r.inst2.includes(id), id);
    assert.deepStrictEqual(r.hidden, [false, false]);
    assert.match(r.bank, /Savings toward the house/); assert.match(r.bank, /Pay rent/); assert.match(r.gigs, /Browse job listings/); assert.match(r.market, /delivered to your home/);
    assert.strictEqual(r.cost, 42); assert.ok(r.pending); assert.strictEqual(r.pantry, 3); assert.ok(r.delivered);
    noErrors(errors);
  } },
  { name: 'job listings in this mode: only your city’s jobs, no resident jobs', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page, 'olympia');
    const r = await page.evaluate(() => ({ elig: Object.keys(JOBS).filter(jobEligible), open: jobOpenings(), emp: S.emp }));
    assert.deepStrictEqual(r.elig.sort(), ['r_oly', 'r_oly2']);
    assert.ok(r.open.every(k => /^r_oly/.test(k)));
    await newGame(page);
    const r2 = await page.evaluate(() => ({ elig: Object.keys(JOBS).filter(jobEligible), on: visitorOn() }));
    assert.ok(r2.elig.length >= 4 && r2.elig.every(k => !/^r_/.test(k))); assert.strictEqual(r2.on, false);
    noErrors(errors);
  } },
  { name: 'saves: a month in progress keeps its state through a reload and Continue', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await reg(page, 'seattle');
    await page.evaluate(() => {
      const R = REG(); S.weekNo = 2; S.cur = 3; S.t = 3 * 1440 + 900; S.loc = 'rwork'; S.cars[0].loc = 'rwork'; VS().rep = 17; R.pend = 410; R.vac = 3; R.rent.wk = 2; R.weekends = 2; R.mail = 4;
      meet('walt', 'Walt, the Legion regular', 'test'); RB('phone').paid = true; saveGame();
    });
    await reload(page);
    assert.match(await page.textContent('.title'), /Weekend regular/);
    await page.click('button:has-text("Continue")');
    const r = await page.evaluate(() => ({ on: visitorOn(), len: VS().len, mode: S.mode, wk: S.weekNo, loc: S.loc, rep: VS().rep, pend: REG().pend, vac: REG().vac, rentWk: REG().rent.wk, weekends: REG().weekends, mail: REG().mail, friend: !!S.friends.walt, phone: RB('phone').paid, city: REG().city, emp: S.emp }));
    assert.deepStrictEqual(r, { on: true, len: 'regular', mode: 'month', wk: 2, loc: 'rwork', rep: 17, pend: 410, vac: 3, rentWk: 2, weekends: 2, mail: 4, friend: true, phone: true, city: 'seattle', emp: 'r_sea' });
    // an old save without the reg object (or with part of it) is filled in
    await page.evaluate(() => { const V = VS(); delete V.reg.rent; delete V.reg.W; delete V.reg.chores; const d = migrate(JSON.parse(JSON.stringify(packSave()))); S = d.S; });
    const r2 = await page.evaluate(() => ({ rent: REG().rent.strikes, chores: REG().chores.dishes, W: REG().W.on, mode: S.mode, acts: actions().length > 0 }));
    assert.deepStrictEqual(r2, { rent: 0, chores: 0, W: false, mode: 'month', acts: true });
    noErrors(errors);
  } },
  { name: 'short visits and the resident game are unchanged', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const o = {};
      for (const len of ['day', 'weekend', 'week']) { visitorNew(len, 'tacoma', 'normal'); MQ = []; o[len] = { reg: regOn(), mode: S.mode, rentOn: typeof rentOn === 'function' && rentOn(), emp: S.emp, acts: actions().map(a => a.l).filter(l => /Pay rent|vacation|Check the mail|Do the dishes/.test(l)), phone: ['bank', 'gigs', 'market'].map(id => vphoneHidden(id)) }; }
      newGame('hard', 'week'); MQ = []; o.res = { on: visitorOn(), reg: regOn(), rent: rentOn(), emp: S.emp, loc: S.loc, rentRem: actions().some(a => /^Pay rent/.test(a.l)), jobs: jobOpenings().length };
      return o;
    });
    for (const len of ['day', 'weekend', 'week']) { assert.strictEqual(r[len].reg, false); assert.strictEqual(r[len].mode, 'week'); assert.strictEqual(r[len].emp, null); assert.deepStrictEqual(r[len].acts, []); assert.deepStrictEqual(r[len].phone, [true, true, true]); }
    assert.strictEqual(r.res.on, false); assert.strictEqual(r.res.rent, true); assert.strictEqual(r.res.emp, 'lakewood'); assert.strictEqual(r.res.loc, 'home'); assert.ok(r.res.jobs >= 1);
    noErrors(errors);
  } },
];
