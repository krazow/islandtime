const { open, newGame, noErrors, assert } = require('./helpers');

// 🗺️ the tappable map (src/js/50-map.js)
const mapOn = (page, on = true) => page.evaluate(v => { setPref('mapView', v); setPref('goOpen', true); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); }, on);
const pins = page => page.evaluate(() => [...document.querySelectorAll('.mpin')].map(p => p.getAttribute('aria-label')));
const overlap = page => page.evaluate(() => { const r = [...document.querySelectorAll('.mpin circle')].map(c => c.getBoundingClientRect()); let min = 1e9;
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) min = Math.min(min, Math.hypot(r[i].x - r[j].x, r[i].y - r[j].y)); return { n: r.length, min, w: document.querySelector('.mapsvg').getBoundingClientRect().width }; });

module.exports = [
  { name: 'list is the default; the Map toggle shows the island and remembers the choice', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await page.evaluate(() => { setPref('goOpen', true); render(); });
    assert.strictEqual((await page.$$('.mapsvg')).length, 0, 'no map by default');
    assert.ok(await page.$('.maptog'), 'toggle is there');
    await page.click('.maptog button:has-text("Map")');
    assert.ok(await page.$('.mapsvg'));
    assert.strictEqual(await page.evaluate(() => prefs().mapView), true);
    const p = await pins(page);
    assert.ok(p.some(x => /Lake Josephine/.test(x)) && p.some(x => /Ferry Landing/.test(x)) && p.some(x => /The Riv marina/.test(x)));
    assert.ok(!p.some(x => /Steilacoom|Lakewood/.test(x)), 'island panel only shows island places');
    assert.ok(await page.$('.golist[hidden]'), 'list hidden');
    await page.click('.maptog button:has-text("List")');
    assert.strictEqual((await page.$$('.mapsvg')).length, 0);
    noErrors(errors);
  } },
  { name: 'tapping a place shows its travel options and going there moves you', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await mapOn(page);
    await page.click('.mpin[aria-label^="Lake Josephine"]');
    const t = await page.textContent('.mapdet');
    assert.match(t, /Lake Josephine/); assert.match(t, /🚗/);
    await page.click('.mapdet .chip:has-text("🚗")');
    assert.strictEqual(await page.evaluate(() => S.loc), 'lake');
    assert.ok((await page.textContent('.mapwrap')).length > 0);
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('.mapdet').length), 0, 'selection cleared after going');
    noErrors(errors);
  } },
  { name: 'you, your car and the other side: the mainland panel is reachable and shows the route', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await mapOn(page);
    assert.match(await page.textContent('.maptabs'), /Anderson Island · you/);
    await page.click('.maptabs button:has-text("Mainland")');
    const p = await pins(page);
    assert.ok(p.some(x => /Steilacoom Ferry Terminal/.test(x)) && p.some(x => /Work \(Lakewood\)/.test(x)) && p.some(x => /Tacoma/.test(x)));
    assert.ok(!p.some(x => /vhome|Your place/.test(x)), 'no visitor home for residents');
    // a place across the water explains the ferry
    await page.click('.mpin[aria-label^="Work (Lakewood)"]');
    assert.match(await page.textContent('.mapdet'), /across the water/);
    await page.click('.maptabs button:has-text("Anderson Island")');
    assert.ok(await page.$('svg.mapsvg circle[stroke-dasharray]'), 'you-are-here ring');
    assert.ok(await page.$('.mpin'), 'markers');
    const car = await page.evaluate(() => S.cars.length);
    assert.ok(car >= 1);
    noErrors(errors);
  } },
  { name: 'phone width: markers do not pile up on either panel', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await page.setViewportSize({ width: 390, height: 800 });
    await newGame(page); await mapOn(page);
    let o = await overlap(page);
    assert.ok(o.w <= 390 && o.min >= 20, JSON.stringify(o));
    await page.click('.maptabs button:has-text("Mainland")');
    o = await overlap(page);
    assert.ok(o.w <= 390 && o.n >= 20 && o.min >= 20, JSON.stringify(o));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no sideways scroll');
    noErrors(errors);
  } },
  { name: 'the ferry shows while a boat is crossing, and not during an outage', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await mapOn(page);
    await page.evaluate(() => { S.week.b = []; S.week.fog = S.week.fog.map(() => 0); S.cur = 1; S.t = 1 * 1440 + 380 + 5; render(); });
    assert.ok(await page.$('.mapferry'), 'boat on the island panel');
    assert.match(await page.textContent('.mapcap'), /crossing now/);
    await page.evaluate(() => { S.week.b = [{ start: S.t - 30, end: S.t + 600, cause: 'generator failure' }]; render(); });
    assert.ok(!(await page.$('.mapferry')));
    assert.match(await page.textContent('.mapcap'), /suspended/);
    noErrors(errors);
  } },
  { name: 'visitor mode adds the visitor places; resident mode hides them', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page); await mapOn(page);
    const r = await pins(page);
    assert.ok(!r.some(x => /Johnson Farm|Andy|Jacobs/.test(x)), 'hidden outside a visit');
    await page.evaluate(() => { crossing = (a, b, c, done) => done(); visitorNew('weekend', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); });
    await page.click('.maptabs button:has-text("Anderson Island")');
    const v = await pins(page);
    assert.ok(v.some(x => /Johnson Farm/.test(x)) && v.some(x => /Andy/.test(x)) && v.some(x => /Jacobs/.test(x)), v.join('|'));
    await page.click('.maptabs button:has-text("Mainland")');
    assert.ok((await pins(page)).some(x => /Your place/.test(x)), 'visitor home on the mainland');
    noErrors(errors);
  } },
  { name: 'a visitor from Seattle or Olympia gets a home-city tab with a real shoreline; Tacoma does not', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    for (const [city, tab] of [['seattle', 'Seattle'], ['olympia', 'Olympia']]) {
      await page.evaluate(c => { visitorNew('regular', c, 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.loc = 'vhome'; MAPSIDE = null; setPref('goOpen', true); MAPPREF(true); }, city);
      assert.match(await page.textContent('.maptabs'), new RegExp(tab + ' · you'));
      const p = await pins(page);
      assert.ok(p.some(x => /Your place/.test(x)) && p.length === 3, p.join('|'));
      assert.ok(await page.evaluate(() => document.querySelectorAll('svg.mapsvg path[d^="M"]').length >= 1), 'shoreline drawn');
      await page.click('.maptabs button:has-text("Mainland")');
      assert.ok(!(await pins(page)).some(x => /Your place/.test(x)), 'home is on its own tab, not the mainland map');
      assert.ok((await pins(page)).some(x => /Steilacoom Ferry Terminal/.test(x)));
    }
    await page.evaluate(() => { visitorNew('regular', 'tacoma', 'normal'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); S.loc = 'vhome'; MAPSIDE = null; render(); });
    assert.strictEqual(await page.evaluate(() => document.querySelectorAll('.maptabs button').length), 2, 'Tacoma is on the mainland map');
    noErrors(errors);
  } },
];
