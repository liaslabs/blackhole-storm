"""One-time (in-app) products through the Play Developer API (run by .github/workflows/play-store.yml, task "products").

Reads the product list in store/play-urunleri.md (id, US price, Turkey price, en-US and tr-TR name and description).
Without --apply it only reads: what Play already has, and what would be created with which prices.
With --apply it creates the missing products (purchase option "default", buy, backward compatible), prices every
region from the US price with Play's own conversion, sets Turkey to its TL price, and activates them.
A product that already has an active purchase option is left alone. Subscriptions are not touched.
"""
import argparse, json, os, re, sys
from decimal import Decimal
from pathlib import Path

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

PKG = 'com.liaslabs.blackholestorm'
BASE = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}'
LIST = Path(__file__).resolve().parent.parent / 'store' / 'play-urunleri.md'
SUMMARY = os.environ.get('GITHUB_STEP_SUMMARY')
out = []


def say(s=''):
    print(s)
    out.append(s)


def session():
    info = json.loads(os.environ['PLAY_SERVICE_ACCOUNT_JSON'])
    cred = service_account.Credentials.from_service_account_info(info, scopes=['https://www.googleapis.com/auth/androidpublisher'])
    return AuthorizedSession(cred)


def money(cur, amount):
    d = Decimal(amount)
    return {'currencyCode': cur, 'units': str(int(d)), 'nanos': int((d - int(d)) * 1000000000)}


def show(m):
    return f"{m['currencyCode']} {int(m.get('units', 0)) + m.get('nanos', 0) / 1e9:.2f}"


def products():
    row = re.compile(r'^\d+\. ([a-z0-9_.]+) \| \$([\d.]+) \| ₺([\d.,]+) \| (.+?) \| (.+?) \| (.+?) \| (.+)$')
    ps = []
    for line in LIST.read_text(encoding='utf-8').splitlines():
        m = row.match(line.strip())
        if m:
            pid, usd, tl, en_t, en_d, tr_t, tr_d = m.groups()
            ps.append({'id': pid, 'usd': usd, 'try': tl.replace('.', '').replace(',', '.'),
                       'en': (en_t, en_d), 'tr': (tr_t, tr_d)})
    for p in ps:
        for t, d in (p['en'], p['tr']):
            if len(t) > 55 or not 50 <= len(d) <= 200:
                sys.exit(f"{p['id']}: ad en çok 55, açıklama 50-200 karakter olmalı")
    return ps


def call(s, method, path, **kw):
    r = s.request(method, BASE + path, **kw)
    if r.status_code >= 400:
        say(f'**Play hata verdi ({r.status_code})** `{method} {path}`')
        say('```')
        say(r.text[:1500])
        say('```')
        if r.status_code == 403:
            say('Hizmet hesabının bu iş için izni yok: Play Console › Kullanıcılar ve izinler › hizmet hesabı › uygulama izinleri.')
        sys.exit(1)
    return r.json() if r.text else {}


