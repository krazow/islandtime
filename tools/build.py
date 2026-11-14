#!/usr/bin/env python3
"""Build index.html (the single-file game) from src/.

  src/shell.html   page skeleton with /*@STYLE@*/ and //@SCRIPT@ placeholders
  src/style.css    all styles
  src/js/*.js      the game code, concatenated in file-name order

Usage:  python3 tools/build.py          write index.html
        python3 tools/build.py --check  fail if index.html is out of date with src/
Then tools/build-offline.py and windows/build.sh work from index.html as before.
"""
import os, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def read(p): return open(os.path.join(ROOT, p), encoding='utf-8').read()
def build():
    shell = read('src/shell.html')
    css = read('src/style.css')[:-1]          # each part is stored with one trailing newline
    js = ''.join(read(os.path.relpath(f, ROOT)) for f in sorted(glob.glob(os.path.join(ROOT, 'src', 'js', '*.js'))))[:-1]
    assert shell.count('/*@STYLE@*/') == 1 and shell.count('//@SCRIPT@') == 1, 'placeholders missing in src/shell.html'
    return shell.replace('/*@STYLE@*/', css).replace('//@SCRIPT@', js)
def version_json():
    """version.json: what the website's latest version is. Downloaded copies (the Windows app, the offline file) read it to offer updates."""
    import re, json
    v = re.search(r"APP_VERSION='([0-9.]+)'", read('src/js/01-core.js')).group(1)
    m = re.search(r"\{v:'([0-9.]+)',date:'([^']*)',title:'((?:[^'\\]|\\.)*)'", read('src/js/83-whats-new.js'))
    title = m.group(3).replace("\\'", "'") if m and m.group(1) == v else ''
    return json.dumps({'version': v, 'date': m.group(2) if m and m.group(1) == v else '', 'title': title,
        'installer': 'https://github.com/krazow/islandtime/releases/latest/download/Island-Time-Setup.exe',
        'offline': 'https://krazow.github.io/islandtime/offline/Island-Time-offline.html',
        'web': 'https://krazow.github.io/islandtime/'}, ensure_ascii=False, indent=1) + '\n'
if __name__ == '__main__':
    out = build(); target = os.path.join(ROOT, 'index.html')
    vj = version_json(); vtarget = os.path.join(ROOT, 'version.json')
    if '--check' in sys.argv:
        cur = open(target, encoding='utf-8').read()
        if cur != out:
            print('index.html is out of date with src/. Run: python3 tools/build.py'); sys.exit(1)
        if not os.path.exists(vtarget) or open(vtarget, encoding='utf-8').read() != vj:
            print('version.json is out of date with src/. Run: python3 tools/build.py'); sys.exit(1)
        print('index.html matches src/'); sys.exit(0)
    # catch syntax errors right away (needs Node.js; skipped if it isn't installed)
    import shutil, subprocess
    if shutil.which('node'):
        js = out[out.index('<script>') + 8: out.rindex('</script>')]
        r = subprocess.run(['node', '-e', 'new Function(require("fs").readFileSync(0,"utf8"))'], input=js, text=True, capture_output=True)
        if r.returncode:
            print('Syntax error in the built game code, index.html not written:'); print(r.stderr.strip().splitlines()[-1] if r.stderr.strip() else r.stderr); sys.exit(1)
    open(target, 'w', encoding='utf-8').write(out)
    open(vtarget, 'w', encoding='utf-8').write(vj)
    print(f'wrote index.html ({len(out.encode())//1024} KB) from {len(glob.glob(os.path.join(ROOT,"src","js","*.js")))} modules')
