const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'ferry: never stuck at Steilacoom when no boat can take you tonight', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      // car boats done for the night, a passenger-only boat still runs, but you carry too much to walk on
      S.cur = 4; S.t = 4 * 1440 + 1104; S.loc = 'stDock'; S.cars[0].loc = 'stDock'; S.cars[0].fuel = 10; S.carried = 6;
      S.week.b = [{ start: 4 * 1440 - 200, end: 5 * 1440 + 300, cause: 'test outage' }]; render();
      const labels = [...document.querySelectorAll('.content .act:not([disabled]) b')].map(x => x.textContent);
      return { carry: canWalkCarry(), terminal: labels.some(l => /Sleep in the terminal/.test(l)), motel: labels.some(l => /motel/i.test(l)) };
    });
    assert.strictEqual(r.carry, false);
    assert.ok(r.terminal && r.motel, 'terminal and motel must be offered when no boat can take you tonight');
    noErrors(errors);
  } },
  { name: 'priorities: add, move, toggle', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.prios = []; setTab('todo'); prioAdd('Buy milk'); prioAdd('Fix gutter'); prioAdd('Call Dale'); });
    const list = () => page.evaluate(() => S.prios.map(q => q.t + (q.done ? '✓' : '')));
    assert.deepStrictEqual(await list(), ['Buy milk', 'Fix gutter', 'Call Dale']);
    await page.evaluate(() => prioMove(2, -1));
    assert.deepStrictEqual(await list(), ['Buy milk', 'Call Dale', 'Fix gutter']);
    await page.evaluate(() => prioMove(0, -1)); // no-op at the top
    assert.deepStrictEqual(await list(), ['Buy milk', 'Call Dale', 'Fix gutter']);
    await page.evaluate(() => prioToggle(0));
    assert.deepStrictEqual(await list(), ['Call Dale', 'Fix gutter', 'Buy milk✓']);
    await page.evaluate(() => prioToggle(2));
    assert.deepStrictEqual(await list(), ['Call Dale', 'Fix gutter', 'Buy milk']);
    assert.strictEqual(await page.$$eval('.prio', e => e.length), 3);
    assert.match(await page.textContent('.content'), /Call Dale/);
    noErrors(errors);
  } },
  { name: 'upkeep: night changes S.up, chores work, fold-outs render', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const before = JSON.stringify(S.up), notes = [];
      upkeepNight('home', notes, 0);
      return { changed: JSON.stringify(S.up) !== before, notesOk: Array.isArray(notes) };
    });
    assert.ok(r.changed, 'S.up changed overnight');
    await page.evaluate(() => { S.loc = 'home'; S.t = 9 * 60; setTab('act'); });
    const sums = await page.$$eval('details.upk > summary', e => e.map(x => x.textContent));
    assert.ok(sums.some(s => s.includes('🏠')), 'home fold-out: ' + sums);
    assert.ok(sums.some(s => s.includes('🌲')), 'yard fold-out: ' + sums);
    await page.click('details.upk:has(summary:text("🏠")) > summary');
    const bed = page.locator('details.upk button.act', { hasText: 'Make the bed' }).first();
    await bed.click();
    const done = await page.evaluate(() => S.up.done.bed === dayKey());
    assert.ok(done, 'chore marked done');
    assert.ok(await page.locator('details.upk button.act[disabled]', { hasText: 'Make the bed ✓' }).count(), 'chore shows done');
    noErrors(errors);
  } },
];
