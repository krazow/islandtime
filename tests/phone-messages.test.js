const { open, newGame, noErrors, assert } = require('./helpers');
// index.html only: the offline build is regenerated from index.html at release time.

// a game with a few friends, at a given minute of day (no planned incoming texts unless asked)
async function setup(page, { at = 600, friends = ['sam', 'fred', 'hendersons'], lvl = 1 } = {}) {
  await newGame(page);
  await page.evaluate(([at, friends, lvl]) => {
    const names = { sam: 'Sam, your new neighbor', fred: 'Pajama Fred', hendersons: 'the Hendersons', walt: 'Walt from the American Legion', rusty: 'Rusty from the bar' };
    for (const id of friends) S.friends[id] = { name: names[id], how: 'test', day: 0, lvl, pts: lvl >= 3 ? 6 : lvl >= 2 ? 3 : 0 };
    S.t = S.cur * 1440 + at; S.phoneT = S.t; S.phone = 90; S.loc = 'home';
    MSG().plan = { d: dayKey(), at: [] };
    render();
  }, [at, friends, lvl]);
}
const advance = (page, min) => page.evaluate(m => { S.t += m; processTimed(); render(); }, min);
const thread = (page, id) => page.evaluate(id => (MSG().th[id] || { m: [] }).m.map(m => ({ f: m.f, x: m.x })), id);

