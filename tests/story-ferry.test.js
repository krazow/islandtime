// Story mode: the ferry levy vote and the boat's trip to dry dock (src/js/27-story-ferry.js).
const { open, newGame, noErrors, assert } = require('./helpers');
// a story game at chapter ch, week wk, day d, minute m (the framework in 26-story.js isn't needed: we build S.story directly)
const story = (page, ch, wk = 0, d = 0, m = 600, loc = 'home') => page.evaluate(([ch, wk, d, m, loc]) => {
  S.mode = 'month'; S.story = { ch, seasons: ['summer', 'fall', 'winter', 'spring'], flags: {}, recap: [] };
  S.season = ['summer', 'fall', 'winter', 'fall'][ch]; S.weekNo = wk; S.cur = d; S.t = d * 1440 + m; S.loc = loc;
  S.week = genWeek(S.diff); S.week.b = []; S.week.fog = [0, 0, 0, 0, 0, 0, 0]; S.log = []; S.rep = 0;
  MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); render();
}, [ch, wk, d, m, loc]);
const at = (page, d, m, loc) => page.evaluate(([d, m, loc]) => { S.cur = d; S.t = d * 1440 + m; if (loc) S.loc = loc; render(); }, [d, m, loc]);
const act = (page, re) => page.evaluate(src => { const a = actions().find(x => new RegExp(src).test(x.l)); return a ? { l: a.l, s: a.s, dis: !!a.dis } : null; }, re.source);
const run = (page, re) => page.evaluate(src => { const a = actions().find(x => new RegExp(src).test(x.l)); a.fn(); }, re.source);
const sup = page => page.evaluate(() => S.story.ferry.support);
const log = page => page.evaluate(() => S.log.map(l => l.s).join('\n'));
const shut = page => page.evaluate(() => { document.querySelectorAll('.modal-bg').forEach(e => e.remove()); MQ = []; });

