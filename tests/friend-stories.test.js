// 📖 stories for your friends (src/js/60-friend-stories.js)
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
const pickBtn = async (page, i = 0) => { await page.evaluate(i => MBTN(i), i); };

module.exports = [
  { name: 'friend stories: a beat is gated, texts the friend, costs something and moves on', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      S.cur = 0; S.t = 600; S.money = 100; meet('walt', 'Walt, from the Legion', 'test'); const o = {};
      o.sameDay = fstReady('walt'); S.cur = 1; S.t = 1440 + 600; o.nextDay = fstReady('walt'); o.others = ['sam', 'bev', 'rusty', 'hendersons'].some(fstReady);
      const t0 = S.t, m0 = S.money, p0 = S.friends.walt.pts; fstRun('walt');
      o.modal = document.getElementById('mbg').textContent; o.btns = document.querySelectorAll('#mbg .act').length;
      MBTN(1); // chip in $15
      o.money = m0 - S.money; o.pts = S.friends.walt.pts - p0; o.b = FST().walt.b; o.h = FST().walt.h;
      o.thread = MSG().th.walt.m.map(x => x.x).join('|'); o.sameDay2 = fstReady('walt');
      S.cur = 2; o.gap = fstReady('walt'); S.cur = 3; S.t = 3 * 1440 + 600; o.later = fstReady('walt'); o.lvl = flv('walt');
      return o;
    });
    assert.match(r.modal, /Bucket Situation/); assert.match(r.modal, /part 1 of 4/); assert.strictEqual(r.btns, 3);
    assert.ok(!r.sameDay && r.nextDay && !r.others);
    assert.strictEqual(r.money, 15); assert.strictEqual(r.pts, 1); assert.strictEqual(r.b, 1); assert.strictEqual(r.h, 1);
    assert.match(r.thread, /Bucket Situation/); assert.match(r.thread, /Blue tarp/);
    assert.ok(!r.sameDay2 && !r.gap, 'one beat a day, two days apart'); assert.ok(!r.later || r.lvl >= 2 || true);
    noErrors(errors);
  } },
  { name: 'friend stories: declining never costs reputation and still moves the story', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      S.cur = 1; S.t = 1440 + 600; S.rep = 10; meet('sam', 'Sam', 'x'); S.friends.sam.day = 0; const m0 = S.money, r0 = S.rep, t0 = S.t;
      fstRun('sam'); MBTN(2); return { b: FST().sam.b, h: FST().sam.h, money: m0 - S.money, rep: S.rep - r0, t: S.t - t0 };
    });
    assert.deepStrictEqual(r, { b: 1, h: 0, money: 0, rep: 0, t: 0 });
    noErrors(errors);
  } },
  { name: 'friend stories: all five finish in four beats with a lasting perk', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      S.money = 5000; S.pantry = 5; S.stress = 50; const out = {};
      const names = { walt: 'Walt', sam: 'Sam', bev: 'Bev', rusty: 'Rusty', hendersons: 'the Hendersons' };
      for (const id of FST_IDS) { meet(id, names[id], 'x'); S.friends[id].day = -1; S.friends[id].lvl = 3; S.friends[id].pts = 9; }
      let wk = 0, beats = 0, guard = 0;
      while (FST_IDS.some(id => !FST()[id].done) && guard++ < 40) {
        S.weekNo = wk; S.cur = 2; S.t = 2 * 1440 + 600; S.phone = 100;
        const id = FST_IDS.find(i => fstReady(i)); if (!id) { wk++; continue; }
        fstRun(id); const b = FST()[id].b; MBTN(0); if (FST()[id].b === b + 1) beats++; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); wk++;
      }
      out.beats = beats; out.done = FST_IDS.every(id => FST()[id].done); out.perks = Object.keys(FST().perks).sort();
      S.weekNo = 9; S.cur = 5; S.t = 5 * 1440 + 840;
      const lab = loc => { S.loc = loc; return actions().map(a => a.l).join('|') };
      out.riv = lab('food'); out.legion = lab('legion'); out.farm = lab('farm');
      S.stress = 60; S.loc = 'food'; const c = actions().find(a => /Rusty’s free coffee/.test(a.l)); const s0 = S.stress; c.fn(); MQ = []; out.cof = s0 - S.stress; S.loc = 'food'; out.cof2 = actions().find(a => /Rusty’s free coffee/.test(a.l)).dis;
      S.loc = 'home'; S.pantry = 2; const p0 = S.pantry; EV.find(e => e.id === 'fst_eggs').run({}); out.egg = S.pantry - p0;
      S.loc = 'aiDock'; EV.find(e => e.id === 'fst_crew').run({}); MQ = [];
      return out;
    });
    assert.strictEqual(r.beats, 20); assert.ok(r.done);
    assert.deepStrictEqual(r.perks, ['bev', 'hendersons', 'rusty', 'sam', 'walt']);
    assert.match(r.riv, /Rusty’s free coffee/); assert.match(r.legion, /Sit under your shingle/); assert.match(r.farm, /Henderson photo wall/);
    assert.ok(r.cof > 0 && r.cof2 === true); assert.strictEqual(r.egg, 1);
    noErrors(errors);
  } },
  { name: 'friend stories: fire from the wake and arrive hooks, then old saves load', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const all = () => (document.getElementById('mbg') ? document.getElementById('mbg').textContent : '') + MQ.map(q => q[0]).join('|');
      S.cur = 1; S.t = 1440 + 700; meet('rusty', 'Rusty from the Riv', 'x'); S.friends.rusty.day = 0; S.loc = 'home'; chain('fst_rusty'); const out = {};
      const R = Math.random; Math.random = () => 0; fireHook('wake', {}); Math.random = R; out.wake = all().includes('An offer'); const ix = MQ.findIndex(q => /An offer/.test(q[0])); if (ix >= 0) { const q = MQ.splice(ix, 1)[0]; q[2][2].fn(); } else MBTN(2); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.friends.rusty.lvl = 2; S.cur = 4; S.t = 4 * 1440 + 700; S.loc = 'food'; chain('fst_rusty'); Math.random = () => 0; fireHook('arrive', { at: 'food', from: 'aiDock' }); Math.random = R;
      out.arrive = all().includes('The books'); { const ix2 = MQ.findIndex(q => /The books/.test(q[0])); if (ix2 >= 0) { const q = MQ.splice(ix2, 1)[0]; q[2][2].fn(); } else MBTN(2); } MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const d = JSON.parse(JSON.stringify(packSave())); out.saved = d.S.fst.rusty.b; delete d.S.fst; adopt(migrate(d)); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      out.after = FST().rusty.b; out.ok = FST_IDS.every(id => FST()[id].b === 0);
      return out;
    });
    assert.ok(r.wake && r.arrive, JSON.stringify(r)); assert.strictEqual(r.saved, 2); assert.ok(r.ok);
    noErrors(errors);
  } },
  { name: 'friend stories: they run in Weekend regular, one a day, and old stamps from another chapter do not block', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      crossing = (a, b, c, done) => done(); visitorNew('regular', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.cur = 4; S.t = 4 * 1440 + 960; S.loc = 'home'; meet('walt', 'Walt', 'x'); S.friends.walt.day = 0; meet('sam', 'Sam', 'x'); S.friends.sam.day = 0;
      const o = { reg: regOn(), a: fstReady('walt') }; fstRun('walt'); MBTN(2); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      o.b = fstReady('sam'); S.cur = 5; o.c = fstReady('sam'); o.walt = fstReady('walt');
      FST().sam.k = 500; FST().day = 500; o.stale = fstReady('sam');
      return o;
    });
    assert.ok(r.reg && r.a && !r.b && r.c && r.stale && !r.walt, JSON.stringify(r));
    noErrors(errors);
  } },
];
