// 🏝️ Islander / 🧳 Visitor: a card for each on the title screen, their own difficulty levels, three saves each
const { open, newGame, reload, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
const filled = page => page.evaluate(() => [1, 2, 3, 4, 5, 6].map(n => rawSave(n) ? (JSON.parse(rawSave(n).v).S.visitor ? 'V' : 'I') : '-').join(''));

module.exports = [
  { name: 'sides: the title screen has an Islander and a Visitor card, each with its own Continue, new game and saves', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.money = 777; saveGame(); S = null; setSlot(4); visitorNew('weekend', 'tacoma', 'normal'); saveGame(); S = null; titleScreen(); });
    await clear(page);
    const I = await page.textContent('#sideI'), V = await page.textContent('#sideV');
    assert.match(I, /🏝️ Islander/); assert.match(I, /Continue as T/); assert.match(I, /1 week/); assert.match(I, /Saves \(1 of 3\)/);
    assert.match(V, /🧳 Visitor/); assert.match(V, /Continue as T: .*Friday/); assert.match(V, /Saves \(1 of 3\)/);
    await page.click('#sideI >> text=Continue as T'); await page.waitForSelector('.hud');
    assert.strictEqual(await page.evaluate(() => S.money), 777);
    assert.match(await page.textContent('.hud-side'), /🏝️ Islander · ⛴️ Normal/);
    noErrors(errors);
  } },
  { name: 'sides: saves from the old three shared slots are sorted into their group, and nothing is lost', fn: async ctx => {
    const { page, errors } = await open(ctx);
    // the 1.22 layout: a visit in slot 1, island games in slots 2 and 3
    await page.evaluate(() => {
      const put = (n, s) => slotKeys(n).forEach(k => localStorage.setItem(k, JSON.stringify(s)));
      newGame('normal', 'week'); visitorNew('day', 'seattle', 'normal'); const v = packSave(); v.app = '1.22.3';
      newGame('hard', 'week'); const a = packSave(); a.app = '1.22.3'; S.money = 4321; const b = packSave(); b.app = '1.22.3';
      [1, 2, 3, 4, 5, 6].forEach(n => slotKeys(n).forEach(k => localStorage.removeItem(k)));
      put(1, v); put(2, a); put(3, b); setSlot(1); S = null; titleScreen();
    });
    await clear(page);
    assert.strictEqual(await filled(page), '-IIV--');
    assert.strictEqual(await page.evaluate(() => curSlot()), 4, 'the current slot follows the game');
    assert.match(await page.textContent('#sideV'), /Continue as T/);
    assert.match(await page.textContent('#sideI'), /Saves \(2 of 3\)/);
    noErrors(errors);
  } },
  { name: 'sides: each way to play has its own difficulty levels', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await clear(page);
    await page.evaluate(() => startVisit());
    await page.click('#mbg button:has-text("🏕️ Weekend")'); await page.click('#mbg >> text=Tacoma');
    const v = await page.textContent('#mbg');
    assert.match(v, /How hard is the visit/); assert.match(v, /Easy Sunday/); assert.match(v, /Tourist/); assert.match(v, /Missed the Boat/);
    assert.doesNotMatch(v, /Ferry Hell|Old-timer/);
    await page.click('#mbg >> text=Missed the Boat'); await page.waitForSelector('.hud');
    assert.match(await page.textContent('.hud-side'), /🧳 Visitor · 🌧️ Missed the Boat/);
    assert.ok(await page.evaluate(() => curSlot() >= 4), 'a visit lands in a visitor slot');
    await page.evaluate(() => { saveGame(); S = null; titleScreen(); }); await clear(page);
    await page.evaluate(() => diffModal(() => {}));
    const i = await page.textContent('#mbg');
    assert.match(i, /Old-timer/); assert.match(i, /Normal/); assert.match(i, /Ferry Hell/); assert.doesNotMatch(i, /Tourist/);
    noErrors(errors);
  } },
  { name: 'sides: visitor levels change I-5 traffic, crashes and the last-boat warning', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const at = k => { S = null; newGame(k, 'week'); visitorNew('weekend', 'seattle', k); S.t = 7 * 60 + 0; S.loc = 'vhome'; return vtTraffic('vhome', 'stDock', 0 * 1440 + 420).min; };
      const ez = at('easy'), no = at('normal'), hd = at('hard');
      at('easy'); let crash = 0; for (let i = 0; i < 400; i++) if (vtTrafficRoll('vhome', 'stDock').crash) crash++;
      at('hard'); const warn = lbHomeSide();
      return { ez, no, hd, crash, warn };
    });
    assert.ok(r.ez < r.no && r.no < r.hd, JSON.stringify(r));
    assert.strictEqual(r.crash, 0, 'no crashes on Easy Sunday');
    assert.strictEqual(r.warn, null, 'no last-boat heads-up on Missed the Boat');
    noErrors(errors);
  } },
  { name: 'sides: three saves each; a full group asks which slot to replace, the other group is untouched', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { for (const n of [1, 2, 3]) { setSlot(n); S = null; newGame('normal', 'week'); S.money = 100 * n; saveGame(); }
      setSlot(5); S = null; visitorNew('day', 'olympia', 'normal'); saveGame(); S = null; titleScreen(); });
    await clear(page);
    assert.match(await page.textContent('#sideI'), /Saves \(3 of 3\)/);
    await page.click('#sideI .slen button:has-text("1 month")');
    assert.match(await page.textContent('#mbg'), /All three islander slots are in use/);
    await page.click('#mbg .slot:nth-of-type(2) >> text=Start new here');
    assert.match(await page.textContent('#mbg'), /Start over in islander slot 2/);
    await page.click('#mbg >> text=Start a new game here');
    assert.match(await page.textContent('#mbg'), /New islander game/);
    assert.strictEqual(await page.evaluate(() => curSlot()), 2);
    await clear(page);
    await page.evaluate(() => { titleScreen(); }); await clear(page);
    await page.click('#sideV .slen button:has-text("1 week")');
    assert.match(await page.textContent('#mbg'), /Where do you live/);
    assert.strictEqual(await page.evaluate(() => curSlot()), 4, 'the first free visitor slot');
    assert.strictEqual(await filled(page), 'III-V-');
    noErrors(errors);
  } },
  { name: 'sides: a challenge started while a visit is current goes in an islander slot; a regular who moves over follows', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { setSlot(4); S = null; visitorNew('weekend', 'tacoma', 'normal'); saveGame(); S = null; titleScreen(); });
    await clear(page);
    await page.evaluate(() => dailyStartModal());
    assert.strictEqual(await page.evaluate(() => curSlot()), 1);
    await clear(page);
    // a weekend regular in visitor slot 5 who becomes a resident saves into a free islander slot
    const r = await page.evaluate(() => { setSlot(5); S = null; visitorNew('regular', 'seattle', 'normal'); saveGame(); delete S.visitor; S.money = 9999; saveGame();
      return [curSlot(), !!rawSave(5), JSON.parse(rawSave(curSlot()).v).S.money]; });
    assert.deepStrictEqual(r, [1, false, 9999]);
    noErrors(errors);
  } },
];
