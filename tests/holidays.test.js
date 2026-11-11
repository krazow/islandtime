const { open, noErrors, assert } = require('./helpers');

const game = (page, season = 'fall', mode = 'week') => page.evaluate(([s, m]) => {
  newGame('normal', m, s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [season, mode]);
const press = (page, re) => page.evaluate(src => { const r = new RegExp(src); const i = MB.findIndex(b => r.test(b.l)); if (i < 0) throw new Error('no button ' + src + ' in ' + MB.map(b => b.l).join(' | ')); MBTN(i); }, re.source);
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
// jump to a day: wk (weekNo), d (0 = Monday), minute of day, place
const at = (page, wk, d, m, loc) => page.evaluate(([wk, d, m, loc]) => { S.weekNo = wk; S.cur = d; S.t = d * 1440 + m; S.loc = loc; }, [wk, d, m, loc]);
const labels = page => page.evaluate(() => actions().map(a => a.l));
const find = (page, re) => page.evaluate(src => { const a = actions().find(a => new RegExp(src).test(a.l)); return a ? { l: a.l, dis: !!a.dis } : null; }, re.source);
const run = (page, re) => page.evaluate(src => { actions().find(a => new RegExp(src).test(a.l)).fn(); }, re.source);

module.exports = [
  { name: 'holidays: dates map to the game calendar; only holidays inside the game fire', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const w = (season, mode, wk, d) => { newGame('normal', mode, season); S.weekNo = wk; return holWho(d).join('+') };
      const out = {
        july4: w('summer', 'week', 0, 5), julyEarly: w('summer', 'week', 0, 4), julyWk2: w('summer', 'month', 2, 5),
        fallWeek: [0, 1, 2, 3, 4, 5, 6].map(d => w('fall', 'week', 0, d)).join('|'),
        eve: w('fall', 'month', 3, 2), thanks: w('fall', 'month', 3, 3), black: w('fall', 'month', 3, 4), sun: w('fall', 'month', 3, 6), wk2: w('fall', 'month', 2, 3),
        jan: w('winter', 'week', 0, 0), jan2: w('winter', 'week', 0, 3), spring: w('spring', 'month', 1, 2),
      };
      newGame('normal', 'month', 'fall'); S.weekNo = 3; S.cur = 3; out.date = dateTxt(3);
      return out;
    });
    assert.strictEqual(r.july4, 'july4'); assert.strictEqual(r.julyEarly, ''); assert.strictEqual(r.julyWk2, '');
    assert.strictEqual(r.fallWeek, '||||||'); // no holiday in Nov 2-8
    assert.strictEqual(r.eve, 'thanksEve'); assert.strictEqual(r.thanks, 'thanksgiving'); assert.strictEqual(r.black, 'blackFriday+xmas'); assert.strictEqual(r.sun, 'xmas'); assert.strictEqual(r.wk2, '');
    assert.strictEqual(r.jan, 'xmas'); assert.strictEqual(r.jan2, ''); assert.strictEqual(r.spring, ''); assert.strictEqual(r.date, 'Nov 26');
    // an ordinary week has no holiday actions
    await game(page, 'fall', 'week');
    await at(page, 0, 2, 800, 'legion');
    const l = await labels(page); assert.ok(!l.some(x => /Thanksgiving|parade|trunk|tree lighting/i.test(x)));
    noErrors(errors);
  } },
  { name: 'holidays: the Wednesday before Thanksgiving crowds the boats; Thanksgiving week has announcements', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    const r = await page.evaluate(() => {
      const f = (wk, side, d, dep) => { S.weekNo = wk; S.week.b = []; return fullProb(side, d, dep) };
      const out = { eveHome: f(3, 'M', 2, 1035), eveMorn: f(3, 'I', 2, 455), normal: f(1, 'M', 2, 1035), thu: f(3, 'M', 3, 1035), sun: f(3, 'M', 6, 955), sunNormal: f(1, 'M', 6, 955), sunIsl: f(3, 'I', 6, 915) };
      S.weekNo = 3; S.cur = 2; S.t = 2 * 1440 + 400; S.loc = 'home'; const say0 = S.log.length;
      const ev = id => { const e = EV.find(e => e.id === id); return { cond: !!e.cond({}), noScale: !!e.noScale }; };
      out.a = ev('hol_thanks_eve'); EV.find(e => e.id === 'hol_thanks_eve').run({}); out.said = S.log.slice(say0).map(l => l.s).join(' ');
      out.notOnThu = (S.cur = 3, !EV.find(e => e.id === 'hol_thanks_eve').cond({}));
      return out;
    });
    assert.ok(r.eveHome >= 0.7, 'Wednesday evening from the mainland: ' + r.eveHome); assert.ok(r.eveHome > r.normal + 0.2);
    assert.ok(r.eveMorn >= 0.35); assert.ok(r.thu < 0.2, 'Thanksgiving Day is quiet'); assert.ok(r.sun >= 0.7); assert.ok(r.sun > r.sunNormal);
    assert.ok(r.a.cond && r.a.noScale); assert.match(r.said, /Wednesday before Thanksgiving/); assert.ok(r.notOnThu);
    noErrors(errors);
  } },
  { name: 'holidays: Thanksgiving dinner: a friend’s table, the Legion, host the neighbors, or quiet', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    await at(page, 3, 3, 900, 'home');
    await page.evaluate(() => { S.money = 300; S.pantry = 4; S.stress = 60; S.friends.hendersons = { name: 'the Hendersons', how: 'x', day: 0, lvl: 1, pts: 0 }; S.friends.sam = { name: 'Sam, your new neighbor', how: 'x', day: 0, lvl: 1, pts: 0 }; });
    assert.ok(await find(page, /Thanksgiving dinner/));
    await run(page, /Thanksgiving dinner/);
    const lab = await page.evaluate(() => MB.map(b => b.l));
    assert.ok(lab.some(l => /Dinner at The Hendersons/.test(l)), lab.join('|')); assert.ok(lab.some(l => /Legion/.test(l))); assert.ok(lab.some(l => /Host: cook/.test(l)));
    await press(page, /Host: cook for the neighbors/);
    const r = await page.evaluate(() => ({ money: S.money, pantry: S.pantry, stress: S.stress, ate: S.ateOut, day: day(), hend: S.friends.hendersons.pts, sam: S.friends.sam.pts, rep: S.rep, done: HOL().done.thanks === dayKey() }));
    assert.strictEqual(r.money, 255); assert.strictEqual(r.pantry, 6); assert.ok(r.stress < 60); assert.strictEqual(r.ate, r.day); assert.ok(r.hend >= 2 && r.sam >= 2); assert.ok(r.rep >= 5); assert.ok(r.done);
    const again = await find(page, /Thanksgiving dinner/); assert.strictEqual(again, null);
    // the Legion's community dinner
    await game(page, 'fall', 'month'); await at(page, 3, 3, 900, 'legion');
    await page.evaluate(() => { S.stress = 60; });
    await run(page, /Thanksgiving dinner/); await press(page, /community dinner/);
    const l = await page.evaluate(() => ({ st: S.stress, ate: S.ateOut, walt: !!S.friends.walt }));
    assert.ok(l.st < 60); assert.strictEqual(l.ate, 3); assert.ok(l.walt);
    // quiet
    await game(page, 'fall', 'month'); await at(page, 3, 3, 900, 'home');
    await run(page, /Thanksgiving dinner/);
    const q = await page.evaluate(() => MB.map(b => b.l)); assert.ok(!q.some(x => /Dinner at/.test(x)));
    await press(page, /quiet dinner/);
    // not in the morning
    await game(page, 'fall', 'month'); await at(page, 3, 3, 400, 'home');
    assert.strictEqual(await find(page, /Thanksgiving dinner/), null);
    noErrors(errors);
  } },
  { name: 'holidays: the pie baked on the eve makes it to the table', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    await at(page, 3, 2, 900, 'home');
    await page.evaluate(() => { S.pantry = 3; S.friends.hendersons = { name: 'the Hendersons', how: 'x', day: 0, lvl: 1, pts: 0 }; });
    await run(page, /Bake a pie/);
    assert.strictEqual(await page.evaluate(() => S.pantry), 2);
    await at(page, 3, 3, 900, 'home');
    await run(page, /Thanksgiving dinner/);
    assert.ok(await page.evaluate(() => MB.some(b => /Bring your pie/.test(b.s || ''))));
    noErrors(errors);
  } },
  { name: 'holidays: a pie on the ferry ramp and a Christmas carol on the boat', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    await at(page, 3, 2, 900, 'aiDock');
    const r = await page.evaluate(() => { const e = EV.find(e => e.id === 'thanks_ferry'); return { ok: !!e.cond({ from: 'ferry', at: 'aiDock' }), notWalk: !e.cond({ from: 'home', at: 'aiDock' }) } });
    assert.ok(r.ok && r.notWalk);
    await page.evaluate(() => { EV.find(e => e.id === 'thanks_ferry').run({}); });
    await press(page, /Help scrape it up/);
    // the carol: Black Friday onward, and January
    await at(page, 3, 4, 900, 'stDock');
    assert.ok(await page.evaluate(() => !!EV.find(e => e.id === 'xmas_carol').cond({ from: 'ferry', at: 'stDock' })));
    await page.evaluate(() => { const s = S.stress = 50; EV.find(e => e.id === 'xmas_carol').run({}); });
    await press(page, /Sing along/);
    assert.ok(await page.evaluate(() => S.stress < 50));
    await at(page, 2, 4, 900, 'stDock');
    assert.ok(await page.evaluate(() => !EV.find(e => e.id === 'xmas_carol').cond({ from: 'ferry', at: 'stDock' })));
    await game(page, 'winter', 'week'); await at(page, 0, 1, 900, 'aiDock');
    assert.ok(await page.evaluate(() => !!EV.find(e => e.id === 'xmas_carol').cond({ from: 'ferry', at: 'aiDock' })));
    noErrors(errors);
  } },
  { name: 'holidays: Christmas: tree lighting on Black Friday, decorations once, ZooLights, January leftovers', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    await at(page, 3, 4, 960, 'legion');
    assert.ok((await find(page, /tree lighting: 5:30/)) !== null);
    await at(page, 3, 4, 1060, 'legion');
    await page.evaluate(() => { S.stress = 60; });
    await run(page, /tree lighting/);
    const t = await page.evaluate(() => ({ st: S.stress, bev: !!S.friends.bev, done: HOL().done.tree === dayKey() }));
    assert.ok(t.st < 60 && t.bev && t.done);
    assert.match(await page.evaluate(() => actions().find(a => /tree lighting/.test(a.l)).l), /✓/);
    // decorations
    await at(page, 3, 5, 900, 'home');
    await page.evaluate(() => { S.money = 100; S.home = 50; });
    await run(page, /Christmas lights and a tree/);
    const d = await page.evaluate(() => ({ money: S.money, home: S.home, again: actions().some(a => /Christmas lights/.test(a.l)) }));
    assert.strictEqual(d.money, 80); assert.strictEqual(d.home, 54); assert.strictEqual(d.again, false);
    // ZooLights at Point Defiance
    await at(page, 3, 5, 1100, 'tc_zoo');
    await page.evaluate(() => { S.money = 100; S.stress = 60; });
    await run(page, /ZooLights/);
    const z = await page.evaluate(() => ({ money: S.money, st: S.stress, again: actions().some(a => /^ZooLights/.test(a.l)) }));
    assert.strictEqual(z.money, 78); assert.ok(z.st < 60); assert.strictEqual(z.again, false);
    // no decorations before Thanksgiving weekend
    await at(page, 3, 2, 900, 'home'); assert.strictEqual(await find(page, /Christmas lights/), null);
    // Black Friday announcement mentions ZooLights
    await at(page, 3, 4, 400, 'home');
    assert.match(await page.evaluate(() => { const n = S.log.length; EV.find(e => e.id === 'hol_blackfriday').run({}); return S.log.slice(n).map(l => l.s).join(' ') }), /ZooLights/);
    // January: still decorated, the wake line
    await game(page, 'winter', 'week'); await at(page, 0, 0, 400, 'home');
    assert.ok(await page.evaluate(() => !!EV.find(e => e.id === 'hol_xmas_jan').cond({})));
    noErrors(errors);
  } },
  { name: 'holidays: Fourth of July: parade, potluck, fireworks from the marina, and a packed ferry', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'summer', 'week');
    await at(page, 0, 5, 560, 'legion');
    assert.ok(await find(page, /parade: 10:00/) !== null);
    await at(page, 0, 5, 610, 'legion');
    await page.evaluate(() => { S.stress = 60; S.healthB = S.health; });
    await run(page, /Watch the Fourth of July parade/);
    await press(page, /Wave from the curb/);
    const p = await page.evaluate(() => ({ st: S.stress, walt: !!S.friends.walt }));
    assert.ok(p.st < 60 && p.walt);
    await at(page, 0, 5, 1000, 'legion');
    await page.evaluate(() => { S.money = 50; S.pantry = 2; });
    await run(page, /Go to the Fourth of July potluck/);
    await press(page, /Bring a dish from your pantry/);
    const q = await page.evaluate(() => ({ pantry: S.pantry, ate: S.ateOut, rep: S.rep }));
    assert.strictEqual(q.pantry, 1); assert.strictEqual(q.ate, 5); assert.ok(q.rep >= 3);
    // fireworks off the marina dock
    await at(page, 0, 5, 1300, 'marina');
    await page.evaluate(() => { S.stress = 60; });
    await run(page, /fireworks from the marina dock/);
    const f = await page.evaluate(() => ({ st: S.stress, fw: SEAST().fw === dayKey(), again: actions().some(a => /^Watch the fireworks from the marina/.test(a.l)) }));
    assert.ok(f.st <= 48); assert.ok(f.fw); assert.strictEqual(f.again, false);
    // the boats are packed
    const full = await page.evaluate(() => { S.week.b = []; return { sat: fullProb('M', 5, 1035), july4ev: holCrowd('M', 5, 1035) } });
    assert.ok(full.sat >= 0.6);
    // the wake line
    await at(page, 0, 5, 400, 'home');
    assert.match(await page.evaluate(() => { const n = S.log.length; EV.find(e => e.id === 'hol_july4').run({}); return S.log.slice(n).map(l => l.s).join(' ') }), /parade/);
    noErrors(errors);
  } },
  { name: 'holidays: Halloween trunk-or-treat (when a game calendar reaches October 31)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'week');
    // no real season reaches Oct 31 yet, so move the calendar
    await page.evaluate(() => { window.__gd = gameDate; gameDate = d => new Date(2026, 9, 31); });
    await at(page, 0, 5, 1000, 'legion');
    assert.deepStrictEqual(await page.evaluate(() => holWho()), ['halloween']);
    assert.ok(await find(page, /Trunk-or-treat/));
    await page.evaluate(() => { S.t = 5 * 1440 + 1050; S.money = 50; S.stress = 60; Math.random = () => 0.1; });
    await run(page, /Go to trunk-or-treat/);
    await press(page, /homemade/);
    const r = await page.evaluate(() => ({ money: S.money, st: S.stress, rep: S.rep }));
    assert.strictEqual(r.money, 70); assert.ok(r.st < 60); assert.ok(r.rep >= 4);
    assert.match(await page.evaluate(() => { const n = S.log.length; S.cur = 5; S.loc = 'home'; EV.find(e => e.id === 'hol_halloween').run({}); return S.log.slice(n).map(l => l.s).join(' ') }), /trunk-or-treat/);
    assert.ok(await page.evaluate(() => holCrowd('M', 5, 1035)) > 0);
    await page.evaluate(() => { gameDate = window.__gd; });
    noErrors(errors);
  } },
  { name: 'holidays: visitors get the community parts but not the home ones', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall', 'month');
    await page.evaluate(() => { S.visitor = vsInit('regular', 'tacoma'); });
    await at(page, 3, 3, 900, 'home');
    assert.strictEqual(await find(page, /Thanksgiving dinner/), null);
    await at(page, 3, 3, 900, 'legion');
    await run(page, /Thanksgiving dinner/);
    const lab = await page.evaluate(() => MB.map(b => b.l)); assert.ok(!lab.some(l => /Host/.test(l)));
    await press(page, /community dinner/);
    assert.ok(await page.evaluate(() => VS().rep >= 1));
    noErrors(errors);
  } },
];
