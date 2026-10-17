#!/usr/bin/env python3
"""Builds the single-file game (index.html) from src/game.src.html.

The readable game code lives in src/game.src.html and src/v2.js (the V2 drag engine). Large binary data (fonts,
sprites, sounds, background images) is kept in src/blocks/ and injected at the
placeholder comments; the translations come from i18n/*.json.

Usage:  python3 src/build.py            -> writes index.html in the repo root
"""
import glob, json, os, sys

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def main():
    src = read(f'{SRC}/game.src.html')
    # the V2 drag engine lives in its own file and is inlined into the game script
    assert src.count('//@@V2_ENGINE@@') == 1
    src = src.replace('//@@V2_ENGINE@@', read(f'{SRC}/v2.js').rstrip('\n'))
    # the name filter is shared with the leaderboard server (server/worker.js imports the same file)
    assert src.count('//@@FLEET@@') == 1
    src = src.replace('//@@FLEET@@', read(f'{SRC}/fleet.js').rstrip('\n'))
    assert src.count('//@@NAMES@@') == 1
    src = src.replace('//@@NAMES@@', read(f'{SRC}/names.js').rstrip('\n'))
    # the fleet missions' catalogue is shared with the leaderboard server too
    assert src.count('//@@FMIS@@') == 1
    src = src.replace('//@@FMIS@@', read(f'{SRC}/fmis.js').rstrip('\n'))
    # build stamp for error reports: the service worker cache name (bumped with every web release)
    import re
    m = re.search(r"CACHE = '([^']+)'", read(f'{ROOT}/sw.js'))
    assert src.count("'@@BUILD@@'") == 1
    src = src.replace("'@@BUILD@@'", json.dumps(m.group(1) if m else 'dev'))
    # the Android build passes its version name and code (e.g. "1.5.0 (31)"), shown in Settings next to the install number
    assert src.count("'@@APPVER@@'") == 1
    src = src.replace("'@@APPVER@@'", json.dumps(os.environ.get('BHS_APPVER', '')))
    for ph in ('FONT_DATA', 'SPRITE_DATA', 'SFX_DATA', 'ASSET_DATA', 'CHAMP_DATA', 'I18N_DATA'):
        assert src.count(f'<!--{ph}-->') == 1, ph
    langs = {}
    for f in sorted(glob.glob(f'{ROOT}/i18n/*.json')):
        d = json.loads(read(f))
        langs[os.path.basename(f)[:-5]] = {k: v for k, v in d.items() if v and not k.startswith('_')}
    # every language must carry the same keys, otherwise the missing texts would silently show in Turkish
    if langs:
        allk = set().union(*langs.values())
        for l, d in langs.items():
            miss = sorted(allk - set(d))
            if miss:
                print(f'WARNING: {l}.json is missing {len(miss)} translation(s):', *miss[:10], sep='\n  ')
    i18n = ('<script>window.I18N=' + json.dumps(langs, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + ';</script>') if langs else ''
    out = (src.replace('<!--FONT_DATA-->', read(f'{SRC}/blocks/fonts.html'))
              .replace('<!--SPRITE_DATA-->', read(f'{SRC}/blocks/sprites.html'))
              .replace('<!--SFX_DATA-->', read(f'{SRC}/blocks/sfx.html').rstrip('\n'))
              .replace('<!--ASSET_DATA-->', read(f'{SRC}/blocks/assets.html').rstrip('\n'))
              .replace('<!--CHAMP_DATA-->', read(f'{SRC}/blocks/champ.html').rstrip('\n'))
              .replace('<!--I18N_DATA-->', i18n))
    dest = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/index.html'  # another file for a side build (the default is the game itself)
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(out)
    print('built', os.path.basename(dest), len(out), 'bytes;', {k: len(v) for k, v in langs.items()})


if __name__ == '__main__':
    main()
