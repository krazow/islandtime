const { open, newGame, noErrors, assert } = require('./helpers');

// tests run with tips off; these turn them on (as for a new profile) before starting a game
async function tutGame(page, season) {
  await page.evaluate(sea => {
    setPref('tips', true);
    newGame('normal', 'week', sea); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
    tab = 'act'; render();
  }, season || 'fall');
}
// put the player somewhere at a time (minutes after midnight) on a day, and re-render
const at = (page, loc, m, d) => page.evaluate(([loc, m, d]) => {
  if (d != null) S.cur = d; S.loc = loc; S.t = S.cur * 1440 + m;
  S.cars.find(x => x.id === 'isl').loc = loc;   // the car comes along
  tab = 'act'; render();
}, [loc, m, d]);
const tip = page => page.evaluate(() => { const t = document.querySelector('#app .tip'); return t ? t.textContent : null; });
const tipId = page => page.evaluate(() => { const b = document.querySelector('#app .tip button'); const m = b && /tipSeen\('([^']+)'\)/.exec(b.getAttribute('onclick')); return m ? m[1] : null; });
async function gotIt(page) { await page.click('#app .tip button:has-text("Got it")'); }
// mark everything except the given ids as seen
const only = (page, ids) => page.evaluate(ids => { S.tips = { seen: TIPS.map(t => t.id).filter(id => !ids.includes(id)) }; render(); }, ids);

module.exports = [
  { name: 'guided week: Monday tips appear in order at the right places, once each', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await tutGame(page);
    // 5:30 AM at home: the welcome
    assert.strictEqual(await tipId(page), 'goal');
    const t0 = await tip(page);
    assert.match(t0, /Guided week · Monday/); assert.match(t0, /Ferry Landing/); assert.match(t0, /9:00 AM/);
    assert.ok(!t0.includes("'"), 'curly apostrophes only');
    // Next up hides while a tip shows
    assert.strictEqual(await page.$('#app .nextup'), null);
    await gotIt(page);
    // the next step waits for the clock: Next up gets its turn
    assert.strictEqual(await tip(page), null);
    assert.ok(await page.$('#app .nextup'), 'Next up back after Got it');
    // the landing
    await at(page, 'aiDock', 7 * 60 + 10);
    assert.strictEqual(await tipId(page), 'dock'); assert.match(await tip(page), /20 minutes before/); assert.match(await tip(page), /7:35/);
    await gotIt(page);
    await at(page, 'stDock', 8 * 60 + 15);
    assert.strictEqual(await tipId(page), 'mainland'); await gotIt(page);
    await at(page, 'work', 8 * 60 + 40);
    assert.strictEqual(await tipId(page), 'work'); await gotIt(page);
    // after the shift, on the mainland: groceries, then gas, then getting home
    await page.evaluate(() => { S.worked[0] = true; S.pantry = 2; S.carried = 0; });
    await at(page, 'market', 17 * 60 + 10);
    assert.strictEqual(await tipId(page), 'groceries'); assert.match(await tip(page), /Supermarket/); await gotIt(page);
    await page.evaluate(() => { S.cars.find(x => x.id === 'isl').fuel = 2; });
    await at(page, 'gas', 17 * 60 + 40);
    assert.strictEqual(await tipId(page), 'fuel'); assert.match(await tip(page), /no gas on the island/); await gotIt(page);
    await at(page, 'stDock', 18 * 60);
    assert.strictEqual(await tipId(page), 'gohome'); await gotIt(page);
    await at(page, 'home', 19 * 60 + 30);
    assert.strictEqual(await tipId(page), 'bed'); assert.match(await tip(page), /alarms/); await gotIt(page);
    // once each: revisiting the same places shows nothing new from Monday
    await at(page, 'aiDock', 20 * 60); assert.strictEqual(await tip(page), null);
    await at(page, 'stDock', 20 * 60 + 30); assert.strictEqual(await tip(page), null);
    assert.deepStrictEqual(await page.evaluate(() => S.tips.seen), ['goal', 'dock', 'mainland', 'work', 'groceries', 'fuel', 'gohome', 'bed']);
    // trading is locked on Monday, as before
    assert.ok(await page.evaluate(() => tradingLocked()));
    noErrors(errors);
  } },
  { name: 'guided week: Tuesday phone tip, friends, trading unlocks', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await tutGame(page);
    await page.evaluate(() => { S.tips.seen = ['goal', 'dock', 'mainland', 'work', 'groceries', 'fuel', 'gohome', 'bed']; S.week.storm = null; });
    await at(page, 'home', 5 * 60 + 40, 1);
    assert.strictEqual(await tipId(page), 'phone_apps');
    const t = await tip(page);
    assert.match(t, /Guided week · Tuesday/); assert.match(t, /5 slots/); assert.match(t, /ferry, money or groceries/);
    await gotIt(page);
    await page.evaluate(() => { S.friends.sam = { name: 'Sam, your neighbor', lvl: 1, day: 0, how: 'test' }; });
    await at(page, 'home', 5 * 60 + 45);
    assert.strictEqual(await tipId(page), 'friends'); assert.match(await tip(page), /Text them/); await gotIt(page);
    assert.ok(!(await page.evaluate(() => tradingLocked())), 'trading unlocked on Tuesday');
    await at(page, 'store', 6 * 60);
    assert.strictEqual(await tipId(page), 'trading');
    noErrors(errors);
  } },
  { name: 'guided week: Wednesday bingo, Thursday doctor tip', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await tutGame(page);
    await only(page, ['bingo', 'doctor', 'rx']);
    await at(page, 'home', 15 * 60, 2);
    assert.strictEqual(await tipId(page), 'bingo'); assert.match(await tip(page), /Bingo at the Riv/); assert.match(await tip(page), /Wednesday/);
    await gotIt(page);
    await at(page, 'home', 6 * 60, 3);
    assert.strictEqual(await tipId(page), 'doctor');
    const t = await tip(page);
    assert.match(t, /Guided week · Thursday/); assert.match(t, /2:30 PM/); assert.match(t, /Medical Clinic/);
    await gotIt(page);
    await at(page, 'pharmacy', 17 * 60);
    assert.strictEqual(await tipId(page), 'rx');
    noErrors(errors);
  } },
  { name: 'guided week: weekend house tips; Gus and a day off', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await tutGame(page);
    await only(page, ['home_meter', 'bills', 'gus', 'dayoff']);
    await at(page, 'home', 8 * 60, 5);
    assert.strictEqual(await tipId(page), 'home_meter');
    const t = await tip(page);
    assert.match(t, /Guided week · Friday/); assert.match(t, /Home/); assert.match(t, /Inside the house/); assert.match(t, /Outside & property/);
    for (const id of ['bills', 'gus', 'dayoff']) {
      await gotIt(page); await page.evaluate(() => { S.t += 5; render(); });
      assert.strictEqual(await tipId(page), id);
    }
    assert.match(await tip(page), /day off/);
    noErrors(errors);
  } },
  { name: 'guided week: winter tips (ramp ice, drip the faucets); summer tourists', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await tutGame(page, 'winter');
    assert.match(await tip(page), /Ice on the ramp/);
    await only(page, ['winter_drip']);
    await at(page, 'home', 18 * 60 + 30, 0);
    assert.strictEqual(await tipId(page), 'winter_drip'); assert.match(await tip(page), /drip the faucets/);
    // fall never shows it
    await tutGame(page, 'fall');
    await only(page, ['winter_drip']);
    await at(page, 'home', 18 * 60 + 30, 0);
    assert.strictEqual(await tip(page), null);
    await tutGame(page, 'summer');
    await at(page, 'aiDock', 7 * 60, 0);
    await page.evaluate(() => { S.tips.seen = ['goal']; render(); });
    assert.match(await tip(page), /tourists with kayaks/);
    noErrors(errors);
  } },
  { name: 'guided week: tips off shows nothing; replay resets progress', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);   // helper prefs: tips off
    assert.strictEqual(await tip(page), null);
    for (const [loc, m, d] of [['aiDock', 420, 0], ['home', 360, 1], ['home', 360, 3], ['home', 600, 5]]) { await at(page, loc, m, d); assert.strictEqual(await tip(page), null); }
    // turning tips off from the tip box
    await tutGame(page);
    assert.ok(await tip(page));
    await page.click('#app .tip button:has-text("Turn off tips")');
    assert.strictEqual(await tip(page), null);
    assert.strictEqual(await page.evaluate(() => prefs().tips), false);
    // replay from settings: progress reset, tips back on
    await page.evaluate(() => { S.tips.seen = TIPS.map(t => t.id); S.cur = 0; S.t = 330; S.loc = 'home'; render(); });
    await page.click('.hud button[aria-label="Settings"]');
    await page.click('#mbg button:has-text("Replay the guided week")');
    assert.deepStrictEqual(await page.evaluate(() => S.tips.seen), []);
    assert.strictEqual(await page.evaluate(() => prefs().tips), true);
    assert.strictEqual(await tipId(page), 'goal');
    assert.strictEqual(await page.$('#app .nextup'), null, 'Next up hidden while the tip shows');
    noErrors(errors);
  } },
  { name: 'feedback: opens from settings; link has type, version, season; name opt-in; capped', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.evaluate(() => { newGame('hard', 'week', 'winter'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
    await page.click('.hud button[aria-label="Settings"]');
    await page.click('#mbg button:has-text("Send feedback")');
    await page.waitForSelector('#fbLink');
    assert.strictEqual(await page.getAttribute('#fbLink', 'target'), '_blank');
    await page.check('input[name=fbType][value=unfair]');
    await page.fill('#fbText', 'The 7:45 left without me & I was “in line”');
    const href = await page.getAttribute('#fbLink', 'href');
    assert.ok(href.startsWith('https://github.com/krazow/islandtime/issues/new?title='));
    const u = new URL(href), title = u.searchParams.get('title'), body = u.searchParams.get('body');
    assert.match(title, /^\[Something felt unfair\] The 7:45 left without me & I was “in line”/);
    assert.ok(body.includes('Version: ' + await page.evaluate(() => APP_VERSION)));
    assert.match(body, /Season: winter/); assert.match(body, /Difficulty: hard/); assert.match(body, /Mode: week/);
    assert.match(body, /When: Monday/); assert.match(body, /Location: Home/); assert.match(body, /Friends: 0/); assert.match(body, /Phone apps: none/);
    assert.ok(href.includes(encodeURIComponent('Season: winter')), 'encoded');
    assert.ok(!/Player name/.test(body), 'name excluded by default');
    assert.ok(!(await page.inputValue('#fbReport')).includes('Player name'));
    await page.evaluate(() => { S.name = 'Zelda Q'; });
    await page.check('#fbName');
    const b2 = new URL(await page.getAttribute('#fbLink', 'href')).searchParams.get('body');
    assert.match(b2, /Player name: Zelda Q/);
    assert.match(await page.inputValue('#fbReport'), /Player name: Zelda Q/);
    // a huge report is capped (emoji included: never split, never throws)
    await page.evaluate(() => { const t = document.getElementById('fbText'); t.removeAttribute('maxlength'); });
    await page.fill('#fbText', '🌊 ferry '.repeat(700));
    const long = await page.getAttribute('#fbLink', 'href');
    assert.ok(long.length <= 6000, 'capped: ' + long.length);
    const lb = new URL(long).searchParams.get('body');
    assert.match(lb, /truncated/); assert.match(lb, /Season: winter/);
    noErrors(errors);
  } },
  { name: 'feedback: end screen link; Copy report uses the clipboard, else selects the text', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { S.cur = 6; S.t = 6 * 1440 + 1300; finish(); });
    await page.waitForSelector('#fbEnd');
    await page.click('#fbEnd');
    await page.waitForSelector('#fbReport');
    assert.match(await page.inputValue('#fbReport'), /game over/);
    // clipboard API available
    await page.evaluate(() => { window.__clip = null; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: t => { window.__clip = t; return Promise.resolve(); } } }); });
    await page.fill('#fbText', 'Bingo was rigged');
    await page.click('#mbg .fb-copy');
    await page.waitForFunction(() => /Copied/.test(document.getElementById('fbMsg').textContent));
    const clip = await page.evaluate(() => window.__clip);
    assert.match(clip, /^\[Bug\] Bingo was rigged/); assert.match(clip, /Version: /);
    // no clipboard API: the readonly box is selected for a manual copy
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); document.execCommand = () => false; });
    await page.click('#mbg .fb-copy');
    const sel = await page.evaluate(() => { const r = document.getElementById('fbReport'); return { focus: document.activeElement === r, all: r.selectionStart === 0 && r.selectionEnd === r.value.length && r.value.length > 50, ro: r.readOnly, msg: document.getElementById('fbMsg').textContent }; });
    assert.ok(sel.focus && sel.all && sel.ro, JSON.stringify(sel)); assert.match(sel.msg, /Ctrl\+C/);
    // a rejected clipboard write also falls back
    await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }); document.getElementById('fbMsg').textContent = ''; });
    await page.click('#mbg .fb-copy');
    await page.waitForFunction(() => /Ctrl\+C/.test(document.getElementById('fbMsg').textContent));
    noErrors(errors);
  } },
];
