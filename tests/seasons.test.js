const { open, noErrors, reload, assert } = require('./helpers');

// Start a fresh game in a season, with no queued modals.
async function seasonGame(page, season, mode = 'week', diff = 'normal') {
  await page.evaluate(([d, m, s]) => {
    newGame(d, m, s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
    tab = 'act'; render();
  }, [diff, mode, season]);
}
const labels = page => page.evaluate(() => actions().map(a => a.l));

module.exports = [
  { name: 'new-game flow asks for a season after difficulty and length', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => startNewWeek());
    const pick = async re => { const b = (await page.$$('#mbg .act')); for (const x of b) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
    await pick(/Normal/);
    await pick(/One week/);
    const txt = await page.textContent('#mbg');
    assert.match(txt, /Fall \(November\)/); assert.match(txt, /Winter \(January\)/); assert.match(txt, /Summer \(July\)/);
    await pick(/Winter/);
    assert.strictEqual(await page.evaluate(() => S.season), 'winter');
    assert.strictEqual(await page.evaluate(() => prefs().season), 'winter');
    noErrors(errors);
  } },
  { name: 'each season starts on the right Monday and shows the right month', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const want = { fall: ['Nov 2', 'Nov 7', 'Nov 29', '🍂'], winter: ['Jan 4', 'Jan 9', 'Jan 31', '❄️'], summer: ['Jun 29', 'Jul 4', 'Jul 26', '☀️'] };
    for (const s in want) {
      await seasonGame(page, s, 'month');
      const r = await page.evaluate(() => { const a = [dateTxt(0), dateTxt(5)]; S.weekNo = 3; a.push(dateTxt(6)); S.weekNo = 0; render(); return a.concat(document.querySelector('.hud-sub').textContent); });
      assert.deepStrictEqual(r.slice(0, 3), want[s].slice(0, 3), s);
      assert.ok(r[3].includes(want[s][3]) && r[3].includes(want[s][0]), s + ' hud: ' + r[3]);
      // a real Monday
      assert.strictEqual(await page.evaluate(() => { const st = SEA().start; return new Date(st[0], st[1], st[2]).getDay(); }), 1, s);
    }
    noErrors(errors);
  } },
  { name: 'summer: weekend evening boats fill up more than in fall; winter a bit less', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const fp = async s => { await seasonGame(page, s); return page.evaluate(() => { S.week.b = []; return [fullProb('M', 5, 1105), fullProb('I', 6, 1070), fullProb('I', 1, 535)]; }); };
    const fall = await fp('fall'), sum = await fp('summer'), win = await fp('winter');
    assert.ok(sum[0] > fall[0] + 0.2, `Sat evening: summer ${sum[0]} vs fall ${fall[0]}`);
    assert.ok(sum[1] > fall[1], `Sun evening: summer ${sum[1]} vs fall ${fall[1]}`);
    assert.ok(sum[2] >= fall[2], 'midweek midday');
    assert.ok(win[0] < fall[0], 'winter is quieter');
    noErrors(errors);
  } },
  { name: 'winter: ice on the ramp delays boats, ice cancellations, icy roads and king tides fire', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'winter');
    const r = await page.evaluate(() => {
      S.week.b = []; S.week.fog = [0, 0, 0, 0, 0, 0, 0]; S.week.sea.ice[1] = 20; S.week.sea.tide = null;
      const s = sailing('I', 1, 390), late = sailing('I', 1, 690);
      let cancels = 0; for (let i = 0; i < 40; i++) cancels += genWeek('normal', 'winter').b.filter(b => b.ice).length;
      return { delay: s.delay, why: s.why, late: late.delay, cancels };
    });
    assert.ok(r.delay >= 20 && /Ice on the ferry ramp/.test(r.why), JSON.stringify(r));
    assert.strictEqual(r.late, 0, 'ice only delays the morning boats');
    assert.ok(r.cancels > 0, 'ice can cancel sailings');
    // icy road + king tide during an island drive
    const ev = await page.evaluate(() => {
      S.cars.forEach(c => { c.bat = 'ok'; }); S.week.sea.snow = day(); S.week.sea.tide = { day: day(), start: S.t - 10, end: S.t + 200 }; S.t = Math.max(S.t, 400);
      S.week.sea.tide.start = S.t - 10; S.week.sea.tide.end = S.t + 200; S.ev.flags.garage = -1;
      forceEvent('icy_road'); forceEvent('king_tide');
      const t0 = S.t; go('store', { m: 'car', min: 7 }); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      return { ids: S.ev.history.map(h => h.id), mins: S.t - t0, loc: S.loc };
    });
    assert.ok(ev.ids.includes('icy_road') && ev.ids.includes('king_tide'), JSON.stringify(ev));
    assert.ok(ev.mins >= 7 + 8 + 20, 'icy road and the flooded Oro Bay road add time: ' + ev.mins);
    // waiting for an iced-up boat says why it's late
    const say = await page.evaluate(() => {
      S.cur = 1; S.t = 1440 + 330; S.loc = 'aiDock'; S.cars[0].loc = 'aiDock'; S.cars[0].fuel = 10; S.week.sea.ice[1] = 20; S.week.b = []; S.priority = true;
      setPref('safeOff', true); S.log = []; waitFerry('walk'); setPref('safeOff', false); return S.log.map(l => l.s).join(' ');
    });
    assert.match(say, /Ice on the ferry ramp.*minutes late/);
    noErrors(errors);
  } },
  { name: 'winter: frozen pipes burst when the heat is out, dripping the faucets saves them', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'winter');
    const r = await page.evaluate(() => {
      const U = UP(); S.week.sea.cold[0] = true; U.propane = 0; U.wood = 0; U.burned = -1; S.power = null; S.week.storm = null;
      const chance = pipeChance('home', 0), m0 = S.money, notes = [], R = Math.random;
      Math.random = () => 0; try { seasonNight('home', notes, 0); } finally { Math.random = R; }
      return { chance, notes, spent: m0 - S.money, pipes: S.stats.pipes };
    });
    assert.ok(r.chance >= 0.5, 'high chance with no heat on a freezing night');
    assert.ok(r.notes.some(n => /frozen pipe split/.test(n)) && r.spent === 280 && r.pipes === 1, JSON.stringify(r));
    // the drip action
    await page.evaluate(() => { S.loc = 'home'; S.t = 1000; tab = 'act'; render(); });
    const l = await labels(page);
    assert.ok(l.includes('Drip the faucets (3 nights)'), l.join(' | '));
    const due = await page.evaluate(() => actions().find(a => a.l === 'Drip the faucets (3 nights)').due);
    assert.strictEqual(due, true, 'due on a freezing evening');
    const r2 = await page.evaluate(() => {
      actions().find(a => a.l === 'Drip the faucets (3 nights)').fn();
      const chance = pipeChance('home', 0), notes = [], R = Math.random, m0 = S.money;
      Math.random = () => 0; try { seasonNight('home', notes, 0); } finally { Math.random = R; }
      return { chance, notes, spent: m0 - S.money, drip: S.sea.drip === dayKey() };
    });
    assert.strictEqual(r2.chance, 0); assert.strictEqual(r2.spent, 0); assert.ok(r2.drip);
    assert.ok(r2.notes.some(n => /faucets drip all night/.test(n)), JSON.stringify(r2.notes));
    assert.ok((await labels(page)).some(l => /^Faucets dripping ✓/.test(l)));
    noErrors(errors);
  } },
  { name: 'winter: woodstove and propane burn faster, more outages, gutters and moss slower', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const run = async s => { await seasonGame(page, s); return page.evaluate(() => {
      const U = UP(); let wood = 0, prop = 0, gut = 0, moss = 0;
      for (let i = 0; i < 20; i++) { Object.assign(U, { wood: 10, propane: 80, gutters: 0, moss: 0 }); S.week.storm = null; upkeepNight('home', [], 0); wood += 10 - U.wood; prop += 80 - U.propane; gut += U.gutters; moss += U.moss; }
      return { wood, prop, gut, moss, outage: seasonMul('outage'), storm: seasonMul('storm') }; }); };
    const f = await run('fall'), w = await run('winter');
    assert.strictEqual(f.wood, 20); assert.strictEqual(f.prop, 40);
    assert.ok(w.wood > f.wood && w.prop > f.prop, JSON.stringify([f, w]));
    assert.ok(w.moss < f.moss, 'moss grows slower');
    assert.ok(w.outage > 1 && w.storm > 1 && f.outage === 1 && f.storm === 1);
    noErrors(errors);
  } },
  { name: 'summer: no woodstove, garden needs water and feeds you, no fog or storms, burn ban', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'summer');
    const r = await page.evaluate(() => {
      const U = UP(); Object.assign(U, { wood: 3, propane: 50, chimney: 5, ash: 0 }); const n = [];
      upkeepNight('home', n, 0);
      let fog = 0, storms = 0; for (let i = 0; i < 30; i++) { const w = genWeek('hard', 'summer'); fog += w.fog.filter(Boolean).length; storms += w.storm ? 1 : 0; }
      return { wood: U.wood, propane: U.propane, chimney: U.chimney, notes: n, fog, storms, fire: EV.find(e => e.id === 'chimney_fire').cond({ where: 'home' }) };
    });
    assert.deepStrictEqual([r.wood, r.chimney, r.fire], [3, 5, false], JSON.stringify(r));
    assert.ok(r.propane >= 48, 'propane: hot water only');
    assert.ok(!r.notes.some(n => /firewood/.test(n)));
    assert.strictEqual(r.fog, 0); assert.strictEqual(r.storms, 0);
    // garden: water it and it pays out; ignore it and it dies
    const g = await page.evaluate(() => {
      S.loc = 'home'; S.t = 600; const p0 = S.pantry, out = [];
      for (let i = 0; i < 3; i++) { actions().find(a => a.l === 'Water the garden').fn(); const n = []; seasonNight('home', n, day()); out.push(...n); S.cur++; S.t = S.cur * 1440 + 600; }
      const harvest = S.pantry - p0;
      for (let i = 0; i < 3; i++) { const n = []; seasonNight('home', n, day()); out.push(...n); S.cur++; S.t = S.cur * 1440 + 600; }
      return { harvest, dead: S.sea.garden.dead, notes: out };
    });
    assert.strictEqual(g.harvest, 1, JSON.stringify(g)); assert.strictEqual(g.dead, true);
    // burn ban
    const b = await page.evaluate(() => { S.sea.brush = 6; S.t = S.cur * 1440 + 700; const l = actions().map(a => a.l); const m0 = S.money, R = Math.random;
      Math.random = () => 0; try { actions().find(a => /Burn the brush pile/.test(a.l)).fn(); } finally { Math.random = R; } return { l, fine: m0 - S.money, brush: S.sea.brush }; });
    assert.ok(b.l.includes('Chip and haul the brush pile'), b.l.join('|'));
    assert.strictEqual(b.fine, 250); assert.strictEqual(b.brush, 0);
    noErrors(errors);
  } },
  { name: 'summer: Fourth of July on Saturday of week 1 (BBQ, fireworks, ferry chaos)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'summer', 'month');
    const r = await page.evaluate(() => {
      S.week.b = []; S.cur = 5; S.t = 5 * 1440 + 360; S.log = []; seasonMorning(5);
      const morning = S.log.map(l => l.s).join(' ');
      S.loc = 'food'; S.t = 5 * 1440 + 720; const bbq = actions().find(a => /Legion Fourth of July BBQ: \$12/.test(a.l));
      const m0 = S.money; bbq.fn();
      S.loc = 'home'; S.t = 5 * 1440 + 1310; const fw = actions().find(a => a.l === 'Watch the fireworks over the water');
      const st0 = S.stress; fw.fn();
      const evening = sailing('M', 5, 1105), full = fullProb('M', 5, 1105), friday = fullProb('I', 4, 690);
      const date = dateTxt(5); S.weekNo = 1; S.week = genWeek('normal', 'summer');
      return { date, morning, paid: m0 - S.money, walt: !!S.friends.walt, fw: S.sea.fw, delay: evening.delay, why: evening.why, full, friday, nextWeek: S.week.sea.fourth };
    });
    assert.strictEqual(r.date, 'Jul 4');
    assert.match(r.morning, /Fourth of July/);
    assert.strictEqual(r.paid, 12); assert.ok(r.walt, 'meets Walt at the BBQ');
    assert.ok(r.fw != null, 'watched the fireworks');
    assert.ok(r.delay >= 15 && /Fourth of July/.test(r.why));
    assert.ok(r.full >= 0.5, 'Fourth evening boats are packed even with two boats running: ' + r.full);
    assert.strictEqual(r.nextWeek, -1, 'only in the first week');
    noErrors(errors);
  } },
  { name: 'summer: wildfire smoke day keeps you inside', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'summer');
    const r = await page.evaluate(() => { S.week.sea.smoke = day(); S.t = day() * 1440 + 720; S.loc = 'home'; render();
      return { lite: seasonLite(720), dark: seasonDark(), bar: document.querySelector('.alertbar') ? document.querySelector('.alertbar').textContent : '' }; });
    assert.strictEqual(r.lite, false); assert.match(r.dark, /smoke/); assert.match(r.bar, /smoke/i);
    noErrors(errors);
  } },
  { name: 'daylight: outdoor work window per season', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const win = async s => { await seasonGame(page, s); return page.evaluate(() => { S.week.sea && (S.week.sea.smoke = -1); return [370, 430, 500, 970, 1030, 1250].map(m => seasonLite(m)); }); };
    assert.deepStrictEqual(await win('fall'), [false, true, true, true, false, false]);
    assert.deepStrictEqual(await win('winter'), [false, false, true, false, false, false]);
    assert.deepStrictEqual(await win('summer'), [true, true, true, true, true, true]);
    // the gutter job is disabled at 4:30 PM in winter with the January text
    await seasonGame(page, 'winter');
    const g = await page.evaluate(() => { S.loc = 'home'; S.t = 990; UP().gutters = 70; const a = actions().find(x => x.l === 'Clear the gutters'); return [a.dis, a.s]; });
    assert.strictEqual(g[0], true); assert.match(g[1], /8 AM–4 PM in January/);
    noErrors(errors);
  } },
  { name: 'fall is unchanged: dates, daylight, ferry, heating, no season extras', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'fall');
    const r = await page.evaluate(() => {
      S.week.b = [];
      const U = UP(); Object.assign(U, { wood: 5, propane: 60 }); S.week.storm = null; upkeepNight('home', [], 0);
      const g = genWeek('normal', 'fall');
      return { season: S.season, date: dateTxt(0), sea: S.week.sea, gsea: g.sea, delay: seasonDelay('I', 1, 390),
        full: [fullProb('M', 4, 955), fullProb('I', 0, 380), fullProb('M', 6, 1105), fullProb('I', 2, 605)], wood: U.wood, propane: U.propane,
        dark: seasonDark(), mul: ['fog', 'storm', 'outage', 'rain', 'gut', 'moss'].map(k => seasonMul(k)), flavor: seasonFlavor() === FLAVOR_MORNING, life: LIFE_CAL.vet.d };
    });
    assert.strictEqual(r.season, 'fall'); assert.strictEqual(r.date, 'Nov 2');
    assert.strictEqual(r.sea, undefined); assert.strictEqual(r.gsea, undefined); assert.strictEqual(r.delay, null);
    assert.deepStrictEqual(r.full.map(x => Math.round(x * 100) / 100), [0.55, 0.35, 0.45, 0.05]);
    assert.strictEqual(r.wood, 4); assert.strictEqual(r.propane, 58);
    assert.strictEqual(r.dark, 'Outdoor work is a daylight job: 7 AM–5 PM in November.');
    assert.deepStrictEqual(r.mul, [1, 1, 1, 1, 1, 1]); assert.ok(r.flavor);
    // newGame without a season (as other modules and old tests call it) is fall
    assert.strictEqual(await page.evaluate(() => { newGame('normal', 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); return S.season; }), 'fall');
    noErrors(errors);
  } },
  { name: 'an old save without a season loads as fall; a winter save keeps its season', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'fall');
    await page.evaluate(() => { const d = packSave(); delete d.S.season; delete d.S.sea; d.app = '1.12.0'; localStorage.setItem('islandtime.save', JSON.stringify(d)); });
    await reload(page);
    await page.evaluate(() => resumeGame());
    assert.deepStrictEqual(await page.evaluate(() => [S.season, dateTxt(0), typeof S.sea]), ['fall', 'Nov 2', 'object']);
    await seasonGame(page, 'winter');
    await page.evaluate(() => saveGame());
    await reload(page);
    assert.match(await page.textContent('.title'), /Continue as T: ❄️ Winter/);
    await page.evaluate(() => resumeGame());
    assert.deepStrictEqual(await page.evaluate(() => [S.season, dateTxt(0), Array.isArray(S.week.sea.cold)]), ['winter', 'Jan 4', true]);
    noErrors(errors);
  } },
  { name: 'a whole week in each season runs without errors and the end screen names the season', fn: async ctx => {
    const { page, errors } = await open(ctx);
    for (const [s, mon] of [['fall', 'November'], ['winter', 'January'], ['summer', 'July']]) {
      await seasonGame(page, s);
      await page.evaluate(() => {
        for (let i = 0; i < 7 && !S.over; i++) {
          S.loc = 'home'; S.t = S.cur * 1440 + 1200; tab = 'act'; render(); setTab('ferry'); setTab('act');
          endDay('home'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
        }
      });
      const end = await page.textContent('.end');
      assert.ok(new RegExp('Season.*' + mon).test(end), s + ': ' + end.slice(0, 300));
    }
    noErrors(errors);
  } },
  { name: 'scene: snow in winter, bright sky in summer', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'winter');
    const w = await page.evaluate(() => { S.loc = 'home'; S.t = 720; render(); return document.querySelector('.scene svg').innerHTML; });
    assert.ok(/snowline/.test(w) && /#f2f6f7/.test(w));
    await seasonGame(page, 'summer');
    const s = await page.evaluate(() => { S.loc = 'home'; S.t = 720; render(); return document.querySelector('.scene svg').innerHTML; });
    assert.ok(/#7fb6d8/.test(s) && /#3b7a50/.test(s) && !/snowline/.test(s));
    // 8 PM in July is still daylight; in January it's night
    const n = await page.evaluate(() => { S.t = 1200; render(); return /#0e1d2b/.test(document.querySelector('.scene svg').innerHTML); });
    assert.strictEqual(n, false);
    noErrors(errors);
  } },
];
