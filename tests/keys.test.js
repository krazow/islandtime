// ⌨️ keyboard shortcuts
const { open, newGame, noErrors, assert } = require('./helpers');
module.exports = [
  { name: 'keys: number keys press action buttons, H/F/T/L switch tabs, P toggles the phone, ? lists shortcuts', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { document.querySelectorAll('#mbg').forEach(e => e.remove()); tab = 'act'; render(); });
    await page.keyboard.press('t');
    assert.strictEqual(await page.evaluate(() => tab), 'todo');
    await page.keyboard.press('f');
    assert.strictEqual(await page.evaluate(() => tab), 'ferry');
    await page.keyboard.press('l');
    assert.strictEqual(await page.evaluate(() => tab), 'log');
    await page.keyboard.press('h');
    assert.strictEqual(await page.evaluate(() => tab), 'act');
    // 1 presses the first visible action button
    const first = await page.evaluate(() => { const b = [...document.querySelectorAll('#app .content button.act')].find(b => !b.disabled && b.offsetParent); window.__clicked = null; document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('button.act'); if (t && window.__clicked == null) window.__clicked = t.textContent; }, { capture: true, once: true }); return b.textContent; });
    await page.keyboard.press('1');
    assert.strictEqual(await page.evaluate(() => window.__clicked), first);
    await page.evaluate(() => { document.querySelectorAll('#mbg').forEach(e => e.remove()); MQ.length = 0; tab = 'act'; render(); });
    // phone
    await page.keyboard.press('p');
    assert.ok(await page.evaluate(() => !!document.getElementById('phoneUI')), 'phone open');
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => !document.getElementById('phoneUI')), 'phone closed');
    // ? opens the list; numbers then press the pop-up's buttons; Esc closes it
    await page.keyboard.press('?');
    assert.match(await page.textContent('#mbg'), /Keyboard shortcuts/);
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => !document.getElementById('mbg')), 'Esc closed the pop-up');
    await page.evaluate(() => modal('Pick', '', [{ l: 'Alpha', fn: () => { window.__pick = 'a'; } }, { l: 'Beta', fn: () => { window.__pick = 'b'; } }]));
    await page.keyboard.press('2');
    assert.strictEqual(await page.evaluate(() => window.__pick), 'b');
    noErrors(errors);
  } },
  { name: 'keys: never fire while typing a priority', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { document.querySelectorAll('#mbg').forEach(e => e.remove()); tab = 'todo'; render(); });
    const inp = page.locator('#prioIn');
    if (await inp.count()) { await inp.focus(); await page.keyboard.type('help Fred'); assert.strictEqual(await page.evaluate(() => tab), 'todo'); assert.strictEqual(await inp.inputValue(), 'help Fred'); }
    noErrors(errors);
  } },
];
