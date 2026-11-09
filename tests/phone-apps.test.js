const { open, newGame, reload, noErrors, assert } = require('./helpers');

const APPS = ['group', 'ferry', 'jobs', 'flash', 'notes'];
const phoneText = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
// click a button inside the phone by its label
const tap = (page, label) => page.locator('#phoneUI button', { hasText: label }).first().click();

// The phone isn't in the committed offline build until it is rebuilt for a release, so these run on index.html only.
module.exports = [
  { only: 'index.html', name: 'App Store lists the installable apps; home screen shows Clock and App Store', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => phoneOpen());
    const home = await phoneText(page);
    assert.match(home, /App Store/); assert.match(home, /Clock/); assert.match(home, /0\/5/);
    await page.evaluate(() => phoneGo('store'));
    const t = await phoneText(page);
    for (const n of ['Island Group', 'Ferry Alerts', 'Job Hunt', 'Flashlight', 'Notes']) assert.ok(t.includes(n), 'store lists ' + n);
    assert.match(t, /0 of 5 slots used/);
    assert.match(t, /MB/);
    noErrors(errors);
  } },
  { only: 'index.html', name: 'install takes 6 min on the island, 1 on the mainland; narrated', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.t = 10 * 60; phoneOpen('store'); });
    const t0 = await page.evaluate(() => S.t);
    await page.locator('#phoneUI .ph-store', { hasText: 'Ferry Alerts' }).locator('button', { hasText: 'Install' }).click();
    const r = await page.evaluate(() => ({ dt: S.t, inst: phoneInstalled('ferry') }));
    assert.strictEqual(r.dt - t0, 6); assert.ok(r.inst);
    assert.match(await phoneText(page), /installed in 6 minutes/);
    assert.match(await page.evaluate(() => S.log.map(e => e.s).join(' ')), /Installed <b>Ferry Alerts<\/b>/);
    await page.evaluate(() => { S.loc = 'stDock'; render(); });
    const t1 = await page.evaluate(() => S.t);
    await page.locator('#phoneUI .ph-store', { hasText: 'Notes' }).locator('button', { hasText: 'Install' }).click();
    assert.strictEqual(await page.evaluate(() => S.t) - t1, 1);
    assert.match(await phoneText(page), /installed in 1 minute\b/);
    noErrors(errors);
  } },
  { only: 'index.html', name: '5-slot limit enforced; removing frees a slot', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => {
      definePhoneApp({ id: 'extra', name: 'Extra', ic: '🧪', desc: 'A sixth app', view: () => '<p>x</p>' });
      S.loc = 'stDock'; for (const id of ['group', 'ferry', 'jobs', 'flash', 'notes']) phoneInstall(id);
      phoneOpen('store');
    });
    assert.strictEqual(await page.evaluate(() => phoneFree()), 0);
    const t = await phoneText(page);
    assert.match(t, /5 of 5 slots used — remove an app to install another/);
    assert.ok(await page.locator('#phoneUI .ph-store', { hasText: 'Extra' }).locator('button[disabled]', { hasText: 'Install' }).count(), 'install disabled when full');
    assert.strictEqual(await page.evaluate(() => phoneStoreInstall('extra')), false);
    await page.locator('#phoneUI .ph-store', { hasText: 'Flashlight' }).locator('button', { hasText: 'Remove' }).click();
    assert.deepStrictEqual(await page.evaluate(() => [phoneFree(), phoneInstalled('flash')]), [1, false]);
    await page.locator('#phoneUI .ph-store', { hasText: 'Extra' }).locator('button', { hasText: 'Install' }).click();
    assert.ok(await page.evaluate(() => phoneInstalled('extra')));
    noErrors(errors);
  } },
  { only: 'index.html', name: 'each placeholder app opens without errors', fn: async ctx => {
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
  { only: 'index.html', name: 'Island Group posts for help; the old Here action is gone', fn: async ctx => {
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
  { only: 'index.html', name: 'Ferry Alerts shows next sailings, last boat and a known outage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'home'; S.t = 9 * 60; phoneInstall('ferry'); phoneOpen('ferry'); });
    let t = await phoneText(page);
    assert.match(t, /Next sailings from Anderson Island/); assert.match(t, /Last boat tonight/);
    assert.strictEqual(await page.locator('#phoneUI .ph-li').count(), 3);
    await page.evaluate(() => { S.week.b.push({ start: S.t - 10, end: S.t + 200, cause: 'test engine failure' }); render(); });
    t = await phoneText(page);
    assert.match(t, /Rider alert/); assert.match(t, /test engine failure/);
    noErrors(errors);
  } },
  { only: 'index.html', name: 'Job Hunt opens the job listings', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'stDock'; phoneInstall('jobs'); phoneOpen('jobs'); });
    await tap(page, 'Browse job listings');
    assert.match(await page.textContent('#mbg h2'), /Job listings/);
    noErrors(errors);
  } },
  { only: 'index.html', name: 'Flashlight drains battery; outage relief once', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.t = 10 * 60; phoneInstall('flash'); S.phone = 80; S.phoneT = S.t;
      const base = (() => { const s = S.phone; S.t += 60; afterAction(); const d = s - S.phone; S.phone = 80; S.phoneT = S.t; return d; })();
      phoneFlash(true); S.t += 60; afterAction();
      const lit = 80 - S.phone; phoneFlash(false);
      S.power = { start: S.t - 5, end: S.t + 300 }; S.stress = 50;
      phoneFlash(true); const s1 = S.stress; phoneFlash(false); phoneFlash(true); const s2 = S.stress;
      return { base, lit, s1, s2 };
    });
    assert.strictEqual(r.lit - r.base, 6, 'about 1% per 10 min extra: ' + JSON.stringify(r));
    assert.ok(r.s1 < 50, 'stress relief in an outage'); assert.strictEqual(r.s2, r.s1, 'only once per outage');
    noErrors(errors);
  } },
  { only: 'index.html', name: 'Notes adds and checks off priorities', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.prios = []; S.loc = 'stDock'; phoneInstall('notes'); phoneOpen('notes'); });
    await tap(page, 'Pay rent');
    await page.fill('#phNoteIn', 'Feed the cat');
    await page.locator('#phoneUI .ph-add button').click();
    assert.deepStrictEqual(await page.evaluate(() => S.prios.map(q => q.t)), ['Pay rent', 'Feed the cat']);
    await page.locator('#phoneUI .ph-todo', { hasText: 'Pay rent' }).click();
    assert.deepStrictEqual(await page.evaluate(() => S.prios.map(q => q.t + (q.done ? '✓' : ''))), ['Feed the cat', 'Pay rent✓']);
    noErrors(errors);
  } },
  { only: 'index.html', name: 'Clock shows alarms and opens the alarm modal above the phone', fn: async ctx => {
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
  { only: 'index.html', name: 'installed apps persist through save and reload', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.loc = 'stDock'; phoneInstall('ferry'); phoneInstall('notes'); saveGame(); });
    await reload(page);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    assert.deepStrictEqual(await page.evaluate(() => [phoneInstalled('ferry'), phoneInstalled('notes'), phoneInstalled('group'), phoneFree()]), [true, true, false, 3]);
    noErrors(errors);
  } },
];
