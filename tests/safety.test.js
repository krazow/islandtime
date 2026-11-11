const { open, newGame, noErrors, assert } = require('./helpers');

// 🛡️ "Are you sure?" prompts (52-safety.js) and ↩️ Undo (53-undo.js)
const setup = (page, o) => page.evaluate(o => {
  crossing = (a, b, c, done) => done();
  S.week.b = []; S.week.fog = S.week.fog.map(() => 0);
  S.cur = o.d; S.t = o.d * 1440 + o.m; S.phoneT = S.t; S.phone = 100; S.loc = o.loc;
  if (o.car) S.cars[0].loc = o.car; S.cars.forEach(c => { c.fuel = c.tank; });
  if (o.pantry != null) S.pantry = o.pantry; if (o.money != null) S.money = o.money;
  MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, o);
const modalText = page => page.evaluate(() => { const m = document.getElementById('mbg'); return m ? m.textContent : ''; });
const clickModal = async (page, re) => { for (const x of await page.$$('#mbg .act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
const clickAct = async (page, re) => { for (const x of await page.$$('#app .content button.act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no action ' + re); };
const state = page => page.evaluate(() => ({ loc: S.loc, t: S.t, cur: S.cur, money: S.money, over: !!S.over, car: S.cars[0].loc }));

module.exports = [
  { name: 'walking on with your car here asks first; Go back changes nothing, confirming leaves the car', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' });
    const s0 = await state(page);
    await clickAct(page, /Walk on the next sailing/);
    assert.match(await modalText(page), /Leave your car behind/);
    await clickModal(page, /Go back/);
    assert.deepStrictEqual(await state(page), s0);
    await clickAct(page, /Walk on the next sailing/);
    await clickModal(page, /Walk on, leave the car/);
    const s1 = await state(page);
    assert.strictEqual(s1.loc, 'aiDock'); assert.strictEqual(s1.car, 'stDock');
    noErrors(errors);
  } },
  { name: 'no prompt when a car waits on the other side, or when the prompts are turned off in Settings', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' });
    await page.evaluate(() => { S.cars.push({ id: 'beat', name: 'Mainland beater', loc: 'aiDock', fuel: 5, tank: 12, diesel: false }); });
    await page.evaluate(() => waitFerry('walk'));
    assert.ok(!(await modalText(page)).includes('Leave your car'), 'a car waits on the island');
    assert.strictEqual((await state(page)).loc, 'aiDock');
    // Settings toggle
    await setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' });
    await page.evaluate(() => { S.cars = S.cars.slice(0, 1); openSettings(); });
    assert.match(await modalText(page), /“Are you sure\?” prompts: On/);
    await clickModal(page, /Are you sure/);
    assert.match(await modalText(page), /prompts: Off/);
    assert.strictEqual(await page.evaluate(() => prefs().safeOff), true);
    await clickModal(page, /^Close/);
    await page.evaluate(() => waitFerry('walk'));
    assert.strictEqual((await state(page)).loc, 'aiDock', 'walked on without asking');
    noErrors(errors);
  } },
  { name: 'walking on after the last car sailing says so; the "No more car sailings" window is the only prompt on that path', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    // a long outage: later boats are passenger-only
    const prep = () => setup(page, { d: 1, m: 600, loc: 'stDock', car: 'stDock' }).then(() => page.evaluate(() => { S.week.b = [{ start: S.t - 1000, end: S.t + 1000, cause: 'generator failure' }]; render(); }));
    await prep();
    await clickAct(page, /Walk on the next sailing/);
    assert.match(await modalText(page), /last car sailing has gone/);
    await clickModal(page, /Go back/);
    assert.strictEqual((await state(page)).loc, 'stDock');
    await prep();
    await page.evaluate(() => waitFerry('drive'));
    assert.match(await modalText(page), /No more car sailings tonight/);
    await clickModal(page, /^Walk on the/);
    assert.strictEqual((await state(page)).loc, 'aiDock', 'one window was enough');
    noErrors(errors);
  } },
  { name: 'going to bed hungry with food in reach asks; with the Riv closed or food in the pantry it does not', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 1140, loc: 'home', car: 'home', pantry: 0, money: 100 });
    await clickAct(page, /Go to bed/);
    assert.match(await modalText(page), /Go to bed hungry/); assert.match(await modalText(page), /Riv/);
    await clickModal(page, /Go back/);
    assert.strictEqual((await state(page)).cur, 1);
    await clickAct(page, /Go to bed/);
    await clickModal(page, /Go to bed hungry/);
    assert.strictEqual((await state(page)).cur, 2, 'the day ended');
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    await setup(page, { d: 2, m: 1300, loc: 'home', car: 'home', pantry: 0, money: 100 });   // the Riv closes at 9 PM
    await clickAct(page, /Go to bed/);
    assert.strictEqual((await state(page)).cur, 3, 'nothing within reach, no prompt');
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    await setup(page, { d: 3, m: 1140, loc: 'home', car: 'home', pantry: 3, money: 100 });
    await clickAct(page, /Go to bed/);
    assert.strictEqual((await state(page)).cur, 4, 'food in the pantry, no prompt');
    noErrors(errors);
  } },
  { name: 'a visit’s last day: a trip that would miss the last boat, and ending the day before it, both ask', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { crossing = (a, b, c, done) => done(); visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.week.b = []; S.week.fog = S.week.fog.map(() => 0); });
    const info = await page.evaluate(() => { const V = VS(); S.cur = V.last; S.t = V.last * 1440 + 1335; S.phoneT = S.t; S.loc = 'lake'; S.cars[0].loc = 'lake'; S.cars[0].fuel = S.cars[0].tank; S.phone = 100; return { last: Math.max(...deps('I', V.last)) }; });
    assert.strictEqual(info.last, 1370);
    await page.evaluate(() => go('jacobs', { m: 'car', l: 'car', min: 10 }));
    assert.match(await modalText(page), /miss the last boat/);
    await clickModal(page, /Go back/);
    assert.strictEqual((await state(page)).loc, 'lake');
    await page.evaluate(() => go('andys', { m: 'car', l: 'car', min: 2 }));
    assert.ok(!(await modalText(page)).includes('miss the last boat'), 'a short hop is fine');
    assert.strictEqual((await state(page)).loc, 'andys');
    // ending the day on the island before the last boat leaves
    const bed = await page.evaluate(() => { S.loc = 'home'; S.t = VS().last * 1440 + 1100; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); return actions().filter(a => /^Go to bed|^Turn in early|^Sleep in/.test(a.l)).map(a => a.l); });
    if (bed.length) {
      await clickAct(page, new RegExp('^' + bed[0].slice(0, 8)));
      const t = await modalText(page);
      assert.ok(/Skip the last boat home|Go to bed hungry/.test(t), t);
    }
    noErrors(errors);
  } },
  { name: 'Weekend regular: buying the house asks first and then ends the month', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { crossing = (a, b, c, done) => done(); visitorNew('regular', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); const R = REG(); R.offered = true; R.house = { ask: regDown(), at: 0, by: 'Marta' }; S.money = 9000; });
    await page.evaluate(() => regBuy());
    assert.match(await modalText(page), /Buy the house/);
    await clickModal(page, /Go back/);
    assert.strictEqual(await page.evaluate(() => !!S.over || !!REG().bought), false);
    await page.evaluate(() => regBuy());
    await clickModal(page, /Yes, buy it/);
    assert.strictEqual(await page.evaluate(() => !!REG().bought && !!S.over), true);
    noErrors(errors);
  } },
  { name: 'Undo: moving somewhere and buying dinner can be undone once; the button then goes away', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { setPref('goOpen', true); S.money = 200; render(); });
    assert.ok(!(await page.$('.undobtn')));
    const s0 = await state(page);
    await page.click('.dest:has-text("Lake Josephine") .chip:has-text("🚗")');
    assert.strictEqual((await state(page)).loc, 'lake');
    assert.match(await page.textContent('.undobtn'), /Undo/);
    await page.click('.undobtn');
    assert.deepStrictEqual(await state(page), s0);
    assert.ok(!(await page.$('.undobtn')), 'one step only');
    assert.match(await page.textContent('.narr'), /Undid/);
    // buy dinner at the Riv, then undo the money
    await page.evaluate(() => { S.loc = 'food'; S.cars[0].loc = 'food'; S.t = S.cur * 1440 + 1000; render(); });
    const m0 = await page.evaluate(() => S.money);
    await clickAct(page, /Takeout dinner/);
    assert.strictEqual(await page.evaluate(() => S.money), m0 - 27);
    await page.click('.undobtn');
    assert.deepStrictEqual(await page.evaluate(() => [S.money, S.ateOut === day()]), [m0, false]);
    noErrors(errors);
  } },
  { name: 'Undo is not offered after a day ends, after a modal, or once something else has happened', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page, { d: 1, m: 1140, loc: 'home', car: 'home', pantry: 3, money: 100 });
    await clickAct(page, /Go to bed/);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
    assert.ok(!(await page.$('.undobtn')), 'not after the day ends');
    assert.strictEqual(await page.evaluate(() => undoAvail()), false);
    await setup(page, { d: 2, m: 600, loc: 'home', car: 'home' });
    await clickAct(page, /Alarm/);
    assert.ok(await page.$('#mbg'));
    assert.strictEqual(await page.evaluate(() => undoAvail()), false, 'a modal opened');
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
    // an action, then time passes by some other route: stale
    await newGame(page);
    await page.evaluate(() => { setPref('goOpen', true); render(); });
    await page.click('.dest:has-text("Lake Josephine") .chip:has-text("🚗")');
    assert.strictEqual(await page.evaluate(() => undoAvail()), true);
    await page.evaluate(() => { S.t += 10; say('something else'); render(); });
    assert.ok(!(await page.$('.undobtn')), 'state moved on');
    noErrors(errors);
  } },
];
