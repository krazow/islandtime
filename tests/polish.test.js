const { open, newGame, noErrors, assert } = require('./helpers');

// A fake WebAudio, installed before page scripts: counts nodes started and stopped.
function fakeAudio() {
  const A = window.__fa = { ctx: 0, started: 0, stopped: 0, nodes: 0 };
  const param = v => ({ value: v, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  class Node { constructor() { A.nodes++; } connect(d) { return d; } disconnect() {} }
  class Src extends Node { start() { A.started++; } stop() { A.stopped++; } }
  class Ctx {
    constructor() { A.ctx++; this.state = 'running'; this.sampleRate = 8000; this.currentTime = 0; this.destination = new Node(); }
    resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); }
    createGain() { const n = new Node(); n.gain = param(1); return n; }
    createBiquadFilter() { const n = new Node(); n.frequency = param(350); n.Q = param(1); n.type = 'lowpass'; return n; }
    createOscillator() { const n = new Src(); n.frequency = param(440); n.type = 'sine'; return n; }
    createBufferSource() { const n = new Src(); n.playbackRate = param(1); n.loop = false; return n; }
    createBuffer(ch, len, sr) { const d = new Float32Array(len); return { sampleRate: sr, length: len, getChannelData: () => d }; }
  }
  window.AudioContext = Ctx; window.webkitAudioContext = Ctx;
}

// buttons whose accessible name would be empty: no aria-label/title and no letters or digits in their text
const unnamed = page => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent !== null || b.closest('#mbg,#phoneUI')).filter(b => {
  const lab = (b.getAttribute('aria-label') || b.getAttribute('title') || '').trim();
  return !lab && !/[\p{L}\p{N}]/u.test(b.textContent || '');
}).map(b => b.outerHTML.slice(0, 120)));
// clickable non-native elements must be keyboard reachable
const badClickables = page => page.evaluate(() => [...document.querySelectorAll('[onclick]')].filter(e => !/^(BUTTON|A|INPUT|SELECT|TEXTAREA|SUMMARY|LABEL|OPTION)$/.test(e.tagName) && !e.closest('button'))
  .filter(e => e.getAttribute('role') !== 'button' || e.getAttribute('tabindex') !== '0').map(e => e.outerHTML.slice(0, 120)));
const liveText = page => page.evaluate(() => document.getElementById('a11yLive').textContent);

async function endGame(page, how) {
  await page.evaluate(how => {
    S.friends.sam = { name: 'Sam, your neighbor', lvl: 2 }; S.achGame = ['pantry', 'zen'];
    if (how === 'lost') gameOver('fired'); else { S.cur = 6; S.t = 6 * 1440 + 1300; finish(); }
  }, how);
  await page.waitForSelector('#shareBtn');
}

