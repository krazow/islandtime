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
if __name__ == '__main__':
    out = build(); target = os.path.join(ROOT, 'index.html')
    if '--check' in sys.argv:
        cur = open(target, encoding='utf-8').read()
        if cur != out:
            print('index.html is out of date with src/. Run: python3 tools/build.py'); sys.exit(1)
        print('index.html matches src/'); sys.exit(0)
    open(target, 'w', encoding='utf-8').write(out)
    print(f'wrote index.html ({len(out.encode())//1024} KB) from {len(glob.glob(os.path.join(ROOT,"src","js","*.js")))} modules')