module.exports = [
  { name: 'story ferry: nothing changes outside story games', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'aiDock'; S.weekNo = 1; S.cur = 1; S.t = 1440 + 600; S.week.b = []; render();
      const w = genWeek(S.diff);
      return { car: fareCar(), walk: fareWalk(), txt: fareTxt('walk'), full: fullProb('I', 1, 380) === Math.min(0.95, 0.35 * DF().full), dock: actions().some(a => /signatures|ballot|levy/i.test(a.l)),
        todo: todoItems().some(x => /levy/i.test(x.l)), note: seasonFerryNote(), alert: seasonAlert(), marks: !!(w.sfDock || w.sfLevy), story: !!S.story,
        hook: typeof window.STORY_FERRY_HOOK.ending };
    });
    assert.strictEqual(r.car, 24.94); assert.strictEqual(r.walk, 8.14); assert.strictEqual(r.txt, '$8.14');
    assert.strictEqual(r.full, true); assert.strictEqual(r.dock, false); assert.strictEqual(r.todo, false);
    assert.strictEqual(r.note, ''); assert.strictEqual(r.alert, ''); assert.strictEqual(r.marks, false); assert.strictEqual(r.story, false);
    assert.strictEqual(r.hook, 'function');
    await page.evaluate(() => { S.phone = 90; phoneInstall('group'); phoneOpen('group'); });
    assert.ok(!/Keep the Boat Running/.test(await page.textContent('#phoneUI')));
    noErrors(errors);
  } },
  { name: 'story ferry: campaign actions in chapter 0, each with its limit', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 0, 0, 1, 600, 'aiDock');
    assert.strictEqual(await page.evaluate(() => (STORY_FERRY_HOOK.chapterStart(0, null), sfF().support)), 40);
    assert.match(await log(page), /Keep the Boat Running/);
    assert.ok(await page.evaluate(() => todoItems().some(x => /ferry levy campaign/.test(x.l) && /40%/.test(x.s))));
    // signatures: +3, once a day, at either landing
    await run(page, /Gather signatures/); assert.strictEqual(await sup(page), 43);
    assert.strictEqual((await act(page, /Gather signatures/)).dis, true);
    await at(page, 2, 600, 'stDock'); assert.strictEqual((await act(page, /Gather signatures/)).dis, false);
    await run(page, /Gather signatures/); assert.strictEqual(await sup(page), 46);
    // Island Group: +2, once a week
    await page.evaluate(() => { S.phone = 90; phoneInstall('group'); S.loc = 'home'; render(); phoneOpen('group'); });
    assert.match(await page.textContent('#phoneUI'), /Keep the Boat Running/);
    await page.locator('#phoneUI button.ph-btn', { hasText: 'Share the campaign' }).click();
    assert.strictEqual(await sup(page), 48);
    await page.evaluate(() => { phoneClose(); phoneOpen('group'); });
    assert.ok(await page.locator('#phoneUI button.ph-btn', { hasText: 'Share the campaign' }).isDisabled());
    await page.evaluate(() => phoneClose());
    // talk at the old store: +2 once a week; argue against: −2 once a week
    await at(page, 2, 700, 'store');
    await run(page, /Talk ferry levy/); assert.strictEqual(await sup(page), 50);
    assert.strictEqual((await act(page, /Talk ferry levy/)).dis, true);
    await run(page, /Argue against/); assert.strictEqual(await sup(page), 48);
    assert.strictEqual((await act(page, /Argue against/)).dis, true);
    await page.evaluate(() => { S.weekNo = 1; }); assert.strictEqual((await act(page, /Talk ferry levy/)).dis, false);
    await page.evaluate(() => { S.weekNo = 0; });
    // flyers at the Legion's Fourth of July BBQ (Saturday of week 0), once
    assert.strictEqual(await page.evaluate(() => fourthDay(5)), true);
    await at(page, 5, 600, 'food'); assert.strictEqual(await act(page, /flyers/), null, 'not before 11 AM');
    await at(page, 5, 720, 'food'); assert.match((await act(page, /flyers/)).l, /Legion BBQ/);
    await run(page, /flyers/); assert.strictEqual(await sup(page), 52);
    await at(page, 6, 1100, 'food'); assert.strictEqual(await act(page, /flyers/), null, 'only once');
    // the evening at the Riv works too, if you missed the BBQ
    await page.evaluate(() => { S.story.ferry.flyers = false; });
    await at(page, 3, 1100, 'food'); assert.match((await act(page, /flyers/)).l, /at the Riv/);
    await at(page, 3, 700, 'food'); assert.strictEqual(await act(page, /flyers/), null, 'evenings only');
    // nothing in chapter 1
    await page.evaluate(() => { S.story.ch = 1; S.season = 'fall'; });
    await at(page, 3, 700, 'aiDock'); assert.strictEqual(await act(page, /Gather signatures/), null);
    noErrors(errors);
  } },
  { name: 'story ferry: reputation changes how much each campaign action counts', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 0, 0, 1, 700, 'store');
    await page.evaluate(() => { S.rep = 65; }); await run(page, /Talk ferry levy/); assert.strictEqual(await sup(page), 43);
    await page.evaluate(() => { S.rep = -25; S.story.ferry.talk = ''; }); await run(page, /Talk ferry levy/); assert.strictEqual(await sup(page), 44);
    await page.evaluate(() => { S.rep = 60; S.loc = 'aiDock'; }); await run(page, /Gather signatures/); assert.strictEqual(await sup(page), 49, '+3 × 1.5 rounds to +5');
    await page.evaluate(() => { S.rep = 70; S.loc = 'store'; }); await run(page, /Argue against/); assert.strictEqual(await sup(page), 46);
    noErrors(errors);
  } },
  { name: 'story ferry: the ballot (drop box Mon–Tue, mail from home Monday)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 1, 0, 0, 600, 'home');
    assert.ok(await act(page, /Mail your ballot/));
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Vote on the ferry levy' && !x.ok)));
    await at(page, 1, 600, 'home'); assert.strictEqual(await act(page, /Mail your ballot/), null, 'mail only on Monday');
    await at(page, 1, 600, 'store'); assert.ok(await act(page, /Drop your ballot/));
    await at(page, 1, 1210, 'store'); assert.strictEqual(await act(page, /Drop your ballot/), null, 'box closes at 8 PM');
    await at(page, 1, 900, 'store');
    await run(page, /Drop your ballot/);
    assert.match(await page.textContent('.modal'), /Supporters say[\s\S]*Opponents say/);
    await page.locator('.modal button', { hasText: 'Vote no' }).click();
    assert.strictEqual(await page.evaluate(() => S.story.ferry.vote), 'no');
    assert.strictEqual(await act(page, /Drop your ballot/), null);
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Vote on the ferry levy' && x.ok)));
    // leaving it blank is a choice too
    await page.evaluate(() => { S.story.ferry.vote = null; });
    await run(page, /Drop your ballot/);
    await page.locator('.modal button', { hasText: 'Leave it blank' }).click();
    assert.strictEqual(await page.evaluate(() => S.story.ferry.vote), 'none');
    // not in week 1, not in other chapters
    await page.evaluate(() => { S.story.ferry.vote = null; S.weekNo = 1; });
    assert.strictEqual(await act(page, /Drop your ballot/), null);
    noErrors(errors);
  } },
  { name: 'story ferry: election results both ways, at 8 PM or overnight', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 1, 0, 1, 1190, 'home');
    // fails: 50 support − 1 (your no) − 6
    const fail = await page.evaluate(() => { const F = sfF(); F.support = 50; F.vote = 'no'; const r = Math.random; Math.random = () => 0;
      processTimed(); const before = S.story.flags.levy; S.t = 1440 + 1200; processTimed(); Math.random = r; return { before, after: S.story.flags.levy }; });
    assert.strictEqual(fail.before, undefined, 'not before 8 PM');
    assert.strictEqual(fail.after, 'fail');
    assert.match(await log(page), /ferry levy fails/);
    // passes: 49 support + 1 (your yes) + ~6, resolved overnight if you went to bed early
    await story(page, 1, 0, 1, 1000, 'home');
    const pass = await page.evaluate(() => { const F = sfF(); F.support = 49; F.vote = 'yes'; const r = Math.random; Math.random = () => 0.99;
      const notes = []; upkeepNight('home', notes, 1); Math.random = r; return { levy: S.story.flags.levy, notes: notes.join(' ') }; });
    assert.strictEqual(pass.levy, 'pass');
    assert.match(pass.notes, /ferry levy passes/);
    // a near miss without your vote: 49 + 0 − 6 = 43 fails
    await story(page, 1, 0, 2, 600, 'home');
    assert.strictEqual(await page.evaluate(() => { sfF().support = 49; const r = Math.random; Math.random = () => 0; processTimed(); Math.random = r; return S.story.flags.levy; }), 'fail', 'resolves later the same week too');
    noErrors(errors);
  } },
  { name: 'story ferry: fares ±10% for cars and walk-ons from the day after the vote, charged and shown', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 1, 0, 1, 600, 'stDock');
    await page.evaluate(() => { S.story.flags.levy = 'pass'; });
    assert.deepStrictEqual(await page.evaluate(() => [fareCar(), fareWalk()]), [24.94, 8.14], 'not on vote day itself');
    await at(page, 2, 600, 'stDock');
    assert.deepStrictEqual(await page.evaluate(() => [fareCar(), fareWalk(), fareTxt('walk'), fareTxt('drive')]), [22.45, 7.33, '$7.33', '$22.45']);
    const paid = await page.evaluate(() => { S.cars.forEach(c => { c.loc = 'home'; }); for (const g in S.cargo) S.cargo[g] = 0; S.carried = 0; S.money = 500;
      const s = findNext('M', 'walk', false); board('M', s, 'walk'); return Math.round((500 - S.money) * 100) / 100; });
    assert.strictEqual(paid, 7.33);
    await page.locator('.cross').click();
    await page.evaluate(() => { tab = 'ferry'; S.loc = 'stDock'; render(); });
    const txt = await page.textContent('.content');
    assert.match(txt, /\$22\.45 with a car, \$7\.33 on foot/);
    assert.match(txt, /Ferry levy passed/);
    await page.evaluate(() => { tab = 'act'; S.story.flags.levy = 'fail'; S.story.ch = 2; S.season = 'winter'; S.weekNo = 0; render(); });
    assert.deepStrictEqual(await page.evaluate(() => [fareCar(), fareWalk(), FP_BOOK.walk.fare()]), [27.43, 8.95, 8.95]);
    const paid2 = await page.evaluate(() => { S.loc = 'stDock'; S.money = 500; const s = findNext('M', 'walk', false); board('M', s, 'walk'); return Math.round((500 - S.money) * 100) / 100; });
    assert.strictEqual(paid2, 8.95);
    noErrors(errors);
  } },
  { name: 'story ferry: crew-shortage outages after the vote (rarer if it passed, an extra one if it failed)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 2, 1, 0, 600, 'home');
    const r = await page.evaluate(() => {
      const crew = 'no relief captain available (crew shortage)', mk = () => ({ b: [0, 1, 2, 3, 4].map(d => ({ start: d * 1440 + 600, end: d * 1440 + 700, cause: crew })).concat({ start: 6 * 1440 + 600, end: 6 * 1440 + 700, cause: 'generator failure' }) });
      const rr = Math.random; const out = {};
      S.story.flags.levy = 'pass'; Math.random = () => 0.5; out.pass = sfLevyWeek(mk()).b.map(b => b.cause);
      Math.random = () => 0.1; out.passLucky = sfLevyWeek(mk()).b.length;
      S.story.flags.levy = 'fail'; Math.random = () => 0.3; out.fail = sfLevyWeek({ b: [] }).b.map(b => b.cause);
      Math.random = () => 0.7; out.failQuiet = sfLevyWeek({ b: [] }).b.length;
      Math.random = rr;
      out.marked = genWeek(S.diff).sfLevy;
      S.story.ch = 1; S.weekNo = 0; S.story.flags.levy = 'fail'; out.voteWeek = genWeek(S.diff).sfLevy || null;
      return out;
    });
    assert.deepStrictEqual(r.pass, ['generator failure']);
    assert.strictEqual(r.passLucky, 6);
    assert.deepStrictEqual(r.fail, ['no relief captain available (crew shortage)']);
    assert.strictEqual(r.failQuiet, 0);
    assert.strictEqual(r.marked, 'fail');
    assert.strictEqual(r.voteWeek, null, 'the vote week itself is generated before the vote');
    noErrors(errors);
  } },
  { name: 'story ferry: dry dock in chapter 1 weeks 1–2 only: fuller boats, slower crossings, a flaky engine, notes', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 1, 0, 1, 600, 'aiDock');
    const base = await page.evaluate(() => [fullProb('I', 1, 380), fullProb('I', 1, 1210)]);
    const when = await page.evaluate(() => { const o = {}; for (const [ch, wk] of [[0, 1], [1, 0], [1, 1], [1, 2], [1, 3], [2, 1]]) { S.story.ch = ch; S.weekNo = wk; o[ch + ':' + wk] = sfDock(); } S.story.ch = 1; S.weekNo = 1; return o; });
    assert.deepStrictEqual(when, { '0:1': false, '1:0': false, '1:1': true, '1:2': true, '1:3': false, '2:1': false });
    const dock = await page.evaluate(() => [fullProb('I', 1, 380), fullProb('I', 1, 1210)]);
    assert.ok(Math.abs(dock[0] - Math.min(0.95, base[0] * 1.8)) < 1e-9);
    assert.ok(Math.abs(dock[1] - base[1] * 1.8) < 1e-9);
    // the Monday heads-up and the alert bar
    await page.evaluate(() => { S.cur = 0; S.t = 360; startDay(); render(); });
    assert.match(await log(page), /went to the shipyard/);
    assert.strictEqual(await page.evaluate(() => S.story.ferry.dockOn), true);
    assert.match(await page.textContent('.alertbar'), /relief boat/);
    await page.evaluate(() => { tab = 'ferry'; render(); });
    assert.match(await page.textContent('.content'), /at the shipyard[\s\S]*walk on if you can/i);
    await page.evaluate(() => { tab = 'act'; render(); });
    // crossings take 5 minutes longer (walk-ons, island side)
    const dur = await page.evaluate(() => { S.cur = 1; S.t = 1440 + 600; S.loc = 'aiDock'; S.week.b = []; for (const g in S.cargo) S.cargo[g] = 0; S.carried = 0;
      const s = findNext('I', 'walk', false); S.t = s.abs; window.__t0 = S.t; window.__k = s.ketron; board('I', s, 'walk'); return null; });
    await page.locator('.cross').click();
    assert.strictEqual(await page.evaluate(() => S.t - __t0), await page.evaluate(() => 25 + (__k ? 10 : 0)));
    // one cancelled midday round trip on about one day in ten
    const eng = await page.evaluate(() => { const r = Math.random; Math.random = () => 0.05; const w = sfDockWeek({ b: [] }); Math.random = () => 0.5; const n = sfDockWeek({ b: [] }).b.length; Math.random = r;
      S.week.b = w.b; return { n: w.b.length, quiet: n, cause: w.b[0].cause, st: sailing('M', 2, 635).cancel, ai: sailing('I', 2, 670).cancel, morning: !!sailing('I', 2, 455).cancel }; });
    assert.deepStrictEqual(eng, { n: 7, quiet: 0, cause: 'the relief boat’s one engine is acting up', st: true, ai: true, morning: false });
    // the boat comes back in week 3
    const back = await page.evaluate(() => { S.weekNo = 3; S.cur = 0; S.t = 360; S.week.b = []; startDay(); render(); return S.story.flags.drydock; });
    assert.strictEqual(back, true);
    assert.match(await log(page), /The boat is back/);
    assert.strictEqual(await page.evaluate(() => seasonFerryNote().includes('shipyard')), false);
    noErrors(errors);
  } },
  { name: 'story ferry: the story hook: chapter start/end lines, flags and the ending', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    await story(page, 1, 0, 0, 600, 'home');
    const r = await page.evaluate(() => {
      const H = window.STORY_FERRY_HOOK, n1 = [], n2 = [], n3 = [];
      H.chapterStart(1, n1);
      S.story.ferry.support = 70; const rr = Math.random; Math.random = () => 0.5; H.chapterEnd(1, n2); Math.random = rr;
      S.story.ch = 2; H.chapterStart(2, n3);
      return { id: H.id, n1: n1.join(' '), n2: n2.join(' '), n3: n3.join(' '), flags: S.story.flags,
        end: H.ending({ levy: 'pass', drydock: true }), fail: H.ending({ levy: 'fail' }), none: H.ending({}) };
    });
    assert.strictEqual(r.id, 'ferry');
    assert.match(r.n1, /November 3/); assert.match(r.n1, /shipyard/);
    assert.match(r.n2, /levy passes/); assert.match(r.n2, /boat is back/);
    assert.deepStrictEqual(r.flags, { levy: 'pass', drydock: true });
    assert.match(r.n3, /10% lower/);
    assert.strictEqual(r.end.length, 2); assert.match(r.end[0], /levy passed/); assert.match(r.end[1], /shipyard/);
    assert.strictEqual(r.fail.length, 1); assert.match(r.fail[0], /levy failed/);
    assert.deepStrictEqual(r.none, []);
    await shut(page);
    noErrors(errors);
  } },
  { name: 'story ferry: the trip planner adds the relief boat’s 5 minutes during dry dock', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'aiDock'; S.cur = 1; S.t = 1440 + 300; S.week.b = [];
      const arr = () => { const p = planTrip('work', 1440 + 1300, 0); return p.best ? p.best.arrive - p.best.abs : null; };
      const before = arr();
      S.mode = 'month'; S.story = { ch: 1, seasons: ['summer', 'fall', 'winter', 'spring'], flags: {}, recap: [] }; S.weekNo = 1;
      const during = arr(); S.weekNo = 3; const after = arr();
      return { before, during, after };
    });
    assert.strictEqual(r.during - r.before, 5); assert.strictEqual(r.after, r.before);
    noErrors(errors);
  } },
];
