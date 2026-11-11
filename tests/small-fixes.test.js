// 1.21.1 small fixes: reputation losses, fines and bail by level; places with nothing to do hidden on visits; resident reputation
// sits still during a visit; Islander's first-week grace for the Riv weekend shift; Undo replays luck instead of re-rolling it
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };

module.exports = [
  { name: 'levels: reputation losses ×0.5 / ×1 / ×1.5 and fines and bail scale the same way; gains are untouched', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const out = {};
    for (const d of ['easy', 'normal', 'hard']) {
      await newGame(page, d);
      out[d] = await page.evaluate(() => { S.rep = 0; const loss = repAdd(-20, 'test'); S.rep = 0; const gain = repAdd(10, 'test');
        return [loss, gain, fineAmt(150), fineAmt(750)]; });
    }
    assert.deepStrictEqual(out, { easy: [-10, 10, 75, 375], normal: [-20, 10, 150, 750], hard: [-30, 10, 225, 1125] });
    // the gas-can citation on the ferry charges the level's amount
    await newGame(page, 'hard');
    const r = await page.evaluate(() => { const before = S.money; money(-fineAmt(150)); return before - S.money; });
    assert.strictEqual(r, 225);
    noErrors(errors);
  } },
  { name: 'visits: work sites, the pharmacy and the warehouse club are out of the travel list and the map; regulars only lose the islander jobs', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const list = () => page.evaluate(clr => { eval(clr)(); S.loc = 'stDock'; S.cars[0].loc = 'stDock'; setPref('goOpen', true); setPref('mapView', false); tab = 'act'; render();
      return [...document.querySelectorAll('.dest')].map(d => d.textContent); }, `(${clear})`);
    await newGame(page);
    let names = (await list()).join(' | ');
    assert.match(names, /Work \(Lakewood\)/); assert.match(names, /Pharmacy/);
    await page.evaluate(clr => { eval(clr)(); visitorNew('weekend', 'tacoma', 'normal'); eval(clr)(); }, `(${clear})`);
    names = (await list()).join(' | ');
    for (const hidden of [/Work \(Lakewood\)/, /Hospital Records/, /Warehouse \(DuPont\)/, /Home Depot/, /Wholesale/, /Warehouse Club/, /Pharmacy/]) assert.doesNotMatch(names, hidden);
    for (const kept of [/Supermarket/, /Gas Station/, /Urgent Care/, /Medical Clinic/]) assert.match(names, kept);
    await page.evaluate(clr => { eval(clr)(); visitorNew('regular', 'tacoma', 'normal'); eval(clr)(); }, `(${clear})`);
    names = (await list()).join(' | ');
    assert.doesNotMatch(names, /Work \(Lakewood\)/); assert.match(names, /Pharmacy/); assert.match(names, /Home Depot/);
    noErrors(errors);
  } },
  { name: 'visits: the resident reputation sits still; a deliberate bad act counts against the visitor reputation instead', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(clr => { eval(clr)(); visitorNew('weekend', 'tacoma', 'normal'); eval(clr)(); }, `(${clear})`);
    const r = await page.evaluate(() => { S.rep = 0; VS().rep = 10; const g = repAdd(5, 'bazaar'); const b = repAdd(-20, 'busted with a gas can');
      return { g, b, rep: S.rep, vrep: VS().rep }; });
    assert.deepStrictEqual(r, { g: 0, b: 0, rep: 0, vrep: -10 });
    noErrors(errors);
  } },
  { name: 'Islander: the Riv weekend shift can’t fire you in your first week (old shifts with no start date can)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'easy');
    let r = await page.evaluate(() => { ECO().rivJob = { m: 5, sched: true, since: dayKey() }; const notes = []; rivMeter(-15, notes); return { m: rivJob().m, fired: !!ECO().rivFired }; });
    assert.deepStrictEqual(r, { m: 1, fired: false });
    r = await page.evaluate(() => { ECO().rivJob = { m: 5, sched: true }; const notes = []; rivMeter(-15, notes); return { m: rivJob().m, fired: !!ECO().rivFired }; });
    assert.deepStrictEqual(r, { m: 0, fired: true });
    await newGame(page, 'normal');
    r = await page.evaluate(() => { ECO().rivJob = { m: 5, sched: true, since: dayKey() }; const notes = []; rivMeter(-15, notes); return { fired: !!ECO().rivFired }; });
    assert.deepStrictEqual(r, { fired: true });
    noErrors(errors);
  } },
  { name: 'Undo: the action’s random rolls are replayed after an Undo, so retrying gets the same luck', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      // an action that rolls three times and spends money on the result (simple enough to be undone)
      const acts = actions; let seen = [];
      actions = function () { const a = acts.apply(this, arguments); a.unshift({ ic: '🎲', l: 'Roll the dice', s: '', fn: () => { const x = [Math.random(), Math.random(), Math.random()]; seen.push(x); money(-1); S.t += 5; afterAction(); } }); return a; };
      tab = 'act'; render();
      const btn = () => [...document.querySelectorAll('.act')].find(b => /Roll the dice/.test(b.textContent));
      btn().click(); const undo = document.querySelector('.undobtn'); if (!undo) return { err: 'no undo' }; undo.click(); btn().click();
      actions = acts; return { same: JSON.stringify(seen[0]) === JSON.stringify(seen[1]), n: seen.length };
    });
    assert.deepStrictEqual(r, { same: true, n: 2 });
    noErrors(errors);
  } },
];
