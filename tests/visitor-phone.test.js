const { open, newGame, noErrors, assert } = require('./helpers');

const homeApps = page => page.evaluate(() => [...document.querySelectorAll('#phoneUI .ph-nm')].map(e => e.textContent));
const text = page => page.evaluate(() => (document.getElementById('phoneUI') || {}).textContent || '');
const ALL = ['bank', 'gigs', 'market', 'telehealth', 'rides'];

module.exports = [
  { name: 'resident phone is unchanged: all apps installable, no Visit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(ids => ({
      store: phoneStoreApps().map(a => a.id), visit: !!phoneApp('visit'), inst: phoneInstalled('visit'),
      has: ids.every(id => phoneApp(id)),
    }), ALL);
    assert.ok(!r.visit && !r.inst && r.has);
    for (const id of ['group', 'bank', 'gigs', 'market', 'telehealth', 'rides', 'ferrypass', 'weather']) assert.ok(r.store.includes(id), id);
    assert.ok(!r.store.includes('visit'));
    await page.evaluate(() => phoneOpen());
    const apps = await homeApps(page);
    assert.ok(!apps.includes('Visit')); assert.ok(apps.includes('Messages') && apps.includes('App Store'));
    await page.evaluate(() => phoneOpen('visit'));
    assert.ok(!(await text(page)).includes('Things to see'));
    noErrors(errors);
  } },
  { name: 'visitor phone hides work apps and shows Visit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { PH().apps.push('bank', 'gigs'); S.visitor = vsInit('weekend', 'tacoma'); phoneOpen(); });
    const apps = await homeApps(page);
    for (const n of ['Visit', 'Messages', 'Phone', 'App Store', 'Island Group', 'Ferry Pass']) assert.ok(apps.includes(n), n);
    for (const n of ['Island Credit Union', 'Gig Work']) assert.ok(!apps.includes(n), n);
    const r = await page.evaluate(ids => ({
      store: phoneStoreApps().map(a => a.id), inst: ids.map(id => phoneInstalled(id)), inst2: phoneInstall('market'),
    }), ALL);
    assert.deepStrictEqual(r.inst, ALL.map(() => false)); assert.ok(!r.inst2);
    for (const id of ALL) assert.ok(!r.store.includes(id), id);
    assert.ok(r.store.includes('group') && r.store.includes('weather'));
    // shortcuts to a hidden app go nowhere
    await page.evaluate(() => { phoneHome(); phoneGo('bank'); });
    assert.ok(!(await text(page)).includes('Credit Union'));
    await page.evaluate(() => phoneOpen('gigs'));
    assert.ok(!(await text(page)).includes('Gig Work'));
    noErrors(errors);
  } },
  { name: 'Visit app: plan, last boat, checklist and photos follow VS()', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.visitor = vsInit('weekend', 'seattle'); S.t = 600; phoneOpen('visit'); });
    let t = await text(page);
    assert.match(t, /Weekend/); assert.match(t, /Seattle/); assert.match(t, /Last boat home today/);
    assert.match(t, /Check-in/); assert.match(t, /0\/6/);
    assert.ok(!t.includes('✓ 🦅')); assert.ok(t.includes('📸 Photos'));
    await page.evaluate(() => { VS().seen.lake = 0; VS().seen.farm = 1; VS().photos.lake = 0; /* 0 = seen on a Monday */ phoneOpen('visit'); });
    t = await text(page);
    assert.match(t, /2\/6/); assert.match(t, /✓ 🦅 Lake Josephine 📸/); assert.match(t, /✓ 🚜 Johnson Farm museum(?! 📸)/); assert.match(t, /☐ 🌳/);
    await page.evaluate(() => { window.visitScore = () => 42; phoneOpen('visit'); });
    assert.match(await text(page), /Score so far: 42/);
    await page.locator('#phoneUI button', { hasText: 'Photos' }).first().click();
    t = await text(page);
    assert.match(t, /1 photo/); assert.match(t, /Lake Josephine/); assert.ok(!t.includes('Johnson Farm'));
    noErrors(errors);
  } },
];
