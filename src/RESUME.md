# Module split — work in progress (paused)

Done:
- `src/shell.html`, `src/style.css`, `src/js/00-data.js` … `10-endings.js` split from index.html 1.11.0.
- `tools/build.py` rebuilds index.html from src/ (byte-identical to 1.11.0; `--check` verifies).

Still to do before releasing as 1.11.1 (no gameplay changes):
1. CI: run `python3 tools/build.py --check` in .github/workflows/test.yml and build.py first in release.yml.
2. README "Project layout" + docs/EVENTS.md: say code lives in src/, edit there, then run tools/build.py.
3. Bump APP_VERSION to 1.11.1 (in src/js/00-data.js) and sw.js, rebuild, build-offline, `node tests/run.js`.
4. Merge into main, push, publish the artifact, rebuild the Windows installer.