module.exports = [
  { name: 'thread list renders with every friend', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => phoneOpen());
    await page.click('.ph-app:has-text("Messages")');
    const rows = await page.$$eval('.msg-row', r => r.map(e => e.textContent));
    assert.strictEqual(rows.length, 3);
    assert.ok(rows.some(t => /Sam/.test(t) && /Say hi/.test(t)), rows.join('|'));
    assert.ok(rows.some(t => /The Hendersons/.test(t)), rows.join('|'));
    noErrors(errors);
  } },
  { name: 'send a text, the reply arrives on game time, unread badge clears on reading', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => phoneOpen('msg', 'sam'));
    const bat = await page.evaluate(() => S.phone);
    await page.click('.ph-btn:has-text("How’s it going?")');
    assert.strictEqual(await page.evaluate(() => S.phone), bat - 1);
    assert.match(await page.textContent('.msg-thread'), /Delivered/);
    assert.ok(await page.$('.ph-btn:has-text("On my way!"):disabled'), 'one text at a time');
    await page.evaluate(() => phoneClose());
    let th = await thread(page, 'sam');
    assert.deepStrictEqual(th.map(m => m.f), [1]);
    const pts = await page.evaluate(() => S.friends.sam.pts);
    await advance(page, 200);
    th = await thread(page, 'sam');
    assert.deepStrictEqual(th.map(m => m.f), [1, 0]);
    assert.ok(th[1].x.length > 2);
    assert.strictEqual(await page.evaluate(() => S.friends.sam.pts), pts + 1, 'social points on the reply');
    assert.strictEqual(await page.evaluate(() => msgUnread()), 1);
    assert.match(await page.textContent('button.phbtn'), /1/);
    await page.evaluate(() => phoneOpen('msg', 'sam'));
    assert.ok(await page.$('.ph-msg.them'));
    assert.strictEqual(await page.evaluate(() => msgUnread()), 0);
    noErrors(errors);
  } },
  { name: 'a text sent at night gets its reply the next morning', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { at: 1400 });
    await page.evaluate(() => { msgSend('hendersons', 'thanks', 'Thanks again!'); });
    await advance(page, 60);
    assert.strictEqual((await thread(page, 'hendersons')).length, 1, 'no reply at midnight');
    const due = await page.evaluate(() => MSG().q[0].at - (S.cur + 1) * 1440);
    assert.ok(due >= 390 && due <= 480, 'reply due ' + due);
    // next morning
    await page.evaluate(() => { S.cur++; S.t = S.cur * 1440 + 500; MSG().plan = { d: dayKey(), at: [] }; processTimed(); });
    const th = await thread(page, 'hendersons');
    assert.strictEqual(th.length, 2);
    assert.strictEqual(th[1].f, 0);
    noErrors(errors);
  } },
  { name: 'asking Sam for a ride: a yes brings the ride option to the ferry landing', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { at: 400, lvl: 3 });
    await page.evaluate(() => phoneOpen('msg', 'sam'));
    await page.evaluate(() => { const r = Math.random; Math.random = () => 0.01; try { document.querySelector('.ph-btn').click(); } finally { Math.random = r; } });
    assert.strictEqual(await page.evaluate(() => travelOpts('aiDock').some(o => o.m === 'friend')), false, 'not before Sam answers');
    await advance(page, 15);
    const th = await thread(page, 'sam');
    assert.strictEqual(th[0].x, 'Any chance of a ride to the ferry?');
    assert.strictEqual(th[1].f, 0);
    assert.ok(await page.evaluate(() => travelOpts('aiDock').some(o => o.m === 'friend' && /Ride with Sam/.test(o.l))));
    // the option is gone after 10:30 / away from home
    await page.evaluate(() => { S.t = S.cur * 1440 + 700; phoneOpen('msg', 'sam'); });
    assert.strictEqual(await page.$('.ph-btn:has-text("ride to the ferry")'), null);
    noErrors(errors);
  } },
  { name: 'Pajama Fred (good friend) names a known upcoming ferry outage', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { lvl: 2 });
    const when = await page.evaluate(() => { S.week.b = [{ start: S.t + 400, end: S.t + 700, cause: 'a test cause' }]; render(); return fmtAbs(S.t + 400); });
    await page.evaluate(() => phoneOpen('msg', 'fred'));
    await page.click('.ph-btn:has-text("Hear anything about the boat")');
    await advance(page, 120);
    const th = await thread(page, 'fred');
    assert.strictEqual(th.length, 2);
    assert.ok(th[1].x.includes(when) && th[1].x.toLowerCase().includes('a test cause'), th[1].x);
    noErrors(errors);
  } },
  { name: 'friends text first, about once a day; replying the same day is social', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page, { at: 360, friends: ['sam', 'walt', 'fred', 'hendersons', 'rusty'] });
    const n = await page.evaluate(() => {
      let n = 0;
      for (let d = 0; d < 40; d++) {
        delete MSG().plan; MSG().th = {}; S.t = S.cur * 1440 + 360; processTimed();
        for (let m = 360; m <= 1300; m += 30) { S.t = S.cur * 1440 + m; processTimed(); }
        n += Object.values(MSG().th).reduce((a, T) => a + T.m.length, 0);
        S.weekNo = (S.weekNo || 0) + 1;   // a new dayKey
      }
      return n / 40;
    });
    assert.ok(n > 0.5 && n < 1.6, 'texts per day ' + n);
    const r = await page.evaluate(() => {
      S.t = S.cur * 1440 + 600; MSG().th = {}; MSG().inc = {}; msgIncoming();
      const id = Object.keys(MSG().th)[0], before = S.friends[id].pts;
      PH().social = {}; msgSend(id, 'thanks', 'Thanks again!');
      return [id, MSG().th[id].m.length, S.friends[id].pts - before];
    });
    assert.strictEqual(r[1], 2);
    assert.strictEqual(r[2], 1, 'replying counts as keeping in touch');
    noErrors(errors);
  } },
  { name: 'an old save without the phone state loads and Messages works', only: 'index.html', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await setup(page);
    await page.evaluate(() => saveGame());
    const ok = await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('islandtime.save'));
      delete d.S.ph; d.app = '1.11.1';
      adopt(migrate(d));
      if (S.ph && S.ph.msg) return 'phone state survived';
      S.t += 30; processTimed(); phoneOpen('msg');
      if (!document.querySelector('.msg-row')) return 'no list';
      phoneGo('msg', 'sam'); msgSend('sam', 'otw', 'On my way!'); S.t += 200; processTimed(); render();
      return MSG().th.sam.m.length === 2 ? 'ok' : 'no reply';
    });
    assert.strictEqual(ok, 'ok');
    noErrors(errors);
  } },
];
