// Job listings that change every week, mid-week fills and openings, friends' tips, seasonal jobs and the co-op clerk
const { open, newGame, noErrors, assert } = require('./helpers');
// in-page helper: run fn with Math.random returning the given values in order, then `rest`
const SEQ = `window.withRand = (vals, rest, fn) => { const o = Math.random; let i = 0; Math.random = () => i < vals.length ? vals[i++] : rest; try { return fn(); } finally { Math.random = o; } };
  window.clearM = () => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); };`;
async function start(ctx, mode = 'month') {
  const o = await open(ctx);
  await newGame(o.page, 'normal', mode);
  await o.page.evaluate(SEQ);
  return o;
}
module.exports = [
  { name: 'listings: regenerated every week, at least 2 open, never your own job, old saves generate lazily', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const out = {};
      delete S.jobsx; out.lazy = jobOpenings().length >= 2 && S.jobsx.key === '0|fall|';
      // nothing comes up by chance: still two listings
      delete S.jobsx; out.min = withRand([], 0.99, () => jobOpenings());
      // everything comes up: every eligible job but yours (fall: the stocker, no deckhand, no co-op clerk yet)
      delete S.jobsx; out.all = withRand([], 0, () => jobOpenings());
      const k0 = S.jobsx.key; const n = []; S.cur = 6; weekRollover(n);
      out.rolled = withRand([], 0, () => jobListings().key); out.k0 = k0; out.seen = S.jobsx.seen;
      // a story chapter is part of the key too
      S.story = { ch: 2 }; out.story = jobListings().key; delete S.story;
      S.emp = 'tacoma'; delete S.jobsx; out.mine = withRand([], 0, () => jobOpenings());
      return out;
    });
    assert.strictEqual(r.lazy, true);
    assert.strictEqual(r.min.length, 2); assert.ok(!r.min.includes('lakewood'));
    assert.deepStrictEqual(r.all, ['riv', 'tacoma', 'dupont', 'stocker']);
    assert.strictEqual(r.k0, '0|fall|'); assert.strictEqual(r.rolled, '1|fall|'); assert.strictEqual(r.seen, false);
    assert.strictEqual(r.story, '1|fall|2');
    assert.deepStrictEqual(r.mine, ['lakewood', 'riv', 'dupont', 'stocker']);
    noErrors(errors);
  } },
  { name: 'listings: mid-week a listing fills (never your interview) and another opens; notes only when you care', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const out = {}, key = jobListKey();
      S.emp = null; S.interview = { job: 'riv', day: 2, time: 900, loc: 'food' };
      S.jobsx = { key, open: ['riv', 'tacoma'], tip: {} };
      let n = []; withRand([0.01, 0], 0.99, () => jobListNight(n)); // fill: picks the first that isn't your interview
      out.fill = { open: S.jobsx.open.slice(), note: n.join(' ') };
      n = []; withRand([0.99, 0.01, 0], 0.99, () => jobListNight(n)); // open: the first closed eligible one
      out.add = { open: S.jobsx.open.slice(), note: n.join(' ') };
      // the interview's listing never fills, even when it's the only one
      S.jobsx.open = ['riv']; n = []; withRand([0.01, 0.99], 0.99, () => jobListNight(n)); out.keep = S.jobsx.open.slice();
      // employed and haven't looked this week: changes happen quietly
      S.emp = 'lakewood'; S.interview = null; S.jobsx = { key, open: ['riv', 'tacoma'], tip: {} };
      n = []; withRand([0.01, 0, 0.01, 0.5], 0.99, () => jobListNight(n)); out.quiet = { open: S.jobsx.open.slice(), notes: n.length };
      S.loc = 'home'; jobModal(); out.modal = document.querySelector('#mbg').textContent; clearM();
      n = []; withRand([0.01, 0], 0.99, () => jobListNight(n)); out.told = n.join(' ');
      return out;
    });
    assert.deepStrictEqual(r.fill.open, ['riv']); assert.match(r.fill.note, /Records clerk.*is gone/);
    assert.deepStrictEqual(r.add.open, ['lakewood', 'riv']); assert.match(r.add.note, /New job listing: <b>Office job/);
    assert.deepStrictEqual(r.keep, ['riv']);
    assert.deepStrictEqual(r.quiet.open, ['tacoma', 'dupont']); assert.strictEqual(r.quiet.notes, 0);
    assert.match(r.modal, /Listings change every week/);
    assert.match(r.told, /is gone/, 'after looking at the listings you hear about it');
    noErrors(errors);
  } },
  { name: 'listings: a friend tips you off once a week; the word in shows and helps the interview', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const out = {}, key = jobListKey();
      S.emp = null; S.rep = 0; S.friends = {}; S.jobsx = { key, open: ['riv', 'tacoma'], tip: {} };
      let n = []; withRand([0.99, 0.99], 0.01, () => jobListNight(n)); out.noFriend = { notes: n.length, tipKey: S.jobsx.tipKey || null };
      S.friends.sam = { name: 'Sam, your new neighbor', lvl: 2, pts: 0 };
      n = []; withRand([0.99, 0.99, 0, 0.01, 0], 0.99, () => jobListNight(n));
      out.tip = { open: S.jobsx.open.slice(), tip: Object.assign({}, S.jobsx.tip), note: n.join(' ') };
      n = []; withRand([0.99, 0.99, 0, 0.01, 0], 0.99, () => jobListNight(n)); out.again = S.jobsx.open.length;
      S.cur = 1; S.t = 1440 + 480; S.loc = 'home'; jobModal();
      const b = [...document.querySelectorAll('#mbg button.act')].find(x => /Office job/.test(x.textContent));
      out.btn = b.textContent; b.click(); out.iv = Object.assign({}, S.interview); clearM();
      // reputation alone gets you a tip from a neighbor
      S.friends = {}; S.rep = 40; S.jobsx = { key, open: ['riv', 'tacoma'], tip: {} };
      n = []; withRand([0.99, 0.99, 0.01, 0], 0.99, () => jobListNight(n)); out.rep = n.join(' ');
      // the word in: +10% at the interview
      const hire = (tip, r) => { S.emp = null; S.stress = 40; S.cur = 2; S.t = 2 * 1440 + 600; S.loc = 'office';
        S.interview = { job: 'tacoma', day: 2, time: 600, loc: 'office', tip }; const a = actions().find(x => /^Interview/.test(x.l));
        withRand([], r, () => a.fn()); clearM(); return S.emp; };
      out.withTip = hire(true, 0.8); out.noTip = hire(false, 0.8);
      return out;
    });
    assert.deepStrictEqual(r.noFriend, { notes: 0, tipKey: null });
    assert.deepStrictEqual(r.tip.open, ['lakewood', 'riv', 'tacoma']); assert.deepStrictEqual(r.tip.tip, { lakewood: true });
    assert.match(r.tip.note, /Sam tips you off/);
    assert.strictEqual(r.again, 3, 'one tip roll a week');
    assert.match(r.btn, /Word in:/); assert.match(r.btn, /Sam put in a good word/);
    assert.strictEqual(r.iv.tip, true);
    assert.match(r.rep, /A neighbor tips you off/);
    assert.strictEqual(r.withTip, 'tacoma'); assert.strictEqual(r.noTip, null);
    noErrors(errors);
  } },
  { name: 'listings: seasonal jobs only in their season, the co-op clerk only once the co-op is open', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const all = () => { delete S.jobsx; return withRand([], 0, () => jobOpenings()); }, out = {};
      out.fall = all(); S.season = 'summer'; out.summer = all(); S.season = 'winter'; out.winter = all();
      S.season = 'summer'; S.jobsx = { key: jobListKey(), open: ['deckhand', 'riv'], tip: {} }; S.season = 'fall';
      out.changed = withRand([], 0, () => jobOpenings()); // a season change regenerates the listings
      S.coop.open = true; out.coop = all();
      return out;
    });
    assert.ok(r.fall.includes('stocker') && !r.fall.includes('deckhand') && !r.fall.includes('clerk'));
    assert.ok(r.summer.includes('deckhand') && !r.summer.includes('stocker'));
    assert.ok(!r.winter.includes('deckhand') && !r.winter.includes('stocker'));
    assert.ok(!r.changed.includes('deckhand'));
    assert.ok(r.coop.includes('clerk'));
    noErrors(errors);
  } },
  { name: 'listings: weekend shifts work, show up in the to-do list, and a missed Sunday counts', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const out = {};
      S.emp = 'stocker'; S.empStart = 0; S.job = 70; S.worked = {};
      S.cur = 5; S.t = 5 * 1440 + 590; S.loc = 'market';
      const w = actions().find(a => /^Work a full shift/.test(a.l)); out.sat = !!w; out.half = actions().some(a => /^Work until/.test(a.l));
      const m0 = S.money; w.fn(); out.pay = S.money - m0; clearM();
      out.todo = todoItems().filter(x => /^Work:/.test(x.l)).map(x => x.l);
      S.cur = 6; S.t = 6 * 1440 + 1300; S.loc = 'home'; S.pantry = 5; S.health = 90; S.stress = 20; const j0 = S.job;
      endDay('home'); clearM(); out.job = j0 - S.job; out.missed = S.log.some(l => /You missed work today/.test(l.s));
      // the deckhand: Monday at 5:30 AM at the island landing, no half day
      S.season = 'summer'; S.emp = 'deckhand'; S.empStart = 0; S.worked = {}; S.cur = 0; S.t = 300; S.loc = 'home';
      out.next = nextUp(actions()); S.loc = 'aiDock'; S.t = 320;
      out.deck = actions().some(a => /^Work a full shift/.test(a.l)); out.deckHalf = actions().some(a => /^Work until/.test(a.l));
      out.days = dayList(JOBS.deckhand.days);
      // the co-op clerk on a Saturday
      S.coop.open = true; syncCoop(); S.emp = 'clerk'; S.cur = 5; S.t = 5 * 1440 + 540; S.loc = 'store';
      out.clerk = actions().some(a => /^Work a full shift/.test(a.l)); out.clerkDays = dayList(JOBS.clerk.days);
      actions().find(a => /^Work a full shift/.test(a.l)).fn(); clearM(); out.ot = actions().some(a => /overtime/i.test(a.l));
      return out;
    });
    assert.strictEqual(r.sat, true); assert.strictEqual(r.half, true); assert.strictEqual(r.pay, 140);
    assert.deepStrictEqual(r.todo, ['Work: Wednesday', 'Work: Thursday', 'Work: Friday', 'Work: Saturday', 'Work: Sunday']);
    assert.ok(r.job >= 15, 'missed Sunday shift: job −15, got −' + r.job); assert.strictEqual(r.missed, true);
    assert.match(r.next.t, /Anderson Island Ferry Landing.*5:30/);
    assert.strictEqual(r.deck, true); assert.strictEqual(r.deckHalf, false);
    assert.strictEqual(r.days, 'Mon, Thu, Fri, Sat, Sun');
    assert.strictEqual(r.clerk, true); assert.strictEqual(r.clerkDays, 'Mon, Tue, Thu, Fri, Sat'); assert.strictEqual(r.ot, false);
    noErrors(errors);
  } },
  { name: 'listings: temporary jobs end with the season: laid off, not fired', fn: async ctx => {
    const { page, errors } = await start(ctx);
    const r = await page.evaluate(() => {
      const out = {};
      S.emp = 'stocker'; S.job = 70; S.rep = 10; S.firedFrom = [];
      out.same = jobSeasonEnd([]); out.kept = S.emp;
      S.season = 'winter'; const n = []; out.ended = jobSeasonEnd(n);
      out.after = { emp: S.emp, fired: S.firedFrom.length, rep: S.rep, firings: S.stats.firings || 0, note: n.join(' ') };
      S.emp = 'tacoma'; out.perm = jobSeasonEnd([]); out.permEmp = S.emp;
      S.emp = null; S.interview = { job: 'deckhand', day: 3, time: 600, loc: 'aiDock' }; jobSeasonEnd([]); out.iv = S.interview;
      return out;
    });
    assert.strictEqual(r.same, false); assert.strictEqual(r.kept, 'stocker');
    assert.strictEqual(r.ended, true);
    assert.strictEqual(r.after.emp, null); assert.strictEqual(r.after.fired, 0); assert.strictEqual(r.after.rep, 10); assert.strictEqual(r.after.firings, 0);
    assert.match(r.after.note, /temporary job/);
    assert.strictEqual(r.perm, false); assert.strictEqual(r.permEmp, 'tacoma');
    assert.strictEqual(r.iv, null);
    noErrors(errors);
  } },
];
