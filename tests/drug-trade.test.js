const { open, newGame, noErrors, assert } = require('./helpers');
// Stub Math.random with a fixed sequence (then 0.5), run fn, restore.
const SEQ = `window.__seq=(a)=>{const o=Math.random;let i=0;Math.random=()=>i<a.length?a[i++]:0.5;window.__restore=()=>{Math.random=o}}`;
async function setup(ctx) {
  const { page, errors } = await open(ctx); await newGame(page); await page.evaluate(SEQ); return { page, errors };
}
module.exports = [
  { name: 'drug trade: four markets at real places, hours, locations and distances', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => ({
      marina: [L.marina.side, MARKETS.marina.hours, dist('marina', 'food'), dist('lake', 'marina'), dist('marina', 'school')],
      school: [L.school.side, MARKETS.school.hours, dist('school', 'home'), dist('home', 'school')],
      ponders: [L.ponders.side, MARKETS.ponders.hours, isFinite(dist('stDock', 'ponders'))], hilltop: [L.hilltop.side, MARKETS.hilltop.hours, isFinite(dist('ponders', 'hilltop'))],
      disp: [L.dispensary.side, MARKETS.dispensary.legal, MARKETS.dispensary.goods],
      pairs: Object.keys(L).filter(a => L[a].side === 'I').every(a => Object.keys(L).filter(b => L[b].side === 'I' && b !== a).every(b => dist(a, b) > 0)),
      goods: DRUG_G.map(g => [g, GOODS[g].pen.bail > 0, GOODS[g].vol > 0, GOODS[g].w > 0]),
    }));
    assert.deepStrictEqual([r.marina[0], r.school[0], r.ponders[0], r.hilltop[0], r.disp[0]], ['I', 'I', 'M', 'M', 'M']);
    assert.ok(r.marina[2] <= 3 && r.marina[3] <= 4 && r.school[2] > 0 && r.school[2] === r.school[3]);
    assert.ok(r.school[1][0] >= 1020 && r.ponders[1][0] >= 1020 && r.hilltop[1][0] >= 1020 && r.ponders[2] && r.hilltop[2]);
    assert.ok(r.pairs, 'every island pair has a distance'); assert.deepStrictEqual(r.disp.slice(1), [true, ['weed']]);
    assert.strictEqual(r.goods.length, 5); noErrors(errors);
  } },
  { name: 'drug trade: weed is legal at the licensed shop (up to an ounce), resale is the crime', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 500; S.cur = 2; S.t = 2 * 1440 + 700; S.loc = 'dispensary'; S.cargo.weed = 0; const rep0 = S.rep, h0 = heatNow('dispensary');
      __seq([0]); trade('weed', 'buy'); __restore(); const bought = S.cargo.weed, charges = S.drugCharges, hot = heatNow('dispensary'), repAfter = S.rep;
      const html = marketView(), noSell = !/TRADE\('weed','sell'\)/.test(html), capped = /disabled/.test(html.split("TRADE('weed','buy')")[1].slice(0, 40));
      const okFerry = !contraband('walk'); S.cargo.weed = 2; const overLimit = contraband('walk'); S.cargo.weed = 1;
      S.loc = 'marina'; S.t = 2 * 1440 + 1100; const legalP = noticeP('marina', 'weed', 'sell'); const badge = /Unlicensed resale/.test(marketView());
      __seq([0, 0]); trade('weed', 'sell'); __restore();
      return { bought, charges, h0, hot, rep0, repAfter, noSell, capped, okFerry, overLimit, legalP, badge, after: S.cargo.weed, sold: S.drugCharges, kind: S.drugLast.kind };
    });
    assert.strictEqual(r.bought, 1); assert.strictEqual(r.charges, 0); assert.strictEqual(r.hot, r.h0); assert.strictEqual(r.repAfter, r.rep0);
    assert.ok(r.noSell && r.capped && r.okFerry && r.overLimit && r.badge && r.legalP > 0);
    assert.strictEqual(r.kind, 'cop'); assert.strictEqual(r.sold, 1, 'unlicensed resale that gets noticed by police is a drug charge'); noErrors(errors);
  } },
  { name: 'drug trade: heat rises with each deal, raises the odds, and cools over days', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 5000; S.cur = 2; S.t = 2 * 1440 + 1100; S.loc = 'school'; S.cargo.drugs = 0; const h0 = heatNow('school'), p0 = noticeP('school', 'pills', 'buy');
      for (let i = 0; i < 3; i++) { __seq([0.99]); trade('pills', 'buy'); __restore(); }
      const h3 = heatNow('school'), p3 = noticeP('school', 'pills', 'buy'), other = heatNow('marina');
      S.cargo.pills = 0; const pLow = noticeP('school', 'pills', 'buy'), pHigh = (S.cargo.pills = 5, noticeP('school', 'pills', 'buy')); S.cargo.pills = 0;
      S.cur = 3; S.t = 3 * 1440 + 1100; const h1d = heatNow('school'); S.cur = 5; S.t = 5 * 1440 + 1100; const h3d = heatNow('school');
      return { h0, h3, p0, p3, other, pLow, pHigh, h1d, h3d, hint: noticeHint(p3), view: /Heat here/.test(marketView()), charges: S.drugCharges };
    });
    assert.strictEqual(r.h0, 0); assert.ok(r.h3 > 2.9 && r.h3 <= 3.01); assert.ok(r.p3 > r.p0); assert.strictEqual(r.other, 0);
    assert.ok(r.pHigh > r.pLow); assert.ok(r.h1d < r.h3 * 0.75 && r.h3d < r.h3 * 0.4, 'cools over a few days'); assert.ok(r.view); assert.strictEqual(r.charges, 0);
    assert.ok(['low', 'medium', 'high'].includes(r.hint)); noErrors(errors);
  } },
  { name: 'drug trade: busy hours and daylight raise the odds (marina summer evening vs quiet schoolhouse)', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.cur = 2; S.t = 2 * 1440 + 1100; S.season = 'summer'; const busy = noticeP('marina', 'party', 'buy'); S.season = 'winter'; const dull = noticeP('marina', 'party', 'buy');
      const school = noticeP('school', 'party', 'buy'); S.season = 'summer'; S.t = 2 * 1440 + 700; const day = noticeP('marina', 'party', 'buy'); S.t = 2 * 1440 + 1300; const dark = noticeP('marina', 'party', 'buy');
      return { busy, dull, school, day, dark, hard: noticeP('marina', 'hard', 'buy') > noticeP('marina', 'party', 'buy') };
    });
    assert.ok(r.busy > r.dull && r.busy > r.school && r.day > r.dark && r.hard); noErrors(errors);
  } },
  { name: 'drug trade: a deal nobody notices costs no reputation, only heat', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 2000; S.cur = 2; S.t = 2 * 1440 + 1100; S.loc = 'school'; const rep = S.rep, npcRep = Object.values(NPC()).map(x => x.rep).join(), m = S.money;
      __seq([0.99]); trade('hard', 'buy'); __restore(); const out = { rep: S.rep - rep, same: Object.values(NPC()).map(x => x.rep).join() === npcRep, drugs: S.cargo.hard, kind: S.drugLast.kind, spent: m - S.money, charges: S.drugCharges, heat: heatNow('school') };
      return out;
    });
    assert.strictEqual(r.rep, 0); assert.ok(r.same && r.heat > 0.9 && r.spent > 0 && r.charges === 0 && r.kind === 'none');
    noErrors(errors);
  } },
  { name: 'drug trade: police notice arrests the player AND the island counterpart with the same penalty', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 3000; S.cur = 2; S.t = 2 * 1440 + 1100; S.loc = 'school'; const t0 = S.t, m0 = S.money, dk = dayKey();
      __seq([0, 0]); trade('hard', 'buy'); __restore(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const cp = S.drugLast.cp, pen = GOODS.hard.pen;
      return { kind: S.drugLast.kind, cp, jail: cp && npcGet(cp).jailUntil - dk, pen, charges: S.drugCharges, bail: m0 - S.money, hours: (S.t - t0 - 15) / 60, hard: S.cargo.hard, npcRep: cp && npcGet(cp).rep < 0 || cp && npcGet(cp).known[0].n === -35, jailed: cp && npcJailed(cp) };
    });
    assert.strictEqual(r.kind, 'cop'); assert.ok(r.cp && r.cp !== 'dale' && r.jailed); assert.strictEqual(r.charges, 1);
    assert.strictEqual(r.jail, r.pen.days); assert.ok(r.bail >= r.pen.bail && r.bail <= r.pen.bail + 1000);
    assert.ok(r.hours >= r.pen.hrs, 'the hours in custody are lost'); assert.strictEqual(r.hard, 0); noErrors(errors);
  } },
  { name: 'drug trade: resident notice costs only the two in the deal 15 reputation each', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 3000; S.cur = 2; S.t = 2 * 1440 + 1100; S.loc = 'marina'; S.rep = 10; S.cargo.party = 0; const all0 = {}; Object.values(NPC()).forEach(x => all0[x.id] = x.rep);
      // roll 0 notices; second roll 0.5 -> past the cop band (0.25), inside the resident band (0.25..0.9)
      __seq([0, 0.5, 0.1]); trade('party', 'buy'); __restore();
      const cp = S.drugLast.cp, others = Object.values(NPC()).filter(x => x.id !== cp && x.rep !== all0[x.id]).length;
      return { kind: S.drugLast.kind, cp, rep: S.rep, d: npcGet(cp).rep - all0[cp], others, charges: S.drugCharges, jailed: npcJailed(cp), post: S.drugLast.post, gossip: (S.npcg || []).some(g => g.id === cp), t: S.money };
    });
    assert.strictEqual(r.kind, 'res'); assert.strictEqual(r.rep, -5); assert.ok(r.d === -15 || r.d === 0 || r.d < 0 && r.d >= -15); assert.strictEqual(r.others, 0);
    assert.strictEqual(r.charges, 0); assert.ok(!r.jailed); assert.ok(r.post && r.gossip, 'the witness posted in the Island Group'); noErrors(errors);
  } },
  { name: 'drug trade: mainland police arrest the player only; a mainland stranger changes nothing', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 3000; S.cur = 2; S.t = 2 * 1440 + 1200; S.loc = 'hilltop'; const npc0 = JSON.stringify(Object.values(NPC()).map(x => [x.rep, x.jailUntil]));
      __seq([0, 0.99]); trade('drugs', 'buy'); __restore(); const stranger = { kind: S.drugLast.kind, charges: S.drugCharges, rep: S.rep, npc: JSON.stringify(Object.values(NPC()).map(x => [x.rep, x.jailUntil])) === npc0 };
      S.loc = 'ponders'; S.t = 2 * 1440 + 1200; const rep = S.rep; __seq([0, 0.1]); trade('party', 'buy'); __restore(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      return { stranger, kind: S.drugLast.kind, cp: S.drugLast.cp, charges: S.drugCharges, npc: JSON.stringify(Object.values(NPC()).map(x => [x.rep, x.jailUntil])) === npc0, repDrop: S.rep - rep };
    });
    assert.deepStrictEqual(r.stranger, { kind: 'str', charges: 0, rep: r.stranger.rep, npc: true }); assert.strictEqual(r.kind, 'cop'); assert.strictEqual(r.cp, null);
    assert.strictEqual(r.charges, 1); assert.ok(r.npc, 'no island record is touched'); noErrors(errors);
  } },
  { name: 'drug trade: Dale arrested means his place is closed; a deal at Dale’s can jail him', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      S.money = 3000; S.cur = 2; S.t = 2 * 1440 + 600; S.loc = 'dale'; const open0 = /Buy <b>/.test(marketView()) && !/No trading here/.test(marketView());
      __seq([0, 0]); trade('drugs', 'buy'); __restore(); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      const cp = S.drugLast.cp, jailed = npcJailed('dale'), v = marketView();
      return { open0, cp, jailed, closed: /No trading here/.test(v), kind: S.drugLast.kind, charges: S.drugCharges };
    });
    assert.ok(r.open0); assert.strictEqual(r.cp, 'dale'); assert.ok(r.jailed && r.closed); assert.strictEqual(r.kind, 'cop'); assert.strictEqual(r.charges, 1); noErrors(errors);
  } },
  { name: 'drug trade: the ferry K-9 check and gas-can rules still apply to every illicit good', fn: async ctx => {
    const { page, errors } = await setup(ctx);
    const r = await page.evaluate(() => {
      const base = () => { S.cargo = { food: 0, med: 0, gas: 0, diesel: 0, drugs: 0, party: 0, pills: 0, hard: 0, weed: 0 } };
      base(); const none = contraband('walk'); const res = {};
      for (const g of ['drugs', 'party', 'pills', 'hard']) { base(); S.cargo[g] = 1; res[g] = contraband('walk'); }
      base(); S.cargo.weed = 1; const weed1 = contraband('walk'); S.cargo.weed = 2; const weed2 = contraband('walk'); base(); S.cargo.gas = 1; const gas = contraband('walk');
      base(); S.cargo.party = 2; S.cargo.weed = 1; S.money = 2000; const ch0 = S.drugCharges;
      const orig = Math.random; Math.random = () => 0; MQ = []; arrest('at the ferry', true); Math.random = orig; MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
      return { none, res, weed1, weed2, gas, ch: S.drugCharges - ch0, left: DRUG_G.reduce((a, g) => a + S.cargo[g], 0), money: S.money };
    });
    assert.strictEqual(r.none, false); assert.deepStrictEqual(Object.values(r.res), [true, true, true, true]); assert.strictEqual(r.weed1, false);
    assert.ok(r.weed2 && r.gas); assert.strictEqual(r.ch, 1); assert.strictEqual(r.left, 0); assert.strictEqual(r.money, 2000 - 750); noErrors(errors);
  } },
];
