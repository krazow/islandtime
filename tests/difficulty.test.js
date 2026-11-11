const { open, newGame, reload, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'deliveries and raccoons follow the level; override still works', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const out = {};
      for (const d of ['easy', 'normal', 'hard']) {
        newGame(d, 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
        DELIVERY_WRONG = null; let n = 0; for (let i = 0; i < 4000; i++) if (hhWrong()) n++;
        const H = HH(); H.trash = 11; const e = EV.find(x => x.id === 'raccoons'); const c1 = e.chance();
        H.trash = 30; const c2 = e.chance();
        out[d] = { diff: S.diff, lv: LV('raccoon'), wrong: n / 4000, c1, c2 };
      }
      DELIVERY_WRONG = 0; const z = hhWrong(); DELIVERY_WRONG = 1; const o = hhWrong(); DELIVERY_WRONG = null;
      out.ov = [z, o];
      return out;
    });
    assert.ok(Math.abs(r.easy.wrong - 0.1) < 0.03 && Math.abs(r.normal.wrong - 0.1) < 0.03, JSON.stringify(r));
    assert.ok(Math.abs(r.hard.wrong - 0.2) < 0.03, JSON.stringify(r));
    assert.ok(Math.abs(r.normal.c1 - 0.30) < 1e-9 && Math.abs(r.easy.c1 - 0.30) < 1e-9, JSON.stringify(r));
    assert.ok(Math.abs(r.hard.c1 - 0.48) < 1e-9, JSON.stringify(r));
    assert.strictEqual(r.normal.c2, 0.5); assert.strictEqual(r.hard.c2, 0.6);
    assert.deepStrictEqual(r.ov, [false, true]);
    noErrors(errors);
  } },
  { name: 'weekly challenge stays on Normal; story uses the chosen level', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const clr = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };
      const spec = challengeSpec(challengeWeekId());
      newGame('hard', 'week'); clr();
      challengeStart(challengeWeekId()); clr();
      const ch = { diff: S.diff, spec: spec.diff };
      storyNew('hard'); clr(); const sh = S.diff;
      storyNew('easy'); clr(); const se = S.diff;
      return { ch, sh, se };
    });
    assert.deepStrictEqual(r.ch, { diff: 'normal', spec: 'normal' });
    assert.strictEqual(r.sh, 'hard'); assert.strictEqual(r.se, 'easy');
    noErrors(errors);
  } },
  { name: 'an old save without level fields keeps the level it started on', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    await page.evaluate(() => { S.money = 321; saveGame(); });
    const d = await page.evaluate(() => JSON.parse(localStorage.getItem('islandtime.save')));
    delete d.S.lv; delete d.S.level;   // a save from before levels had settings
    await page.evaluate(v => { S = null; ['islandtime.save', 'islandtime.save.v2', 'islandtime.save.v1'].forEach(k => localStorage.setItem(k, v)); }, JSON.stringify(d));
    await reload(page);
    await page.evaluate(() => resumeGame());
    const r = await page.evaluate(() => ({ diff: S.diff, money: S.money, wrong: LV('deliverWrong'), rac: LV('raccoon') }));
    assert.deepStrictEqual(r, { diff: 'hard', money: 321, wrong: 0.2, rac: 1.6 });
    noErrors(errors);
  } },
];
