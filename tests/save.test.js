const { open, newGame, reload, noErrors, assert } = require('./helpers');

const rawSave = page => page.evaluate(() => JSON.parse(localStorage.getItem('islandtime.save')));

module.exports = [
  { name: 'save, reload, continue', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.money = 1234; S.t += 60; saveGame(); });
    const t = await page.evaluate(() => S.t);
    await reload(page);
    assert.match(await page.textContent('.title'), /Continue as T/);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    assert.deepStrictEqual(await page.evaluate(() => [S.money, S.t]), [1234, t]);
    noErrors(errors);
  } },
  { name: 'migrates a 1.3.1-style save missing newer fields', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => saveGame());
    const ok = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('islandtime.save'));
      delete d.S.prios; delete d.S.home; delete d.S.up; d.app = '1.3.1';
      const r = migrate(d);
      if (!Array.isArray(r.S.prios)) return 'prios';
      if (typeof r.S.home !== 'number') return 'home';
      if (!r.S.up || typeof r.S.up !== 'object' || typeof r.S.up.gutters !== 'number') return 'up';
      if (r.newer) return 'flagged as newer';
      adopt(r);
      for (const k of ['act', 'ferry', 'todo', 'log']) setTab(k);
      return document.querySelector('.hud') ? 'ok' : 'no hud';
    });
    assert.strictEqual(ok, 'ok');
    noErrors(errors);
  } },
  { name: 'version compare is numeric', fn: async ctx => {
    const { page } = await open(ctx);
    const r = await page.evaluate(() => [verCmp('1.10.0', '1.9.2') > 0, verCmp('1.9.9', '1.10.1') < 0, verCmp('1.10', '1.10.0') === 0, verCmp('2.0.0', '1.99.99') > 0]);
    assert.deepStrictEqual(r, [true, true, true, true]);
  } },
  { name: 'warns once when a local save is from a newer version', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.money = 777; saveGame(); });
    const d = await rawSave(page);
    d.app = '99.0.1'; d.S.futureThing = { keep: 1 };
    // S = null so the page's save-on-leave doesn't overwrite our doctored save during reload
    await page.evaluate(v => { S = null; ['islandtime.save', 'islandtime.save.v2', 'islandtime.save.v1'].forEach(k => localStorage.setItem(k, v)); }, JSON.stringify(d));
    await reload(page);
    await page.evaluate(() => resumeGame());
    const m = await page.textContent('#mbg');
    const v = await page.evaluate(() => APP_VERSION);
    assert.ok(m.includes(`This save is from Island Time 99.0.1, newer than this copy (${v})`), m);
    assert.ok(m.includes('Update the game'), m);
    assert.strictEqual(await page.evaluate(() => S.money), 777, 'still loads what it can');
    assert.deepStrictEqual(await page.evaluate(() => S.futureThing), { keep: 1 }, 'unknown fields kept');
    await page.evaluate(() => MBTN(0));
    assert.strictEqual(await page.$('#mbg'), null);
    // a second load of the same save in this session doesn't warn again
    await page.evaluate(v => localStorage.setItem('islandtime.save', v), JSON.stringify(Object.assign(d, { at: Date.now() + 1e6 })));
    await page.evaluate(() => resumeGame());
    assert.strictEqual(await page.$('#mbg'), null, 'warned only once');
    noErrors(errors);
  } },
  { name: 'warns when an imported transfer code is from a newer version', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.money = 555; saveGame(); });
    const d = await rawSave(page);
    d.app = '2.0.0';
    await page.evaluate(d => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      window.IMPV = 'ISLANDTIME:' + b64enc(JSON.stringify(d)); importCode(); }, d);
    await page.waitForSelector('#mbg');
    const m = await page.textContent('#mbg');
    assert.ok(m.includes('This save is from Island Time 2.0.0, newer than this copy'), m);
    assert.strictEqual(await page.evaluate(() => S.money), 555);
    noErrors(errors);
  } },
  { name: 'no warning for a save from this or an older version', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => saveGame());
    for (const app of [null, '1.3.1', '1.9.9']) {
      const shown = await page.evaluate(app => { const d = JSON.parse(localStorage.getItem('islandtime.save')); if (app) d.app = app;
        MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); adopt(migrate(d));
        return (document.querySelector('#mbg') || {}).textContent || ''; }, app);
      assert.ok(!/newer than this copy/.test(shown), `${app}: ${shown}`);
    }
    noErrors(errors);
  } },
];
