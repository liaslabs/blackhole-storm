"""One-time (in-app) products through the Play Developer API (run by .github/workflows/play-store.yml, task "products").

Reads the product list in store/play-urunleri.md (id, US price, Turkey price, en-US and tr-TR name and description)
and the other store languages from store/play-urunleri-diller.json.
Without --apply it only reads: what Play already has, and what would be created with which prices.
With --apply it creates the missing products (purchase option "default", buy, backward compatible), prices every
region from the US price with Play's own conversion, sets Turkey to its TL price, and activates them.
A product that already has an active purchase option keeps its prices; only its names and descriptions are brought
in line with the files. The VIP subscription (store/play-abonelik.json) is created the same way with one monthly
auto-renewing base plan; once it exists only its texts are updated.
"""
import argparse, json, os, re, sys
from decimal import Decimal
from pathlib import Path

from google.auth.transport.requests import AuthorizedSession
from google.oauth2 import service_account

PKG = 'com.liaslabs.blackholestorm'
BASE = f'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PKG}'
LIST = Path(__file__).resolve().parent.parent / 'store' / 'play-urunleri.md'
LANGS = LIST.with_name('play-urunleri-diller.json')  # the other store languages: {lang: {id: [title, description]} or another lang}
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
    more = {k: v for k, v in json.loads(LANGS.read_text(encoding='utf-8')).items() if k != '_'} if LANGS.exists() else {}
    for p in ps:
        p['listings'] = [('en-US',) + p['en'], ('tr-TR',) + p['tr']]
        for lang, v in sorted(more.items()):
            v = more[v] if isinstance(v, str) else v
            if p['id'] not in v:
                sys.exit(f"{lang}: {p['id']} çevirisi yok")
            p['listings'].append((lang,) + tuple(v[p['id']]))
        for lang, t, d in p['listings']:
            if len(t) > 55 or not 50 <= len(d) <= 200:
                sys.exit(f"{p['id']} ({lang}): ad en çok 55, açıklama 50-200 karakter olmalı")
    return ps


def listing_body(p):
    return [{'languageCode': l, 'title': t, 'description': d} for l, t, d in p['listings']]


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
    onetime(s, plan, o.apply)
    subscription(s, o.apply)


def onetime(s, plan, apply):
    say('## Tek seferlik ürünler · ' + ('UYGULANIYOR' if apply else 'ÖNİZLEME (değişiklik yok)'))

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
    todo, relist = [], []
    for p in plan:
        cur = have.get(p['id'])
        live = cur and any(po.get('state') == 'ACTIVE' for po in cur.get('purchaseOptions', []))
        same = cur and sorted((x['languageCode'], x.get('title'), x.get('description')) for x in cur.get('listings', [])) == sorted(p['listings'])
        if p['usd'] not in conv:
            conv[p['usd']] = call(s, 'POST', '/pricing:convertRegionPrices', json={'price': money('USD', p['usd'])})
        c = conv[p['usd']]
        regions = c.get('convertedRegionPrices', {})
        state = (('etkin, metinler aynı' if same else f"etkin, metinler güncellenecek ({len(p['listings'])} dil)") if live
                 else ('taslak var, tamamlanacak' if cur else 'oluşturulacak'))
        say(f"| `{p['id']}` | {state} | ${p['usd']} | ₺{p['try']} | {len(regions)} | {p['en'][0]} | {p['tr'][0]} |")
        if not live:
            todo.append(p)
        elif not same:
            relist.append(p)
    say('')
    say('Diller: ' + ', '.join(l for l, _, _ in plan[0]['listings']))
    say('')
    if not apply:
        say(f'{len(todo)} ürün oluşturulacak, {len(relist)} ürünün metinleri güncellenecek. Hiçbir şey değiştirilmedi.')
        return

    for p in relist:
        ver = (conv[p['usd']].get('regionVersion') or {}).get('version') or '2022/02'
        call(s, 'PATCH', f"/onetimeproducts/{p['id']}", json={'packageName': PKG, 'productId': p['id'], 'listings': listing_body(p)},
             params={'updateMask': 'listings', 'regionsVersion.version': ver})
        say(f"- `{p['id']}` metinleri güncellendi ({len(p['listings'])} dil)")

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
                'listings': listing_body(p),
                'purchaseOptions': [po]}
        call(s, 'PATCH', f"/onetimeproducts/{p['id']}", json=body,  # Play spells this one path in lower case
             params={'updateMask': 'listings,purchaseOptions', 'allowMissing': 'true', 'regionsVersion.version': ver})
        call(s, 'POST', f"/oneTimeProducts/{p['id']}/purchaseOptions:batchUpdateStates",
             json={'requests': [{'activatePurchaseOptionRequest': {'packageName': PKG, 'productId': p['id'], 'purchaseOptionId': 'default'}}]})
        say(f"- `{p['id']}` oluşturuldu ve etkinleştirildi")

    say('')
    say('## Play\'deki son durum')
    j = call(s, 'GET', '/oneTimeProducts', params={'pageSize': 100})
    say('| Kimlik | Seçenek | Durum | ABD | Türkiye | Dil |')
    say('|---|---|---|---|---|---|')
    for p in sorted(j.get('oneTimeProducts', []), key=lambda x: x['productId']):
        for po in p.get('purchaseOptions', []):
            pr = {x['regionCode']: x.get('price') for x in po.get('regionalPricingAndAvailabilityConfigs', [])}
            say(f"| `{p['productId']}` | {po.get('purchaseOptionId')} | {po.get('state')} | "
                f"{show(pr['US']) if pr.get('US') else '-'} | {show(pr['TR']) if pr.get('TR') else '-'} | {len(p.get('listings', []))} |")