def main():
    a = argparse.ArgumentParser()
    a.add_argument('--apply', action='store_true', help='create and activate the missing products')
    o = a.parse_args()
    s, plan = session(), products()
    say('## Tek seferlik ürünler · ' + ('UYGULANIYOR' if o.apply else 'ÖNİZLEME (değişiklik yok)'))

    have, tok = {}, None
    while True:
        j = call(s, 'GET', '/oneTimeProducts', params={'pageSize': 100, **({'pageToken': tok} if tok else {})})
        for p in j.get('oneTimeProducts', []):
            have[p['productId']] = p
        tok = j.get('nextPageToken')
        if not tok:
            break
    say(f'Okuma izni var. Play\'de şu an {len(have)} tek seferlik ürün var' + (': ' + ', '.join(sorted(have)) if have else '.'))
    say('')

    conv = {}
    say('| Kimlik | Durum | ABD | Türkiye | Fiyatlanan ülke | EN ad | TR ad |')
    say('|---|---|---|---|---|---|---|')
    todo = []
    for p in plan:
        cur = have.get(p['id'])
        live = cur and any(po.get('state') == 'ACTIVE' for po in cur.get('purchaseOptions', []))
        if p['usd'] not in conv:
            conv[p['usd']] = call(s, 'POST', '/pricing:convertRegionPrices', json={'price': money('USD', p['usd'])})
        c = conv[p['usd']]
        regions = c.get('convertedRegionPrices', {})
        state = 'etkin, dokunulmaz' if live else ('taslak var, tamamlanacak' if cur else 'oluşturulacak')
        say(f"| `{p['id']}` | {state} | ${p['usd']} | ₺{p['try']} | {len(regions)} | {p['en'][0]} | {p['tr'][0]} |")
        if not live:
            todo.append(p)
    say('')
    if not o.apply:
        say(f'{len(todo)} ürün oluşturulacak. Hiçbir şey değiştirilmedi.')
        return

    for p in todo:
        c = conv[p['usd']]
        ver = (c.get('regionVersion') or {}).get('version') or '2022/02'
        cfg = []
        for rc, rp in sorted(c.get('convertedRegionPrices', {}).items()):
            price = money('TRY', p['try']) if rc == 'TR' else rp['price']
            cfg.append({'regionCode': rc, 'price': price, 'availability': 'AVAILABLE'})
        if not any(x['regionCode'] == 'TR' for x in cfg):
            cfg.append({'regionCode': 'TR', 'price': money('TRY', p['try']), 'availability': 'AVAILABLE'})
        other = c.get('convertedOtherRegionsPrice') or {}
        po = {'purchaseOptionId': 'default',
              'buyOption': {'legacyCompatible': True, 'multiQuantityEnabled': False},
              'regionalPricingAndAvailabilityConfigs': cfg}
        if other.get('usdPrice') and other.get('eurPrice'):
            po['newRegionsConfig'] = {'usdPrice': other['usdPrice'], 'eurPrice': other['eurPrice'], 'availability': 'AVAILABLE'}
        body = {'packageName': PKG, 'productId': p['id'],
                'listings': [{'languageCode': 'en-US', 'title': p['en'][0], 'description': p['en'][1]},
                             {'languageCode': 'tr-TR', 'title': p['tr'][0], 'description': p['tr'][1]}],
                'purchaseOptions': [po]}
        call(s, 'PATCH', f"/oneTimeProducts/{p['id']}", json=body,
             params={'updateMask': 'listings,purchaseOptions', 'allowMissing': 'true', 'regionsVersion.version': ver})
        call(s, 'POST', f"/oneTimeProducts/{p['id']}/purchaseOptions:batchUpdateStates",
             json={'requests': [{'activatePurchaseOptionRequest': {'packageName': PKG, 'productId': p['id'], 'purchaseOptionId': 'default'}}]})
        say(f"- `{p['id']}` oluşturuldu ve etkinleştirildi")

    say('')
    say('## Play\'deki son durum')
    j = call(s, 'GET', '/oneTimeProducts', params={'pageSize': 100})
    say('| Kimlik | Seçenek | Durum | ABD | Türkiye |')
    say('|---|---|---|---|---|')
    for p in sorted(j.get('oneTimeProducts', []), key=lambda x: x['productId']):
        for po in p.get('purchaseOptions', []):
            pr = {x['regionCode']: x.get('price') for x in po.get('regionalPricingAndAvailabilityConfigs', [])}
            say(f"| `{p['productId']}` | {po.get('purchaseOptionId')} | {po.get('state')} | "
                f"{show(pr['US']) if pr.get('US') else '-'} | {show(pr['TR']) if pr.get('TR') else '-'} |")


if __name__ == '__main__':
    try:
        main()
    finally:
        if SUMMARY:
            Path(SUMMARY).write_text('\n'.join(out) + '\n', encoding='utf-8')
