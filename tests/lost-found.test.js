// Mis-delivered packages, sorted out in the 📣 Island Group app.
const { open, newGame, noErrors, assert } = require('./helpers');
const setup = page => page.evaluate(() => {
  const l = S.loc, t = S.t; phoneInstall('group'); S.loc = 'home'; S.cur = 1; S.t = 1440 + 700; S.phone = 90; S.phoneT = S.t;
  const H = HH(); H.missing = []; H.pkgs = []; H.lf = { foreign: [], roll: dayKey(), n: 0 }; UP().trapsOwned = false; S.log = []; render();
});
const tap = async (page, text) => { await page.evaluate(() => phoneOpen('group')); await page.locator('#phoneUI button.ph-btn', { hasText: text }).click(); await page.evaluate(() => phoneClose()); };
const log = page => page.evaluate(() => S.log.map(l => l.s).join('\n'));

module.exports = [
  { name: 'lost & found: your package is missing; post in Island Group and a neighbor drops it on your porch', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    await page.evaluate(() => { hhMissing().push({ kind: 'pkg', k: 'traps', via: 'ups', at: dayKey() - 1, mode: 'quiet', who: 'Pete with the blue truck', nbAt: -1 }); render(); });
    assert.ok(await page.evaluate(() => todoItems().some(x => x.l === 'Find your mouse traps (6-pack)')));
    await page.evaluate(() => phoneOpen('group'));
    assert.match(await page.textContent('#phoneUI'), /Lost & found[\s\S]*tracking says delivered/);
    await page.evaluate(() => phoneClose());
    await tap(page, 'Missing package');
    const due = await page.evaluate(() => hhMissing()[0].due);
    assert.ok(due > 0);
    await page.evaluate(d => { S.t = d + 1; processTimed(); render(); }, due);
    assert.match(await log(page), /Pete with the blue truck replied to your post/);
    assert.deepStrictEqual(await page.evaluate(() => hhPorch().map(p => p.k)), ['traps']);
    await page.evaluate(() => actions().find(a => /^Bring in 1 package/.test(a.l)).fn());
    assert.strictEqual(await page.evaluate(() => UP().trapsOwned), true);
    assert.ok(!(await page.evaluate(() => todoItems().some(x => /^Find your/.test(x.l)))), 'to-do cleared');
    noErrors(errors);
  } },
  { name: 'lost & found: a neighbor posts that they got your package; reply and it comes back', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    await page.evaluate(() => { hhMissing().push({ kind: 'pkg', k: 'bank', via: 'fedex', at: dayKey() });});
    // force the neighbor-posts path
    await page.evaluate(() => { const x = hhMissing()[0]; x.mode = 'nb'; x.who = 'Ruth, who runs the book swap'; x.nbAt = S.t + 30; S.t += 31; processTimed(); render(); });
    assert.match(await log(page), /Ruth, who runs the book swap posted: “Got a package for/);
    assert.strictEqual(await page.evaluate(() => phoneApp('group').badge()), 1, 'badge');
    await tap(page, 'That’s mine');
    const due = await page.evaluate(() => hhMissing()[0].due);
    await page.evaluate(d => { S.t = d + 1; processTimed(); render(); }, due);
    assert.match(await log(page), /Dropped it on your porch/);
    assert.deepStrictEqual(await page.evaluate(() => hhPorch().map(p => p.k)), ['bank']);
    noErrors(errors);
  } },
  { name: 'lost & found: someone else’s package on your porch; post it and they pick it up (reputation +1)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    // the afternoon roll, forced
    const f = await page.evaluate(() => { LF().roll = -1; const r = Math.random; Math.random = () => 0.01; S.t = 1440 + 910; processTimed(); Math.random = r; render(); return LF().foreign.length; });
    assert.strictEqual(f, 1);
    assert.ok(await page.evaluate(() => actions().some(a => /^A package for .* is on your porch$/.test(a.l))));
    assert.ok(await page.evaluate(() => todoItems().some(x => /^Return .*package$/.test(x.l))));
    const rep0 = await page.evaluate(() => S.rep || 0);
    await tap(page, 'Found a package for');
    const due = await page.evaluate(() => LF().foreign[0].due);
    await page.evaluate(d => { S.t = d + 1; processTimed(); render(); }, due);
    assert.match(await log(page), /That’s mine! Thank you!!/);
    assert.strictEqual(await page.evaluate(() => LF().foreign.length), 0);
    assert.strictEqual(await page.evaluate(() => S.rep || 0), rep0 + 1);
    // no more than one roll a day, never on Sunday
    const sun = await page.evaluate(() => { S.cur = 6; S.t = 6 * 1440 + 950; LF().roll = -1; const r = Math.random; Math.random = () => 0.01; processTimed(); Math.random = r; return LF().foreign.length; });
    assert.strictEqual(sun, 0, 'no deliveries on Sunday');
    noErrors(errors);
  } },
  { name: 'lost & found: without the Island Group app, the to-do list says where to get it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await setup(page);
    await page.evaluate(() => { phoneUninstall('group'); hhMissing().push({ kind: 'pkg', k: 'part', via: 'usps', at: dayKey() - 1, mode: 'quiet', nbAt: -1 }); });
    const s = await page.evaluate(() => todoItems().find(x => /^Find your/.test(x.l)).s);
    assert.match(s, /App Store/);
    noErrors(errors);
  } },
];
