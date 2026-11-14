// ⬆️ Updates for downloaded copies (87-update.js), and 🗑️ delete right on the start page
const fs = require('fs'), path = require('path');
const { open, noErrors, assert } = require('./helpers');
const SITE = 'https://krazow.github.io/islandtime/';
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
// version.json as the website would serve it; null = offline
const site = async (ctx, version) => {
  await ctx.context.route(SITE + 'version.json*', r => version ? r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ version, title: 'Something new', installer: 'https://example.invalid/Island-Time-Setup.exe', offline: 'https://example.invalid/Island-Time-offline.html' }) }) : r.abort());
};
const bump = v => v.split('.').map((x, i) => i === 1 ? +x + 1 : i === 2 ? 0 : x).join('.');
// the suite turns update checks off (helpers.js); these tests turn them back on
const openOn = async ctx => { const o = await open(ctx); await o.page.evaluate(() => localStorage.setItem('islandtime.updCheck', 'on')); await o.page.reload(); await o.page.waitForSelector('.title'); return o; };
const waitModal = async (page, ms = 3000) => { try { await page.waitForSelector('#mbg', { timeout: ms }); return await page.textContent('#mbg'); } catch (e) { return ''; } };

module.exports = [
  { name: 'update: a downloaded copy is told about a newer version: Download, Later, or Skip this version', fn: async ctx => {
    const v = require('child_process').execSync(`grep -o "APP_VERSION='[0-9.]*'" ${path.resolve(__dirname, '..', 'src/js/01-core.js')}`).toString().match(/[0-9.]+/)[0];
    await site(ctx, bump(v));
    const { page, errors } = await openOn(ctx);
    const t = await waitModal(page);
    assert.match(t, new RegExp('Island Time ' + bump(v).replace(/\./g, '\\.') + ' is out')); assert.match(t, /Something new/);
    assert.match(t, /Download/); assert.match(t, /Later/); assert.match(t, /Skip this version/); assert.match(t, /Transfer a saved game/);
    await page.click('#mbg >> text=Skip this version');
    await page.reload(); await page.waitForSelector('.title');
    assert.strictEqual(await waitModal(page, 2500), '', 'a skipped version isn’t offered again');
    noErrors(errors);
  } },
  { name: 'update: nothing is shown for the same version, offline, or with Check for updates turned off in Settings', fn: async ctx => {
    const v = require('child_process').execSync(`grep -o "APP_VERSION='[0-9.]*'" ${path.resolve(__dirname, '..', 'src/js/01-core.js')}`).toString().match(/[0-9.]+/)[0];
    await site(ctx, v);
    const { page, errors } = await openOn(ctx);
    assert.strictEqual(await waitModal(page, 2500), '', 'same version');
    await ctx.context.unroute(SITE + 'version.json*'); await site(ctx, null);
    await page.reload(); await page.waitForSelector('.title');
    assert.strictEqual(await waitModal(page, 2500), '', 'offline');
    await ctx.context.unroute(SITE + 'version.json*'); await site(ctx, bump(v));
    await page.evaluate(() => openSettings());
    assert.match(await page.textContent('#updPref'), /Check for updates: On/);
    await page.click('#updPref');
    assert.match(await page.textContent('#updPref'), /Check for updates: Off/);
    await page.reload(); await page.waitForSelector('.title');
    assert.strictEqual(await waitModal(page, 2500), '', 'turned off');
    noErrors(errors);
  } },
  { name: 'update: the Windows app online moves on to the website, bringing every saved game and setting once', fn: async ctx => {
    const v = require('child_process').execSync(`grep -o "APP_VERSION='[0-9.]*'" ${path.resolve(__dirname, '..', 'src/js/01-core.js')}`).toString().match(/[0-9.]+/)[0];
    await site(ctx, v);
    const html = fs.readFileSync(ctx.target.file, 'utf8');
    await ctx.context.route(u => u.href.startsWith(SITE) && !/version\.json/.test(u.href), r => /\/islandtime\/(\?|#|$)/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'text/html', body: html }) : r.abort());
    const { page, errors } = await openOn(ctx);
    await clear(page);
    await page.evaluate(() => { setSlot(1); newGame('normal', 'week'); S.money = 1357; saveGame(); setSlot(5); S = null; visitorNew('week', 'tacoma', 'normal'); S.money = 2468; saveGame(); S = null; setSlot(1); localStorage.setItem('islandtime.popups', 'off'); });
    const local = page.url();
    await page.goto(local + '?app=win');
    await page.waitForURL(u => u.href.startsWith(SITE), { timeout: 8000 });
    assert.ok(!/itmove/.test(page.url()), 'the hand-over leaves the address bar clean');
    const t = await waitModal(page, 4000);
    assert.match(t, /Your games came along/); assert.match(t, /2 saved games/);
    const r = await page.evaluate(() => [JSON.parse(rawSave(1).v).S.money, JSON.parse(rawSave(5).v).S.money, localStorage.getItem('islandtime.popups'), location.protocol]);
    assert.deepStrictEqual(r, [1357, 2468, 'off', 'https:']);
    noErrors(errors.filter(e => !/sw\.js|service ?worker/i.test(e)));
  } },
  { name: 'update: games brought over never overwrite one already on the website; they take a free slot of their own group', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      setSlot(1); newGame('normal', 'week'); S.money = 111; saveGame();
      const incoming = JSON.parse(JSON.stringify(packSave())); incoming.S.money = 999;
      const data = { 'islandtime.save': JSON.stringify(incoming), 'islandtime.name': 'Someone else' };
      location.hash = 'itmove=' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, from: '1.24.1', data }))));
      const res = importMoved();
      return { res, s1: JSON.parse(rawSave(1).v).S.money, s2: rawSave(2) && JSON.parse(rawSave(2).v).S.money, name: localStorage.getItem('islandtime.name'), hash: location.hash };
    });
    assert.deepStrictEqual([r.res.saves, r.res.aside, r.s1, r.s2, r.name, r.hash], [1, 0, 111, 999, 'T', '']);
    noErrors(errors);
  } },
  { name: 'delete: each saved game on the start page has a 🗑️ next to Continue; it asks first', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { setSlot(4); S = null; visitorNew('week', 'tacoma', 'normal'); saveGame(); S = null; setSlot(1); titleScreen(); });
    await clear(page);
    assert.ok(await page.$('#sideV .scrow .sdel'), 'a delete button beside the visitor Continue');
    assert.strictEqual(await page.$('#sideI .sdel'), null, 'none where there is no save');
    await page.click('#sideV .sdel');
    assert.match(await page.textContent('#mbg'), /Delete visitor slot 1\?.*can’t be undone/s);
    await page.click('#mbg >> text=Cancel');
    assert.ok(await page.evaluate(() => !!rawSave(4)), 'Cancel keeps it');
    await page.click('#sideV .sdel'); await page.click('#mbg >> text=Delete it');
    assert.ok(await page.evaluate(() => !rawSave(4)));
    assert.strictEqual(await page.$('#sideV .scont'), null); assert.match(await page.textContent('#sideV'), /Saves \(0 of 3\)/);
    assert.strictEqual(await page.$('#mbg'), null, 'back on the start page, no Saves window');
    noErrors(errors);
  } },
];
