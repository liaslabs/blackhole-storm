"""Google Play store listing through the Publishing API (run by .github/workflows/play-store.yml).

The service account (secret PLAY_SERVICE_ACCOUNT_JSON) has only these Play Console permissions:
view app info, release to testing tracks, manage store presence, reply to reviews.
This script touches store listings (texts, phone screenshots, video link) and testing-track releases
(internal, alpha, beta; a new .aab can be uploaded for them) and nothing else: no in-app products, prices, policy declarations or production.

Every run works inside one Play "edit". Without --apply the edit is thrown away, so nothing changes;
the run only prints what it would do.
"""
import argparse, hashlib, json, os, re, sys
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

PKG = 'com.liaslabs.blackholestorm'
ROOT = Path(__file__).resolve().parent.parent / 'store' / 'listings'
FRAMES_FROM = {'es-419': 'es-ES', 'pt-PT': 'pt-BR'}  # these listings share another language's frames
# the order the phone screenshots show in on Play (the en-US listing was arranged this way by hand: action first)
ORDER = ['1-gameplay', '7-quasar-jet', '2-boss', '8-radiation', '6-survival', '3-laboratory', '4-map', '5-menu']
KEEP_IMAGES = {'en-US'}  # arranged by hand in Play Console; never replaced from here
SUMMARY = os.environ.get('GITHUB_STEP_SUMMARY')
out = []


def say(s=''):
    print(s)
    out.append(s)


def api():
    info = json.loads(os.environ['PLAY_SERVICE_ACCOUNT_JSON'])
    cred = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/androidpublisher'])
    return build('androidpublisher', 'v3', credentials=cred, cache_discovery=False)


def read(p):
    return p.read_text(encoding='utf-8').strip() if p.exists() else None


def local(lang):
    d = ROOT / lang
    fr = ROOT / FRAMES_FROM.get(lang, lang) / 'frames'
    return {
        'title': read(d / 'title.txt'),
        'shortDescription': read(d / 'short.txt'),
        'fullDescription': read(d / 'full.txt'),
        'shots': [] if lang in KEEP_IMAGES or not fr.is_dir() else
                 sorted(fr.glob('*.jpg'), key=lambda p: ORDER.index(p.stem) if p.stem in ORDER else len(ORDER)),
    }


