const { open, newGame, reload, noErrors, assert } = require('./helpers');

const VER = page => page.evaluate(() => APP_VERSION);
const seen = page => page.evaluate(() => localStorage.getItem('islandtime.seenVersion'));
const modalText = page => page.evaluate(() => { const m = document.querySelector('#mbg .modal'); return m ? m.textContent : null; });
// seed an older save into a slot (key for slot 1 is the main key)
async function seedOld(page, slot, app, schema) {
  await page.evaluate(([slot, app, schema]) => {
    newGame('normal', 'week'); MQ = [];
    const d = packSave(); d.app = app; d.schema = schema; d.S.money = 777 + slot;
    localStorage.setItem(slotKeys(slot)[0], JSON.stringify(d)); S = null; // no autosave on unload
  }, [slot, app, schema]);
}
const onDisk = (page, slot) => page.evaluate(s => { const d = JSON.parse(localStorage.getItem(slotKeys(s)[0])); return { app: d.app, schema: d.schema, money: d.S.money }; }, slot);
const setSeen = (page, v) => page.evaluate(v => { if (v == null) localStorage.removeItem('islandtime.seenVersion'); else localStorage.setItem('islandtime.seenVersion', v); }, v);

module.exports = [
  { name: 'update notice: first install shows nothing and stores the version', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { localStorage.clear(); });
    await page.reload(); await page.waitForSelector('.title');
    assert.strictEqual(await page.$('#mbg'), null);
    assert.strictEqual(await seen(page), await VER(page));
    noErrors(errors);
  } },
  { name: 'update notice: same version shows nothing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seedOld(page, 1, '1.0.0', 1);
    await setSeen(page, await VER(page));
    await reload(page);
    assert.strictEqual(await page.$('#mbg'), null);
    noErrors(errors);
  } },
  { name: 'update notice: older version, no saves', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setSeen(page, '1.2.3');
    await reload(page);
    const t = await modalText(page), v = await VER(page);
    assert.match(t, /Island Time updated/);
    assert.ok(t.includes(`You’re now on version ${v} (from version 1.2.3).`), t);
    assert.ok(!/saved games were updated/.test(t));
    noErrors(errors);
  } },
  { name: 'update notice: unknown previous version with a save omits "from"', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seedOld(page, 1, '1.15.0', 6);
    await setSeen(page, null);
    await reload(page);
    const t = await modalText(page);
    assert.ok(!/from version/.test(t), t);
    assert.match(t, /slot 1 \(was 1\.15\.0\)/);
    noErrors(errors);
  } },
  { name: 'update notice: older saves in slots 1 and 2 are upgraded on disk', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seedOld(page, 1, '1.15.0', 6);
    await seedOld(page, 2, '1.16.0', 7);
    await setSeen(page, '1.15.0');
    await reload(page);
    const t = await modalText(page), v = await VER(page);
    assert.match(t, /Your saved games were updated: islander slot 1 \(was 1\.15\.0\), islander slot 2 \(was 1\.16\.0\)\./);
    for (const n of [1, 2]) {
      const d = await onDisk(page, n);
      assert.strictEqual(d.app, v); assert.strictEqual(d.schema, await page.evaluate(() => SAVE_SCHEMA));
      assert.strictEqual(d.money, 777 + n, 'data kept');
    }
    assert.ok(!/slot 3/.test(t));
    await page.click('text=Got it');
    assert.strictEqual(await seen(page), v);
    await page.click('text=Continue as T');
    await page.waitForSelector('.hud');
    assert.ok(!/upgraded from an older version|Save loaded/.test(await modalText(page) || ''));
    assert.strictEqual(await page.evaluate(() => S.money), 778);
    noErrors(errors);
  } },
  { name: 'update notice: a corrupt save is reported and left untouched', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seedOld(page, 1, '1.15.0', 6);
    await page.evaluate(() => localStorage.setItem('islandtime.save.slot2', '{not json'));
    await setSeen(page, '1.15.0');
    await reload(page);
    const t = await modalText(page);
    assert.match(t, /slot 1 \(was 1\.15\.0\)/);
    assert.match(t, /Islander slot 2 couldn’t be updated/);
    assert.strictEqual(await page.evaluate(() => localStorage.getItem('islandtime.save.slot2')), '{not json');
    noErrors(errors);
  } },
  { name: 'update notice: only the Got it button closes it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setSeen(page, '1.2.3');
    await reload(page);
    await page.mouse.click(2, 2);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    assert.ok(await page.$('#mbg'), 'still open after background click and Esc');
    assert.notStrictEqual(await seen(page), await VER(page));
    await page.click('#mbg >> text=Got it');
    assert.strictEqual(await page.$('#mbg'), null);
    assert.strictEqual(await seen(page), await VER(page));
    await reload(page);
    assert.strictEqual(await page.$('#mbg'), null);
    noErrors(errors);
  } },
];
