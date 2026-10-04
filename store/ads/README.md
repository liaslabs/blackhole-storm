# Reklam materyalleri (Google Ads uygulama kampanyası)

Uygulama herkese açık yayına çıktıktan sonra kullanılır. Google Ads'te **Kampanya oluştur › Uygulama tanıtımı ›
Uygulama yüklemeleri › Android › Blackhole Storm** seçilir; reklamları Google bu materyallerden kendisi birleştirir
(YouTube, Play Store, Arama, Discover ve reklam ağı). Yükleme başına ödeme yapılır; ilk deneme için günlük 300–500 ₺ yeterli.

## Materyaller

| Ne | Dosya / bağlantı |
|---|---|
| Oynanabilir reklam (HTML5) | `playable-google-ads.zip` (tek `index.html`, 15 KB, 9 dil, `ExitApi.exit()` ile mağazaya gider). Önizleme: https://liaslabs.github.io/blackhole-storm/onizleme/playable/ |
| Video (25 sn tanıtım ve 15 sn reklam, dikey 1080×1920, müzikli) | `video/blackhole-storm-promo-25s-{en,tr}.mp4`, `video/blackhole-storm-ad-15s-{en,tr}.mp4`: YouTube'a **Liste dışı** yüklenir, bağlantılar kampanyaya ve Play'deki "Tanıtım videosu" alanına eklenir |
| Görseller | `store/listings/<dil>/frames/` (1080×1920 tanıtım kareleri) |
| Simge | `icons/icon-512.png` |

## Metinler

**Başlıklar (en fazla 30 karakter, 5 tane)**

| English | Türkçe |
|---|---|
| Swallow the universe | Evreni yut |
| Grow your black hole | Kara deliğini büyüt |
| Become a quasar | Kuasara dönüş |
| Defeat giant bosses | Dev bossları alt et |
| One finger. Endless fun. | Tek parmak, bitmeyen eğlence |

**Açıklamalar (en fazla 90 karakter, 5 tane)**

| English | Türkçe |
|---|---|
| Drag your black hole, swallow planets and grow. Real Hubble and Webb images! | Kara deliğini sürükle, gezegenleri yut ve büyü. Gerçek Hubble ve Webb görüntüleri! |
| Hundreds of levels, epic bosses and powers: shield, supernova, quasar jet. | Yüzlerce seviye, dev bosslar ve güçler: kalkan, süpernova, kuasar jeti. |
| Survive the Daily Storm and climb the world ranking. | Günün Fırtınasında hayatta kal, dünya sıralamasında yüksel. |
| Free to play, 10 languages, plays offline. | Ücretsiz, 10 dil, internetsiz oynanır. |
| Upgrade your black hole in the Laboratory and evolve it into a quasar. | Laboratuvarda kara deliğini geliştir ve kuasara dönüştür. |

## Oynanabilir reklam teknik notları

- Google Ads HTML5 kuralları: tek `.zip`, en fazla 5 MB, dışarıdan dosya yüklemez (yalnızca Google'ın `exitapi.js`'i), dikey.
- Oyun 40 saniye ya da Dev Gezegen yutulunca biter; sağ üstteki "YÜKLE" düğmesi her an mağazaya gider.
- Kaynak: `onizleme/playable/index.html` (değiştirirsen zip'i yeniden oluştur: `cd onizleme/playable && zip ../../store/ads/playable-google-ads.zip index.html`).

## Video notları

- Görüntüler oyunun kendisinden kare kare çekildi (otomatik oyuncu oynuyor, montaj efekti yok): seviye 29, seviye 30 bossu, seviye 181 kuasar jeti, Hayatta Kalma (jetli) ve kapanış kartı.
- 15 sn kesit: yut (3 sn), boss (4 sn), kuasar jeti (3 sn), Hayatta Kalma (2 sn), kapanış (3 sn).
- Başlıklar: SWALLOW EVERYTHING · GROW BIGGER · DEFEAT GIANT BOSSES · UNLEASH QUASAR POWER · SURVIVE THE STORM (TR sürümünde Türkçe).
- Müzik oyunun kendi parçası (`music/z4.mp3`), telif sorunu yok.
- Play'in tanıtım videosu alanı YouTube bağlantısı ister; video herkese açık ya da liste dışı olmalı, reklamlar kapalı olmalı, yaş sınırı olmamalı.
