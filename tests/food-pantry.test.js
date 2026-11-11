// Ferry Hell only: the Legion food pantry when you're broke (35-food-pantry.js)
const { open, newGame, noErrors, assert } = require('./helpers');
const at = (page, o) => page.evaluate(o => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
  S.cur = o.cur ?? 1; S.t = S.cur * 1440 + (o.m ?? 720); S.loc = o.loc ?? 'legion'; S.money = o.money ?? 10; S.pantry = o.pantry ?? 0; S.carried = 0;
  const a = actions().find(a => /food box|food pantry/i.test(a.l)); const t = todoItems().find(i => /Legion pantry/.test(i.l));
  return { a: a ? { l: a.l, dis: !!a.dis } : null, todo: !!t };
}, o);

module.exports = [
  { name: 'food pantry: on Hard a broke player gets a free 5-day food box at the Legion, once a week', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard');
    let r = await at(page, {});
    assert.ok(r.a && !r.a.dis && /5 days of food/.test(r.a.l), JSON.stringify(r)); assert.ok(r.todo);
    const got = await page.evaluate(() => { const s = S.stress, t = S.t; actions().find(a => /food box/.test(a.l)).fn(); return { c: S.carried, dt: S.t - t, ds: S.stress - s }; });
    assert.deepStrictEqual(got, { c: 5, dt: 20, ds: 3 });
    r = await at(page, { cur: 3 });
    assert.ok(r.a && r.a.dis, 'one box a week: ' + JSON.stringify(r)); assert.ok(!r.todo);
    // a new week: available again
    await page.evaluate(() => { S.weekNo = (S.weekNo || 0) + 1; });
    r = await at(page, { cur: 1 }); assert.ok(r.a && !r.a.dis);
    // closed hours, not broke, not at the Legion
    r = await at(page, { m: 1200 }); assert.ok(r.a && r.a.dis);
    r = await at(page, { money: 200 }); assert.strictEqual(r.a, null); assert.ok(!r.todo);
    r = await at(page, { loc: 'home' }); assert.strictEqual(r.a, null); assert.ok(r.todo);
    noErrors(errors);
  } },
  { name: 'food pantry: never on Easy or Normal', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const d of ['easy', 'normal']) {
      await newGame(page, d);
      const r = await at(page, {});
      assert.strictEqual(r.a, null, d); assert.ok(!r.todo, d);
    }
    noErrors(errors);
  } },
];
