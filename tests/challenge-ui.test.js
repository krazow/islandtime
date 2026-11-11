const { open, newGame, noErrors, assert } = require('./helpers');
const { pathToFileURL } = require('url');
// Stub the seeded-week API only where it is missing (so the tests pass before and after the merge).
const STUB = () => {
  if (typeof challengeWeekId !== 'function') window.challengeWeekId = () => '2026-W46';
  if (typeof challengeStart !== 'function') window.challengeStart = () => {};
  if (typeof challengeOn !== 'function') window.challengeOn = () => !!(S && S.challenge);
  if (typeof challengeResult !== 'function') window.challengeResult = () => ({ id: S.challenge.id, score: 321, money: 45, grade: 'B', workdays: 5, stranded: 1, rep: 7 });
};
const R = (o) => Object.assign({ id: '2026-W46', name: 'Ana', score: 300, money: 50, grade: 'B', workdays: 5, stranded: 0, rep: 3 }, o);

module.exports = [
  { name: 'share code round-trips and the checksum catches typos', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const out = await page.evaluate(r => {
      const code = chEncode(r), d = chDecode(code);
      const bad = code.slice(0, 8) + (code[8] === 'A' ? 'B' : 'A') + code.slice(9);
      return { code, d, urlSafe: /^IT1-[A-Za-z0-9_-]+-[0-9a-z]{4}$/.test(code), link: chDecode('https://x/?c=' + code).ok, bad: chDecode(bad), cut: chDecode(code.slice(0, -6)), long: chDecode(chEncode(Object.assign({}, r, { name: 'x'.repeat(40) + 'é' }))) };
    }, R({ name: 'Zoë ★' }));
    assert(out.urlSafe, out.code);
    assert.deepStrictEqual(out.d.r, R({ name: 'Zoë ★' }));
    assert(out.link);
    assert(!out.bad.ok && /typo|checksum|can’t be read/.test(out.bad.err));
    assert(!out.cut.ok);
    assert.strictEqual(out.long.r.name.length, 20);
    noErrors(errors);
  } },
  { name: 'invalid codes show a friendly error in Compare scores', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => chCompare());
    await page.fill('#chin', 'hello there');
    await page.click('text=Add code');
    await page.waitForSelector('#cherr');
    assert(/Island Time challenge code/.test(await page.textContent('#cherr')));
    assert.strictEqual(await page.evaluate(() => Object.keys(chLoad().boards).length), 0);
    noErrors(errors);
  } },
  { name: '?c= deep link opens Compare with that score on the board', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const code = await page.evaluate(r => { localStorage.removeItem('islandtime.challenge'); return chEncode(r); }, R({ name: 'Bo', score: 410 }));
    await page.goto(pathToFileURL(ctx.target.file).href + '?c=' + code);
    await page.waitForSelector('.chtab');
    const t = await page.textContent('.chtab');
    assert(/Bo/.test(t) && /410/.test(t), t);
    assert(/Compare scores/.test(await page.textContent('.modal h2')));
    noErrors(errors);
  } },
  { name: 'leaderboard: add, dedupe, sort, week picker, remove', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(([a, b, c, d]) => { localStorage.removeItem('islandtime.challenge'); chAdd(a); chAdd(b); chAdd(c); chAdd(d); }, [R({ name: 'Ana', score: 300 }), R({ name: 'Bo', score: 500 }), R({ name: 'Ana', score: 300 }), R({ id: '2026-W45', name: 'Old', score: 100 })]);
    const rows = await page.evaluate(() => chBoard('2026-W46').map(e => e.name));
    assert.deepStrictEqual(rows, ['Bo', 'Ana']);
    await page.evaluate(() => chCompare('2026-W46'));
    assert.strictEqual(await page.locator('.chtab tr').count(), 3);
    assert(await page.locator('#chwk option').count() >= 2);
    await page.selectOption('#chwk', '2026-W45');
    await page.waitForSelector('.chtab');
    assert(/Old/.test(await page.textContent('.chtab')) && !/Bo/.test(await page.textContent('.chtab')));
    await page.selectOption('#chwk', '2026-W46');
    await page.waitForSelector('.chtab');
    await page.locator('.chrm').first().click();
    await page.waitForSelector('.chtab');
    assert.deepStrictEqual(await page.evaluate(() => chBoard('2026-W46').map(e => e.name)), ['Ana']);
    noErrors(errors);
  } },
  { name: 'end screen of a challenge game shows the share box and saves the result', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(STUB);
    await newGame(page);
    const id = '2026-W46';
    await page.evaluate(id => { window.challengeOn = () => !!S.challenge; window.challengeResult = () => ({ id, score: 321, money: 45, grade: 'B', workdays: 5, stranded: 1, rep: 7 }); S.challenge = { id }; localStorage.removeItem('islandtime.challenge'); finish(); }, id);
    await page.waitForSelector('#chbox');
    const code = await page.getAttribute('#chcode', 'data-code');
    const d = await page.evaluate(c => chDecode(c), code);
    assert(d.ok && d.r.score === 321 && d.r.id === id, JSON.stringify(d));
    assert(await page.locator('#chbox >> text=Copy code').count() && await page.locator('#chbox >> text=Copy link').count());
    assert.strictEqual(await page.evaluate(() => chLoad().mine['2026-W46'].score), 321);
    // a normal (non-challenge) game has no box
    await newGame(page);
    await page.evaluate(() => { S.challenge = null; finish(); });
    await page.waitForSelector('.end');
    assert.strictEqual(await page.locator('#chbox').count(), 0);
    noErrors(errors);
  } },
  { name: 'title screen has the weekly challenge button and modal', fn: async ctx => {
    const { page, errors } = await open(ctx);
    assert(/Weekly challenge · Week of/.test(await page.textContent('#chBtn')));
    await page.click('#chBtn');
    await page.waitForSelector('#mbg');
    const t = await page.textContent('.modal');
    assert(/same weather, outages and prices/.test(t) && /Compare scores/.test(t) && /Never mind/.test(t));
    await page.click('text=Never mind');
    assert.strictEqual(await page.locator('#mbg').count(), 0);
    noErrors(errors);
  } },
];
