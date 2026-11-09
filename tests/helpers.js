// Shared helpers for the Island Time tests.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { pathToFileURL } = require('url');

const TARGETS = [{ name: 'index.html', file: path.resolve(__dirname, '..', 'index.html') }];
const offline = path.resolve(__dirname, '..', 'offline', 'IslandTime-offline.html');
if (fs.existsSync(offline)) TARGETS.push({ name: 'offline', file: offline });

const PREFS = { 'islandtime.name': 'T', 'islandtime.popups': 'off', 'islandtime.prefs': JSON.stringify({ tips: false, sound: false }) };

// Runs before any page script: an optional seeded Math.random (mulberry32). It must not touch localStorage:
// in Chromium, storage read at document creation during a file:// reload can be a stale snapshot that
// misses the previous page's last writes.
function initScript({ seed }) {
  if (seed != null) {
    let a = seed >>> 0;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
}

// Open the game; returns { page, errors } where errors collects uncaught page errors.
async function open({ context, target }, { seed = 12345 } = {}) {
  await context.addInitScript(initScript, { seed });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.stack || e)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto(pathToFileURL(target.file).href);
  // quiet prefs (name set, no tips, no pop-ups, no sound), then reload so the game starts with them
  await page.evaluate(p => { for (const k in p) localStorage.setItem(k, p[k]); }, PREFS);
  for (let i = 0; i < 5; i++) {
    await page.reload();
    await page.waitForSelector('.title');
    if (await page.evaluate(() => localStorage.getItem('islandtime.popups') === 'off' && typeof prefs === 'function' && prefs().tips === false)) break;
  }
  return { page, errors };
}

// Start a fresh game with no queued modals.
async function newGame(page, diff = 'normal', mode = 'week') {
  await page.evaluate(([d, m]) => {
    newGame(d, m); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove());
    tab = 'act'; render();
  }, [diff, mode]);
}

async function reload(page) {
  await page.reload();
  await page.waitForSelector('.title');
}

function noErrors(errors) { assert.deepStrictEqual(errors, [], 'page errors:\n' + errors.join('\n')); }

module.exports = { TARGETS, open, newGame, reload, noErrors, assert };