SUB = LIST.with_name('play-abonelik.json')  # the VIP subscription: one auto-renewing monthly base plan


def subscription(s, apply):
    if not SUB.exists():
        return
    cfg = json.loads(SUB.read_text(encoding='utf-8'))
    pid, bp = cfg['id'], cfg['base_plan']
    ls = cfg['listings']
    listings = []
    for lang, v in sorted(ls.items()):
        v = ls[v] if isinstance(v, str) else v
        t, d, ben = v
        if len(t) > 55 or len(d) > 200 or len(ben) > 4 or any(len(x) > 40 for x in ben):
            sys.exit(f'{pid} ({lang}): ad en çok 55, açıklama 200, en fazla 4 fayda ve her biri 40 karakter')
        listings.append({'languageCode': lang, 'title': t, 'description': d, 'benefits': ben})
    say('')
    say('## Abonelik · ' + ('UYGULANIYOR' if apply else 'ÖNİZLEME (değişiklik yok)'))
    have = {x['productId']: x for x in call(s, 'GET', '/subscriptions', params={'pageSize': 100}).get('subscriptions', [])}
    cur = have.get(pid)
    c = call(s, 'POST', '/pricing:convertRegionPrices', json={'price': money('USD', cfg['usd'])})
    ver = (c.get('regionVersion') or {}).get('version') or '2022/02'
    regions = []
    for rc, rp in sorted(c.get('convertedRegionPrices', {}).items()):
        regions.append({'regionCode': rc, 'newSubscriberAvailability': True, 'price': money('TRY', cfg['try']) if rc == 'TR' else rp['price']})
    if not any(x['regionCode'] == 'TR' for x in regions):
        regions.append({'regionCode': 'TR', 'newSubscriberAvailability': True, 'price': money('TRY', cfg['try'])})
    plan = {'basePlanId': bp, 'regionalConfigs': regions,
            'autoRenewingBasePlanType': {'billingPeriodDuration': 'P1M', 'gracePeriodDuration': 'P3D', 'accountHoldDuration': 'P30D',
                                         'resubscribeState': 'RESUBSCRIBE_STATE_ACTIVE', 'legacyCompatible': True}}
    other = c.get('convertedOtherRegionsPrice') or {}
    if other.get('usdPrice') and other.get('eurPrice'):
        plan['otherRegionsConfig'] = {'usdPrice': other['usdPrice'], 'eurPrice': other['eurPrice'], 'newSubscriberAvailability': True}
    live = cur and any(b.get('basePlanId') == bp and b.get('state') == 'ACTIVE' for b in cur.get('basePlans', []))
    say(f"`{pid}` / `{bp}`: {'etkin' if live else ('var, etkin değil' if cur else 'oluşturulacak')} · aylık, otomatik yenilenen · "
        f"ABD ${cfg['usd']} · Türkiye ₺{cfg['try'].replace('.', ',')} · {len(regions)} ülke · {len(listings)} dil")
    if not apply:
        return
    body = {'packageName': PKG, 'productId': pid, 'listings': listings}
    if not cur:
        body['basePlans'] = [plan]
        call(s, 'POST', '/subscriptions', json=body, params={'productId': pid, 'regionsVersion.version': ver})
        say(f'- `{pid}` oluşturuldu')
    else:  # an existing subscription: only its texts are brought in line; prices of a live plan stay as they are
        call(s, 'PATCH', f'/subscriptions/{pid}', json=body, params={'updateMask': 'listings', 'regionsVersion.version': ver})
        say(f'- `{pid}` metinleri güncellendi ({len(listings)} dil)')
    if not live:
        call(s, 'POST', f'/subscriptions/{pid}/basePlans/{bp}:activate', json={'packageName': PKG, 'productId': pid, 'basePlanId': bp})
        say(f'- `{pid}` / `{bp}` etkinleştirildi')
    x = call(s, 'GET', f'/subscriptions/{pid}')
    for b in x.get('basePlans', []):
        pr = {r['regionCode']: r.get('price') for r in b.get('regionalConfigs', [])}
        say(f"Son durum: `{b['basePlanId']}` {b.get('state')} · ABD {show(pr['US']) if pr.get('US') else '-'} · "
            f"Türkiye {show(pr['TR']) if pr.get('TR') else '-'} · {len(x.get('listings', []))} dil")


if __name__ == '__main__':
    try:
        main()
    finally:
        if SUMMARY:
            Path(SUMMARY).write_text('\n'.join(out) + '\n', encoding='utf-8')
