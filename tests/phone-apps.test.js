const { open, newGame, reload, noErrors, assert } = require('./helpers');

const APPS = ['group'];
const RETIRED = ['ferry', 'jobs', 'flash', 'notes'];
const phoneText = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
// click a button inside the phone by its label
const tap = (page, label) => page.locator('#phoneUI button', { hasText: label }).first().click();

// The phone isn't in the committed offline build until it is rebuilt for a release, so these run on index.html only.
module.exports = [
  { name: 'App Store lists the installable apps; home screen shows Clock and App Store', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => phoneOpen());
    const home = await phoneText(page);
    assert.match(home, /App Store/); assert.match(home, /Clock/); assert.match(home, /0\/5/);
    await page.evaluate(() => phoneGo('store'));
    const t = await phoneText(page);
    assert.ok(t.includes('Island Group'), 'store lists Island Group');
    for (const n of ['Ferry Alerts', 'Job Hunt', 'Flashlight', 'Notes']) assert.ok(!t.includes(n), 'retired app not listed: ' + n);
    assert.deepStrictEqual(await page.evaluate(ids => ids.filter(id => phoneApp(id)), RETIRED), [], 'retired apps are gone');
    assert.match(t, /0 of 5 slots used/);
    assert.match(t, /MB/);
    noErrors(errors);
  } },
  { name: 'install takes 6 min on the island, 1 on the mainland; narrated', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.t = 10 * 60; phoneOpen('store'); });
    const t0 = await page.evaluate(() => S.t);
    await page.locator('#phoneUI .ph-store', { hasText: 'Island Group' }).locator('button', { hasText: 'Install' }).click();
    const r = await page.evaluate(() => ({ dt: S.t, inst: phoneInstalled('group') }));
    assert.strictEqual(r.dt - t0, 6); assert.ok(r.inst);
    assert.match(await phoneText(page), /installed in 6 minutes/);
    assert.match(await page.evaluate(() => S.log.map(e => e.s).join(' ')), /Installed <b>Island Group<\/b>/);
    await page.evaluate(() => { definePhoneApp({ id: 'extra', name: 'Extra', ic: '🧪', desc: 'A test app', view: () => '<p>x</p>' }); S.loc = 'stDock'; render(); });
    const t1 = await page.evaluate(() => S.t);
    await page.locator('#phoneUI .ph-store', { hasText: 'Extra' }).locator('button', { hasText: 'Install' }).click();
    assert.strictEqual(await page.evaluate(() => S.t) - t1, 1);
    assert.match(await phoneText(page), /installed in 1 minute\b/);
    noErrors(errors);
  } },
  { name: '5-slot limit enforced; removing frees a slot', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => {
      for (let i = 1; i <= 4; i++) definePhoneApp({ id: 'fill' + i, name: 'Filler ' + i, ic: '🧪', desc: 'A test app', view: () => '<p>x</p>' });
      definePhoneApp({ id: 'extra', name: 'Extra', ic: '🧪', desc: 'A sixth app', view: () => '<p>x</p>' });
      S.loc = 'stDock'; for (const id of ['group', 'fill1', 'fill2', 'fill3', 'fill4']) phoneInstall(id);
      phoneOpen('store');
    });
    assert.strictEqual(await page.evaluate(() => phoneFree()), 0);
    const t = await phoneText(page);
    assert.match(t, /5 of 5 slots used — remove an app to install another/);
    assert.ok(await page.locator('#phoneUI .ph-store', { hasText: 'Extra' }).locator('button[disabled]', { hasText: 'Install' }).count(), 'install disabled when full');
    assert.strictEqual(await page.evaluate(() => phoneStoreInstall('extra')), false);
    await page.locator('#phoneUI .ph-store', { hasText: 'Filler 2' }).locator('button', { hasText: 'Remove' }).click();
    assert.deepStrictEqual(await page.evaluate(() => [phoneFree(), phoneInstalled('fill2')]), [1, false]);
    await page.locator('#phoneUI .ph-store', { hasText: 'Extra' }).locator('button', { hasText: 'Install' }).click();
    assert.ok(await page.evaluate(() => phoneInstalled('extra')));
    noErrors(errors);
  } },
  { name: 'each built-in app and Island Group opens without errors', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(apps => { S.loc = 'stDock'; apps.forEach(phoneInstall); phoneOpen(); }, APPS);
    for (const id of APPS.concat(['clock', 'store'])) {
      await page.evaluate(id => { phoneHome(); phoneGo(id); }, id);
      const t = await phoneText(page);
      assert.ok(!/Something went wrong/.test(t), id + ' rendered: ' + t.slice(0, 200));
      assert.ok(await page.locator('#phoneUI .ph-bar').count(), id + ' open');
    }
    noErrors(errors);
  } },
  { name: 'Island Group posts for help; the old Here action is gone', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.t = 10 * 60; setTab('act'); });
    assert.strictEqual(await page.locator('button.act', { hasText: 'Post asking for help' }).count(), 0, 'old action removed');
    assert.ok(await page.evaluate(() => { const a = []; helpActions(a, day(), tod()); return !a.some(x => /Post asking|community group today|Waiting for replies/.test(x.l)) && a.some(x => /Help a neighbor/.test(x.l)); }));
    await page.evaluate(() => { phoneInstall('group'); phoneOpen('group'); });
    await tap(page, 'Post asking for help');
    await page.locator('#mbg button.act', { hasText: 'General help around the house' }).click();
    const r = await page.evaluate(() => ({ post: S.comm.post === dayKey(), job: !!upJob('post') }));
    assert.ok(r.post && r.job, 'posted');
    assert.match(await phoneText(page), /Waiting for replies/);
    assert.ok(await page.locator('#phoneUI button[disabled]', { hasText: 'Post asking for help' }).count(), 'once a day');
    // replies light the badge (when you're not looking at the app)
    await page.evaluate(() => { phoneHome(); S.t = upJob('post').due + 1; afterAction(); });
    assert.strictEqual(await page.evaluate(() => phoneApp('group').badge()), 1);
    noErrors(errors);
  } },
  { name: 'Clock shows alarms and opens the alarm modal above the phone', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => phoneOpen('clock'));
    assert.ok((await phoneText(page)).includes(await page.evaluate(() => alarmTxt())));
    await tap(page, 'Set alarms');
    assert.match(await page.textContent('#mbg h2'), /Set your alarms/);
    const z = await page.evaluate(() => [+getComputedStyle(document.getElementById('mbg')).zIndex, +getComputedStyle(document.getElementById('phoneUI')).zIndex]);
    assert.ok(z[0] > z[1], 'modal above the phone ' + z);
    noErrors(errors);
  } },
  { name: 'installed apps persist through save and reload', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'stDock'; phoneInstall('group'); phoneInstall('telehealth'); saveGame(); });
    await reload(page);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    assert.deepStrictEqual(await page.evaluate(() => [phoneInstalled('group'), phoneInstalled('telehealth'), phoneFree()]), [true, true, 3]);
    noErrors(errors);
  } },
];
