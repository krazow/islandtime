const { open, newGame, noErrors, assert } = require('./helpers');

module.exports = [
  { name: 'title screen has a daily challenge button for the local date, next to the weekly one', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const out = await page.evaluate(() => { const b = document.getElementById('dayBtn'), w = document.getElementById('chBtn'); return { t: b && b.textContent, adj: !!(w && w.nextElementSibling === b), id: dailyDateId(new Date(2026, 0, 5, 23, 59)), id2: dailyDateId(new Date(2026, 11, 31, 0, 1)) }; });
    assert(/^☀️ Daily challenge · [A-Z][a-z]{2} \d+$/.test(out.t), out.t);
    assert(out.adj); assert.strictEqual(out.id, 'D2026-01-05'); assert.strictEqual(out.id2, 'D2026-12-31');
    await page.click('#menuBtn'); const box = await page.locator('#dayBtn').boundingBox(); await page.click('#menuBtn'); assert(box && box.width <= 400);
    noErrors(errors);
  } },
  { name: 'the same date gives the same day (weather, sailings, prices, season, goal); other dates differ', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      const snap = id => { dailyStart(id); const s = JSON.stringify([S.week.b, S.week.fog, S.week.storm, S.week.px, S.season, S.challenge.goal, S.up.well, S.up.propane]); return s };
      const a = snap('D2026-11-11'), b = snap('D2026-11-11'), c = snap('D2026-11-12'), d = snap('D2026-03-02');
      dailyStart('D2026-11-11'); return { same: a === b, diff: a !== c, season: S.season, goal: !!DAILY_GOALS[S.challenge.goal], spring: JSON.parse(d)[4], on: dailyOn(), vis: !visitorOn(), mode: S.mode };
    });
    assert(r.same && r.diff && r.goal && r.on && r.vis); assert.strictEqual(r.season, 'fall'); assert.strictEqual(r.spring, 'spring');
    noErrors(errors);
  } },
  { name: 'going to bed ends the day with a score, saves it, and gives an IT1 code that decodes', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { localStorage.removeItem('islandtime.challenge'); dailyStart('D2026-11-11'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
    assert(/Daily goal/.test(await page.textContent('body')));
    await page.evaluate(() => { S.loc = 'home'; S.t = S.cur * 1440 + 1300; endDay('home'); });
    await page.waitForSelector('#chcode');
    const out = await page.evaluate(() => { const code = document.getElementById('chcode').value, d = chDecode(code); return { code, d, over: S.over, mine: chLoad().mine['D2026-11-11'], title: document.querySelector('.end h1').textContent }; });
    assert(out.over && out.d.ok && out.d.r.id === 'D2026-11-11' && out.d.r.score === out.mine.score, JSON.stringify(out));
    assert(/^IT1-/.test(out.code));
    // a friend's code lands on the same board
    await page.evaluate(() => chAdd({ id: 'D2026-11-11', name: 'Bo', score: 9999, money: 1, grade: 'A', workdays: 1, stranded: 0, rep: 0 }));
    await page.evaluate(() => chCompare('D2026-11-11'));
    await page.waitForSelector('.chtab');
    const t = await page.textContent('.chtab'); assert(/Bo/.test(t));
    assert(/Daily Nov 11/.test(await page.textContent('#chwk')));
    noErrors(errors);
  } },
  { name: 'scoring: goal bonus, stranded night scores lower, weekly codes still decode', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const r = await page.evaluate(() => {
      dailyStart('D2026-11-11'); S.challenge.goal = 'home'; S.worked[0] = true; S.late[0] = 0;
      const home = dailyScore('home'), away = dailyScore('motel');
      const wk = chDecode(chEncode({ id: '2026-W46', name: 'Ana', score: 300, money: 50, grade: 'B', workdays: 5, stranded: 0, rep: 3 }));
      return { home: home.score, away: away.score, met: home.met, awayMet: away.met, wk: wk.ok && wk.r.id === '2026-W46' };
    });
    assert(r.home > r.away && r.met && !r.awayMet && r.wk, JSON.stringify(r));
    noErrors(errors);
  } },
  { name: 'the daily start modal and a normal game stay separate', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.click('#menuBtn'); await page.click('#dayBtn');
    await page.waitForSelector('.modal');
    assert(/Today’s goal/.test(await page.textContent('.modal')));
    await page.click('.modal button:has-text("Start")');
    await page.waitForTimeout(200);
    assert(await page.evaluate(() => dailyOn()));
    await newGame(page);
    assert(!(await page.evaluate(() => dailyOn() || Math.random === chRand)));
    noErrors(errors);
  } },
];
