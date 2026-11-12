const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'loads without errors and shows the title screen', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const t = await page.textContent('.title');
    assert.match(t, /Island Time/);
    assert.match(t, /Start a new game/);
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
  { name: 'start a new game: one title button opens a mode chooser (island, visit, weekend regular, challenges)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); titleScreen(); });
    assert.strictEqual(await page.$('.title button[onclick="startNewWeek()"]'), null, 'no Start a new week / Start Monday');
    await page.click('.title button:has-text("Start a new game")');
    const t = await page.textContent('#mbg');
    for (const m of ['Live on the island', 'Visit the island', 'Weekend regular', 'Weekly challenge', 'Daily challenge']) assert.ok(t.includes(m), m);
    await page.click('#mbg >> text=Weekend regular');
    assert.match(await page.textContent('#mbg'), /Where do you live|name/i);
    noErrors(errors);
  } },
];
