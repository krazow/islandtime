const { open, noErrors, reload, assert } = require('./helpers');

// Start a fresh game in a season, with no queued modals (same approach as seasons.test.js).
async function seasonGame(page, season, mode = 'week', diff = 'normal') {
  await page.evaluate(([d, m, s]) => {
    newGame(d, m, s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
    tab = 'act'; render();
  }, [diff, mode, season]);
}
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });

module.exports = [
  { name: 'spring: April 2027 dates, Monday start, no ferry holidays, HUD and intro', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring', 'month');
    const r = await page.evaluate(() => {
      const st = SEA().start, out = { dow: new Date(st[0], st[1], st[2]).getDay(), d0: dateTxt(0), d6: dateTxt(6), hol: [], two: [] };
      for (let w = 0; w < 4; w++) { S.weekNo = w; for (let d = 0; d < 7; d++) { if (ferryHoliday(d)) out.hol.push(w + ':' + d); if (twoBoatDay(d)) out.two.push(w + ':' + d); } }
      S.weekNo = 3; out.last = dateTxt(6); S.weekNo = 0; render();
      out.hud = document.querySelector('.hud-sub').textContent;
      out.log = S.log.map(l => l.s).join(' ');
      out.ok = seasonOk('spring'); out.badge = seasonBadge(S); out.year = seasonYear('spring');
      return out;
    });
    assert.strictEqual(r.dow, 1, 'April 5 2027 is a Monday');
    assert.deepStrictEqual([r.d0, r.d6, r.last], ['Apr 5', 'Apr 11', 'May 2']);
    assert.deepStrictEqual(r.hol, []); assert.deepStrictEqual(r.two, []);
    assert.ok(r.hud.includes('🌱') && r.hud.includes('Apr 5'), r.hud);
    assert.match(r.log, /Spring on the island/);
    assert.ok(r.ok); assert.strictEqual(r.badge, '🌱 Spring'); assert.strictEqual(r.year, 'April 2027');
    noErrors(errors);
  } },
  { name: 'spring: daylight window, weather multipliers, non-peak fares, spring-break boats', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const fp = async s => { await seasonGame(page, s); return page.evaluate(() => { S.week.b = []; return [fullProb('M', 4, 1105), fullProb('I', 5, 690), fullProb('I', 1, 535), fullProb('M', 6, 1105)]; }); };
    const fall = await fp('fall'), spr = await fp('spring');
    assert.ok(Math.abs(spr[0] - fall[0] - 0.08) < 1e-9 && Math.abs(spr[1] - fall[1] - 0.08) < 1e-9, JSON.stringify([fall, spr]));
    assert.strictEqual(spr[2], fall[2]); assert.strictEqual(spr[3], fall[3]);
    const r = await page.evaluate(() => ({
      lite: [380, 400, 700, 1160, 1180].map(m => seasonLite(m)), dark: seasonDark(),
      mul: ['fog', 'storm', 'outage', 'rain', 'gut', 'moss'].map(k => seasonMul(k)), fare: fareCar(), deps: deps('I', 5).length, base: AI_DEPS.length,
      delay: seasonDelay('I', 1, 390), note4: (S.cur = 4, seasonFerryNote()), note1: (S.cur = 1, seasonFerryNote()) }));
    assert.deepStrictEqual(r.lite, [false, true, true, true, false]);
    assert.strictEqual(r.dark, 'Outdoor work is a daylight job: 6:30 AM–7:30 PM in April.');
    assert.deepStrictEqual(r.mul, [0.7, 0.3, 0.5, 1.1, 0.8, 1.3]);
    assert.strictEqual(r.fare, 24.94); assert.strictEqual(r.deps, r.base);
    assert.strictEqual(r.delay, null);
    assert.match(r.note4, /Spring break/); assert.strictEqual(r.note1, '');
    // fewer fog days and storms than fall over many weeks
    const w = await page.evaluate(() => { let fog = [0, 0], st = [0, 0]; for (let i = 0; i < 200; i++) { const a = genWeek('normal', 'fall'), b = genWeek('normal', 'spring');
      fog[0] += a.fog.filter(Boolean).length; fog[1] += b.fog.filter(Boolean).length; st[0] += a.storm ? 1 : 0; st[1] += b.storm ? 1 : 0; } return { fog, st }; });
    assert.ok(w.fog[1] < w.fog[0] && w.st[1] < w.st[0], JSON.stringify(w));
    noErrors(errors);
  } },
  { name: 'spring: woodstove lightly (about every other night), little propane, moss grows faster', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const run = async s => { await seasonGame(page, s); return page.evaluate(() => {
      const U = UP(); let wood = 0, prop = 0, moss = 0;
      for (let i = 0; i < 40; i++) { Object.assign(U, { wood: 10, propane: 80, moss: 0 }); S.week.storm = null; upkeepNight('home', [], 0); wood += 10 - U.wood; prop += 80 - U.propane; moss += U.moss; }
      return { wood, prop, moss, stove: seasonStove(), price: woodPrice() }; }); };
    const f = await run('fall'), s = await run('spring');
    assert.strictEqual(f.wood, 40); assert.strictEqual(f.prop, 80);
    assert.ok(s.wood > 8 && s.wood < 32, 'about every other night: ' + s.wood);
    assert.strictEqual(s.prop, 40, 'propane 1 a night with the stove');
    assert.ok(s.moss > f.moss, 'moss loves spring');
    assert.strictEqual(s.stove, true); assert.strictEqual(s.price, 17); assert.strictEqual(f.price, 19);
    noErrors(errors);
  } },
  { name: 'spring: plant the garden, water it (rain counts), early greens, and it dies if neglected', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring', 'month');
    const r = await page.evaluate(() => {
      S.week.sea.pollen = []; S.loc = 'home'; S.t = 600;
      const before = actions().map(a => a.l);
      const night = (rain) => { const n = []; UP().rain = rain ? dayKey() : -1; seasonNight('home', n, day()); return n; };
      const next = () => { if (S.cur === 6) { S.weekNo++; S.cur = 0; S.week = genWeek('normal'); S.week.sea.pollen = []; } else S.cur++; S.t = S.cur * 1440 + 600; };
      const t0 = S.t; actions().find(a => a.l === 'Plant the garden').fn(); const took = S.t - t0;
      const after = actions().map(a => a.l);
      const p0 = S.pantry, notes = [];
      // 12 days: water every other day, and once let the rain do it
      for (let i = 0; i < 12; i++) {
        if (i > 0 && i % 2 === 0 && i !== 6) actions().find(a => a.l === 'Water the garden').fn();
        notes.push(...night(i === 5)); next();
      }
      const harvest = S.pantry - p0, alive = !S.sea.garden.dead;
      // now neglect it
      for (let i = 0; i < 5; i++) { notes.push(...night(false)); next(); }
      return { before, after, took, harvest, alive, dead: S.sea.garden.dead, notes, veg: S.stats.veg,
        labels: actions().map(a => a.l) };
    });
    assert.ok(r.before.includes('Plant the garden'), r.before.join('|'));
    assert.strictEqual(r.took, 60);
    assert.ok(!r.after.includes('Plant the garden') && r.after.includes('Garden watered today ✓'), r.after.join('|'));
    assert.ok(r.alive, JSON.stringify(r.notes));
    assert.ok(r.notes.some(n => /rains in the night/.test(n)), 'rain waters it');
    assert.ok(r.notes.some(n => /first rows are up/.test(n)));
    assert.ok(r.harvest >= 1, 'early greens by day 12: ' + JSON.stringify(r.notes));
    assert.ok(r.notes.some(n => /colander of lettuce/.test(n)));
    assert.strictEqual(r.dead, true);
    assert.ok(r.notes.some(n => /seedlings give up/.test(n)));
    assert.ok(r.labels.includes('The garden is done for this spring'));
    // never planted: nothing happens at night; and too late to plant in week 3
    const r2 = await page.evaluate(() => { S.sea = {}; S.weekNo = 0; S.cur = 1; S.t = 1440 + 600; S.week.sea.pollen = []; const n = []; seasonNight('home', n, 1);
      const early = actions().some(a => a.l === 'Plant the garden'); S.weekNo = 2; const late = actions().some(a => a.l === 'Plant the garden');
      S.t = 1440 + 1200; S.weekNo = 0; const dark = actions().find(a => a.l === 'Plant the garden');
      return { garden: n.filter(x => /garden/i.test(x)), early, late, dark: [dark.dis, dark.s] }; });
    assert.deepStrictEqual(r2.garden, []); assert.ok(r2.early); assert.ok(!r2.late);
    assert.strictEqual(r2.dark[0], true); assert.match(r2.dark[1], /April/);
    noErrors(errors);
  } },
  { name: 'spring: spring cleaning once per game', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring');
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.t = 600; S.home = 50; S.stress = 30;
      const t0 = S.t; actions().find(a => a.l === 'Spring cleaning').fn();
      const out = { took: S.t - t0, home: S.home, stress: S.stress, same: actions().find(a => /Spring cleaning/.test(a.l)).dis };
      S.cur = 1; S.t = 1440 + 600; out.later = actions().some(a => /Spring cleaning/.test(a.l));
      return out;
    });
    assert.strictEqual(r.took, 120); assert.strictEqual(r.home, 58); assert.strictEqual(r.stress, 27);
    assert.strictEqual(r.same, true); assert.strictEqual(r.later, false);
    await seasonGame(page, 'fall');
    assert.ok(!(await page.evaluate(() => { S.loc = 'home'; S.t = 600; return actions().some(a => /Spring cleaning|Plant the garden/.test(a.l)); })));
    noErrors(errors);
  } },
  { name: 'spring: pollen days (note, stress outdoors, allergy pill at the pharmacy)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring');
    // 0–2 pollen days a week
    const counts = await page.evaluate(() => { const c = new Set(); for (let i = 0; i < 100; i++) c.add(genWeek('normal', 'spring').sea.pollen.length); return [...c].sort(); });
    assert.deepStrictEqual(counts, [0, 1, 2]);
    const r = await page.evaluate(() => {
      S.week.sea.pollen = [1, 2]; S.cur = 1; S.t = 1440 + 360; S.log = []; seasonMorning(1);
      const morning = S.log.map(l => l.s).join(' ');
      S.loc = 'home'; S.t = 1440 + 600; UP().gutters = 50; S.week.fog = [0, 0, 0, 0, 0, 0, 0]; S.week.storm = null; render();
      const bar = document.querySelector('.alertbar') ? document.querySelector('.alertbar').textContent : '';
      const s0 = S.stress; S.log = [];
      actions().find(a => a.l === 'Clear the gutters').fn();
      const sneeze = S.log.map(l => l.s).join(' ');
      actions().find(a => a.l === 'Spring cleaning').fn();   // inside: no pollen
      const pol1 = S.sea.pol.n;
      UP().moss = 50; S.money = 500; actions().find(a => /Treat the moss/.test(a.l)).fn();
      const n = [], s1 = S.stress; seasonNight('home', n, 1);
      return { morning, bar, sneeze, pol1, pol: S.sea.pol.n, notes: n, stressNight: S.stress - s1 };
    });
    assert.match(r.morning, /Pollen day/); assert.match(r.bar, /Pollen/);
    assert.match(r.sneeze, /eyes are streaming/);
    assert.strictEqual(r.pol1, 1); assert.strictEqual(r.pol, 2);
    assert.ok(r.notes.some(n => /pollen/.test(n)), JSON.stringify(r.notes)); assert.strictEqual(r.stressNight, 2);
    // the pharmacy: take one today; it covers the day
    const p = await page.evaluate(() => {
      S.cur = 2; S.t = 2 * 1440 + 720; S.loc = 'pharmacy'; S.money = 100;
      const a = actions().find(x => x.l === 'Allergy pill — $9'); a.fn();
      const paid = 100 - S.money, took = actions().find(x => /Allergy pill taken/.test(x.l));
      S.loc = 'home'; S.t = 2 * 1440 + 800; UP().gutters = 50; S.log = []; actions().find(x => x.l === 'Clear the gutters').fn();
      const n = []; const s0 = S.stress; seasonNight('home', n, 2);
      return { paid, took: !!took && took.dis, sneeze: S.log.some(l => /streaming/.test(l.s)), notes: n, stress: S.stress - s0, alert: seasonAlert() };
    });
    assert.strictEqual(p.paid, 9); assert.strictEqual(p.took, true); assert.strictEqual(p.sneeze, false);
    assert.ok(!p.notes.some(n => /pollen/.test(n))); assert.strictEqual(p.alert, '');
    // buy ahead on a calm day: taken automatically on the next pollen morning
    const q = await page.evaluate(() => {
      S.sea.pill = null; S.week.sea.pollen = [4]; S.cur = 3; S.t = 3 * 1440 + 720; S.loc = 'pharmacy'; S.money = 100;
      actions().find(x => x.l === 'Allergy pills for the next pollen day — $9').fn();
      const held = S.sea.pills; S.cur = 4; S.t = 4 * 1440 + 360; S.log = []; seasonMorning(4);
      return { held, after: S.sea.pills, pill: S.sea.pill === dayKey(), m: S.log.map(l => l.s).join(' ') };
    });
    assert.strictEqual(q.held, 1); assert.strictEqual(q.after, 0); assert.ok(q.pill); assert.match(q.m, /take an allergy pill/);
    noErrors(errors);
  } },
  { name: 'spring: mud season slows island drives in the first two weeks', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring', 'month');
    const r = await page.evaluate(() => {
      S.cars.forEach(c => { c.bat = 'ok'; }); S.t = Math.max(S.t, 600); S.ev.flags.garage = -1; S.week.sea.pollen = [];
      const ev = EV.find(e => e.id === 'mud_road');
      const out = { mud: S.week.sea.mud, chance: ev.chance };
      forceEvent('mud_road'); const t0 = S.t; go('store', { m: 'car', min: 7 }); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      out.ids = S.ev.history.map(h => h.id); out.mins = S.t - t0;
      S.weekNo = 2; out.wk3 = genWeek('normal').sea.mud; S.weekNo = 1; out.wk2 = genWeek('normal').sea.mud;
      S.week.sea.mud = false; out.cond = ev.cond({ mode: 'car', from: 'home' });
      return out;
    });
    assert.strictEqual(r.mud, true); assert.strictEqual(r.chance, 0.25);
    assert.ok(r.ids.includes('mud_road'), JSON.stringify(r));
    assert.ok(r.mins >= 7 + 5, 'mud adds time: ' + r.mins);
    assert.strictEqual(r.wk2, true); assert.strictEqual(r.wk3, false); assert.strictEqual(r.cond, false);
    // the push
    const p = await page.evaluate(() => { S.week.sea.mud = true; S.loc = 'home'; S.cars[0].loc = 'home'; const R = Math.random; let added = 0;
      Math.random = () => 0; try { EV.find(e => e.id === 'mud_road').run({ add: n => { added += n; } }); } finally { Math.random = R; }
      return { added, push: S.ev.history.some(h => h.id === 'car_push') }; });
    assert.strictEqual(p.added, 20); assert.ok(p.push);
    // fall never gets mud
    await seasonGame(page, 'fall');
    assert.strictEqual(await page.evaluate(() => EV.find(e => e.id === 'mud_road').cond({ mode: 'car', from: 'home' })), false);
    noErrors(errors);
  } },
  { name: 'spring: flavor, forecast, injury, frogs and the season picker', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring');
    const r = await page.evaluate(() => {
      S.week.sea.pollen = []; S.week.storm = null; S.cur = 2; S.t = 2 * 1440 + 360; S.log = []; seasonMorning(2);
      S.cur = 1; const n = []; seasonNight('home', n, 1);
      return { flavor: seasonFlavor().join(' '), cozy: seasonFlavor(true).length, inj: seasonInjury(), fc: S.log.map(l => l.s).join(' '), frogs: n.join(' '),
        wx: wxDay(2).sum, txt: SEASON_TXT.spring };
    });
    assert.match(r.flavor, /frogs/); assert.match(r.flavor, /robin/); assert.match(r.flavor, /barbecue/); assert.match(r.flavor, /Rainier/); assert.match(r.flavor, /rhubarb/);
    assert.strictEqual(r.cozy, 2);
    assert.match(r.inj, /wet moss/);
    assert.match(r.fc, /Forecast/);
    assert.match(r.frogs, /frog chorus/);
    assert.match(r.wx, /Sun breaks|Showers|Rain/);
    assert.strictEqual(r.txt, '🌱 Spring');
    // the new-game flow lists spring with its description
    await page.evaluate(() => startNewWeek());
    const pick = async re => { const b = (await page.$$('#mbg .act')); for (const x of b) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
    await pick(/Normal/); await pick(/One week/);
    const txt = await page.textContent('#mbg');
    assert.match(txt, /Spring \(April\)/); assert.match(txt, /garden to plant/);
    await pick(/Spring/);
    assert.strictEqual(await page.evaluate(() => S.season), 'spring');
    noErrors(errors);
  } },
  { name: 'spring: a save reloads in spring; a whole week runs and the end screen says April', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await seasonGame(page, 'spring');
    await page.evaluate(() => { S.loc = 'home'; S.t = 600; actions().find(a => a.l === 'Plant the garden').fn(); saveGame(); });
    await reload(page);
    assert.match(await page.textContent('.title'), /Continue as T: 🌱 Spring/);
    await page.evaluate(() => resumeGame());
    await clearModals(page);
    assert.deepStrictEqual(await page.evaluate(() => [S.season, dateTxt(0), Array.isArray(S.week.sea.pollen), !!S.sea.garden]), ['spring', 'Apr 5', true, true]);
    await seasonGame(page, 'spring');
    await page.evaluate(() => {
      for (let i = 0; i < 7 && !S.over; i++) {
        S.loc = 'home'; S.t = S.cur * 1440 + 1200; tab = 'act'; render(); setTab('ferry'); setTab('act');
        endDay('home'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      }
    });
    const end = await page.textContent('.end');
    assert.ok(/Season.*April/.test(end), end.slice(0, 300));
    noErrors(errors);
  } },
];
