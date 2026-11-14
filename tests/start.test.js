// ⛴️ The start page: 1 week / 1 month / 1 year on each card, the whole title on one screen, a visitor year, and ℹ️ About
const { open, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
const pick = async (page, re) => { for (const x of await page.$$('#mbg .act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };

module.exports = [
  { name: 'start: the title fits one phone screen with no scrolling, even with games on both cards', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const [w, h] of [[390, 844], [360, 640]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
        setSlot(1); S = null; newGame('normal', 'month'); saveGame(); setSlot(4); S = null; visitorNew('weekend', 'seattle', 'normal'); saveGame(); S = null; setSlot(1); titleScreen(); });
      await clear(page);
      const r = await page.evaluate(() => ({ sh: document.scrollingElement.scrollHeight, ih: innerHeight, conts: document.querySelectorAll('.side .scont').length, lens: document.querySelectorAll('.side .slen button').length, ul: !!document.querySelector('.title ul') }));
      assert.ok(r.sh <= r.ih, `${w}x${h}: ${r.sh} > ${r.ih}`);
      assert.strictEqual(r.conts, 2); assert.strictEqual(r.lens, 6); assert.ok(!r.ul, 'the long description moved to About');
    }
    noErrors(errors);
  } },
  { name: 'start: islander 1 year is story mode; visitor 1 week is a week’s visit and 1 month a weekend regular', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await clear(page);
    await page.click('#sideI .slen button:has-text("1 year")'); await pick(page, /Normal/); await clear(page);
    assert.deepStrictEqual(await page.evaluate(() => [!!S.story, S.mode, curSlot()]), [true, 'month', 1]);
    await page.evaluate(() => { saveGame(); S = null; titleScreen(); }); await clear(page);
    await page.click('#sideV .slen button:has-text("1 week")'); await pick(page, /Tacoma/); await pick(page, /Summer/); await pick(page, /Tourist/); await clear(page);
    assert.deepStrictEqual(await page.evaluate(() => [VS().len, VS().home, S.season, S.diff, curSlot()]), ['week', 'tacoma', 'summer', 'normal', 4]);
    await page.evaluate(() => { saveGame(); S = null; titleScreen(); }); await clear(page);
    await page.click('#sideV .slen button:has-text("1 month")'); await pick(page, /Olympia/); await pick(page, /Fall/); await pick(page, /Easy Sunday/); await clear(page);
    assert.deepStrictEqual(await page.evaluate(() => [VS().len, !!VS().year, S.diff, curSlot()]), ['regular', false, 'easy', 5]);
    noErrors(errors);
  } },
  { name: 'start: a visitor year is four weekend-regular months, one per season; money, friends and reputation carry over', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await clear(page);
    await page.click('#sideV .slen button:has-text("1 year")'); await pick(page, /Seattle/); await pick(page, /Tourist/);
    await pick(page, /Keep the first one/);
    assert.match(await page.textContent('#mbg'), /A year as a weekend regular/);
    await clear(page);
    assert.deepStrictEqual(await page.evaluate(() => [VS().len, VS().year.m, S.season]), ['regular', 0, 'summer']);
    assert.match(await page.textContent('.hud-sub'), /Month 1\/4 · Week 1\/4/);
    // the end of month 1: on to fall, with everything carried
    await page.evaluate(() => { S.money = 4321; VS().rep = 22; S.friends.walt = S.friends.walt || { name: 'Walt', lvl: 2, pts: 5 }; regEndMonth(); });
    assert.match(await page.textContent('#mbg'), /Month 1 of 4 done/);
    await page.click('#mbg >> text=Months later');
    const r = await page.evaluate(() => ({ m: VS().year.m, sea: S.season, money: S.money, rep: VS().rep, walt: !!S.friends.walt, over: !!S.over, slot: curSlot() }));
    assert.deepStrictEqual(r, { m: 1, sea: 'fall', money: 4321, rep: 22, walt: true, over: false, slot: 4 });
    // month 4 ends the year on the end screen
    await page.evaluate(() => { VS().year.m = 3; regEndMonth(); });
    await page.waitForSelector('.end');
    const e = await page.textContent('.end');
    assert.match(e, /YEAR COMPLETE/); assert.match(e, /A year as a weekend regular/);
    noErrors(errors);
  } },
  { name: 'start: a full side asks which slot to replace, then offers the three lengths', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { for (const n of [4, 5, 6]) { setSlot(n); S = null; visitorNew('day', 'tacoma', 'normal'); saveGame(); } S = null; setSlot(1); titleScreen(); });
    await clear(page);
    await page.click('#sideV .slen button:has-text("1 year")');
    assert.match(await page.textContent('#mbg'), /All three visitor slots are in use/);
    await page.click('#mbg .slot:nth-of-type(3) >> text=Start new here');
    await page.click('#mbg >> text=Start a new game here');
    const t = await page.textContent('#mbg');
    assert.match(t, /New visitor game/); assert.match(t, /1 week/); assert.match(t, /1 month/); assert.match(t, /1 year/);
    assert.strictEqual(await page.evaluate(() => curSlot()), 6);
    noErrors(errors);
  } },
];
