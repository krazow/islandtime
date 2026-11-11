const { open, newGame, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
const visit = page => page.evaluate(() => { newGame('normal', 'week'); S.visitor = vsInit('weekend', 'tacoma'); S.loc = 'home'; S.cur = 5; S.t = 5 * 1440 + 8 * 60; S.money = 300; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
module.exports = [
  { name: 'sights are hidden in the resident game and listed during a visit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { const a = ['farm', 'andys', 'jacobs'].map(k => L[k].side); const h = document.querySelector('#app').innerHTML; return { a, shown: /Johnson Farm|Andy.s Wild|Jacobs Point/.test(h) }; });
    assert.deepStrictEqual(r.a, ['X', 'X', 'X']); assert.strictEqual(r.shown, false);
    await visit(page);
    const v = await page.evaluate(() => { const h = document.querySelector('#app').innerHTML; return { a: ['farm', 'andys', 'jacobs'].map(k => L[k].side), shown: /Johnson Farm/.test(h) && /Jacobs Point/.test(h), d: dist('home', 'jacobs') > 0 && dist('farm', 'andys') > 0 }; });
    assert.deepStrictEqual(v.a, ['I', 'I', 'I']); assert.ok(v.shown); assert.ok(v.d);
    noErrors(errors);
  } },
  { name: 'look around, one photo per sight, farm hours, Riv dinner and Legion coffee count', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page);
    const r = await page.evaluate(() => {
      const act = l => actions().find(a => a.l === l);
      const out = {};
      S.loc = 'lake'; S.t = 5 * 1440 + 7 * 60; out.stress0 = S.stress = 50;
      act('Look around').fn(); out.lakeSeen = VS().seen.lake !== undefined; out.stress1 = S.stress;
      act('Take a photo').fn(); out.photo = VS().photos.lake; out.great = VS().photoQ.lake;
      out.again = actions().find(a => a.l === 'Photo taken').dis;
      S.loc = 'farm'; S.t = 5 * 1440 + 9 * 60; out.farmClosed = actions().some(a => a.l === 'Closed right now');
      S.t = 5 * 1440 + 14 * 60; out.farmOpen = actions().some(a => a.l === 'Look around');
      S.loc = 'jacobs'; S.t = 5 * 1440 + 10 * 60; act('Take a photo').fn(); out.jacobsPlain = VS().photoQ.jacobs;
      S.loc = 'food'; S.t = 5 * 1440 + 18 * 60; const m0 = S.money; actions().find(a => /Dinner at the Riv/.test(a.l)).fn(); out.riv = VS().seen.riv !== undefined; out.spent = m0 - S.money;
      S.loc = 'legion'; S.t = 5 * 1440 + 10 * 60; actions().find(a => /Coffee with the veterans/.test(a.l)).fn(); out.legion = VS().seen.legion !== undefined;
      out.rep = VS().rep; out.n = vSeenN(); return out;
    });
    assert.ok(r.lakeSeen); assert.ok(r.stress1 < r.stress0); assert.strictEqual(r.photo, 5); assert.strictEqual(r.great, 2); assert.ok(r.again);
    assert.ok(r.farmClosed); assert.ok(r.farmOpen); assert.strictEqual(r.jacobsPlain, 1);
    assert.ok(r.riv); assert.ok(r.spent > 0); assert.ok(r.legion); assert.ok(r.rep > 0); assert.strictEqual(r.n, 4);
    noErrors(errors);
  } },
  { name: 'visitScore: shape, and making the boat beats missing it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page);
    const r = await page.evaluate(() => {
      VS().seen.lake = 5; VS().photos.lake = 5;
      VS().result = 'home'; const h = visitScore(); VS().result = 'missed'; const m = visitScore();
      return { h, m };
    });
    assert.ok(typeof r.h.score === 'number' && /^[A-F]$/.test(r.h.grade) && Array.isArray(r.h.lines) && r.h.lines.every(l => typeof l === 'string') && r.h.lines.length >= 4);
    assert.ok(r.h.score > r.m.score + 500);
    noErrors(errors);
  } },
  { name: 'visitor reputation: deliberate rude choice drops it, polite raises it, clamps', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await visit(page);
    await page.evaluate(() => { S.cars = S.cars || []; fireHook('arrive', { at: 'aiDock' }); forceEvent('v_landing'); });
    const r = await page.evaluate(() => {
      const out = {}; out.r0 = VS().rep;
      S.cars.push({ id: 'rent', name: 'Rental', loc: 'aiDock', fuel: 5, tank: 12 }); S.loc = 'aiDock';
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      forceEvent('v_landing'); fireHook('arrive', { at: 'aiDock', from: 'home' });
      const bad = [...document.querySelectorAll('#mbg button')].find(b => /ferry lane/.test(b.textContent)); out.hasChoice = !!bad; bad && bad.click();
      out.afterBad = VS().rep;
      out.r1 = vrepAdd(2, 'test'); out.afterGood = VS().rep; vrepAdd(500, 'x'); out.max = VS().rep; vrepAdd(-500, 'x'); out.min = VS().rep;
      S.visitor = null; out.off = vrepAdd(5, 'no'); return out;
    });
    assert.ok(r.hasChoice); assert.ok(r.afterBad < r.r0); assert.ok(r.afterGood > r.afterBad);
    assert.strictEqual(r.max, 100); assert.strictEqual(r.min, -100); assert.strictEqual(r.off, 0);
    noErrors(errors);
  } },
];
