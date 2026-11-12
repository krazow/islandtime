// ✨ What's new: the title-screen button, the window, and the update pop-up's offer
const { open, newGame, noErrors, assert } = require('./helpers');
module.exports = [
  { name: 'whats new: a button on the title screen opens the changes for this version, with earlier releases below', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); titleScreen(); });
    const b = await page.textContent('#wnBtn');
    assert.match(b, new RegExp('What’s new in ' + (await page.evaluate(() => APP_VERSION)).replace(/\./g, '\\.')));
    assert.match(b, /new/);
    await page.click('#wnBtn');
    const t = await page.textContent('#mbg');
    assert.match(t, /What’s new in Island Time/);
    assert.ok(await page.evaluate(() => WHATSNEW[0].v === APP_VERSION), 'the newest entry is this version');
    assert.match(t, /Earlier releases/);
    assert.ok(await page.$('#mbg .wnvid'), 'a video (or the offline note) for this release');
    await page.click('#mbg >> text=Close');
    assert.strictEqual(await page.$('#wnBtn .wndot'), null, 'the new tag goes once read');
    await page.evaluate(() => titleScreen());
    assert.strictEqual(await page.$('#wnBtn .wndot'), null, 'and stays gone');
    noErrors(errors);
  } },
  { name: 'whats new: every entry has a version, date, title and items, newest first', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => WHATSNEW.map(e => [e.v, !!e.date, !!e.title, e.items.length]));
    assert.ok(r.every(x => x[1] && x[2] && x[3] > 0), JSON.stringify(r));
    const n = v => v.split('.').map(Number).reduce((a, x) => a * 1000 + x, 0);
    assert.ok(r.every((x, i) => i === 0 || n(r[i - 1][0]) > n(x[0])), 'newest first');
    noErrors(errors);
  } },
  { name: 'whats new: the update pop-up offers it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { saveGame(); localStorage.setItem(SEEN_KEY, '1.0.0'); updateShown = false; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S = null; titleScreen(); });
    assert.match(await page.textContent('#mbg'), /See what’s new/);
    await page.click('#mbg >> text=See what’s new');
    await page.waitForTimeout(100);
    assert.match(await page.textContent('#mbg'), /What’s new in Island Time/);
    noErrors(errors);
  } },
];
