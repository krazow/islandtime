// Story mode: the storm of the decade (chapter 2) and the co-op reopening the store (all year). 28-story-island.js
const { open, newGame, noErrors, assert } = require('./helpers');
// a story game in chapter `ch`, week `wk`, at `loc`, day `d`, minute-of-day `m`
const story = (page, o) => page.evaluate(o => {
  S.mode = 'month'; S.story = { ch: o.ch, seasons: ['summer', 'fall', 'winter', 'spring'], flags: {}, recap: [] };
  S.season = ['summer', 'fall', 'winter', 'winter'][o.ch]; S.weekNo = o.wk || 0; S.week = genWeek(S.diff);
  S.cur = o.d || 0; S.t = S.cur * 1440 + (o.m == null ? 600 : o.m); S.phoneT = S.t; S.phone = 90; S.loc = o.loc || 'home'; S.log = []; S.rep = o.rep || 0;
  S.money = 2000; S.health = 80; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render();
}, o);
const act = (page, re) => page.evaluate(src => { const r = new RegExp(src); const a = actions().find(x => r.test(x.l)); return a ? { l: a.l, s: a.s, dis: !!a.dis } : null; }, re.source);
const run = (page, re) => page.evaluate(src => { const r = new RegExp(src); const a = actions().find(x => r.test(x.l) && !x.dis); if (!a) throw new Error('no action ' + src); a.fn(); }, re.source);
const log = page => page.evaluate(() => S.log.map(l => l.s).join('\n'));
const clearModals = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });

