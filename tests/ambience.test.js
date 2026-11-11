const { open, newGame, noErrors, assert } = require('./helpers');

function fakeAudio() {
  const A = window.__fa = { ctx: 0, started: 0, stopped: 0 };
  const param = v => ({ value: v, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} });
  class Node { connect(d) { return d; } disconnect() {} }
  class Src extends Node { start() { A.started++; } stop() { A.stopped++; } }
  class Ctx {
    constructor() { A.ctx++; this.state = 'running'; this.sampleRate = 8000; this.currentTime = 0; this.destination = new Node(); }
    resume() { return Promise.resolve(); }
    createGain() { const n = new Node(); n.gain = param(1); return n; }
    createBiquadFilter() { const n = new Node(); n.frequency = param(350); n.Q = param(1); n.type = 'lowpass'; return n; }
    createOscillator() { const n = new Src(); n.frequency = param(440); n.type = 'sine'; return n; }
    createBufferSource() { const n = new Src(); n.playbackRate = param(1); n.loop = false; return n; }
    createBuffer(ch, len, sr) { const d = new Float32Array(len); return { sampleRate: sr, length: len, getChannelData: () => d }; }
  }
  window.AudioContext = Ctx; window.webkitAudioContext = Ctx;
}
const at = (page, o) => page.evaluate(o => { S.season = o.season; if (o.loc) S.loc = o.loc; S.t = S.cur * 1440 + o.m; S.week.storm = o.storm ? { day: S.cur, start: S.t - 10, end: S.t + 600 } : null; return ambScene(); }, o);

module.exports = [
  { name: 'ambience scene follows season, weather, place and time', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    const spring = await at(page, { season: 'spring', loc: 'lake', m: 1140 });
    const springHome = await at(page, { season: 'spring', loc: 'home', m: 1140 });
    const springDay = await at(page, { season: 'spring', loc: 'lake', m: 780 });
    const winter = await at(page, { season: 'winter', loc: 'home', m: 1080 });
    const summer = await at(page, { season: 'summer', loc: 'home', m: 1080 });
    const storm = await at(page, { season: 'fall', loc: 'home', m: 1200, storm: true });
    const night = await at(page, { season: 'fall', loc: 'aiDock', m: 1400 });
    const dock = await at(page, { season: 'fall', loc: 'aiDock', m: 700 });
    assert(spring.frogs === 1 && springHome.frogs > 0 && springHome.frogs < 1 && springDay.frogs === 0, 'frogs: spring evenings at the lake');
    assert(winter.stove > 0 && summer.stove === 0, 'stove in cool seasons only');
    assert(storm.wind === 1 && dock.wind < 1, 'wind in storms');
    assert(night.night && !night.gulls && dock.gulls, 'quiet at night, gulls by day');
    noErrors(errors);
  } },
  { name: 'ambience layers start with the existing volume setting, stop cleanly and the horn sounds', fn: async ctx => {
    await ctx.context.addInitScript(fakeAudio);
    const { page, errors } = await open(ctx);
    await newGame(page);
    assert.strictEqual(await page.evaluate(() => prefs().amb || 'off'), 'off');
    await page.evaluate(() => { setPref('sound', true); setPref('amb', 'low'); });
    await page.mouse.click(200, 300);
    let st = await page.evaluate(() => { S.season = 'winter'; ambUpdate(); return ambState(); });
    assert(st.on && st.layers && st.wind && st.want.stove > 0, JSON.stringify(st));
    await page.waitForTimeout(900);
    assert((await page.evaluate(() => window.__fa)).started > st.sources, 'woodstove crackle bursts played');
    await page.evaluate(() => crossing('I', 'Crossing', 'x', () => {}));
    await page.click('.cross');
    assert.strictEqual((await page.evaluate(() => ambState())).horns, 1, 'horn on arrival');
    await page.evaluate(() => setPref('sound', false));
    const fa = await page.evaluate(() => window.__fa);
    assert(!(await page.evaluate(() => ambState())).on, 'muted → silent');
    await page.waitForTimeout(100);
    assert.strictEqual(fa.stopped, fa.started, JSON.stringify(fa));
    noErrors(errors);
  } },
  { name: 'no AudioContext: nothing throws', fn: async ctx => {
    await ctx.context.addInitScript(() => { window.AudioContext = undefined; window.webkitAudioContext = undefined; });
    const { page, errors } = await open(ctx);
    await newGame(page);
    const r = await page.evaluate(() => { setPref('sound', true); setPref('amb', 'med'); ambGestureOK(); ambUpdate(); sfx('horn'); const h = ambHorn(); crossing('I', 'x', 'y', () => {}); return { on: ambState().on, h }; });
    assert(!r.on && !r.h);
    noErrors(errors);
  } },
  { name: 'settings: ambience row explains the new sounds; default is off', fn: async ctx => {
    const { page, errors } = await open(ctx);
    await newGame(page);
    await page.evaluate(() => { setPref('sound', true); openSettings(); });
    const t = await page.textContent('.modal');
    assert(/Ambient sound: Off/.test(t) && /frogs/.test(t) && /woodstove/.test(t), t);
    noErrors(errors);
  } },
];
