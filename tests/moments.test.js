// ✨ memorable moments (src/js/61-moments.js)
const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'moments: twenty events across the ferry, home, road, lake and mainland, each with a choice', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const hooks = {}; MOMENTS.forEach(id => { const e = EV.find(x => x.id === id); (Array.isArray(e.hook) ? e.hook : [e.hook]).forEach(h => hooks[h] = (hooks[h] || 0) + 1) });
      const out = { n: MOMENTS.length, hooks, bad: [] };
      const ctxFor = id => { const e = EV.find(x => x.id === id), h = Array.isArray(e.hook) ? e.hook[e.hook.length - 1] : e.hook; const o = { hook: h, at: 'aiDock', from: h === 'arrive' ? 'ferry' : 'home', to: 'aiDock', finish: n => { o.fin = n }, add: () => {} };
        if (id === 'mo_busker' || id === 'mo_tourists') o.at = 'stDock'; if (id === 'mo_swim') o.at = 'lake'; if (id === 'mo_blackberries') { o.at = 'store'; o.from = 'home' } if (id === 'mo_potluck') { o.at = 'home'; o.from = 'aiDock' } return o };
      for (const id of MOMENTS) {
        const e = EV.find(x => x.id === id); let nb = 0;
        for (let i = 0; i < 3; i++) {
          MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove());
          S.money = 100; S.pantry = 3; S.stress = 50; S.gen = 'home'; S.homeGas = 5; S.t = S.cur * 1440 + 700; S.mom = {}; const c = ctxFor(id), t0 = S.t, st0 = S.stress;
          const res = e.run(c); const mb = document.getElementById('mbg'); if (!mb) { out.bad.push(id + ' no modal'); break }
          const btns = mb.querySelectorAll('.act'); nb = btns.length; if (i >= nb) break;
          MBTN(i); if (c.hook === 'tripMid' && c.fin == null) out.bad.push(id + ' did not resume the trip'); if (c.hook === 'tripMid' && !(res && res.block)) out.bad.push(id + ' did not pause the trip');
          if (S.stress > st0 + 4 || S.t - t0 > 130) out.bad.push(id + ' extreme');
        }
        if (nb < 3) out.bad.push(id + ' needs 3 choices'); if (!e.tile && !TILE_META[id]) out.bad.push(id + ' no tile');
      }
      MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove());
      return out;
    });
    assert.strictEqual(r.n, 20); assert.deepStrictEqual(r.bad, []);
    ['arrive', 'wake', 'tripMid'].forEach(h => assert.ok(r.hooks[h] >= 1, h));
    assert.ok(r.hooks.arrive >= 10 && r.hooks.tripMid >= 5);
    noErrors(errors);
  } },
  { name: 'moments: weighted by season and time of day', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const ev = id => EV.find(x => x.id === id), o = {};
      const set = (sea, m, loc) => { S.season = sea; S.t = S.cur * 1440 + m; S.mom = {}; S.week.fog = [0, 0, 0, 0, 0, 0, 0] };
      const ok = (id, c) => { const e = ev(id); return !!e.cond(c) };
      const ch = (id, c) => ev(id).chance(c);
      const ferry = { hook: 'arrive', at: 'aiDock', from: 'ferry' }, road = { hook: 'tripMid', from: 'home', to: 'aiDock', mode: 'car' };
      set('summer', 600); o.orcaSum = ch('mo_orcas', ferry); set('winter', 600); o.orcaWin = ch('mo_orcas', ferry); o.orcaNight = (set('winter', 1300), ok('mo_orcas', ferry));
      set('summer', 600); o.kingSum = ok('mo_king_tide', road); set('winter', 450); o.kingWin = ok('mo_king_tide', road); set('winter', 780); o.kingNoon = ok('mo_king_tide', road);
      set('winter', 780); o.lemWin = ok('mo_lemonade', road); set('summer', 780); o.lemSum = ok('mo_lemonade', road);
      set('summer', 450); o.fawnDawn = ok('mo_fawn', road); set('summer', 780); o.fawnNoon = ok('mo_fawn', road);
      set('winter', 780); o.swimWin = ok('mo_swim', { hook: 'arrive', at: 'lake', from: 'home' }); set('summer', 780); o.swimSum = ok('mo_swim', { hook: 'arrive', at: 'lake', from: 'home' });
      set('fall', 1000); S.power = null; o.potNoOutage = ok('mo_potluck', { hook: 'arrive', at: 'home', from: 'aiDock' }); S.power = { start: S.t - 10, end: S.t + 500 }; o.potOutage = ok('mo_potluck', { hook: 'arrive', at: 'home', from: 'aiDock' });
      set('fall', 400); o.chain = ok('mo_chainsaw', { hook: 'wake' }) ; S.loc = 'home'; o.chainHome = ok('mo_chainsaw', { hook: 'wake' }); set('summer', 400); o.chainSum = ch('mo_chainsaw', { hook: 'wake' }); set('fall', 400); o.chainFall = ch('mo_chainsaw', { hook: 'wake' });
      return o;
    });
    assert.ok(r.orcaSum > r.orcaWin && r.orcaWin > 0); assert.ok(!r.orcaNight);
    assert.ok(!r.kingSum && r.kingWin && !r.kingNoon); assert.ok(!r.lemWin && r.lemSum); assert.ok(r.fawnDawn && !r.fawnNoon);
    assert.ok(!r.swimWin && r.swimSum); assert.ok(!r.potNoOutage && r.potOutage); assert.ok(r.chainHome && r.chainFall > r.chainSum);
    noErrors(errors);
  } },
  { name: 'moments: never a flood (one a day, three a week) and old saves load', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      delete S.mom; S.season = 'summer'; S.cur = 2; S.t = 2 * 1440 + 700; const o = {};
      const R = Math.random; Math.random = () => 0; let fired = 0;
      for (let i = 0; i < 30; i++) { MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove()); const n = S.ev.history.length; S.cur = 2; S.t = 2 * 1440 + 700; S.loc = 'aiDock'; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); fired += S.ev.history.slice(n).filter(h => MOMENTS.includes(h.id)).length }
      o.oneDay = fired;
      for (const d of [3, 4, 5, 6]) { S.cur = d; S.t = d * 1440 + 700; MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove()); const n = S.ev.history.length; for (let i = 0; i < 12; i++) { S.ev.count = {}; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); } fired += 0 }
      Math.random = R; o.week = Object.values(MOM().w).reduce((a, b) => a + b, 0);
      const d = JSON.parse(JSON.stringify(packSave())); delete d.S.mom; adopt(migrate(d)); MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove()); o.after = momCapOk();
      return o;
    });
    assert.strictEqual(r.oneDay, 1); assert.ok(r.week <= 3, 'week ' + r.week); assert.ok(r.after);
    noErrors(errors);
  } },
  { name: 'moments: fire from the real hooks (ferry arrival, wake at home)', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const R = Math.random; Math.random = () => 0; S.season = 'summer'; S.cur = 1; S.t = 1440 + 620; S.loc = 'aiDock'; MQ = []; document.querySelectorAll('.modal-bg').forEach(x => x.remove());
      EV.forEach(e => { if (!MOMENTS.includes(e.id)) S.ev.count[e.id] = 99 }); const n = S.ev.history.length; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); Math.random = R;
      const ids = S.ev.history.slice(n).map(h => h.id); const txt = (document.getElementById('mbg') || { textContent: '' }).textContent + MQ.map(q => q[0]).join('|');
      return { ids, ok: ids.some(i => MOMENTS.includes(i)), txt };
    });
    assert.ok(r.ok, JSON.stringify(r));
    noErrors(errors);
  } },
];
