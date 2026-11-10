// 🤲 island reputation, −100 to +100
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
module.exports = [
  { name: 'reputation: clamps to −100..+100, tiers, Known for, tier-change tile', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.rep = 0; S.repx = null; S.log = [];
      const t0 = repTier().id; repAdd(15, 'test'); const t1 = repTier().id; repAdd(5, 'helped'); const t2 = repTier().id;
      repAdd(500, 'a lot'); const max = S.rep; repAdd(-500, 'a scandal'); const min = S.rep;
      return { t0, t1, t2, max, min, tier: repTier().id, known: REP().known.map(k => k.why).slice(0, 2), log: S.log.map(l => l.s).join(' ') };
    });
    assert.deepStrictEqual([r.t0, r.t1, r.t2], ['new', 'new', 'known']);
    assert.strictEqual(r.max, 100); assert.strictEqual(r.min, -100); assert.strictEqual(r.tier, 'pariah');
    assert.deepStrictEqual(r.known, ['a scandal', 'a lot']);
    assert.match(r.log, /You’re now <b>🤝 Known/);
    noErrors(errors);
  } },
  { name: 'reputation: old saves convert ×7.5 and keep their perks', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const d = JSON.parse(JSON.stringify(packSave())); d.schema = 6; d.S.rep = 8; d.S.eco = Object.assign({}, d.S.eco, { perks: { 3: true, 5: true, 8: true } }); delete d.S.repx;
      const m = migrate(d); adopt(m); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const n0 = S.log.length; afterAction();
      return { rep: S.rep, perks: Object.keys(S.eco.perks).sort(), renarrated: S.log.slice(n0).some(e => /first call|Island regular/.test(e.s)), notes: m.notes.join(' ') };
    });
    assert.strictEqual(r.rep, 60);
    assert.deepStrictEqual(r.perks, ['20', '35', '60']);
    assert.strictEqual(r.renarrated, false, 'perks not announced again');
    assert.match(r.notes, /−100 to \+100/);
    noErrors(errors);
  } },
  { name: 'reputation: a gas can bust is −20 and makes the deckhand an enemy; making up on a weekend', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.rep = 0; S.repx = null; S.cargo.gas = 1; S.loc = 'aiDock';
      const orig = Math.random; Math.random = () => 0.01; const s = { dep: 455, abs: 455, d: 0 }; try { board('I', s, 'drive'); } catch (e) {} Math.random = orig;
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const after = { rep: S.rep, enemies: REP().enemies.map(e => e.who) };
      S.loc = 'home'; S.cur = 5; S.t = 5 * 1440 + 600; render();
      const mk = actions().find(a => /^Make up with Corey/.test(a.l)); const todo = todoItems().some(x => /^Make up with Corey/.test(x.l));
      mk.fn();
      return { after, todo, mended: REP().enemies.length, rep: S.rep };
    });
    assert.strictEqual(r.after.rep, -20);
    assert.deepStrictEqual(r.after.enemies, ['Corey the deckhand']);
    assert.ok(r.todo);
    assert.strictEqual(r.mended, 0); assert.strictEqual(r.rep, -15);
    noErrors(errors);
  } },
  { name: 'reputation: a missed favor costs friendship, not reputation, and makes no enemies', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.rep = 0; S.repx = null; meet('marta', 'Marta, from up the road', 'test');
      const n = []; repFavorFailed('marta', n); const once = { rep: S.rep, friend: !!S.friends.marta };
      repFavorFailed('marta', n);
      return { once, rep: S.rep, friend: !!S.friends.marta, enemies: REP().enemies.map(e => e.who), notes: n.join(' ') };
    });
    assert.deepStrictEqual(r.once, { rep: 0, friend: true });
    assert.strictEqual(r.rep, 0); assert.strictEqual(r.friend, true);
    assert.deepStrictEqual(r.enemies, []);
    noErrors(errors);
  } },
  { name: 'reputation: never drifts down; a bad name heals; the house doesn’t cost reputation; gifts on the porch', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.repx = null; S.rep = 40; const R = REP(); R.lastGood = dayKey() - 8; R.driftAt = dayKey() - 7; R.gift = dayKey();
      const n = []; repNight('motel', n); const drift = S.rep;
      S.rep = -30; R.healAt = dayKey() - 14; repNight('motel', n); const heal = S.rep;
      S.rep = 0; S.home = 20; R.homeLow = 6; repNight('motel', n); const house = S.rep;
      S.home = 70; S.rep = 70; R.gift = -1; const p0 = S.pantry, w0 = UP().wood, s0 = S.stress; const orig = Math.random; Math.random = () => 0.01;
      const g = []; repNight('home', g); Math.random = orig;
      return { drift, heal, house, gift: g.join(' '), changed: S.pantry !== p0 || UP().wood !== w0 || S.stress !== s0 };
    });
    assert.strictEqual(r.drift, 40, 'no good deeds lately is not a bad deed');
    assert.strictEqual(r.heal, -25, 'a bad name fades slowly');
    assert.strictEqual(r.house, 0, 'a run-down house is not on purpose');
    assert.ok(r.gift.length > 10 && r.changed, 'a gift: ' + r.gift);
    noErrors(errors);
  } },
  { name: 'reputation: friendship gains +1 when known, halved when talked about', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      meet('marta', 'Marta, from up the road', 'test'); const f = S.friends.marta; f.pts = 0; f.lvl = 1;
      S.rep = 30; friendPts('marta', 1); const known = f.pts;
      f.pts = 0; S.rep = -30; friendPts('marta', 2); const talked = f.pts;
      return { known, talked };
    });
    assert.strictEqual(r.known, 2); assert.strictEqual(r.talked, 1);
    noErrors(errors);
  } },
  { name: 'reputation: Gig Work offerings follow your rating; island gigs need good standing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      const out = {};
      for (const v of [0, -30, -70]) { S.rep = v; out[v] = { max: gigMax(), island: gigList().some(g => g.island), pay: gigPay(GIGS[2]) }; }
      S.rep = 10; S.loc = 'home'; S.phone = 90; S.phoneT = S.t; const m0 = S.money; const ok = gigDo('dogwalk'); out.walk = { ok, paid: S.money - m0 };
      out.rx = gigDo('rxrun');   // not at the landing
      return out;
    });
    assert.deepStrictEqual(r['0'], { max: 4, island: true, pay: 8 });
    assert.deepStrictEqual(r['-30'], { max: 3, island: false, pay: 8 });
    assert.deepStrictEqual(r['-70'], { max: 2, island: false, pay: 6 });
    assert.deepStrictEqual(r.walk, { ok: true, paid: 15 });
    assert.strictEqual(r.rx, false);
    noErrors(errors);
  } },
  { name: 'reputation: the Riv: no interview at −30, no weekend shift below −10, no-shows and firing', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      const out = {};
      S.rep = -30; S.cur = 1; S.t = 1440 + 600; S.loc = 'home'; S.jobsx = { key: jobListKey(), open: ['riv', 'tacoma'], tip: {} }; jobModal();
      out.riv = [...document.querySelectorAll('#mbg button.act')].find(b => /Line cook/.test(b.textContent)).disabled;
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.rep = -15; S.loc = 'food'; S.cur = 4; S.t = 4 * 1440 + 930; out.blocked = actions().some(a => /^No weekend shift for you/.test(a.l));
      S.rep = 60; const sh = actions().find(a => /^Work the weekend evening shift/.test(a.l)); const m0 = S.money; sh.fn(); out.pay = S.money - m0; out.job = Object.assign({}, ECO().rivJob);
      // a scheduled Saturday with no show
      const n = []; ECO().riv = -1; S.cur = 5; rivNight('home', n, 5); out.noshow = { m: ECO().rivJob.m, rep: S.rep, note: n.join(' ') };
      ECO().rivJob.m = 10; rivNight('home', [], 5); out.fired = { fired: !!ECO().rivFired, list: (S.firedFrom || []).includes('riv'), rep: S.rep };
      return out;
    });
    assert.strictEqual(r.riv, true, 'the Riv won’t interview you at −30');
    assert.strictEqual(r.blocked, true);
    assert.ok(r.pay >= 68, 'regulars’ rate: ' + r.pay);
    assert.deepStrictEqual(r.job, { m: 73, sched: true });
    assert.strictEqual(r.noshow.m, 58); assert.strictEqual(r.noshow.rep, 65, 'a no-show hurts the Riv job meter, not reputation'); assert.match(r.noshow.note, /never showed/);
    assert.deepStrictEqual(r.fired, { fired: true, list: true, rep: 65 });
    noErrors(errors);
  } },
  { name: 'reputation: the Island Group app shows the meter, Known for and enemies', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.repx = null; S.rep = 0; repAdd(25, 'helped a neighbor'); repEnemy('Corey the deckhand', 'you argued on the car deck'); S.loc = 'home'; phoneInstall('group'); });
    await clear(page);
    const t = await page.evaluate(() => phoneApp('group').view());
    assert.match(t, /Known · \+25/); assert.match(t, /repbar/); assert.match(t, /Known for/); assert.match(t, /Not fans of yours[\s\S]*Corey the deckhand/);
    noErrors(errors);
  } },
];
