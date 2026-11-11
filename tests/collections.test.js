// 📒 collections across games (src/js/62-63): photo album, crossing log, island bingo
const { open, newGame, reload, noErrors, assert } = require('./helpers');
const clear = page => page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
const KEY = 'islandtime.collections';

module.exports = [
  { name: 'collections: a title-screen button and a Settings row open the three collections', fn: async ctx => {
    const { page, errors } = await open(ctx);
    assert.ok(await page.$('#colBtn'), 'title button');
    await page.click('#colBtn');
    let t = await page.textContent('#mbg');
    assert.match(t, /Photo album \(0\)/); assert.match(t, /Crossing log \(0\)/); assert.match(t, /Island bingo \(0\/25\)/);
    await page.evaluate(() => { MBTN(2) });
    t = await page.textContent('#mbg'); assert.match(t, /Island bingo \(0\/25\)/);
    const cells = await page.$$eval('.colsq', els => els.length); assert.strictEqual(cells, 25);
    // 390px phone: the card fits the window
    const fit = await page.evaluate(() => { const g = document.querySelector('.colbg'), m = document.querySelector('.modal'); const r = g.getBoundingClientRect(); return { w: r.width, ok: g.scrollWidth <= g.clientWidth + 1 && m.scrollWidth <= m.clientWidth + 1, cell: document.querySelector('.colsq').getBoundingClientRect().width } });
    assert.ok(fit.ok && fit.cell >= 50, JSON.stringify(fit));
    await clear(page);
    await page.click('.tgear'); t = await page.textContent('#mbg'); assert.match(t, /Collections \(0 photos · 0 rides · 0\/25\)/);
    await page.evaluate(() => { const i = MB.findIndex(b => /Collections/.test(b.l)); MBTN(i) });
    assert.match(await page.textContent('#mbg'), /Back to settings/);
    await page.evaluate(() => { MBTN(MB.length - 1) });
    assert.match(await page.textContent('#mbg'), /Settings/);
    noErrors(errors);
  } },
  { name: 'collections: the photo album keeps moments and visitor sight photos across games and reloads', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    await page.evaluate(() => { S.season = 'summer'; S.cur = 1; S.t = 1440 + 600; S.mom = {}; const e = EV.find(x => x.id === 'mo_orcas'); e.run({ hook: 'arrive', at: 'aiDock', from: 'ferry' }); MBTN(0); });
    await clear(page);
    let a = await page.evaluate(() => colPhotos().map(p => p.t + '|' + p.src + '|' + p.sea));
    assert.deepStrictEqual(a, ['Orcas off the ferry|moment|summer']);
    await page.evaluate(() => { visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.loc = 'lake'; S.t = S.cur * 1440 + 600; vPhoto(VSIGHTS.find(s => s.id === 'lake')); MQ = []; });
    a = await page.evaluate(() => colPhotos().map(p => p.t + '|' + p.src)); assert.strictEqual(a.length, 2); assert.match(a[1], /Lake Josephine\|sight/);
    await reload(page); await newGame(page);
    a = await page.evaluate(() => ({ n: colPhotos().length, raw: JSON.parse(localStorage.getItem('islandtime.collections')).photos.length, save: JSON.stringify(packSave()).includes('Orcas off') }));
    assert.deepStrictEqual(a, { n: 2, raw: 2, save: false }, 'kept across a reload, not part of the save');
    await page.click('.tgear').catch(() => {}); await clear(page);
    await page.evaluate(() => colAlbum(null)); const t = await page.textContent('#mbg'); assert.match(t, /Photo album \(2\)/); assert.match(t, /Orcas off the ferry/); assert.match(t, /Lake Josephine/);
    noErrors(errors);
  } },
  { name: 'collections: the crossing log counts ferry rides, the best day, milestones and survives new games', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const o = {}; S.cur = 1; S.t = 1440 + 800; for (let i = 0; i < 3; i++) { S.loc = i % 2 ? 'stDock' : 'aiDock'; fireHook('arrive', { at: S.loc, from: 'ferry' }) }
      o.n = colGet().cross.n; o.first = !!colGet().cross.first; o.best = colGet().cross.best; o.sq = !!colGet().bingo.first_ride;
      S.cur = 2; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); o.best2 = colGet().cross.best; o.n2 = colGet().cross.n;
      fireHook('arrive', { at: 'aiDock', from: 'home' }); o.nonFerry = colGet().cross.n;
      for (let i = 0; i < 6; i++) fireHook('arrive', { at: 'aiDock', from: 'ferry' }); o.ten = colGet().cross.ms.slice(); o.sq10 = !!colGet().bingo.rides_10;
      newGame('normal', 'week'); MQ = []; o.after = colGet().cross.n;
      return o;
    });
    assert.deepStrictEqual([r.n, r.first, r.best, r.sq], [3, true, 3, true]); assert.strictEqual(r.best2, 3); assert.strictEqual(r.n2, 4); assert.strictEqual(r.nonFerry, 4);
    assert.deepStrictEqual(r.ten, [10]); assert.ok(r.sq10); assert.strictEqual(r.after, 10);
    // 100 rides
    const h = await page.evaluate(() => { for (let i = 0; i < 90; i++) fireHook('arrive', { at: 'aiDock', from: 'ferry' }); return { ms: colGet().cross.ms, n: colGet().cross.n, sq: !!colGet().bingo.rides_100 } });
    assert.deepStrictEqual(h.ms, [10, 25, 50, 100]); assert.strictEqual(h.n, 100); assert.ok(h.sq);
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); colCrossLog(null) });
    const t = await page.textContent('#mbg'); assert.match(t, /Ferry rides100/); assert.match(t, /Most in one day/); assert.match(t, /💯 100/);
    noErrors(errors);
  } },
  { name: 'collections: the island bingo card fills in across games, finds lines, and ignores junk storage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(k => localStorage.setItem(k, '{not json'), KEY); await reload(page);
    await newGame(page);
    const r = await page.evaluate(() => {
      const o = {}; o.sq = COL_SQUARES.length; o.ids = new Set(COL_SQUARES.map(s => s.id)).size;
      o.start = colStats();
      // game 1: two story friends, orcas, a storm night, the last boat, an outage
      meet('walt', 'Walt', 'x'); meet('sam', 'Sam', 'x'); o.five1 = !!colGet().bingo.five_friends;
      S.cur = 1; S.t = 1440 + 800; S.season = 'summer'; S.mom = {}; S.loc = 'aiDock'; EV.forEach(e => { if (e.id !== 'mo_orcas') S.ev.count[e.id] = 99 }); chain('mo_orcas');
      { const R = Math.random; Math.random = () => 0; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); Math.random = R } MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      S.cur = 2; S.t = 2 * 1440 + 1370; fireHook('arrive', { at: 'aiDock', from: 'ferry' }); o.last = !!colGet().bingo.last_boat;
      S.week.storm = { day: 2, start: 2 * 1440 + 900, end: 2 * 1440 + 1900 }; fireHook('night', { where: 'home', notes: [] }); o.storm = !!colGet().bingo.storm;
      S.power = { start: S.t - 5, end: S.t + 300 }; afterAction(); MQ = []; o.outage = !!colGet().bingo.outage;
      // game 2: the rest of the five
      newGame('normal', 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      o.five2 = !!colGet().bingo.five_friends; meet('bev', 'Bev', 'x'); meet('rusty', 'Rusty', 'x'); meet('hendersons', 'The Hendersons', 'x'); o.five3 = !!colGet().bingo.five_friends; o.met = Object.keys(colGet().met).length;
      // a row: orcas, eagles, fawn, sea_lion, rainier
      ['eagles', 'fawn', 'sea_lion', 'rainier'].forEach(i => colBingoMark(i)); o.lines = colLines().length;
      colBingoMark('eagles'); o.dup = colStats().squares;
      S.ev.history.push({ id: 'eagle', t: 0 }); return o;
    });
    assert.strictEqual(r.sq, 25); assert.strictEqual(r.ids, 25); assert.strictEqual(r.start.squares, 0);
    assert.ok(!r.five1 && r.last && r.storm && r.outage && !r.five2 && r.five3 && r.met === 5);
    assert.strictEqual(r.lines, 1);
    // the sightings that came from real events
    const s = await page.evaluate(() => { const c = colGet().bingo; return ['orcas', 'first_ride', 'last_boat', 'storm', 'outage', 'five_friends', 'eagles', 'fawn', 'sea_lion', 'rainier'].every(k => c[k]) });
    assert.ok(s);
    await reload(page);
    await page.click('#colBtn'); assert.match(await page.textContent('#mbg'), /Island bingo \((1\d)\/25\)/);
    noErrors(errors);
  } },
  { name: 'collections: story endings, bingo night and the Riv fill squares; the 23 achievements are untouched', fn: async ctx => {
    const { page, errors } = await open(ctx); await newGame(page);
    const r = await page.evaluate(() => {
      const o = { ach: ACH.length }; S.money = 500; S.pantry = 5; S.cur = 1; S.t = 1440 + 700;
      meet('rusty', 'Rusty', 'x'); S.friends.rusty.day = 0; S.friends.rusty.lvl = 3; S.friends.rusty.pts = 9;
      for (let i = 0; i < 4; i++) { S.weekNo = i * 2; S.cur = 2; S.t = 2 * 1440 + 600; fstRun('rusty'); MBTN(0); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()) }
      o.story = !!colGet().bingo.story_done; o.close = !!colGet().bingo.close_friend;
      S.bingo.nights = 1; S.bingo.won = 20; S.loc = 'food'; S.ateOut = day(); afterAction(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      o.bingo = !!colGet().bingo.bingo_attend && !!colGet().bingo.bingo_win; o.riv = !!colGet().bingo.riv_dinner;
      visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.loc = 'farm'; S.t = S.cur * 1440 + 840; afterAction(); MQ = []; o.farm = !!colGet().bingo.farm; o.achIds = ACH.map(a => a.id).join(',').includes('collection');
      return o;
    });
    assert.strictEqual(r.ach, 23); assert.ok(r.story && r.close && r.bingo && r.riv && r.farm && !r.achIds);
    noErrors(errors);
  } },
];