module.exports = [
  // ---------- share card ----------
  { name: 'share card: end screen button draws a 1080×1350 PNG, previews it and downloads it', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { delete Navigator.prototype.share; delete Navigator.prototype.canShare; });
    await endGame(page);
    assert.match(await page.textContent('#shareBtn'), /Share my week/);
    // sits above "Play another week"
    assert.ok(await page.evaluate(() => document.getElementById('shareBtn').nextElementSibling.textContent.includes('Play another week')));
    await page.click('#shareBtn');
    await page.waitForSelector('#mbg .share-prev');
    const info = await page.evaluate(() => ({ w: SHARE_LAST.w, h: SHARE_LAST.h, type: SHARE_LAST.blob.type, size: SHARE_LAST.blob.size, name: SHARE_LAST.name, d: SHARE_LAST.data }));
    assert.strictEqual(info.w, 1080); assert.strictEqual(info.h, 1350);
    assert.strictEqual(info.type, 'image/png'); assert.ok(info.size > 20000, 'png has content: ' + info.size);
    assert.strictEqual(info.name, 'island-time-t.png');
    assert.strictEqual(info.d.name, 'T'); assert.ok(info.d.ach.some(a => /Fully stocked/.test(a)), 'achievements on card');
    assert.deepStrictEqual(info.d.friends, ['Sam']); assert.strictEqual(info.d.season, '🍂 Fall');
    assert.ok(info.d.stats.some(([k]) => /Nights stranded/.test(k)) && info.d.stats.some(([k]) => /crossings/.test(k)));
    // the image really is the card: teal background, cream panel
    const px = await page.evaluate(async () => {
      const img = document.querySelector('.share-prev'); await img.decode();
      const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      return [[...x.getImageData(5, 1345, 1, 1).data], [...x.getImageData(1000, 800, 1, 1).data]];
    });
    assert.deepStrictEqual(px[0].slice(0, 3), [0x12, 0x31, 0x3b]);
    assert.deepStrictEqual(px[1].slice(0, 3), [0xf4, 0xf1, 0xea]);
    // no share API in this browser → download
    assert.ok(!(await page.evaluate(() => [...document.querySelectorAll('#mbg button')].some(b => /📤 Share/.test(b.textContent)))));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#mbg button:has-text("Save the picture")')]);
    assert.strictEqual(dl.suggestedFilename(), 'island-time-t.png');
    noErrors(errors);
  } },
  { name: 'share card: uses navigator.share with a PNG file when it can', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page, 'hard', 'month');
    await page.evaluate(() => {
      window.__shared = null;
      navigator.canShare = d => !!(d && d.files && d.files[0] instanceof File);
      navigator.share = d => { window.__shared = { name: d.files[0].name, type: d.files[0].type, size: d.files[0].size, text: d.text }; return Promise.resolve(); };
    });
    await endGame(page, 'lost');
    assert.match(await page.textContent('#shareBtn'), /Share my month/);
    await page.click('#shareBtn');
    await page.waitForSelector('#mbg .share-prev');
    const d = await page.evaluate(() => SHARE_LAST.data);
    assert.strictEqual(d.grade, 'F'); assert.ok(d.lost); assert.match(d.diff, /Ferry Hell/);
    await page.click('#mbg button:has-text("📤 Share")');
    await page.waitForFunction(() => window.__shared);
    const s = await page.evaluate(() => window.__shared);
    assert.strictEqual(s.name, 'island-time-t.png'); assert.strictEqual(s.type, 'image/png'); assert.ok(s.size > 20000);
    assert.ok(s.text.includes('https://krazow.github.io/islandtime/'));
    noErrors(errors);
  } },

  // ---------- accessibility ----------
  { name: 'a11y: every visible button has an accessible name; clickables are keyboard reachable', fn: async ctx => {
    const { page, errors } = await open(ctx);
    const check = async where => {
      assert.deepStrictEqual(await unnamed(page), [], `unnamed buttons on ${where}`);
      assert.deepStrictEqual(await badClickables(page), [], `non-keyboard clickables on ${where}`);
    };
    await check('title');
    await newGame(page);
    await page.evaluate(() => { prioAdd('Buy dog food'); prioAdd('Call mom'); S.loc = 'aiDock'; render(); });
    for (const k of ['act', 'ferry', 'todo', 'log']) { await page.evaluate(k => setTab(k), k); await check(k); }
    await page.evaluate(() => setTab('todo'));
    assert.strictEqual(await page.getAttribute('.prio .pt', 'role'), 'button');
    assert.strictEqual(await page.getAttribute('.prio .pt', 'tabindex'), '0');
    assert.strictEqual(await page.getAttribute('nav.tabs button.on', 'aria-current'), 'page');
    await page.evaluate(() => phoneOpen()); await check('phone home');
    for (const a of ['msg', 'calls', 'store']) { await page.evaluate(a => { if (phoneApp(a)) phoneGo(a); }, a); await check('phone ' + a); await page.evaluate(() => phoneHome()); }
    await page.evaluate(() => phoneClose());
    await page.evaluate(() => { S.home = 30; say('x'); showTile('🦌', 'Deer on the road', 'test', 'info'); render(); });
    await check('tiles');
    // Playwright's accessibility tree agrees: no unnamed buttons
    if (page.accessibility) {
      const snap = await page.accessibility.snapshot({ interestingOnly: false });
      const bad = []; (function walk(n) { if (!n) return; if (n.role === 'button' && !(n.name || '').trim()) bad.push(n); (n.children || []).forEach(walk); })(snap);
      assert.deepStrictEqual(bad, [], 'a11y tree buttons without names');
    }
    await page.evaluate(() => openSettings()); await check('settings');
    await page.evaluate(() => { MQ = []; document.getElementById('mbg').remove(); S.cur = 6; S.t = 6 * 1440 + 1300; finish(); });
    await check('end screen');
    noErrors(errors);
  } },
  { name: 'a11y: live region announces narration, tiles and modal titles', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    assert.strictEqual(await page.getAttribute('#a11yLive', 'aria-live'), 'polite');
    await page.evaluate(() => say('🦅 An eagle lifts off right over {{name}}’s car.'));
    await page.waitForFunction(() => document.getElementById('a11yLive').textContent.includes('An eagle lifts off right over T’s car.'));
    await page.evaluate(() => showTile('🛞', 'Flat tire', 'On the way to the landing', 'bad'));
    await page.waitForFunction(() => document.getElementById('a11yLive').textContent.includes('Flat tire. On the way to the landing'));
    assert.strictEqual(await page.getAttribute('#tiles', 'aria-live'), 'off', 'tiles no longer double-announce');
    await page.evaluate(() => modal('🧪 A test window', '<p>Body</p>', [{ l: 'OK', fn: () => {} }]));
    await page.waitForFunction(() => document.getElementById('a11yLive').textContent.includes('🧪 A test window'));
    assert.ok(!(await liveText(page)).includes('<'), 'no HTML in announcements');
    noErrors(errors);
  } },
  { name: 'a11y: modals are labelled dialogs; focus moves in, stays in, and comes back', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.focus('.hud button[onclick="openSettings()"]');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#mbg .modal[role="dialog"]');
    const d = await page.evaluate(() => { const m = document.querySelector('#mbg .modal'); return { modal: m.getAttribute('aria-modal'), label: document.getElementById(m.getAttribute('aria-labelledby')).textContent, focus: document.activeElement === m.querySelector('button'), first: document.activeElement.textContent }; });
    assert.strictEqual(d.modal, 'true'); assert.strictEqual(d.label, '⚙️ Settings'); assert.ok(d.focus, 'focus on first modal button, got ' + d.first);
    // Shift+Tab from the first button wraps to the last (Close)
    await page.keyboard.press('Shift+Tab');
    assert.match(await page.evaluate(() => document.activeElement.textContent), /^Close$/);
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement === document.querySelector('#mbg button')), 'Tab wraps to the first');
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Enter');
    assert.ok(!(await page.$('#mbg')));
    assert.ok(await page.evaluate(() => document.activeElement.getAttribute('onclick') === 'openSettings()'), 'focus back on the gear');
    // a submenu chain keeps the original return point
    await page.keyboard.press('Enter'); await page.waitForSelector('#mbg');
    await page.click('#mbg button:has-text("Accessibility")');
    await page.waitForSelector('#mbg h2:has-text("Accessibility")');
    assert.ok(await page.evaluate(() => document.activeElement === document.querySelector('#mbg button')));
    await page.click('#mbg button:has-text("Back to settings")');
    await page.click('#mbg button:has-text("Close")');
    assert.ok(await page.evaluate(() => document.activeElement.getAttribute('onclick') === 'openSettings()'), 'focus back on the gear after a chain');
    noErrors(errors);
  } },
  { name: 'a11y: keyboard only: priorities, Next up hide, details, crossing skip', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { prioAdd('Buy dog food'); setTab('todo'); });
    await page.focus('.prio .pt');
    await page.keyboard.press('Enter');
    assert.ok(await page.evaluate(() => S.prios[0].done), 'Enter marks done');
    assert.ok(await page.evaluate(() => document.activeElement.classList.contains('pt')), 'focus stays on the item after re-render');
    assert.strictEqual(await page.getAttribute('.prio .pt', 'aria-pressed'), 'true');
    await page.keyboard.press(' ');
    assert.ok(!(await page.evaluate(() => S.prios[0].done)), 'Space toggles back');
    // move down/up buttons keep focus too
    await page.evaluate(() => prioAdd('Second'));
    await page.focus('.prio button[aria-label="Move down"]');
    await page.keyboard.press('Enter');
    assert.strictEqual(await page.evaluate(() => S.prios[0].t), 'Second');
    // Next up's ✕ (hide for today) works from the keyboard
    await page.evaluate(() => setTab('act'));
    await page.waitForSelector('.nextup .nu-x');
    assert.strictEqual(await page.getAttribute('.nextup .nu-x', 'aria-label'), 'Hide Next up for today');
    await page.focus('.nextup .nu-x');
    await page.keyboard.press('Enter');
    assert.ok(await page.evaluate(() => S.nextHide === dayKey() && !document.querySelector('.nextup')));
    assert.ok(await page.evaluate(() => document.activeElement !== document.body), 'focus not dropped');
    // summary/details toggles with the keyboard
    await page.evaluate(() => { setPref('goOpen', false); setTab('act'); });
    await page.focus('details.go:not(.upk) > summary');
    await page.keyboard.press('Enter');
    assert.ok(await page.evaluate(() => document.querySelector('details.go:not(.upk)').open));
    // crossing overlay: a focused, labelled button; Enter skips it
    await page.evaluate(() => { window.__done = 0; crossing('I', 'Crossing to Steilacoom', '7:45 AM departure', () => { window.__done++; }); });
    const c = await page.evaluate(() => { const e = document.querySelector('.cross'); return { role: e.getAttribute('role'), label: e.getAttribute('aria-label'), focused: document.activeElement === e }; });
    assert.strictEqual(c.role, 'button'); assert.match(c.label, /Crossing to Steilacoom.*skip/); assert.ok(c.focused);
    await page.keyboard.press('Enter');
    assert.strictEqual(await page.evaluate(() => window.__done), 1);
    assert.ok(!(await page.$('.cross')));
    noErrors(errors);
  } },
  { name: 'a11y: focus outlines are visible, and stronger in high contrast', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.focus('.hud button[onclick="openSettings()"]');
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); // keyboard focus → :focus-visible
    const o = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { w: s.outlineWidth, st: s.outlineStyle }; });
    assert.strictEqual(o.st, 'solid'); assert.ok(parseFloat(o.w) >= 3);
    await page.evaluate(() => setPref('hc', true));
    const h = await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow);
    assert.ok(h && h !== 'none', 'high-contrast focus ring: ' + h);
    noErrors(errors);
  } },

  // ---------- ambient sound ----------
  { name: 'ambient: off by default, waits for a gesture, follows the scene, pauses when hidden', fn: async ctx => {
    await ctx.context.addInitScript(fakeAudio);
    const { page, errors } = await open(ctx);
    await newGame(page);
    let st = await page.evaluate(() => ambState());
    assert.strictEqual(st.level, 'off'); assert.ok(!st.on);
    // turned on in prefs but no user gesture yet: nothing starts
    await page.evaluate(() => { setPref('sound', true); setPref('amb', 'low'); });
    st = await page.evaluate(() => ambState());
    assert.ok(!st.on && !st.gesture, 'no audio before a gesture');
    assert.strictEqual(await page.evaluate(() => window.__fa.ctx), 0);
    await page.mouse.click(200, 300);
    st = await page.evaluate(() => ambState());
    assert.ok(st.on && st.sources >= 3, 'started: ' + JSON.stringify(st));
    assert.strictEqual(await page.evaluate(() => window.__fa.ctx), 1, 'reuses the one AudioContext');
    assert.ok(st.want.forest > 0, 'forest at home');
    await page.evaluate(() => { S.loc = 'aiDock'; render(); });
    assert.ok((await page.evaluate(() => ambState())).want.gulls, 'gulls at the dock');
    await page.evaluate(() => { S.up.rain = dayKey(); render(); });
    assert.ok((await page.evaluate(() => ambState())).want.rain >= 0.6, 'heavier rain on a rainy night');
    // ferry engine during the crossing
    await page.evaluate(() => crossing('I', 'Crossing', 'x', () => {}));
    assert.ok((await page.evaluate(() => ambState())).ferry);
    await page.click('.cross');
    assert.ok(!(await page.evaluate(() => ambState())).ferry);
    // page hidden → stops; visible → back
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.ok(!(await page.evaluate(() => ambState())).on, 'paused when hidden');
    const fa = await page.evaluate(() => window.__fa);
    assert.strictEqual(fa.stopped, fa.started, 'every source stopped');
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
    assert.ok((await page.evaluate(() => ambState())).on, 'resumes when visible');
    // master sound toggle wins
    await page.evaluate(() => setPref('sound', false));
    assert.ok(!(await page.evaluate(() => ambState())).on, 'master sound off → ambient off');
    await page.evaluate(() => setPref('sound', true));
    assert.ok((await page.evaluate(() => ambState())).on);
    await page.evaluate(() => setPref('amb', 'off'));
    assert.ok(!(await page.evaluate(() => ambState())).on);
    noErrors(errors);
  } },
  { name: 'ambient: settings row cycles Off → Low → Medium → Off (real WebAudio, no errors)', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => setPref('sound', true));
    await page.evaluate(() => openSettings());
    const row = '#mbg button:has-text("Ambient sound")';
    assert.match(await page.textContent(row), /Ambient sound: Off/);
    await page.click(row);
    assert.match(await page.textContent(row), /Ambient sound: Low/);
    assert.ok((await page.evaluate(() => ambState())).on);
    await page.click(row);
    assert.match(await page.textContent(row), /Ambient sound: Medium/);
    assert.strictEqual(await page.evaluate(() => prefs().amb), 'med');
    await page.evaluate(() => { S.loc = 'stDock'; crossing('M', 'Crossing', 'x', () => {}, true); });
    await page.waitForTimeout(150);
    await page.click('.cross');
    await page.click(row);
    assert.match(await page.textContent(row), /Ambient sound: Off/);
    assert.ok(!(await page.evaluate(() => ambState())).on);
    noErrors(errors);
  } },
];
