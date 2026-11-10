const { open, noErrors, reload, assert } = require('./helpers');

// 📖 story mode: a year on the island in four chapters (src/js/26-story.js)
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
// start a story the way a player does: difficulty → length → (no season picker)
async function storyViaMenu(page) {
  await page.evaluate(() => startNewWeek());
  const pick = async re => { for (const x of await page.$$('#mbg .act')) if (re.test(await x.textContent())) { await x.click(); return; } throw new Error('no button ' + re); };
  await pick(/Normal/);
  await pick(/Story: a year on the island/);
}
const storyGame = page => page.evaluate(() => { storyNew('normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
// jump to week 4, Sunday night at home, and go to bed (the real night path: endDay → finish → chapter end)
const endChapter = page => page.evaluate(() => {
  MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
  S.weekNo = 3; S.cur = 6; S.t = 6 * 1440 + 1300; S.phoneT = S.t; S.loc = 'home'; S.pantry = Math.max(S.pantry, 2);
  for (const k in HH_BILLS) HB(k).paid = true;
  endDay('home');
});
// a bot that clicks through the game until n nights have passed (or the game ends)
const playNights = (page, n, seed) => page.evaluate(([n]) => {
  const rnd = Math.random, skip = /exit|transfer|settings|change name|slot/i;
  const ok = b => !b.disabled && !skip.test(b.textContent) && !/openSettings|openTransfer|confirmExit|nameModal/.test(b.getAttribute('onclick') || '');
  const pick = a => a[Math.floor(rnd() * a.length)];
  const start = S.weekNo * 7 + S.cur; let steps = 0;
  while (S.weekNo * 7 + S.cur < start + n && steps < 3000 && !S.over) {
    steps++;
    const cross = document.querySelector('.cross'); if (cross) { cross.click(); continue; }
    const m = document.getElementById('mbg');
    if (m) { const bs = [...m.querySelectorAll('button.act')].filter(ok); const p = bs.find(b => b.classList.contains('primary')); const b = p || pick(bs); if (b) b.click(); else m.remove(); continue; }
    if (rnd() < 0.05) { setTab(pick(['act', 'ferry', 'todo', 'log'])); continue; }
    if (tab !== 'act') setTab('act');
    if (tod() >= 1320 && S.loc === 'home') { endDay('home'); continue; }
    const bs = [...document.querySelectorAll('#app .content button.act')].filter(ok);
    if (!bs.length) { endDay(L[S.loc].side === 'I' ? 'home' : 'terminal'); continue; }
    pick(bs).click();
  }
  return { steps, day: S.weekNo * 7 + S.cur, over: S.over };
}, [n]);

module.exports = [
  { name: 'new-game flow: Story skips the season picker and starts chapter 1 in summer', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await storyViaMenu(page);
    assert.match(await page.textContent('#mbg'), /Chapter 1 of 4 · Summer: Moving in/);
    const r = await page.evaluate(() => ({ st: S.story, season: S.season, mode: S.mode, week: S.weekNo, t: S.t, loc: S.loc, on: storyOn(), ch: storyCh() }));
    assert.strictEqual(r.season, 'summer'); assert.strictEqual(r.mode, 'month'); assert.strictEqual(r.week, 0);
    assert.strictEqual(r.st.ch, 0); assert.deepStrictEqual(r.st.seasons, ['summer', 'fall', 'winter', 'spring']); assert.deepStrictEqual(r.st.flags, {});
    assert.ok(r.on); assert.strictEqual(r.ch, 0); assert.ok(r.t >= 330 && r.t < 420, 't ' + r.t); assert.strictEqual(r.loc, 'home'); // a wake-up event can take a few minutes
    // the "no gas on the island" note is queued behind the chapter card
    await page.locator('#mbg button.act').first().click();
    assert.match(await page.textContent('#mbg'), /no gas on the island/i);
    await clearModals(page);
    assert.match(await page.textContent('.hud-sub'), /Ch\. 1\/4 · Week 1\/4/);
    assert.match(await page.textContent('.hud-sub'), /Jun 29/);
    assert.ok(await page.evaluate(() => S.log.some(e => /Chapter 1 of 4/.test(e.s))));
    // outside story mode nothing changes
    await page.evaluate(() => { newGame('normal', 'month', 'fall'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); });
    assert.strictEqual(await page.evaluate(() => [storyOn(), storyCh(), S.story === undefined].join()), 'false,-1,true');
    assert.match(await page.textContent('.hud-sub'), /Week 1\/4/);
    noErrors(errors);
  } },
  { name: 'end of chapter 1: interlude, fall, Monday 5:30 at home, life carried over, clocks rebased', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await storyGame(page);
    const before = await page.evaluate(() => {
      meet('sam', 'Sam from down the road', 'test'); S.rep = 30; S.money = 900; S.health = 70; S.stress = 50; S.home = 60;
      PH().apps.push('weather'); S.phone = 20;
      ECO().hens = 3; ECO().ot = 25; ECO().board = 3; HH().dog = { n: 'Clam', fed: 27, walked: 26, since: 3, kibble: 9, alone: 0 };
      REP().lastGood = 27; REP().driftAt = 21; S.arcs.sam.k = 20;
      UP().jobs.push({ k: 'septic', due: 99999 }); UP().septic = 80; UP().done.dishes = 27; S.empStart = 15;
      S.delivery = { due: 9999, n: 3 }; S.power = { start: 9000, end: 9900, cause: 'x' }; S.cargo.drugs = 2; S.cargo.food = 1;
      S.interview = { job: 'riv', day: 8, time: 900, loc: 'food' }; S.quests = [{ who: 'sam', due: 9 }];
      S.cars[0].loc = 'stDock'; S.cars[0].fuel = 6;
      return { friends: Object.keys(S.friends), emp: S.emp };
    });
    await endChapter(page);
    const txt = await page.textContent('#mbg');
    assert.match(txt, /Chapter 1 of 4 is done: Summer: Moving in/);
    assert.match(txt, /Months later/); assert.match(txt, /Sam/); assert.match(txt, /Chapter 2 of 4 · Fall: The vote/);
    assert.match(txt, /You kept your job \(Office job, Lakewood\)/);
    const r = await page.evaluate(() => ({ X: S.story, season: S.season, mode: S.mode, week: S.weekNo, cur: S.cur, t: S.t, loc: S.loc, money: S.money, health: S.health, stress: S.stress, home: S.home,
      friends: Object.keys(S.friends), emp: S.emp, rep: S.rep, apps: PH().apps, phone: S.phone, hens: ECO().hens, ot: ECO().ot, board: ECO().board, dog: HH().dog,
      rep2: [REP().lastGood, REP().driftAt], arc: S.arcs.sam.k, jobs: UP().jobs.length, septic: UP().septic, done: UP().done, empStart: S.empStart, delivery: S.delivery, power: S.power,
      cargo: S.cargo, interview: S.interview, quests: S.quests, car: S.cars[0].loc, fuel: S.cars[0].fuel, pantry: S.pantry, bills: HH().bills }));
    assert.strictEqual(r.X.ch, 1); assert.strictEqual(r.season, 'fall'); assert.strictEqual(r.mode, 'month');
    assert.deepStrictEqual([r.week, r.cur, r.loc], [0, 0, 'home']); assert.ok(r.t >= 330 && r.t < 420, 't ' + r.t);
    assert.ok(await page.evaluate(() => S.log.some(e => e.t === 330 && /Chapter 2 of 4 · Fall: The vote.*Monday, 5:30 AM/.test(e.s))));
    assert.strictEqual(r.money, r.X.recap[0].money + 400, 'employed: +$400 for the skipped months');
    assert.strictEqual(r.X.recap.length, 1);
    assert.strictEqual(r.health, Math.min(100, r.X.recap[0].health + 15)); assert.ok(r.stress <= Math.max(0, r.X.recap[0].stress - 25) + 5, 'stress ' + r.stress);
    assert.deepStrictEqual(r.friends, before.friends); assert.strictEqual(r.emp, before.emp); assert.strictEqual(r.rep, 30);
    assert.ok(r.apps.includes('weather')); assert.strictEqual(r.phone, 100); assert.strictEqual(r.hens, 3);
    assert.strictEqual(r.ot, -1); assert.strictEqual(r.board, -1);
    assert.deepStrictEqual([r.dog.n, r.dog.fed, r.dog.walked, r.dog.since], ['Clam', -1, -2, 3 - 28]);
    assert.deepStrictEqual(r.rep2, [0, 0]); assert.strictEqual(r.arc, -8);
    assert.strictEqual(r.jobs, 0); assert.strictEqual(r.septic, 0, 'the booked septic truck came in the months between'); assert.deepStrictEqual(r.done, {});
    assert.strictEqual(r.empStart, 0); assert.strictEqual(r.delivery, null); assert.strictEqual(r.power, null);
    assert.strictEqual(r.cargo.drugs, 0); assert.strictEqual(r.cargo.food, 1); assert.strictEqual(r.interview, null); assert.deepStrictEqual(r.quests, []);
    assert.strictEqual(r.car, 'home'); assert.strictEqual(r.fuel, 6); assert.strictEqual(r.pantry, 3); assert.ok(Object.values(r.bills).every(b => !b.paid && !b.late && !b.fees), 'a fresh month of bills');
    assert.ok(await page.evaluate(() => jobStarted(0) && S.log.some(e => /Chapter 2 of 4/.test(e.s))));
    // the interlude goes away and the game goes on: HUD, To-do, phone, and a day of play
    await page.locator('#mbg button.act', { hasText: 'Begin chapter 2' }).click();
    await clearModals(page);
    assert.match(await page.textContent('.hud-sub'), /Ch\. 2\/4 · Week 1\/4/); assert.match(await page.textContent('.hud-sub'), /Nov 2/);
    await page.evaluate(() => { setTab('todo'); setTab('ferry'); setTab('log'); setTab('act'); phoneOpen(); PHONE_APPS.filter(a => phoneInstalled(a.id)).forEach(a => phoneGo(a.id)); phoneClose(); });
    const p = await playNights(page, 2);
    assert.ok(p.day >= 2 || p.over, 'played into Wednesday: ' + JSON.stringify(p));
    assert.strictEqual(await page.evaluate(() => S.season), 'fall');
    noErrors(errors);
  } },
  { name: 'unemployed at a chapter end: −$300, never below −$1,500; hooks run in order', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const calls = await page.evaluate(() => {
      window.CALLS = []; storyHooks.push({ id: 'test', chapterStart(ch, notes) { CALLS.push('start' + ch); notes.push('📣 Test beat starts ' + ch); S.story.testbeat = { n: (S.story.testbeat ? S.story.testbeat.n : 0) + 1 }; },
        chapterEnd(ch, notes) { CALLS.push('end' + ch); S.story.flags.levy = 'fail'; } });
      window.jobSeasonEnd = (notes, a, b) => { CALLS.push(`season ${a}>${b}`); notes.push('🧺 Your seasonal job ended.'); };
      storyNew('normal'); return CALLS.slice();
    });
    assert.deepStrictEqual(calls, ['start0']);
    await page.evaluate(() => { S.emp = null; S.job = 0; S.money = 100; });
    await endChapter(page);
    const txt = await page.textContent('#mbg');
    assert.match(txt, /Months of odd jobs and bills: −\$300/); assert.match(txt, /ferry levy failed/); assert.match(txt, /Your seasonal job ended/); assert.match(txt, /Test beat starts 1/);
    const r = await page.evaluate(() => ({ calls: CALLS, m: S.money, rec: S.story.recap[0].money, island: S.story.testbeat, levy: S.story.flags.levy }));
    assert.deepStrictEqual(r.calls, ['start0', 'end0', 'season summer>fall', 'start1']);
    assert.strictEqual(r.m, r.rec - 300); assert.deepStrictEqual(r.island, { n: 2 }, 'beat state carries across'); assert.strictEqual(r.levy, 'fail');
    await page.evaluate(() => { S.money = -1400; S.emp = null; });
    await endChapter(page);
    assert.strictEqual(await page.evaluate(() => S.money), -1500);
    assert.strictEqual(await page.evaluate(() => S.season), 'winter');
    noErrors(errors);
  } },
  { name: 'the endings: priority rules with forced state', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await storyGame(page);
    const r = await page.evaluate(() => {
      const t = (o, f) => { S.rep = o.rep; S.money = o.money; S.emp = o.emp === false ? null : 'lakewood'; S.coop.open = false; S.story.flags = f || {}; return storyEnding().id; };
      return [
        t({ rep: -60, money: -900, emp: false }, { coopOpen: true }),        // pariah beats broke
        t({ rep: 70, money: -501 }, { coopOpen: true }),                     // broke beats heart
        t({ rep: 10, money: -1, emp: false }),                               // broke: unemployed and in debt
        t({ rep: 60, money: 500 }, { coopOpen: true }),                      // heart
        t({ rep: 60, money: 500 }, { coopOpen: false }),                     // regular
        t({ rep: 75, money: 0, emp: false }),                                // regular, even unemployed
        t({ rep: 20, money: 10 }),                                           // islander
        t({ rep: 19, money: -400 }),                                         // commuter
        t({ rep: 40, money: 50, emp: false }),                               // scraping
        t({ rep: -59, money: 0, emp: false }),                               // scraping
      ];
    });
    assert.deepStrictEqual(r, ['pariah', 'broke', 'broke', 'heart', 'regular', 'regular', 'islander', 'commuter', 'scraping', 'scraping']);
    // the co-op flag falls back to the co-op actually opening when no beat set it
    assert.strictEqual(await page.evaluate(() => { S.rep = 65; S.money = 10; S.emp = 'lakewood'; S.story.flags = {}; S.coop.open = true; return storyEnding().id; }), 'heart');
    noErrors(errors);
  } },
  { name: 'through to the ending: four chapters, epilogue, end screen and achievements', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { localStorage.removeItem('islandtime.achievements');
      storyHooks.push({ id: 'test', ending(flags) { return ['🧪 A line from a beat: ' + (flags.levy || 'none') + '.']; } }); });
    await storyGame(page);
    for (const ch of [0, 1, 2]) {
      assert.strictEqual(await page.evaluate(() => S.story.ch), ch);
      await endChapter(page);
    }
    const st = await page.evaluate(() => ({ ch: S.story.ch, season: S.season, spring: seasonOk('spring') }));
    assert.strictEqual(st.ch, 3); assert.strictEqual(st.season, st.spring ? 'spring' : 'winter');
    await page.evaluate(() => { S.story.flags = { levy: 'pass', drydock: true, storm: { helped: 3 }, coopOpen: true }; S.rep = 70; S.emp = 'lakewood'; S.money = 1200; });
    await endChapter(page);
    assert.ok(await page.$('.end'));
    const end = await page.textContent('.end');
    assert.match(end, /The heart of the island/); assert.match(end, /cut the ribbon/);
    assert.match(end, /A year on the island · Chapter 4 of 4/);
    assert.match(end, /ferry levy passed/); assert.match(end, /back from the shipyard/); assert.match(end, /3 times you showed up/); assert.match(end, /co-op reopened/);
    assert.strictEqual((end.match(/ferry levy/g) || []).length, 1, 'one levy line, not two');
    assert.match(end, /A line from a beat: pass/);
    assert.match(end, /YEAR COMPLETE/);
    const a = await page.evaluate(() => ({ got: Object.keys(achGot()), game: S.achGame, over: S.over, recap: S.story.recap.length, ending: S.story.ending.id }));
    assert.ok(a.got.includes('story_year') && a.got.includes('story_heart'), 'achievements: ' + a.got);
    assert.ok(!a.got.includes('story_bridge'));
    assert.ok(a.over); assert.strictEqual(a.recap, 4); assert.strictEqual(a.ending, 'heart');
    assert.ok(await page.evaluate(() => ACH.filter(x => /^story_/.test(x.id)).length === 3));
    noErrors(errors);
  } },
  { name: 'game over mid-story says how far you got', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await storyGame(page);
    await endChapter(page);
    await page.evaluate(() => gameOver('health'));
    const end = await page.textContent('.end');
    assert.match(end, /Medevac/); assert.match(end, /You made it to chapter 2 of 4\./); assert.match(end, /Chapter 2 of 4 · game over/);
    assert.ok(!(await page.evaluate(() => Object.keys(achGot()).includes('story_year'))));
    noErrors(errors);
  } },
  { name: 'save and reload mid-story; old saves stay out of story mode', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await storyGame(page);
    await page.evaluate(() => { S.story.flags.levy = 'pass'; S.story.ferry = { x: 1 }; });
    await endChapter(page);
    await clearModals(page);
    await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 600; S.phoneT = S.t; render(); saveGame(); });
    await reload(page);
    assert.match(await page.textContent('.title'), /Continue as T: .*Chapter 2 of 4 · Wednesday/);
    assert.match(await page.evaluate(() => slotLine(slotInfo(1))), /Chapter 2 of 4 · Week 1 of 4 · Wednesday/);
    await page.click('text=Continue as T');
    const r = await page.evaluate(() => ({ ch: S.story.ch, levy: S.story.flags.levy, ferry: S.story.ferry.x, season: S.season, mode: S.mode, cur: S.cur }));
    assert.deepStrictEqual(r, { ch: 1, levy: 'pass', ferry: 1, season: 'fall', mode: 'month', cur: 2 });
    assert.match(await page.textContent('.hud-sub'), /Ch\. 2\/4 · Week 1\/4/);
    // a broken story object is repaired on load
    const fixed = await page.evaluate(() => { const d = JSON.parse(JSON.stringify(packSave())); d.S.story = { ch: 9, flags: null }; const m = migrate(d); return m.S.story; });
    assert.strictEqual(fixed.ch, 3); assert.deepStrictEqual(fixed.flags, {}); assert.deepStrictEqual(fixed.recap, []);
    // a plain month game saves and loads without S.story
    await page.evaluate(() => { newGame('normal', 'month', 'fall'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render(); saveGame(); });
    await reload(page);
    await page.click('text=Continue as T');
    assert.strictEqual(await page.evaluate(() => S.story === undefined && !storyOn()), true);
    assert.match(await page.textContent('.hud-sub'), /Week 1\/4/);
    noErrors(errors);
  } },
];