module.exports = [
  { name: 'non-story games are unchanged: no storm week, $2,500 goal, coopCheck opens the store as before', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.season = 'winter'; S.weekNo = 1; S.week = genWeek(S.diff);
      const o = { storm: !!S.week.siStorm, goal: coopGoal(), hook: typeof window.STORY_ISLAND_HOOK };
      S.loc = 'store'; o.pledge = actions().find(a => /^Pledge to the co-op/.test(a.l)).l;
      S.loc = 'home'; S.cur = 3; S.t = 3 * 1440 + 600; o.storyActs = actions().filter(a => /Hendersons|warming spot|chainsaw|storm prices/.test(a.l)).length;
      S.coop.town = 2500; coopCheck(); o.open = S.coop.open; return o;
    });
    assert.strictEqual(r.storm, false);
    assert.strictEqual(r.goal, 2500);
    assert.strictEqual(r.hook, 'object');
    assert.match(r.pledge, /of \$2500\)/);
    assert.strictEqual(r.storyActs, 0);
    assert.strictEqual(r.open, true, 'opens at $2,500');
    noErrors(errors);
  } },
  { name: 'storm week: forecast from Monday, ferry stops Wed 6 PM–Thu 10 PM, power out Wed 8 PM–Sat noon, lights come back', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    // the Sunday before, with 🌦️ Tides & Weather: a day early
    await story(page, { ch: 2, wk: 0, d: 6, m: 330 });
    await page.evaluate(() => { phoneInstall('weather'); startDay(); });
    assert.match(await log(page), /Tides & Weather.*Wednesday night/);
    await story(page, { ch: 2, wk: 1, d: 0, m: 330 });
    const w = await page.evaluate(() => { startDay(); const o = S.week.b.find(b => b.si); return { b: o && [o.start, o.end, o.cause], storm: S.week.storm, known: stormKnown(), todo: todoItems().find(x => x.l === 'Be ready for the storm') }; });
    assert.deepStrictEqual(w.b.slice(0, 2), [2 * 1440 + 1080, 3 * 1440 + 1320]);
    assert.match(w.b[2], /storm of the decade/);
    assert.strictEqual(w.storm.day, 2);
    assert.strictEqual(w.known, true, 'known from Monday');
    assert.match(w.todo.s, /storm of the decade, Wednesday night/);
    assert.match(await log(page), /Heads-up:.*storm of the decade/);
    // Wednesday: ferry runs at 5 PM, not at 7 PM; power goes out at 8 PM
    const wed = await page.evaluate(() => { S.cur = 2; S.t = 2 * 1440 + 1020; const a = !!activeOutage(); S.t = 2 * 1440 + 1140; const b = activeOutage(); processTimed(); const p1 = !!powerOut();
      S.t = 2 * 1440 + 1201; processTimed(); return { a, b: b && b.cause, p1, p2: !!powerOut(), end: S.power && S.power.end }; });
    assert.strictEqual(wed.a, false);
    assert.match(wed.b, /storm of the decade/);
    assert.strictEqual(wed.p1, false);
    assert.strictEqual(wed.p2, true);
    assert.strictEqual(wed.end, 5 * 1440 + 720);
    // the storm night, then Thursday: still out, ferry back at 10 PM
    const thu = await page.evaluate(() => { S.loc = 'home'; S.t = 2 * 1440 + 1290; endDay('home');
      return { cur: S.cur, end: S.power && S.power.end, out: powerOut(), ferryLate: (() => { const t = S.t; S.t = 3 * 1440 + 1330; const x = !!activeOutage(); S.t = t; return x; })() }; });
    assert.strictEqual(thu.cur, 3);
    assert.strictEqual(thu.end, 5 * 1440 + 720, 'endDay keeps the long outage');
    assert.strictEqual(thu.out, true);
    assert.strictEqual(thu.ferryLate, false);
    await clearModals(page);
    const fri = await page.evaluate(() => { S.t = 3 * 1440 + 1290; endDay('home'); return { cur: S.cur, out: powerOut() }; });
    assert.deepStrictEqual(fri, { cur: 4, out: true });
    assert.match(await log(page), /Second night without power/);
    await clearModals(page);
    const sat = await page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 725; S.loc = 'home'; processTimed(); return { out: !!powerOut(), flags: S.story.flags.storm, recap: ((S.story.island && S.story.island.notes) || []).join(' ') }; });
    assert.strictEqual(sat.out, false);
    assert.deepStrictEqual(sat.flags, { helped: 0 });
    assert.match(sat.recap, /storm of the decade/);
    const L2 = await log(page);
    assert.match(L2, /The lights come back on/);
    assert.match(L2, /This is why/);
    noErrors(errors);
  } },
  { name: 'storm choices: each once, with their effects; helped count and flags', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 2, wk: 1, d: 3, m: 600 });
    await page.evaluate(() => { siPowerOn(); UP().wood = 6; S.homeGas = 12; S.stress = 30; });
    const st = () => page.evaluate(() => ({ rep: S.rep, helped: SI().storm.helped, wood: UP().wood, gas: S.homeGas, money: S.money, health: S.health, t: S.t }));
    let a = await st();
    await run(page, /^Check on the Hendersons/);
    let b = await st();
    assert.strictEqual(b.rep - a.rep, 5); assert.strictEqual(b.helped, 1); assert.strictEqual(b.t - a.t, 45);
    assert.ok(await page.evaluate(() => S.friends.hendersons && S.friends.hendersons.pts >= 2));
    assert.strictEqual((await act(page, /Hendersons/)).dis, true);
    a = b; await run(page, /^Open your house as a warming spot/); b = await st();
    assert.strictEqual(b.rep - a.rep, 10); assert.strictEqual(b.helped, 3); assert.strictEqual(a.wood - b.wood, 1); assert.strictEqual(b.t - a.t, 180);
    assert.strictEqual((await act(page, /warming spot/)).dis, true);
    a = b; await run(page, /^Share gas or firewood/);
    await page.locator('.modal-bg button', { hasText: '5 gallons of gas' }).click();
    b = await st();
    assert.strictEqual(b.rep - a.rep, 5); assert.strictEqual(b.helped, 4); assert.strictEqual(a.gas - b.gas, 5);
    a = b; await run(page, /^Sell your spare gas/); b = await st();
    assert.strictEqual(b.rep - a.rep, -10); assert.strictEqual(b.money - a.money, 60); assert.strictEqual(b.helped, 4);
    assert.strictEqual((await act(page, /spare gas/)).dis, true);
    a = b; await run(page, /^Help clear the road/); b = await st();
    assert.strictEqual(b.rep - a.rep, 5); assert.strictEqual(b.helped, 5); assert.strictEqual(a.health - b.health, 3); assert.strictEqual(b.t - a.t, 120);
    assert.strictEqual((await act(page, /clear the road/)).dis, true);
    // the road crew is a Thursday/Friday daylight job
    await page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 600; });
    assert.strictEqual(await act(page, /clear the road/), null);
    // warming spot needs heat
    await story(page, { ch: 2, wk: 1, d: 3, m: 600 });
    await page.evaluate(() => { siPowerOn(); UP().wood = 1; S.homeGas = 0; });
    assert.strictEqual((await act(page, /warming spot/)).dis, true);
    // lights back: flags
    await page.evaluate(() => { SI().storm.out = true; SI().storm.helped = 3; S.t = 5 * 1440 + 730; S.cur = 5; processTimed(); });
    assert.deepStrictEqual(await page.evaluate(() => S.story.flags.storm), { helped: 3 });
    noErrors(errors);
  } },
  { name: 'storm: at reputation +20 the neighbors check on you too', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 2, wk: 1, d: 2, m: 1290, rep: 25 });
    await page.evaluate(() => { UP().wood = 1; endDay('home'); });
    assert.match(await log(page), /The neighbors check on you too/);
    await story(page, { ch: 2, wk: 1, d: 2, m: 1290, rep: 5 });
    await page.evaluate(() => endDay('home'));
    assert.doesNotMatch(await log(page), /The neighbors check on you too/);
    noErrors(errors);
  } },
  { name: 'co-op in story: $6,000 goal, never opens mid-story; pie social (ch 0) and membership (ch 1)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 1, wk: 0, d: 2, loc: 'store' });
    const r = await page.evaluate(() => { S.coop.town = 6500; const notes = []; coopCheck(notes); coopCheck(); const o = { open: S.coop.open, goal: coopGoal() };
      S.coop.town = 1000; o.pledge = actions().find(a => /^Pledge to the co-op/.test(a.l)).l; const n2 = []; weekRollover(n2); o.week = n2.join(' '); return o; });
    assert.strictEqual(r.open, false);
    assert.strictEqual(r.goal, 6000);
    assert.match(r.pledge, /of \$6000\)/);
    assert.match(r.week, /of \$6000\./);
    // membership
    await story(page, { ch: 1, wk: 0, d: 2, loc: 'store' });
    const m0 = await page.evaluate(() => ({ you: S.coop.you, money: S.money }));
    await run(page, /^Join the co-op/);
    const m1 = await page.evaluate(() => ({ you: S.coop.you, money: S.money, f: S.story.flags.coopMember }));
    assert.strictEqual(m0.money - m1.money, 25); assert.strictEqual(m1.you - m0.you, 25); assert.strictEqual(m1.f, true);
    assert.strictEqual((await act(page, /^Co-op member/)).dis, true);
    // pie social: chapter 0, Saturday of week 1, 2–5 PM at the Legion
    await story(page, { ch: 0, wk: 1, d: 5, m: 700, loc: 'legion' });
    assert.strictEqual((await act(page, /pie social/)).dis, true);
    await page.evaluate(() => { S.t = 5 * 1440 + 900; });
    const p0 = await page.evaluate(() => ({ town: S.coop.town, money: S.money, rep: S.rep }));
    await run(page, /^Co-op pie social: \$10/);
    const p1 = await page.evaluate(() => ({ town: S.coop.town, money: S.money, rep: S.rep }));
    assert.strictEqual(p1.town - p0.town, 300); assert.strictEqual(p0.money - p1.money, 10); assert.strictEqual(p1.rep - p0.rep, 5);
    assert.strictEqual((await act(page, /pie social/)).dis, true);
    noErrors(errors);
  } },
  { name: 'co-op chapter 3: the meeting, reopening Saturday of week 1, ribbon cutting at +60, member prices', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 3, wk: 0, d: 3, m: 1000, loc: 'legion', rep: 65 });
    await page.evaluate(() => { S.coop.you = 3000; S.coop.town = 3100; SI().coop.member = true; S.story.flags.coopMember = true; });
    assert.strictEqual((await act(page, /members’ meeting/)).dis, true);
    await page.evaluate(() => { S.t = 3 * 1440 + 1120; });
    const r0 = await page.evaluate(() => S.rep);
    await run(page, /^Attend the co-op members’ meeting/);
    const m = await page.evaluate(() => ({ rep: S.rep, dec: SI().coop.decided, open: S.coop.open }));
    assert.strictEqual(m.rep - r0, 5); assert.strictEqual(m.dec, 'go'); assert.strictEqual(m.open, false);
    // Friday of week 1: still closed; Saturday morning: open
    await page.evaluate(() => { S.weekNo = 1; S.cur = 4; S.t = 4 * 1440 + 330; startDay(); });
    assert.strictEqual(await page.evaluate(() => S.coop.open), false);
    await page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 330; startDay(); S.loc = 'store'; S.t = 5 * 1440 + 630; render(); });
    assert.deepStrictEqual(await page.evaluate(() => [S.coop.open, S.story.flags.coopOpen, L.store.name]), [true, true, 'AI Food Co-op']);
    assert.ok(await act(page, /^Buy groceries: 3 days for \$57 \(member price\)/));
    await run(page, /^Cut the ribbon/);
    assert.strictEqual(await page.evaluate(() => S.story.flags.coopRibbon), true);
    const end = await page.evaluate(() => STORY_ISLAND_HOOK.ending(S.story.flags).join(' '));
    assert.match(end, /reopened the old General Store, and you cut the ribbon/);
    assert.match(end, /member card/);
    // below +60: just join the crowd
    await story(page, { ch: 3, wk: 1, d: 5, m: 630, loc: 'store', rep: 30 });
    await page.evaluate(() => { SI().coop.decided = 'go'; SI().coop.openKey = 12; siCoopOpen(); render(); });
    await run(page, /^Join the crowd at the ribbon cutting/);
    assert.strictEqual(await page.evaluate(() => !!S.story.flags.coopRibbon), false);
    noErrors(errors);
  } },
  { name: 'co-op chapter 3: short at the meeting, a last push that makes it (Sunday) or doesn’t', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 3, wk: 0, d: 3, m: 1000, loc: 'home' });
    await page.evaluate(() => { S.coop.you = 2000; S.coop.town = 3000; S.t = 3 * 1440 + 1235; processTimed(); });
    assert.strictEqual(await page.evaluate(() => SI().coop.decided), 'short');
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Co-op last push: $1000 short')));
    await page.evaluate(() => { S.loc = 'store'; });
    assert.match((await act(page, /^Pledge to the co-op/)).s, /Last push: \$1000 short/);
    // week 2, Tuesday night: the town's money puts it over
    await page.evaluate(() => { S.weekNo = 2; S.cur = 1; S.coop.town += 1000; const n = []; coopCheck(n); });
    assert.deepStrictEqual(await page.evaluate(() => [SI().coop.reached, SI().coop.openKey, S.coop.open]), [true, 20, false]);
    await page.evaluate(() => { S.cur = 6; S.t = 6 * 1440 + 330; startDay(); });
    assert.deepStrictEqual(await page.evaluate(() => [S.coop.open, S.story.flags.coopOpen]), [true, true]);
    // the other way: still short on Saturday night of week 3
    await story(page, { ch: 3, wk: 0, d: 3, m: 1235, loc: 'home' });
    await page.evaluate(() => { S.coop.open = false; syncCoop(); S.coop.you = 1000; S.coop.town = 3000; siCoopDecide(false); S.weekNo = 3; S.cur = 4; coopCheck([]); });
    assert.strictEqual(await page.evaluate(() => S.story.flags.coopOpen), undefined, 'not over until Saturday');
    const r = await page.evaluate(() => { S.cur = 5; const n = []; coopCheck(n); return { n: n.join(' '), f: S.story.flags.coopOpen, open: S.coop.open }; });
    assert.match(r.n, /Not this year/);
    assert.strictEqual(r.f, false); assert.strictEqual(r.open, false);
    assert.match((await page.evaluate(() => STORY_ISLAND_HOOK.ending(S.story.flags))).join(' '), /came up short/);
    noErrors(errors);
  } },
  { name: 'story hook: registered object with ending lines by helped count', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => { const H = window.STORY_ISLAND_HOOK;
      S.mode = 'month'; S.story = { ch: 2, seasons: [], flags: {}, recap: [] }; S.weekNo = 1; S.coop.town = 1200; const notes = []; H.chapterEnd(2, notes);
      return { id: H.id, fns: ['chapterStart', 'chapterEnd', 'ending'].every(k => typeof H[k] === 'function'), notes: notes.join(' '), flag: S.story.flags.storm,
        e0: H.ending({ storm: { helped: 0 } }), e1: H.ending({ storm: { helped: 2 } }), e3: H.ending({ storm: { helped: 4 } }), none: H.ending({}),
        reg: typeof storyHooks === 'undefined' ? null : storyHooks.includes(H) }; });
    assert.strictEqual(r.id, 'island'); assert.ok(r.fns);
    assert.match(r.notes, /Co-op fund: \$1200 of \$6000/);
    assert.deepStrictEqual(r.flag, { helped: 0 });
    assert.match(r.e0[0], /behind your own front door/);
    assert.match(r.e1[0], /a neighbor or two/);
    assert.match(r.e3[0], /4 times/);
    assert.deepStrictEqual(r.none, []);
    if (r.reg !== null) assert.strictEqual(r.reg, true);
    noErrors(errors);
  } },
  { name: 'story odds: levy passes ~1/3 with no effort, almost always with a little; co-op needs pledges', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, { ch: 0 });
    const r = await page.evaluate(() => {
      const N = 2000, rnd = Math.random, mark = f => { let pass = 0; for (let i = 0; i < N; i++) { S.story.flags = {}; Math.random = () => (i + 0.5) / N; sfResult([]); if (S.story.flags.levy === 'pass') pass++; } Math.random = rnd; return pass / N; };
      STORY_FERRY_HOOK.chapterStart(0, null); const F = sfF(), s0 = F.support, o = { start: s0 };
      F.vote = 'none'; o.none = mark(); F.vote = 'no'; o.noVoteNo = mark(); F.vote = 'yes'; o.noVoteYes = mark();
      F.support = s0 + 4 * 3 + 2; F.vote = 'no'; o.few = mark();   // 4 signature days + one share, even with a no vote
      // co-op: town money per night x nights until the meeting (3 chapters of 28 + Sun-Wed) and until the last-push deadline
      const per = []; for (let k = 0; k < 30; k++) { const q = Math.round((15 + k) * coopTownMul()); per.push(q); }
      const mean = per.reduce((a, b) => a + b, 0) / per.length, meet = 3 * 28 + 3, dead = 3 * 28 + 3 * 7 + 5;
      o.meet = mean * meet; o.dead = mean * dead; o.goal = STORY_COOP_GOAL;
      S.story = null; o.plain = coopTownMul(); return o;
    });
    assert.ok(r.none >= 0.2 && r.none <= 0.4, 'no effort: ' + r.none);
    assert.ok(r.noVoteNo >= 0.15 && r.noVoteYes <= 0.5);
    assert.ok(r.few >= 0.9, 'a little effort: ' + r.few);
    assert.ok(r.meet >= 4300 && r.meet <= 5200, 'passive fund at the meeting: ' + r.meet);
    assert.ok(r.dead < r.goal, 'doing nothing never opens the store: ' + r.dead);
    assert.ok(r.dead + 1000 >= r.goal, '$1,000 of pledges gets it there in the last push: ' + (r.dead + 1000));
    assert.strictEqual(r.plain, 1, 'non-story games are unchanged');
    noErrors(errors);
  } },
];
