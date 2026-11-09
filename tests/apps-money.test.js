const { open, newGame, reload, noErrors, assert } = require('./helpers');

const phoneText = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
const tap = (page, label) => page.locator('#phoneUI button', { hasText: label }).first().click();
// put the player somewhere at a given day/time, with no modals, and the phone charged
const at = (page, loc, d, m) => page.evaluate(([loc, d, m]) => {
  S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; S.phone = 100; S.loc = loc; MQ = [];
  document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [loc, d, m]);
const install = (page, ...ids) => page.evaluate(ids => { const l = S.loc; S.loc = 'stDock'; ids.forEach(id => phoneInstall(id)); S.loc = l; }, ids);
const log = page => page.evaluate(() => S.log.map(e => e.s).join('\n'));

module.exports = [
  { name: 'the three money apps are in the App Store, install and open', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'stDock', 0, 600);
    await page.evaluate(() => phoneOpen('store'));
    const t = await phoneText(page);
    for (const n of ['Island Credit Union', 'Gig Work', 'Mainland Market']) assert.ok(t.includes(n), 'store lists ' + n);
    for (const n of ['Island Credit Union', 'Gig Work', 'Mainland Market'])
      await page.locator('#phoneUI .ph-store', { hasText: n }).locator('button', { hasText: 'Install' }).click();
    assert.deepStrictEqual(await page.evaluate(() => ['bank', 'gigs', 'market'].map(phoneInstalled)), [true, true, true]);
    for (const id of ['bank', 'gigs', 'market']) {
      await page.evaluate(id => phoneGo(id), id);
      assert.ok(await page.locator('#phoneUI .ph-bar').count(), id + ' opens');
      assert.doesNotMatch(await phoneText(page), /Something went wrong/);
    }
    noErrors(errors);
  } },
  { name: 'bank: shows balance, card and bills; pays a bill from the app', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'home', 1, 600);
    await install(page, 'bank');
    await page.evaluate(() => { S.money = 500; phoneOpen('bank'); });
    let t = await phoneText(page);
    assert.match(t, /Checking/); assert.match(t, /\$500/);
    assert.match(t, /Phone · \$55/); assert.match(t, /Internet · \$69/); assert.match(t, /due today/);
    assert.match(t, /−\$1,?500|\$1500/);
    await tap(page, 'Pay phone');
    const r = await page.evaluate(() => ({ paid: HB('phone').paid, money: S.money }));
    assert.ok(r.paid); assert.strictEqual(r.money, 445);
    t = await phoneText(page);
    assert.match(t, /Paid phone: \$55/);
    // card debt shows as debt, with its score cost
    await page.evaluate(() => { S.money = -300; phoneRender(); });
    t = await phoneText(page);
    assert.match(t, /Card balance/); assert.match(t, /owe \$300/); assert.match(t, /\$1,?200 left/); assert.match(t, /300 points/);
    noErrors(errors);
  } },
  { name: 'bank: autopay pays on the due day; overdraft fee when short', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'home', 0, 600);
    await install(page, 'bank');
    await page.evaluate(() => phoneOpen('bank'));
    await tap(page, 'Autopay: Off');
    assert.ok(await page.evaluate(() => PH().icu.auto));
    // nothing is due on Monday
    assert.ok(await page.evaluate(() => Object.keys(HH_BILLS).every(k => !HB(k).paid)));
    // Tuesday: the phone bill is due; enough money
    await page.evaluate(() => { phoneClose(); S.money = 400; S.cur = 1; S.t = 1440 + 400; S.phoneT = S.t; afterAction(); });
    let r = await page.evaluate(() => ({ paid: HB('phone').paid, how: HB('phone').how, money: S.money, ins: HB('ins').paid }));
    assert.ok(r.paid); assert.strictEqual(r.how, 'autopay'); assert.strictEqual(r.money, 345); assert.ok(!r.ins, 'insurance not due yet');
    assert.match(await log(page), /Autopay paid your phone carrier: \$55/);
    // Wednesday: insurance ($84) due with only $30: pays anyway, plus a $25 overdraft fee
    await page.evaluate(() => { S.money = 30; S.cur = 2; S.t = 2 * 1440 + 400; afterAction(); });
    r = await page.evaluate(() => ({ paid: HB('ins').paid, money: S.money }));
    assert.ok(r.paid); assert.strictEqual(r.money, 30 - 84 - 25);
    assert.match(await log(page), /overdraft fee/);
    // overnight late check doesn't add a late fee for an autopaid bill
    await page.evaluate(() => { const n = []; hhBillsNight(n, dayKey()); window.__n = n; });
    assert.strictEqual(await page.evaluate(() => HB('ins').fees), 0);
    noErrors(errors);
  } },
  { name: 'gig work: pays, costs battery and time, slower on the island, 4 a day', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'stDock', 1, 600);
    await install(page, 'gigs');
    await page.evaluate(() => { S.money = 100; S.t = 1440 + 600; S.phoneT = S.t; phoneOpen('gigs'); });
    await tap(page, 'Take a survey');
    let r = await page.evaluate(() => ({ money: S.money, t: S.t, ph: S.phone }));
    assert.strictEqual(r.money, 103); assert.strictEqual(r.t, 1440 + 610); assert.ok(r.ph <= 98, 'battery used');
    // on the island: +10 minutes to upload
    await page.evaluate(() => { S.loc = 'home'; phoneRender(); });
    const t0 = await page.evaluate(() => S.t);
    await tap(page, 'Transcribe a voicemail');
    r = await page.evaluate(() => ({ money: S.money, t: S.t }));
    assert.strictEqual(r.money, 109); assert.strictEqual(r.t - t0, 30);
    assert.match(await log(page), /upload on one bar/);
    await tap(page, 'Tag photos'); await tap(page, 'Take a survey');
    assert.strictEqual(await page.evaluate(() => GIG().n), 4);
    assert.match(await phoneText(page), /0 of 4 left today/);
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: 'Take a survey' }).count(), 'disabled after 4');
    assert.strictEqual(await page.evaluate(() => gigDo('survey')), false);
    // a new day resets the count
    await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 600; });
    assert.strictEqual(await page.evaluate(() => GIG().n), 0);
    noErrors(errors);
  } },
  { name: 'gig work: shows the job and opens the job listings', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'home', 0, 600);
    await install(page, 'gigs');
    await page.evaluate(() => phoneOpen('gigs'));
    assert.match(await phoneText(page), /You work as Office job, Lakewood/);
    await page.evaluate(() => { S.emp = null; S.interview = { job: 'riv', day: 2, time: 900, loc: 'food' }; phoneRender(); });
    const t = await phoneText(page);
    assert.match(t, /out of work/); assert.match(t, /Interview:.*Line cook at the Riv/);
    await page.evaluate(() => { S.interview = null; });
    assert.strictEqual(await page.evaluate(() => phoneApp('gigs').badge()), 1);
    await tap(page, 'Browse job listings');
    await page.waitForSelector('#mbg');
    assert.match(await page.textContent('#mbg'), /Job listings/);
    noErrors(errors);
  } },
  { name: 'market: order → terminal locker → groceries in hand; order window; one at a time', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'home', 1, 390);
    await install(page, 'market');
    await page.evaluate(() => { S.money = 200; S.t = 1440 + 390; phoneOpen('market'); });
    assert.match(await phoneText(page), /Orders 7:00 AM–7:00 PM/);
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: '3 days of food' }).count(), 'closed before 7 AM');
    assert.strictEqual(await page.evaluate(() => mktPlace(3)), false);
    await page.evaluate(() => { S.t = 1440 + 600; S.phoneT = S.t; phoneRender(); });
    await tap(page, '3 days of food');
    let r = await page.evaluate(() => ({ money: S.money, o: MKT().order, t: S.t }));
    assert.strictEqual(r.money, 200 - 59); assert.strictEqual(r.o.n, 3); assert.strictEqual(r.o.at, r.t + 120);
    assert.strictEqual(r.t, 1440 + 610, 'one bar: 10 min to order');
    assert.match(await phoneText(page), /Being packed/);
    assert.strictEqual(await page.evaluate(() => mktPlace(5)), false, 'one order at a time');
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: '5 days of food' }).count());
    // after 7 PM: no new orders
    await page.evaluate(() => { const o = MKT().order; MKT().order = null; S.t = 1440 + 1150; const ok = mktPlace(3); MKT().order = o; window.__late = ok; });
    assert.strictEqual(await page.evaluate(() => window.__late), false);
    // at the terminal before it's ready: a disabled note
    await page.evaluate(() => { phoneClose(); S.loc = 'stDock'; S.t = 1440 + 650; render(); });
    assert.ok(await page.locator('button.act[disabled]', { hasText: 'still being packed' }).count());
    await page.evaluate(() => { S.t = MKT().order.at; render(); });
    const c0 = await page.evaluate(() => S.carried);
    await page.locator('button.act', { hasText: 'Pick up your grocery order' }).click();
    r = await page.evaluate(() => ({ carried: S.carried, o: MKT().order }));
    assert.strictEqual(r.carried, c0 + 3); assert.strictEqual(r.o, null);
    assert.match(await log(page), /Locker 9/);
    noErrors(errors);
  } },
  { name: 'market: cold items spoil if not picked up by closing; card pays when broke', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await at(page, 'stDock', 2, 900);
    await install(page, 'market');
    await page.evaluate(() => { S.money = 10; });
    assert.ok(await page.evaluate(() => mktPlace(5)), 'essentials go on the card');
    assert.strictEqual(await page.evaluate(() => S.money), 10 - 93);
    await page.evaluate(() => { S.t = 2 * 1440 + 1330; afterAction(); });
    let r = await page.evaluate(() => MKT().order);
    assert.ok(r.spoiled); assert.strictEqual(r.n, 2);
    assert.match(await log(page), /3 days of food spoiled/);
    // the rest can still be picked up, on foot up to 4 days in hand
    await page.evaluate(() => { S.carried = 3; render(); });
    await page.locator('button.act', { hasText: 'Pick up your grocery order' }).click();
    r = await page.evaluate(() => ({ carried: S.carried, o: MKT().order }));
    assert.strictEqual(r.carried, 4); assert.strictEqual(r.o.n, 1, 'one day left in the locker');
    // overnight: an order nobody picked up spoils before morning
    await page.evaluate(() => { MKT().order = null; S.money = 500; S.t = 2 * 1440 + 800; mktPlace(3); const n = []; upkeepNight('home', n, day()); window.__n = n.join(' '); });
    assert.match(await page.evaluate(() => window.__n), /spoiled/);
    assert.strictEqual(await page.evaluate(() => MKT().order.n), 1);
    // shows in To-do
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Pick up your grocery order')));
    noErrors(errors);
  } },
  { name: 'an older save without the money apps’ state loads and the apps work', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { saveGame(); const d = JSON.parse(localStorage.getItem('islandtime.save')); delete d.S.ph; localStorage.setItem('islandtime.save', JSON.stringify(d)); });
    await reload(page);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.loc = 'stDock'; S.t = S.cur * 1440 + 600; S.phone = 100; for (const id of ['bank', 'gigs', 'market']) phoneInstall(id); });
    for (const id of ['bank', 'gigs', 'market']) {
      await page.evaluate(id => phoneOpen(id), id);
      assert.doesNotMatch(await phoneText(page), /Something went wrong/);
    }
    await page.evaluate(() => { phoneClose(); endDay('terminal'); });
    noErrors(errors);
  } },
];