def sha256(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def status(ed, eid):
    say('## Play mağaza durumu')
    det = ed.details().get(packageName=PKG, editId=eid).execute()
    say(f"Varsayılan dil: **{det.get('defaultLanguage')}**")
    ls = ed.listings().list(packageName=PKG, editId=eid).execute().get('listings', [])
    say('')
    say('| Dil | Uygulama adı | Kısa açıklama | Tam açıklama | Video | Telefon kareleri |')
    say('|---|---|---|---|---|---|')
    for l in sorted(ls, key=lambda x: x['language']):
        n = len(ed.images().list(packageName=PKG, editId=eid, language=l['language'], imageType='phoneScreenshots').execute().get('images', []))
        say(f"| {l['language']} | {l.get('title', '')} | {len(l.get('shortDescription', ''))} kr | {len(l.get('fullDescription', ''))} kr | {'var' if l.get('video') else '-'} | {n} |")
    say('')
    say('## Kanallar')
    for t in ed.tracks().list(packageName=PKG, editId=eid).execute().get('tracks', []):
        rel = ', '.join(f"{r.get('name', '?')} ({r.get('status')}, kod {'/'.join(r.get('versionCodes', []))})" for r in t.get('releases', [])) or '-'
        say(f"- **{t['track']}**: {rel}")


def listings(ed, eid, only, video_tr, apply):
    say('## Mağaza girişleri · ' + ('UYGULANIYOR' if apply else 'ÖNİZLEME (değişiklik yok)'))
    remote = {l['language']: l for l in ed.listings().list(packageName=PKG, editId=eid).execute().get('listings', [])}
    langs = sorted(p.name for p in ROOT.iterdir() if (p / 'title.txt').exists())
    if only:
        langs = [l for l in langs if l in only]
    changed = 0
    for lang in langs:
        L, R = local(lang), remote.get(lang, {})
        patch = {k: L[k] for k in ('title', 'shortDescription', 'fullDescription') if L[k] is not None and L[k] != R.get(k, '')}
        if lang == 'tr-TR' and video_tr and video_tr != R.get('video', ''):
            patch['video'] = video_tr
        imgs = ed.images().list(packageName=PKG, editId=eid, language=lang, imageType='phoneScreenshots').execute().get('images', [])
        same = [i.get('sha256') for i in imgs] == [sha256(p) for p in L['shots']]
        notes = []
        if not R:
            notes.append('dil Play\'de yok, eklenecek')
        if patch:
            notes.append('metin: ' + ', '.join(patch))
        if L['shots'] and not same:
            notes.append(f"kareler: {len(imgs)} → {len(L['shots'])} ({', '.join(p.name for p in L['shots'])})")
        say(f"- **{lang}**: " + ('; '.join(notes) if notes else 'aynı, dokunulmaz'))
        if not notes:
            continue
        changed += 1
        if not apply:
            continue
        if patch:
            body = {'language': lang, **{k: R.get(k, '') for k in ('title', 'shortDescription', 'fullDescription', 'video') if k in R}, **patch}
            ed.listings().update(packageName=PKG, editId=eid, language=lang, body=body).execute()
        if L['shots'] and not same:
            ed.images().deleteall(packageName=PKG, editId=eid, language=lang, imageType='phoneScreenshots').execute()
            for p in L['shots']:
                ed.images().upload(packageName=PKG, editId=eid, language=lang, imageType='phoneScreenshots',
                                   media_body=MediaFileUpload(str(p), mimetype='image/jpeg')).execute()
    say('')
    say(f'{changed} dilde değişiklik ' + ('yapıldı.' if apply else 'yapılacak.'))
    return changed


TEST_TRACKS = ('internal', 'alpha', 'beta')  # production is never touched from here


def notes_for(name):
    """The release notes block (<en-US>...</en-US>) under '## <version name>' in store/release-notes.md."""
    s = (ROOT.parent / 'release-notes.md').read_text(encoding='utf-8')
    m = re.search(r'^## ' + re.escape(name) + r'(?![\d.]).*?(?=^## |\Z)', s, re.S | re.M)
    if not m:
        return []
    return [{'language': lang, 'text': txt.strip()} for lang, txt in re.findall(r'<([a-z]{2,3}(?:-[A-Za-z0-9]+)?)>\n(.*?)\n</\1>', m.group(0), re.S)]


def release(ed, eid, track, code, apply, aab='', vname=''):
    say(f'## Sürüm · {track} · ' + ('UYGULANIYOR' if apply else 'ÖNİZLEME (değişiklik yok)'))
    if track not in TEST_TRACKS:
        sys.exit(f'{track}: yalnızca test kanalları ({", ".join(TEST_TRACKS)})')
    codes = {str(b['versionCode']) for b in ed.bundles().list(packageName=PKG, editId=eid).execute().get('bundles', [])}
    tracks = {t['track']: t.get('releases', []) for t in ed.tracks().list(packageName=PKG, editId=eid).execute().get('tracks', [])}
    if aab:
        # a new bundle from the Android build: uploaded inside this edit, so a refused run leaves nothing behind
        p = Path(aab)
        if not p.is_file():
            sys.exit(f'Paket bulunamadı: {aab}')
        if code in codes:
            sys.exit(f'Kod {code} zaten Play\'de; paketi tekrar yüklemeye gerek yok (paketsiz çalıştır)')
        if not re.fullmatch(r'\d+\.\d+\.\d+', vname or ''):
            sys.exit('Paketle birlikte sürüm adı gerekli (ör. 1.4.9)')
        say(f'Paket: {p.name} ({p.stat().st_size / 1e6:.1f} MB), kod {code} olarak yüklenecek')
        if apply:
            up = ed.bundles().upload(packageName=PKG, editId=eid,
                                     media_body=MediaFileUpload(str(p), mimetype='application/octet-stream', resumable=True)).execute()
            got = str(up.get('versionCode'))
            if got != code:
                sys.exit(f'Paketteki kod {got}, beklenen {code}: hiçbir şey kaydedilmedi')
            say(f'Yüklendi: kod {got}')
        name = f'{code} ({vname})'
    else:
        if code not in codes:
            sys.exit(f'Kod {code} Play\'e yüklenmemiş (yüklü kodlar: {", ".join(sorted(codes, key=int))})')
        name = next((r['name'] for rs in tracks.values() for r in rs if code in r.get('versionCodes', []) and r.get('name')), code)
    ver = re.search(r'\(([\d.]+)\)', name)
    notes = notes_for(ver.group(1)) if ver else []
    cur = tracks.get(track, [])
    say('Şu an: ' + (', '.join(f"{r.get('name')} ({r.get('status')})" for r in cur) or '-'))
    say(f'Yeni: **{name}** (kod {code}, tüm test kullanıcılarına)')
    for n in notes:
        say(f"Sürüm notu ({n['language']}, {len(n['text'])} kr):")
        say('```')
        say(n['text'])
        say('```')
    if not notes:
        sys.exit(f'release-notes.md içinde "{name}" için <en-US> notu bulunamadı')
    if any(len(n['text']) > 500 for n in notes):
        sys.exit('Sürüm notu 500 karakteri geçiyor')
    if any(code in r.get('versionCodes', []) and r.get('status') == 'completed' for r in cur):
        say('Bu kod bu kanalda zaten yayında; değişiklik yok.')
        return 0
    if apply:
        body = {'track': track, 'releases': [{'name': name, 'versionCodes': [code], 'status': 'completed', 'releaseNotes': notes}]}
        ed.tracks().update(packageName=PKG, editId=eid, track=track, body=body).execute()
    return 1


def main():
    a = argparse.ArgumentParser()
    a.add_argument('task', choices=['status', 'listings', 'release'])
    a.add_argument('--apply', action='store_true', help='keep the edit (otherwise it is discarded)')
    a.add_argument('--send-for-review', action='store_true', help='send the committed changes for review right away')
    a.add_argument('--only', default='', help='comma-separated languages, e.g. tr-TR,de-DE')
    a.add_argument('--video-tr', default='', help='YouTube link for the tr-TR listing')
    a.add_argument('--track', default='alpha', help='release: internal, alpha or beta')
    a.add_argument('--version-code', default='', help='release: version code already uploaded to Play (or in --aab)')
    a.add_argument('--aab', default='', help='release: an .aab from the Android build to upload first')
    a.add_argument('--version-name', default='', help='release: version name for an uploaded .aab, e.g. 1.4.9')
    o = a.parse_args()
    if o.video_tr and not o.video_tr.startswith(('https://www.youtube.com/', 'https://youtu.be/', 'https://youtube.com/')):
        sys.exit('video-tr bir YouTube bağlantısı olmalı')
    ed = api().edits()
    eid = ed.insert(packageName=PKG, body={}).execute()['id']
    keep = False
    try:
        if o.task == 'status':
            status(ed, eid)
        else:
            if o.task == 'release':
                if not o.version_code.isdigit():
                    sys.exit('release için --version-code gerekli')
                n = release(ed, eid, o.track, o.version_code, o.apply, o.aab, o.version_name)
            else:
                n = listings(ed, eid, [x.strip() for x in o.only.split(',') if x.strip()], o.video_tr.strip(), o.apply)
            if o.apply and n:
                ed.validate(packageName=PKG, editId=eid).execute()
                sent = o.send_for_review
                try:
                    ed.commit(packageName=PKG, editId=eid, changesNotSentForReview=not sent).execute()
                except HttpError as e:
                    # Play refuses to send for review from the API while changes made in the Console UI are waiting;
                    # then the edit is saved unsent and the review is started from Publishing overview.
                    if not sent or 'changesNotSentForReview' not in str(e):
                        raise
                    say('Play, Console\'da bekleyen değişiklikler yüzünden API\'den incelemeye göndermeye izin vermedi; gönderilmeden kaydediliyor.')
                    ed.commit(packageName=PKG, editId=eid, changesNotSentForReview=True).execute()
                    sent = False
                keep = True
                say('Kaydedildi. ' + ('İncelemeye gönderildi.' if sent else 'Play Console › Yayın özeti\'nde "incelemeye gönder" bekliyor.'))
    finally:
        if not keep:
            ed.delete(packageName=PKG, editId=eid).execute()
        if SUMMARY:
            Path(SUMMARY).write_text('\n'.join(out) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()
