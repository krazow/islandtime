// Job hunting: weekend interviews, a week off the listings after a firing, starting the next day; cancelling help visits
const { open, newGame, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
module.exports = [
  { name: 'jobs: on a weekend in a month game, interviews go to early next week and survive the rollover', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.cur = 5; S.t = 5 * 1440 + 600; S.loc = 'home';
      const slot = interviewSlot('tacoma'), txt = ivDay(slot);
      S.interview = { job: 'tacoma', day: slot.day, time: slot.time, loc: JOBS.tacoma.loc };
      const todo = todoItems().find(x => /^Interview/.test(x.l)).s;
      const n = []; weekRollover(n);
      return { slot, txt, todo, after: S.interview && S.interview.day };
    });
    assert.deepStrictEqual(r.slot, { day: 7, time: 600 });
    assert.strictEqual(r.txt, 'next Monday'); assert.match(r.todo, /^next Monday/);
    assert.strictEqual(r.after, 0, 'Monday of the new week');
    noErrors(errors);
  } },
  { name: 'jobs: a one-week game still has no weekend interviews', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    assert.strictEqual(await page.evaluate(() => { S.cur = 5; S.t = 5 * 1440 + 600; return interviewSlot('tacoma'); }), null);
    noErrors(errors);
  } },
  { name: 'jobs: fired → off the listings for a week, then back with lower odds', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'normal', 'month');
    const r = await page.evaluate(() => {
      S.firedFrom = ['tacoma']; S.firedAt = { tacoma: dayKey() };
      const now = jobOpenings().includes('tacoma');
      S.firedAt.tacoma = dayKey() - 7; const later = jobOpenings().includes('tacoma');
      S.loc = 'home'; jobModal(); const sub = [...document.querySelectorAll('#mbg button.act')].find(b => /Records clerk/.test(b.textContent)).textContent;
      return { now, later, sub };
    });
    assert.strictEqual(r.now, false); assert.strictEqual(r.later, true); assert.match(r.sub, /They remember firing you/);
    noErrors(errors);
  } },
  { name: 'jobs: hired today, you start tomorrow (no shift today, no missed-work penalty)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      S.cur = 1; S.t = 1440 + 600; S.loc = 'office'; S.interview = { job: 'tacoma', day: 1, time: 600, loc: 'office' };
      const orig = Math.random; Math.random = () => 0.01; actions().find(a => /^Interview/.test(a.l)).fn(); Math.random = orig;
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const today = actions().find(a => /start tomorrow/.test(a.l)), noShift = !actions().some(a => /^Work a full shift/.test(a.l));
      const todo = todoItems().filter(x => /^Work:/.test(x.l)).map(x => x.l);
      const j0 = S.job; const n = []; S.t = 1440 + 1300;
      // the night check for missed work
      const missed = (() => { const d = 1; return S.emp && curJob().days.includes(d) && !S.worked[d] && jobStarted(d); })();
      S.cur = 2; S.t = 2 * 1440 + 500; const tomorrow = actions().some(a => /^Work a full shift/.test(a.l));
      return { emp: S.emp, today: !!today, noShift, todoHasMon: todo.includes('Work: Monday'), todoHasTue: todo.includes('Work: Tuesday'), missed, tomorrow };
    });
    assert.strictEqual(r.emp, 'tacoma'); assert.ok(r.today && r.noShift);
    assert.strictEqual(r.todoHasTue, false, 'no Tuesday shift on the to-do list'); assert.strictEqual(r.missed, false);
    assert.strictEqual(r.tomorrow, true);
    noErrors(errors);
  } },
  { name: 'help posts: cancel early for free, at the last minute for −2', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => {
      phoneInstall('group'); S.loc = 'home'; S.t = 600; S.rep = 10; S.phone = 90; S.phoneT = S.t;
      UP().jobs.push({ k: 'post', due: 1050, at: 1020, task: 'general', sched: true }); postCancel(); const early = { rep: S.rep, job: !!upJob('post') };
      UP().jobs.push({ k: 'post', due: 810, at: 780, task: 'general', sched: true }); S.t = 700; postCancel(); const late = { rep: S.rep, job: !!upJob('post') };
      return { early, late };
    });
    assert.deepStrictEqual(r.early, { rep: 10, job: false });
    assert.deepStrictEqual(r.late, { rep: 8, job: false });
    noErrors(errors);
  } },
];
