const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'loads without errors and shows the title screen', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const t = await page.textContent('.title');
    assert.match(t, /Island Time/);
    assert.match(t, /1 week/); assert.match(t, /1 month/); assert.match(t, /1 year/);
    const v = await page.evaluate(() => APP_VERSION);
    assert.ok(t.includes('Version ' + v), 'version shown on title');
    noErrors(errors);
  } },
  ...['week', 'month'].map(mode => ({ name: `new ${mode} game renders every tab`, fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', mode);
    assert.strictEqual(await page.evaluate(() => S.mode), mode);
    for (const k of ['act', 'ferry', 'todo', 'log']) {
      await page.evaluate(k => setTab(k), k);
      assert.ok(await page.$('.hud'), `hud on ${k}`);
      assert.ok(await page.$(`nav.tabs button.on`), `tab bar on ${k}`);
      assert.ok((await page.textContent('.content')).trim().length > 0 || k === 'log', `content on ${k}`);
    }
    noErrors(errors);
  } })),
  { name: 'end-of-week screen renders', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.cur = 6; S.t = 6 * 1440 + 1300; finish(); });
    await page.waitForSelector('.end');
    const t = await page.textContent('.end');
    assert.match(t, /Sunday night/);
    assert.match(t, /Play another week/);
    noErrors(errors);
  } },
  { name: 'start a new game: each card has 1 week / 1 month / 1 year right on the title', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); titleScreen(); });
    assert.strictEqual(await page.$('.title button[onclick="startNewWeek()"]'), null, 'no Start a new week / Start Monday');
    await page.click('#sideI .slen button:has-text("1 week")');
    assert.match(await page.textContent('#mbg'), /How hard is island life/);
    await page.click('#mbg >> text=Normal'); assert.match(await page.textContent('#mbg'), /What time of year/);
    await page.click('#mbg >> text=Winter'); await page.waitForSelector('.hud');
    assert.deepStrictEqual(await page.evaluate(() => [S.mode, S.season, !!S.visitor, curSlot()]), ['week', 'winter', false, 1]);
    await page.evaluate(() => { S = null; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); titleScreen(); });
    await page.click('#sideV .slen button:has-text("1 month")');
    assert.match(await page.textContent('#mbg'), /Where do you live/);
    noErrors(errors);
  } },
];
