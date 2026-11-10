const { open, newGame, reload, noErrors, assert } = require('./helpers');

const phoneText = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
const tap = (page, label) => page.locator('#phoneUI button', { hasText: label }).first().click();
// a fresh game with Telehealth installed, on day d at time m, at loc
async function setup(page, d, m, loc) {
  await newGame(page);
  await page.evaluate(([d, m, loc]) => {
    S.loc = 'stDock'; phoneInstall('telehealth');
    S.cur = d; S.t = d * 1440 + m; S.phoneT = S.t; S.phone = 90; S.money = 500; S.loc = loc;
    phoneOpen('telehealth');
  }, [d, m, loc]);
}

module.exports = [
  { name: 'Telehealth fails on one bar: the video freezes on your face', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, 3, 600, 'home');
    assert.match(await phoneText(page), /One bar/);
    const t0 = await page.evaluate(() => S.t);
    await tap(page, 'Renew my prescription');
    assert.match(await phoneText(page), /freezes on your own face/);
    const r = await page.evaluate(() => ({ dt: S.t, rx: S.rx, money: S.money, visit: PH().tele.visit, mail: PH().tele.mail }));
    assert.deepStrictEqual(r, { dt: t0 + 5, rx: false, money: 500, visit: -1, mail: -1 });
    noErrors(errors);
  } },
  { name: 'Telehealth on the mainland renews the prescription by mail; the Saturday penalty doesn’t hit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, 4, 600, 'stDock');   // Friday
    assert.match(await phoneText(page), /Four bars/);
    const b0 = await page.evaluate(() => S.phone);
    await tap(page, 'Renew my prescription');
    let r = await page.evaluate(() => ({ t: S.t, money: S.money, rx: S.rx, mail: PH().tele.mail, dk: dayKey(), bat: S.phone }));
    assert.strictEqual(r.t, 4 * 1440 + 620, '20 minutes');
    assert.strictEqual(r.money, 470, '$20 visit + $10 meds');
    assert.strictEqual(r.rx, false, 'not until the mail comes');
    assert.strictEqual(r.mail, r.dk + 1);
    assert.ok(b0 - r.bat >= 8, 'video eats battery');
    const t = await phoneText(page);
    assert.match(t, /Prescription renewed/);
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: 'stressed' }).count(), 'once a day');
    assert.strictEqual(await page.evaluate(() => teleVisit('stress')), false);
    // the to-do item knows
    assert.ok(await page.evaluate(() => todoItems().some(i => /prescription/.test(i.l) && /In the mail/.test(i.s) && !i.urgent)));
    // Saturday: nothing before 1 PM, then it's in the box
    r = await page.evaluate(() => { phoneClose(); S.loc = 'home'; S.cur = 5; S.t = 5 * 1440 + 600; processTimed(); const a = S.rx; S.t = 5 * 1440 + 800; processTimed(); return [a, S.rx]; });
    assert.deepStrictEqual(r, [false, true]);
    assert.match(await page.evaluate(() => S.log.map(e => e.s).join(' ')), /prescription came in the mail/);
    // Saturday night: no prescription penalty
    r = await page.evaluate(() => { S.t = 5 * 1440 + 1300; S.health = 50; const n = S.log.length; endDay('home'); return S.log.slice(n).map(e => e.s).join(' '); });
    assert.ok(!/out of your prescription/.test(r), r);
    noErrors(errors);
  } },
  { name: 'Telehealth works on the Riv’s Wi-Fi: stress advice, then health advice the next day', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, 1, 720, 'food');
    await page.evaluate(() => { S.stress = 50; S.health = 50; render(); });
    assert.match(await phoneText(page), /Riv’s Wi-Fi/);
    assert.match(await phoneText(page), /Too early/, 'too early in the week to renew');
    await tap(page, 'stressed');
    assert.deepStrictEqual(await page.evaluate(() => [S.stress, S.money]), [42, 480]);
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: 'run down' }).count(), 'once a day');
    await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 720; S.phoneT = S.t; render(); });
    await tap(page, 'run down');
    assert.deepStrictEqual(await page.evaluate(() => [S.health, S.money]), [53, 460]);
    noErrors(errors);
  } },
  { name: 'Telehealth can’t treat the ankle: go to Urgent Care, no charge', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, 2, 600, 'stDock');
    await page.evaluate(() => { S.injury = { day: 2, treated: false }; render(); });
    await tap(page, 'My ankle');
    assert.match(await phoneText(page), /Urgent Care/);
    const r = await page.evaluate(() => ({ treated: S.injury.treated, money: S.money, visit: PH().tele.visit }));
    assert.deepStrictEqual(r, { treated: false, money: 500, visit: -1 });
    assert.ok(await page.locator('#phoneUI button:not([disabled])', { hasText: 'stressed' }).count(), 'the daily visit is still there');
    noErrors(errors);
  } },
  { name: 'Island Group shows your reputation and the last few replies', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.rep = 25; S.loc = 'stDock'; phoneInstall('group'); phoneOpen('group'); });
    let t = await phoneText(page);
    assert.match(t, /Known · \+25/); assert.match(t, /What your reputation gets you/);
    assert.ok(!/Recent replies/.test(t));
    await page.evaluate(() => { for (let i = 0; i < 4; i++) postReplies({ task: 'general' }); render(); });
    t = await phoneText(page);
    assert.match(t, /Recent replies/);
    assert.strictEqual(await page.locator('#phoneUI .ph-grp').count(), 3, 'keeps the last three');
    noErrors(errors);
  } },
  { name: 'old save with retired apps loads, frees the slots and says so once', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => {
      S.loc = 'stDock'; phoneInstall('group');
      PH().apps.push('flash', 'notes'); PH().flash = { on: true, t: S.t, acc: 0, out: -1 };
      saveGame();
    });
    await reload(page);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    await page.waitForSelector('#mbg');
    assert.match(await page.textContent('#mbg'), /apps were retired in this update: Flashlight and Notes/);
    let r = await page.evaluate(() => ({ apps: PH().apps, free: phoneFree(), flash: 'flash' in PH(), n: S.log.filter(e => /retired/.test(e.s)).length }));
    assert.deepStrictEqual(r, { apps: ['group'], free: 4, flash: false, n: 1 });
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); phoneOpen(); });
    assert.match(await page.evaluate(() => document.getElementById('phoneUI').textContent), /1\/5/);
    await page.evaluate(() => { phoneClose(); saveGame(); });
    await reload(page);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    assert.ok(!/retired/.test(await page.evaluate(() => (document.querySelector('#mbg') || {}).textContent || '')), 'notice only once');
    assert.strictEqual(await page.evaluate(() => S.log.filter(e => /retired/.test(e.s)).length), 1);
    noErrors(errors);
  } },
];
