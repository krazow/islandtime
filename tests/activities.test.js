const { open, noErrors, assert } = require('./helpers');

const game = (page, season = 'fall', mode = 'week') => page.evaluate(([s, m]) => {
  newGame('normal', m, s); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render();
}, [season, mode]);
// press the modal button whose label matches
const press = (page, re) => page.evaluate(src => { const r = new RegExp(src); const i = MB.findIndex(b => r.test(b.l)); if (i < 0) throw new Error('no button ' + src + ' in ' + MB.map(b => b.l).join(' | ')); MBTN(i); }, re.source);
const modalTitle = page => page.evaluate(() => { const h = document.querySelector('#mbg h2'); return h ? h.textContent : ''; });
// make Math.random return a queue of values, then 0.5
const rnd = (page, vals) => page.evaluate(v => { const q = v.slice(); Math.random = () => q.length ? q.shift() : 0.5; }, vals);

module.exports = [
  { name: 'activities: fishing needs a license, bought once for $20', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.loc = 'marina'; S.cur = 1; S.t = 1440 + 600; S.money = 100;
      const fish = () => actions().find(a => /Go fishing/.test(a.l));
      const out = { before: fish().dis, hasBuy: actions().some(a => /fishing license/.test(a.l)) };
      actions().find(a => /fishing license/.test(a.l)).fn();
      out.paid = 100 - S.money; out.lic = TX().lic; out.after = fish().dis; out.buyGone = !actions().some(a => /Buy a Washington/.test(a.l));
      return out;
    });
    assert.strictEqual(r.before, true); assert.ok(r.hasBuy); assert.strictEqual(r.paid, 20); assert.strictEqual(r.lic, 1);
    assert.strictEqual(r.after, false); assert.ok(r.buyGone);
    noErrors(errors);
  } },
  { name: 'activities: a salmon in season can be eaten (food) or given to a friend', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'fall');
    await page.evaluate(() => { S.loc = 'marina'; S.cur = 1; S.t = 1440 + 600; S.money = 100; S.pantry = 2; S.stress = 60; TX().lic = 1; fishOpen(); });
    await rnd(page, [0.1, 0.1, 0.95]);
    await press(page, /Settle in/);
    await press(page, /Set the hook/);
    assert.match(await modalTitle(page), /landed .*coho/);
    const t0 = await page.evaluate(() => S.t);
    await press(page, /Cook it tonight/);
    const r = await page.evaluate(() => ({ pantry: S.pantry, stress: S.stress, t: S.t, fish: TX().got.fish, money: S.money }));
    assert.strictEqual(r.pantry, 5); assert.ok(r.stress < 60); assert.strictEqual(r.fish, 1); assert.strictEqual(r.money, 96);
    // again, and give it to a friend
    await page.evaluate(() => { S.friends.walt = { name: 'Walt from the American Legion', how: 'x', day: 0, lvl: 1, pts: 0 }; fishOpen(); });
    await rnd(page, [0.1, 0.1, 0.95]);
    await press(page, /Settle in/); await press(page, /Set the hook/);
    const lab = await page.evaluate(() => MB.map(b => b.l));
    assert.ok(lab.some(l => /Give it to Walt/.test(l)), lab.join('|'));
    await press(page, /Give it to Walt/);
    const g = await page.evaluate(() => ({ pantry: S.pantry, pts: S.friends.walt.pts }));
    assert.strictEqual(g.pantry, 5); assert.ok(g.pts >= 3);
    noErrors(errors);
  } },
  { name: 'activities: a rockfish must go back; keeping one is a bad act that may be ticketed', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'spring');
    await page.evaluate(() => { S.loc = 'marina'; S.cur = 1; S.t = 1440 + 600; S.money = 300; S.rep = 0; TX().lic = 1; fishOpen(); });
    await rnd(page, [0.1, 0.1, 0.01]);
    await press(page, /Settle in/); await press(page, /Set the hook/);
    assert.match(await modalTitle(page), /rockfish/i);
    await rnd(page, [0.05]);
    const m0 = await page.evaluate(() => S.money);
    await press(page, /Keep it for dinner/);
    const r = await page.evaluate(() => ({ d: S.money, rep: S.rep, fines: TX().got.fines }));
    assert.strictEqual(r.d, m0 - 150); assert.ok(r.rep < 0); assert.strictEqual(r.fines, 1);
    // released: nothing bad
    await page.evaluate(() => { S.rep = 0; fishOpen(); });
    await rnd(page, [0.1, 0.1, 0.01]);
    await press(page, /Settle in/); await press(page, /Set the hook/);
    await press(page, /Release it/);
    assert.strictEqual(await page.evaluate(() => S.rep), 0);
    noErrors(errors);
  } },
  { name: 'activities: no fishing at night or past three sessions a day', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.loc = 'marina'; S.cur = 1; TX().lic = 1; S.t = 1440 + 1200; const night = actions().find(a => /Go fishing/.test(a.l)).dis;
      S.t = 1440 + 600; const day = actions().find(a => /Go fishing/.test(a.l)).dis; TX().fish = { dk: dayKey(), n: 3 };
      return { night, day, capped: actions().find(a => /Go fishing/.test(a.l)).dis };
    });
    assert.strictEqual(r.night, true); assert.strictEqual(r.day, false); assert.strictEqual(r.capped, true);
    noErrors(errors);
  } },
  { name: 'activities: crab pot in summer, set, soak, pull; legal-size and sex rules are a choice', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'summer');
    const r1 = await page.evaluate(() => {
      S.loc = 'marina'; TX().lic = 1; S.money = 400;
      const at = (d, m) => { S.cur = d; S.t = d * 1440 + m; return actions().find(a => /crab pot/i.test(a.l)); };
      return { mon: at(0, 600).dis, tue: at(1, 600).dis, thu: at(3, 600).dis, sat: at(5, 600).dis, hrs: at(3, 600).s };
    });
    assert.strictEqual(r1.mon, true, 'June 29: before the season'); assert.strictEqual(r1.tue, true, 'closed Tue/Wed'); assert.strictEqual(r1.thu, false); assert.strictEqual(r1.sat, false);
    await page.evaluate(() => { S.cur = 3; S.t = 3 * 1440 + 600; actions().find(a => /Set a crab pot/.test(a.l)).fn(); });
    await press(page, /Set the pot/);
    const r2 = await page.evaluate(() => ({ pot: !!TX().pot, money: S.money, pull: actions().find(a => /crab pot/i.test(a.l)) }));
    assert.ok(r2.pot); assert.strictEqual(r2.money, 389); assert.strictEqual(r2.pull.dis, true);
    await page.evaluate(() => { S.t += 240; });
    // a legal male is kept; a female is thrown back; an undersized kept crab may be ticketed
    await page.evaluate(() => { Math.random = () => 0.99; crabNext([{ size: 6.5, male: true }, { size: 6.75, male: false }, { size: 5.5, male: true }], 0, []); });
    assert.match(await page.evaluate(() => document.querySelector('#mbg .mb').textContent), /6\.5-inch male/);
    await press(page, /Keep the 6\.5-inch male/);
    assert.match(await page.evaluate(() => document.querySelector('#mbg .mb').textContent), /female/);
    await press(page, /Throw it back/);
    await rnd(page, [0.05]);
    const m0 = await page.evaluate(() => S.money);
    await press(page, /Keep the 5\.5-inch male|Keep the male|Keep the/);
    const r3 = await page.evaluate(() => ({ d: S.money - 0, rep: S.rep, fines: TX().got.fines, crab: TX().got.crab, title: document.querySelector('#mbg h2').textContent }));
    assert.strictEqual(r3.d, m0 - 150); assert.ok(r3.rep < 0); assert.strictEqual(r3.fines, 1);
    await page.evaluate(() => { S.pantry = 1; });
    assert.match(r3.title, /1 crab/);
    await press(page, /Boil them/);
    assert.strictEqual(await page.evaluate(() => S.pantry), 2);
    noErrors(errors);
  } },
  { name: 'activities: crab pot pull yields crabs with sizes and sexes', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'summer');
    const r = await page.evaluate(() => {
      S.loc = 'marina'; S.cur = 3; S.t = 3 * 1440 + 600; TX().lic = 1; TX().pot = { at: dayKey() * 1440 + tod() - 300 };
      Math.random = () => 0.9; crabPull();
      return { title: document.querySelector('#mbg h2').textContent, pot: TX().pot };
    });
    assert.match(r.title, /Crab 1 of/); assert.strictEqual(r.pot, null);
    noErrors(errors);
  } },
  { name: 'activities: blackberries ripen in mid-July, fill buckets, scratch, sell at the swap board', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page, 'summer', 'month');
    const r = await page.evaluate(() => {
      S.loc = 'home'; S.weekNo = 0; S.cur = 2; S.t = 2 * 1440 + 600; const early = actions().find(a => /Blackberries aren/.test(a.l));
      S.weekNo = 2; S.t = 2 * 1440 + 600; S.health = 80; S.stress = 50;
      const pick = actions().find(a => /Pick blackberries/.test(a.l));
      return { early: !!early, pick: !!pick };
    });
    assert.ok(r.early); assert.ok(r.pick);
    await page.evaluate(() => { Math.random = () => 0.3; actions().find(a => /Pick blackberries/.test(a.l)).fn(); });
    await press(page, /thicket/);
    const g = await page.evaluate(() => ({ n: berryN(), health: S.health, stress: S.stress, t: S.t }));
    assert.ok(g.n >= 1); assert.strictEqual(g.health, 79); assert.ok(g.stress < 50);
    const s = await page.evaluate(() => {
      const n = berryN(), p0 = S.pantry; S.loc = 'home'; S.t = 2 * 1440 + 900;
      TX().berry.n = 4; actions().find(a => /Make jam/.test(a.l)).fn(); const jam = { n: berryN(), pantry: S.pantry - p0 };
      S.loc = 'store'; const m0 = S.money; actions().find(a => /Sell blackberries/.test(a.l)).fn();
      return { jam, sold: S.money - m0, left: berryN() };
    });
    assert.strictEqual(s.jam.n, 2); assert.strictEqual(s.jam.pantry, 1); assert.strictEqual(s.sold, 12); assert.strictEqual(s.left, 0);
    noErrors(errors);
  } },
  { name: 'activities: visitors get a little score from fishing, and the marina stays usable', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.visitor = vsInit('weekend', 'tacoma'); S.loc = 'marina'; S.cur = 5; S.t = 5 * 1440 + 600; S.money = 300; TX().lic = 1;
      const r0 = VS().rep; fishGo(0); Math.random = () => 0.9; return { r0 };
    });
    await page.evaluate(() => { MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); });
    const r2 = await page.evaluate(() => { Math.random = () => 0.1; fishGo(0); const rep = VS().rep; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); return rep; });
    assert.ok(r2 >= 1);
    noErrors(errors);
  } },
  { name: 'activities: a bingo card at the Riv on Wednesday night, daub and win', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.loc = 'food'; S.cur = 2; S.money = 100; S.t = 2 * 1440 + 1090;
      const a = actions().find(a => /Play one card yourself/.test(a.l)); const early = (S.t = 2 * 1440 + 900, actions().some(a => /Play one card yourself/.test(a.l)));
      S.t = 2 * 1440 + 1090; S.cur = 3; const thu = actions().some(a => /Play one card yourself/.test(a.l)); S.cur = 2;
      return { has: !!a && !a.dis, early, thu };
    });
    assert.ok(r.has); assert.strictEqual(r.early, false); assert.strictEqual(r.thu, false);
    await page.evaluate(() => { actions().find(a => /Play one card yourself/.test(a.l)).fn(); });
    assert.match(await modalTitle(page), /Bingo: your card/);
    // fit on a phone: 5 columns of tappable cells inside a 400 px viewport
    const geo = await page.evaluate(() => { const m = document.querySelector('#mbg .modal').getBoundingClientRect(); const c = [...document.querySelectorAll('.bcc')].map(e => e.getBoundingClientRect());
      return { right: m.right, w: window.innerWidth, n: c.length, minH: Math.min(...c.map(x => x.height)), minW: Math.min(...c.map(x => x.width)), sw: document.querySelector('#mbg .modal').scrollWidth, cw: document.querySelector('#mbg .modal').clientWidth }; });
    assert.strictEqual(geo.n, 25); assert.ok(geo.right <= geo.w + 1); assert.ok(geo.minH >= 40 && geo.minW >= 40); assert.ok(geo.sw <= geo.cw + 1);
    // rig the draw: the top row is called first
    await page.evaluate(() => { const top = [0, 1, 2, 3, 4].map(c => BC.card[c][0]).filter(n => n); BC.order = top.concat(BC.order.filter(n => !top.includes(n))); BC.rivalAt = 99; BC.order.length; });
    await page.click('#bc-next');
    const last = await page.evaluate(() => BC.order[0]);
    // daub an uncalled number: nothing happens
    const miss = await page.evaluate(() => { const u = BC.order.find(n => !BC.called.has(n)); bcDaub(u); return BC.daub.has(u) || BC.wrong === 0; });
    assert.strictEqual(miss, false);
    // false BINGO costs three numbers
    await page.click('#bc-bingo');
    assert.strictEqual(await page.evaluate(() => [BC.idx, BC.false]).then(x => x.join()), '4,1');
    await page.evaluate(() => { while (BC.idx < 5) bcCall(); });
    for (const n of await page.evaluate(() => BC.order.slice(0, 5))) await page.evaluate(n => bcDaub(n), n);
    await page.click('#bc-bingo');
    assert.strictEqual(await page.evaluate(() => BC.over), 'win');
    const m0 = await page.evaluate(() => S.money);
    await press(page, /Leave the table/);
    const d = await page.evaluate(() => ({ money: S.money, played: TX().bingo.n, bc: BC }));
    assert.strictEqual(d.money, m0 + 20); assert.strictEqual(d.bc, null); assert.strictEqual(d.played, 1);
    noErrors(errors);
  } },
  { name: 'activities: a rival can win the bingo game first; three games a night', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await game(page);
    const r = await page.evaluate(() => {
      S.loc = 'food'; S.cur = 2; S.money = 100; S.t = 2 * 1440 + 1090; S.stress = 50;
      Math.random = () => 0.9; bcStart(); BC.rivalAt = 3; bcCall(); bcCall(); bcCall(); const over = BC.over; const dis = !!document.querySelector('#bc-next').disabled; document.querySelector('#bc-next').disabled;
      const m0 = S.money; bcFinish(); const out = { over, dis, lost: m0 === S.money, stress: S.stress };
      MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      for (let i = 0; i < 2; i++) { bcStart(); bcFinish(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); }
      out.capped = actions().find(a => /Play one card yourself/.test(a.l)).dis; return out;
    });
    assert.strictEqual(r.over, 'rival'); assert.ok(r.dis); assert.ok(r.lost); assert.ok(r.stress < 50); assert.strictEqual(r.capped, true);
    noErrors(errors);
  } },
];
