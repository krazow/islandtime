// 🤲 reputation for every character
const { open, newGame, noErrors, assert } = require('./helpers');
module.exports = [
  { name: 'npc rep: roster is lazy, old saves work, clamp/tiers/known/public', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      delete S.npc; delete S.npcg; const n0 = Object.keys(NPC()).length;
      const named = ['marta', 'ken', 'lorraine', 'dev', 'dale', 'fred', 'gus', 'corey', 'walt', 'sam', 'hendersons', 'bev', 'rusty'].every(id => npcGet(id).kind === 'named');
      const bg = Object.values(NPC()).filter(x => x.kind === 'bg').length;
      const d = JSON.parse(JSON.stringify(packSave())); delete d.S.npc; adopt(migrate(d)); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const again = Object.keys(NPC()).length;
      npcGet('bev').rep = 0; const t0 = npcTier('bev').id; npcRepAdd('bev', 25, 'a', { public: true }); const t1 = npcTier('bev').id;
      for (let i = 0; i < 8; i++) npcRepAdd('bev', 1, 'w' + i); const max = npcRepAdd('bev', 500, 'big'), top = npcGet('bev').rep; npcRepAdd('bev', -500, 'x'); const low = npcGet('bev').rep;
      return { n0, named, bg, again, t0, t1, top, low, known: npcGet('bev').known.length, gossip: S.npcg.length, ic: npcIc('bev'), nm: npcName('walt') };
    });
    assert.ok(r.n0 >= 25 && r.named && r.bg >= 12 && r.again === r.n0);
    assert.deepStrictEqual([r.t0, r.t1], ['new', 'known']); assert.strictEqual(r.top, 100); assert.strictEqual(r.low, -100);
    assert.strictEqual(r.known, 6); assert.strictEqual(r.gossip, 1); assert.strictEqual(r.ic, '🚫 '); assert.strictEqual(r.nm, 'Walt');
    noErrors(errors);
  } },
  { name: 'npc rep: arrest jails, closes Dale’s Place and the gas call', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      S.weekNo = 0; S.cur = 1; S.t = 1 * 1440 + 600; const rep0 = npcGet('dale').rep; npcArrest('dale', 'was arrested', 2);
      const o = { drop: npcGet('dale').rep - rep0, jailed: npcJailed('dale'), txt: npcJailTxt('dale'), open: isOpen('dale'), hrs: hoursTxt('dale') };
      S.loc = 'dale'; S.tutorial && (S.tutorial = null); o.act = actions().map(a => a.l + ' ' + a.s).join('|');
      S.loc = 'aiDock'; S.phone = 100; S.cargo = S.cargo || {}; o.fuel = actions().filter(a => /Call Dale/.test(a.l)).map(a => ({ dis: a.dis, s: a.s }));
      S.cur = 4; S.t = 4 * 1440 + 600; o.later = npcJailed('dale'); const n = []; npcNight('home', n); o.rel = npcGet('dale').jailUntil; o.open2 = isOpen('dale');
      o.gossip = (S.npcg || []).some(x => /arrested/.test(x.txt)); return o;
    });
    assert.strictEqual(r.drop, -35); assert.ok(r.jailed && !r.open); assert.match(r.txt, /^Dale’s in county jail until Thursday\.$/);
    assert.match(r.act, /Dale’s Place is closed/); assert.ok(r.gossip);
    r.fuel.forEach(f => { assert.ok(f.dis); assert.match(f.s, /county jail/) });
    assert.ok(!r.later && r.rel === -1);
    noErrors(errors);
  } },
  { name: 'npc rep: 120-night simulation stays balanced', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const res = [];
      for (let run = 0; run < 3; run++) { S.weekNo = 0; S.cur = 0; S.npc = null; S.npcg = []; NPC(); const notes = [];
        for (let i = 0; i < 120; i++) { S.weekNo = Math.floor(i / 7); S.cur = i % 7; S.t = (i % 7) * 1440 + 1380; npcNight('home', notes); }
        const v = Object.values(NPC()), nonshady = v.filter(x => x.trait !== 'dale' && x.trait !== 'fred').map(x => x.rep).sort((a, b) => a - b);
        res.push({ dale: npcGet('dale').rep, fred: npcGet('fred').rep, med: nonshady[nonshady.length >> 1], min: nonshady[0], max: nonshady[nonshady.length - 1], in060: nonshady.filter(x => x >= 0 && x <= 60).length, n: nonshady.length, extreme: v.filter(x => Math.abs(x.rep) >= 100).length }); }
      return res;
    });
    console.log('  sim', JSON.stringify(r));
    for (const s of r) { assert.ok(s.dale < 0, 'dale negative ' + s.dale); assert.ok(s.fred < 10); assert.ok(s.in060 / s.n >= 0.7, 'most between 0 and 60'); assert.strictEqual(s.extreme, 0); assert.ok(s.med >= 5 && s.med <= 50); }
    noErrors(errors);
  } },
  { name: 'npc rep: heal +5 per 14 days, grudges fade after 28, neglected slump', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const T = { helper: 0, quiet: 0, rough: 0, dale: 0, fred: 0 }; const saved = {}; for (const k in NPC_TRAIT) { saved[k] = Object.assign({}, NPC_TRAIT[k]); NPC_TRAIT[k] = { g: 0, h: 0 }; }
      NPC(); const s = npcGet('gus'); s.rep = -10; s.healAt = 0; S.weekNo = 0; S.t = 13 * 1440 % 10080; S.t = 6 * 1440 + 100; npcNight('home', []); const a = s.rep; S.weekNo = 2; S.t = 100; npcNight('home', []); const b = s.rep;
      npcEnemy('gus', 'rusty'); const en0 = s.enemies.length; npcGet('rusty').es.gus = s.es.rusty = dayKey() - 10; npcNight('home', []); const en1 = s.enemies.length; s.es.rusty = dayKey() - 29; npcNight('home', []);
      const p = npcGet('walt'); p.rep = 10; p.homeLow = 1; for (let i = 0; i < 8; i++) npcNight('home', []);
      for (const k in saved) NPC_TRAIT[k] = saved[k]; return { a, b, en0, en1, en2: s.enemies.length, walt: p.rep };
    });
    assert.strictEqual(r.a, -10); assert.strictEqual(r.b, -5); assert.strictEqual(r.en0, 1); assert.strictEqual(r.en1, 1); assert.strictEqual(r.en2, 0); assert.strictEqual(r.walt, 5);
    noErrors(errors);
  } },
  { name: 'npc rep: gossip in the Island Group app, tier icons on friends', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      S.npcg = []; npcRepAdd('ken', 5, 'helped haul firewood', { public: true }); npcRepAdd('dale', -5, 'ran a load', { public: true });
      if (!PH().apps.includes('group')) PH().apps.push('group'); const html = phoneApp('group').view();
      meet('walt', 'Walt from the American Legion', 'x'); npcGet('walt').rep = 55; npcGet('gus'); meet('gus', 'Gus, the handyman', 'x'); npcGet('gus').rep = -70;
      const msg = msgList(); const calls = (() => { try { return phoneApp('calls').view() } catch (e) { return '' } })();
      return { html, msg, calls, ui: (() => { tab = 'me'; return '' })() };
    });
    assert.match(r.html, /Island gossip/); assert.match(r.html, /Big Ken helped haul firewood/); assert.match(r.html, /Dale ran a load/);
    assert.match(r.msg, /🤝<?[^<]*[^]*Walt|🤝 Walt/); assert.match(r.msg, /🚫 Gus/);
    noErrors(errors);
  } },
  { name: 'npc rep: help-post helper is weighted by rep and never jailed', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      NPC(); for (const x of Object.values(NPC())) x.rep = 0; npcGet('walt').rep = 90; npcGet('arlo') ; npcGet('bg7').rep = -60; npcArrest('hendersons', 'x', 3); npcGet('hendersons').rep = 90;
      const c = {}; for (let i = 0; i < 3000; i++) { const h = npcHelper(); c[h.id] = (c[h.id] || 0) + 1 }
      S.log = []; S.t = 600; const orig = Math.random; let hit = 0; const j = { task: 'general' };
      for (let i = 0; i < 80 && !hit; i++) { S.log = []; postReplies(j); hit = S.log.some(l => /^📣 (Walt|Big Ken|[A-Z][^ ]+).* (answers your post and just shows up)/.test(l.s)) ? 1 : 0 }
      return { walt: c.walt, other: c.marta, bad: c.bg7, jailed: c.hendersons || 0, hit };
    });
    assert.ok(r.walt > r.other * 2, `walt ${r.walt} vs marta ${r.other}`); assert.ok(r.bad < r.other); assert.strictEqual(r.jailed, 0);
    noErrors(errors);
  } },
  { name: 'npc rep: story chapters rebase stamps; epilogue names best and worst', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      NPC(); S.weekNo = 4; S.t = 0; npcRepAdd('bev', 5, 'x', { public: true }); npcEnemy('gus', 'rusty'); npcArrest('dale', 'x', 1);
      const k0 = npcGet('bev').known[0].d, e0 = npcGet('gus').es.rusty; S.weekNo = 0; npcRebase();
      const o = { k: [k0, npcGet('bev').known[0].d], e: [e0, npcGet('gus').es.rusty], jail: npcGet('dale').jailUntil, g: S.npcg[0].d };
      for (const x of Object.values(NPC())) x.rep = 0; npcGet('walt').rep = 80; npcGet('dale').rep = -40;
      o.lines = storyHooks.find(h => h.id === 'npcrep').ending({}); return o;
    });
    assert.strictEqual(r.k[1], r.k[0] - 28); assert.strictEqual(r.e[1], r.e[0] - 28); assert.strictEqual(r.jail, 1); assert.strictEqual(r.g, r.k[1]);
    assert.match(r.lines[0], /Walt ended the year the best-liked/); assert.match(r.lines[0], /Dale ended it the least/);
    noErrors(errors);
  } },
];
