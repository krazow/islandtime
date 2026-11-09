const { open, newGame, noErrors, assert } = require('./helpers');

// A bot that plays by clicking: modal buttons first (prefers .primary), else a random enabled action.
const STEPS = 1500;

module.exports = [
  { name: `bot plays ${STEPS} steps of week mode`, fn: async ctx => {
    const { page, errors } = await open(ctx, { seed: 20261108 });
    await newGame(page, 'normal', 'week');
    let stats = { steps: 0, games: 1, idle: 0 };
    while (stats.steps < STEPS && !errors.length) {
      stats = await page.evaluate(([st, n]) => {
        const rnd = Math.random, skip = /exit|transfer|settings|change name/i;
        const ok = b => !b.disabled && !skip.test(b.textContent) && !/openSettings|openTransfer|confirmExit|nameModal/.test(b.getAttribute('onclick') || '');
        const pick = a => a[Math.floor(rnd() * a.length)];
        for (let i = 0; i < n && st.steps < 1e9; i++, st.steps++) {
          const cross = document.querySelector('.cross');
          if (cross) { cross.click(); continue; }
          if (S.over || document.querySelector('.end,.title')) { st.games++; newGame('normal', 'week'); MQ = []; document.querySelectorAll('.modal-bg').forEach(e => e.remove()); tab = 'act'; render(); continue; }
          const m = document.getElementById('mbg');
          if (m) {
            const bs = [...m.querySelectorAll('button.act')].filter(ok);
            const p = bs.find(b => b.classList.contains('primary'));
            const b = p && rnd() < 0.8 ? p : pick(bs);
            if (b) b.click(); else m.remove();
            continue;
          }
          if (rnd() < 0.05) { setTab(pick(['act', 'ferry', 'todo', 'log'])); continue; }
          if (tab !== 'act') setTab('act');
          const bs = [...document.querySelectorAll('#app .content button.act')].filter(ok);
          if (!bs.length) { st.idle++; endDay(L[S.loc].side === 'I' ? 'home' : 'terminal'); continue; }
          const p = bs.filter(b => b.classList.contains('primary'));
          pick(p.length && rnd() < 0.3 ? p : bs).click();
        }
        return st;
      }, [stats, 100]);
    }
    noErrors(errors);
    assert.ok(stats.steps >= STEPS);
    console.log(`       bot: ${stats.steps} steps, ${stats.games} game(s), ${stats.idle} idle`);
  } },
];
