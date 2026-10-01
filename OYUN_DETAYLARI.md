# Blackhole Storm · Oyun Detayları

Lias Labs · HTML5 mobil oyun (web + Google Play/TWA)
Canlı sürüm: https://liaslabs.github.io/blackhole-storm/
Bu belgenin üretildiği sürüm: `f3596d4 · 2026-09-29`

Bu belge oyunun kaynak kodundan (seviye kuralları, oyun içi rehber, tanıtım kartları) otomatik çıkarılıp düzenlendi. Oyun içindeki metinlerle birebir aynıdır.

## 1. Oyunun özü

Oyuncu bir kara deliği parmağıyla sürükler, uzaydaki cisimleri yutarak büyür ve her seviyede bir hedefe ulaşır. Meteorlardan kaçar, güçleri doğru anda kullanır, her 10 seviyede bir boss yener.

- Kara deliği parmağınla sürükle. Parmağını kaldırınca olduğu yerde kalır.
- Bir cisim kesikli çekim alanına girince içeri çekilir, spiral çizerek yutulur.
- Yuttukça büyürsün: çekim alanın genişler, daha büyük cisimleri yutabilirsin. Bir süre yemezsen yavaşça küçülürsün.
- Üstteki hedef puana ulaşınca seviye tamamlanır. Meteorlara çarpma: her çarpışma kara deliğin etrafındaki bir yayı koparır, 3 yay = 1 can.

### Puan
- **🔥 COMBO**: Arka arkaya yut: ×2 ile ×5 arası çarpan. Birkaç saniye yutmazsan combo sıfırlanır.
- **🎯 KUSURSUZ YUTUŞ**: Cismi çekim alanına tam ortadan sokarsan puanın ×1,5.
- **☄️ KUSURSUZ KAÇIŞ**: Bir meteorun kıl payı yanından geç: +50 puan, Vortex ve combo.
- **💢 VORTEX**: Bar dolunca ekrana dokun: 5 saniye dev çekim, puan ×2, meteorlar sana zarar veremez.

### Kara deliğin etrafındaki halkalar
- **⭕ ÇEKİM ALANI**: Kara deliğin etrafındaki soluk geniş halka çekim alanının sınırıdır: içine giren cisimler sana çekilir. Büyüdükçe genişler. Cismi alanın tam ortasından içeri alırsan KUSURSUZ YUTUŞ.
- **🟠 TURUNCU HALKA**: Vortex açıkken kalan süreyi gösterir.
- **🔵 MAVİ HALKA**: Süpernova koruması: meteorlar sana zarar veremez.
- **🟣 MOR TİTREYEN HALKA**: Overload: daha güçlüsün ama yönetmek zor.
- **🟡 SARI HALKA**: Kalkan açık: çarpan meteor parçalanır.
- **🔴 KIRMIZI YANIP SÖNEN**: Darbe aldın; kısa süre dokunulmazsın.
- **💜 MOR DALGALAR**: Bir süredir yemediğin için küçülüyorsun.
- **🌈 ALTTAKİ NOKTALAR**: Spektrum serin: 5 farklı tür = bonus.

## 2. Modlar
- **🪐 KLASİK**: Seviye seviye ilerle, her seviyede yeni bir şey.
- **🔥 ZOR SEVİYE**: Haritada kırmızı halkalı ve alevli seviyeler: hedefe süre dolmadan ulaşmalısın, meteorlar daha sık. Kalkan, Süpernova ve Hawking en çok burada işe yarar. Geçince ekstra yıldız kazanırsın.
- **🔥 ZOR MOD**: 30. seviyeyi geçince açılır. Seviye 1'den, klasikten ayrı bir ilerlemeyle: meteorlar 1,6 kat, hedef puan 1,5 kat (süreli seviyelerde 1,15), küçülme 2 kat hızlı, seviye başına 2 kalp (1 kalp kaybıyla da 3 yıldız alınabilir), ağır çekim yok, ilk seviyede öğretici yok. Yıldız ödülleri 2 kat; Kaptanın Hediyesi ve risk kartı yok.
- **☠️ HAYATTA KAL · GÜNÜN FIRTINASI**: 180 saniye, herkes için aynı fırtına. Hız 8'den başlar, her 30 saniyede 5 artar; meteorlar 1,5 kat, yaylar onarılmaz, ağır çekim yok. 60. ve 120. saniyede meteor kuşağı gelir. Hayatta kalınan her saniye +20 puan; sonuna kadar dayanırsan +3.000 ve kalan her kalp için +1.500. Dünya sıralaması bu skora göre; sunucu 200 saniyeden uzun koşuları reddeder.

### Meydan okuma seviyeleri
- **💨 HIZLI KÜÇÜLME** (6, 16, 22; sonra x4 seviyeleri): cisim sayısı 1,5 kat, yemeyi bırakınca kara delik 3 kat hızlı küçülür (Zor Mod'da 4 kat). Küçülme halkası kırmızıdır.
- **☄ METEOR KUŞAĞI** (8, 18, 28; sonra x7 seviyeleri ve 31'den itibaren rastgele olay): 2,8 sn uyarı ("⚠ DİKKAT · METEOR KUŞAĞINA GİRDİN"), sonra ~12 sn yalnızca meteor; hepsi aynı açıyla paralel şeritlerde akar, bir şerit hep boş kalır ve 4 dalgada bir kayar. Kuşak boyunca küçülme durur. Hasarsız geçiş: +500 puan ve +25 ⭐ (Zor Mod'da +50 ⭐).

### Ağırlaştıran engeller
- **🌫 YAPIŞKAN NEBULA** (35. seviyeden sonra rastgele olay, 15 sn; Zor Mod'da daha sık; Günün Fırtınası'nın olay havuzunda da var): şekil değiştiren mor bir bulut ekranın bir yanından girip öbür yanından çıkar. İçindeyken kara delik sisin içinde silüet olarak görünür ve parmağı ağır takip eder (takip katsayısı 0,97 → 0,07). Yemeye devam edilir; meteorlar buluttan etkilenmez ve sisin içinde de kor gibi görünür.
- **❄ DONMUŞ KUYRUKLU YILDIZ** (25. seviyeden sonra): yutulunca puanı ×2 (120 taban), ama kara delik 3 sn buz tutar: kırağı, buz dikenleri, geri sayım halkası ve üstte ❄ çubuğu; bu sürede ağır hareket eder.
- **⚛️ ANTİMADDE** artık macenta hale ve beyaz "eksi" çizgisiyle çizilir; yeşil yalnızca "yenebilir" anlamına gelir.

### Geliştirici linki
- `https://liaslabs.github.io/blackhole-storm/dev.html` (ya da `?dev=1`): ayrı kayıt alanı (`bhs_dev`), ilk 1000 seviye açık, 50.000 ⭐ ve 5.000 💎 ile başlar, yakıt yok, Kaptanın Hediyesi araya girmez, haritadaki her seviye "BU SEVİYEDEN OYNA" ile gerçek seviye olarak oynanır, sıralamaya skor gönderilmez. Oyuncunun normal kaydına dokunmaz.

### Kademeli yardımlar
- **⏳ Ağır çekim**: 21. seviyeden itibaren (Zor Mod ve Günün Fırtınası'nda yok).
- **⚪ Gümüş kabuk**: 51. seviyeden itibaren kusursuz kaçışla (60'a kadar aynı anda en fazla 1) ve iki kayıptan sonraki yardım olarak; 61'den itibaren galibiyet serisi de verir (1 kabuk), 71'den itibaren 2 kabuk.
- **🟡 Altın kabuk**: 71. seviyeden itibaren.
- **📅 GÜNLÜK KOZMOS**: Herkes aynı evrende 60 saniye. Sonucunu paylaş, arkadaşına meydan oku.

## 3. Seviye planı (1–60)

Her seviyede en fazla bir yeni şey tanıtılır. Seviye başı kartı olan seviyelerde (güç ya da boss) başka tanıtım kartı gelmez. Bilgi kartları en az 8 saniye arayla ve seviye başına en fazla 2 tane çıkar; meteor ve antimadde gibi tehlikeler her zaman hemen anlatılır.

| Sv | Tür | Yeni tanıtılan | Seviye başı kartı | Boss | Zor | Bölge |
|---|---|---|---|---|---|---|
| 1 | Hedef puan |  |  |  |  | DERİN UZAY |
| 2 | Hedef puan | ☄️ METEOR | METEOR VE YAYLAR |  |  | DERİN UZAY |
| 3 | Hedef puan | 🔷 KRİSTAL |  |  |  | DERİN UZAY |
| 4 | Hedef puan | ⏱ ZAMAN TOPU |  |  |  | DERİN UZAY |
| 5 | Hedef puan | 💣 BOMBA GEZEGEN |  |  |  | DERİN UZAY |
| 6 | Hedef puan | ⚡ HIZ + AŞIRI YÜK |  |  |  | DERİN UZAY |
| 7 | Hedef puan | ↔️ YAN AKINTILAR | KALKAN |  |  | DERİN UZAY |
| 8 | Hedef puan | 🌀 MİNİ KARA DELİK |  |  |  | DERİN UZAY |
| 9 | Hedef puan | 🪨 ASTEROİT FIRTINASI |  |  | 🔥 60 sn | DERİN UZAY |
| 10 | Hedef puan | 🪐 DEV GEZEGEN | DEV GEZEGEN | DEV GEZEGEN |  | DERİN UZAY |
| 11 | Av | 🌐 360° + AV kuralı |  |  |  | WESTERLUND 2 |
| 12 | Hedef puan | ☄️ KUYRUKLU YILDIZ |  |  |  | WESTERLUND 2 |
| 13 | Hedef puan | 🌋 BÖLÜNEN GEZEGEN |  |  |  | WESTERLUND 2 |
| 14 | Hedef puan | ⚛️ ANTİMADDE |  |  |  | WESTERLUND 2 |
| 15 | Kısıtlı | 🧲 MIKNATIS + ASTEROİT YASAK kuralı |  |  |  | WESTERLUND 2 |
| 16 | Hedef puan | 💫 PULSAR |  |  |  | WESTERLUND 2 |
| 17 | Hedef puan | 🪐 UYDULU GEZEGEN |  |  |  | WESTERLUND 2 |
| 18 | Hedef puan | 🌫️ KARANLIK MADDE |  |  |  | WESTERLUND 2 |
| 19 | Hedef puan | 🌀 SOLUCAN DELİĞİ |  |  | 🔥 50 sn | WESTERLUND 2 |
| 20 | Hedef puan | 🔴 KIRMIZI DEV | KIRMIZI DEV | KIRMIZI DEV |  | WESTERLUND 2 |
| 21 | Hedef puan |  | SÜPERNOVA |  |  | ORİON BULUTSUSU |
| 22 | Hedef puan |  |  |  |  | ORİON BULUTSUSU |
| 23 | Koruyucu | 🛡 KORUYUCU |  |  |  | ORİON BULUTSUSU |
| 24 | Hedef puan |  | HAWKING SALINIMI |  |  | ORİON BULUTSUSU |
| 25 | Hedef puan |  |  |  | 🔥 50 sn | ORİON BULUTSUSU |
| 26 | Kısıtlı | 🌑 AY VE GEZEGEN YASAK (yeni yasak türü) |  |  |  | ORİON BULUTSUSU |
| 27 | Hedef puan |  |  |  |  | ORİON BULUTSUSU |
| 28 | Hedef puan |  | KUASAR JETİ |  |  | ORİON BULUTSUSU |
| 29 | Hedef puan |  |  |  | 🔥 50 sn | ORİON BULUTSUSU |
| 30 | Hedef puan | 💥 SÜPERNOVA | SÜPERNOVA | SÜPERNOVA |  | ORİON BULUTSUSU |
| 31 | Hedef puan |  |  |  |  | KARİNA BULUTSUSU |
| 32 | Rakip | 🌑 RAKİP KARA DELİK |  |  |  | KARİNA BULUTSUSU |
| 33 | Hedef puan |  |  |  |  | KARİNA BULUTSUSU |
| 34 | Hedef puan |  |  |  |  | KARİNA BULUTSUSU |
| 35 | Koruyucu |  |  |  |  | KARİNA BULUTSUSU |
| 36 | Hedef puan |  |  |  |  | KARİNA BULUTSUSU |
| 37 | Hedef puan |  |  |  |  | KARİNA BULUTSUSU |
| 38 | Kısıtlı |  |  |  |  | KARİNA BULUTSUSU |
| 39 | Hedef puan |  |  |  | 🔥🔥 45 sn | KARİNA BULUTSUSU |
| 40 | Hedef puan | ☢ RADYASYON | RADYASYON | DEV GEZEGEN ☢ |  | KARİNA BULUTSUSU |
| 41 | Av |  |  |  |  | KOZMİK UÇURUMLAR |
| 42 | Hedef puan |  |  |  |  | KOZMİK UÇURUMLAR |
| 43 | Hedef puan |  |  |  |  | KOZMİK UÇURUMLAR |
| 44 | Rakip |  |  |  |  | KOZMİK UÇURUMLAR |
| 45 | Hedef puan |  |  |  | 🔥 50 sn | KOZMİK UÇURUMLAR |
| 46 | Hedef puan |  |  |  |  | KOZMİK UÇURUMLAR |
| 47 | Koruyucu |  |  |  |  | KOZMİK UÇURUMLAR |
| 48 | Hedef puan |  |  |  |  | KOZMİK UÇURUMLAR |
| 49 | Hedef puan |  |  |  | 🔥🔥 45 sn | KOZMİK UÇURUMLAR |
| 50 | Düello (boss) | 👁 KARA DELİK İKİZİ | KARA DELİK İKİZİ | KARA DELİK İKİZİ |  | KOZMİK UÇURUMLAR |
| 51 | Hedef puan |  |  |  |  | DERİN UZAY |
| 52 | Hedef puan |  |  |  |  | DERİN UZAY |
| 53 | Av |  |  |  |  | DERİN UZAY |
| 54 | Hedef puan |  |  |  |  | DERİN UZAY |
| 55 | Hedef puan |  |  |  | 🔥 50 sn | DERİN UZAY |
| 56 | Rakip |  |  |  |  | DERİN UZAY |
| 57 | Hedef puan |  |  |  |  | DERİN UZAY |
| 58 | Hedef puan |  |  |  |  | DERİN UZAY |
| 59 | Hedef puan |  |  |  | 🔥🔥 45 sn | DERİN UZAY |
| 60 | Hedef puan |  |  | SÜPERNOVA ☢ |  | DERİN UZAY |

☢ = boss radyasyon dalgası saçar (40. seviyeden itibaren). 60'tan sonra aynı döngü sürer: her 10. seviye boss, her 50. seviye Kara Delik İkizi düellosu, aradaki seviyelerde kurallı seviyeler ve olaylar.

## 4. Cisimler

| Cisim | Puan | Yutmak için gereken boyut |
|---|---|---|
| Asteroit | 10 | her boyut |
| Ay | 25 | ×1.15 |
| Gezegen | 100 | ×1.35 |
| Kristal | 200 | her boyut |
| Altın gezegen | 500 | ×1.15 |
| Enerji topu | 15 | her boyut |
| Zaman topu | 25 | her boyut |
| Bomba gezegen | 50 | her boyut |
| Mini kara delik | 100 | her boyut |
| Meteor (tehlike) | 0 | yutulmaz |
| Gezegen parçası (boss) | 30 | her boyut |
| Kalkan parçası | 50 | her boyut |
| Kuyruklu yıldız | 60 | her boyut |
| Bölünen gezegen | 0 | yutulmaz |
| Plazma (boss) | 30 | her boyut |
| Altın av | 1500 | her boyut |
| Yarım gezegen | 80 | ×1.15 |
| Antimadde (tehlike) | 0 | her boyut |
| Mıknatıs taşı | 50 | her boyut |
| Pulsar | 150 | her boyut |
| Uydulu gezegen | 100 | ×1.15 |
| Uydu | 100 | her boyut |
| Karanlık madde | 120 | her boyut |
| Takımyıldız yıldızı | 150 | her boyut |
| Tehdit asteroidi (Koruyucu) | 120 | her boyut |
| Ayna taşı | 80 | her boyut |
| Kilonova altını | 220 | her boyut |

- **🪨 ASTEROİT · +10**: En sık gelen cisim. Hep yutulabilir.
- **🌑 AY · +25**: Kara deliğin 1,15M olunca yutulur. Küçükken seker.
- **🪐 GEZEGEN · +100**: 1,35M olunca yutulur.
- **🔷 KRİSTAL · +200**: Değerli ama genelde bir meteorun yanından gelir.
- **🌕 ALTIN GEZEGEN · +500**: Nadir ve hızlı, çoğu zaman meteorlarla birlikte.
- **⚡ ENERJİ**: Vortex barını hızla doldurur.
- **☄️ METEOR**: Yutulmaz. Önce yavaş girer, sonra hızlanır; kırmızı oklar yolunu gösterir. Çarparsa can gider, combo sıfırlanır.
- **🛡 KALKAN PARÇASI**: Seviye 4’ten itibaren arada bir gelir. 3 parça = 1 kalkan.
- **☄️ KUYRUKLU YILDIZ**: Çok hızlı geçer. Yakalarsan combo süren 2 saniye uzar.
- **🌋 BÖLÜNEN GEZEGEN**: Yutulmaz; çarpınca ikiye bölünür, yarım kütleli iki parça hızla uzaklaşır: yakala.
- **⚛️ ANTİMADDE**: Yutma: kara deliğini küçültür ve 3 saniye boyunca cisimleri iter; o sürede hiçbir şey yutulamaz (üstte yeşil süre çubuğu). Vortex açıkken zararsız.
- **🧲 MIKNATIS TAŞI**: Yut: 3 saniye yutabileceğin her şey sana çekilir. Laboratuvardaki Mıknatıs Bobini bu süreyi 8 saniyeye kadar uzatır.
- **💫 PULSAR**: Sadece parlarken yutulur: 150 puan.
- **🪐 UYDULU GEZEGEN**: Gezegeni, sonra 3 saniye içinde uydusunu yut: çift puan.
- **🌫️ KARANLIK MADDE**: Görünmez, yıldızları bükmesinden fark edilir: 120 puan.
- **🌀 SOLUCAN DELİĞİ**: Turuncu kapı yakındaki cisimleri çeker, mavi kapıdan kara deliğine gönderir.

## 5. Güçler, kabuklar ve bosslar
- **⚡ GALİBİYET SERİSİ**: Seviyeleri üst üste geçtikçe serin büyür ve sonraki seviyeye kabuklarla başlarsın: 1 galibiyet 1 gümüş kabuk, 2 ve üstü 2 gümüş kabuk. Kaybedip devam etmeden çıkarsan seri sıfırlanır; devam edersen korunur.
- **🔴 YAYLAR**: Kara deliğin etrafındaki üç kırmızı yay, o anki canın darbe hakkı. Her çarpma bir yay koparır; üçü de giderse bir kalp söner ve yaylar yenilenir. Enerji topu kopan bir yayı onarır.
- **⚪ GÜMÜŞ KABUK**: Üst üste 3 kusursuz kaçış bir yaya gümüş kabuk giydirir. Kabuk bir darbeyi emer. Aynı seviyede 2 kez kaybedersen seviyeye bir kabukla başlarsın.
- **🟡 ALTIN KABUK**: Boss'un zayıf noktalarını kırdıkça kazanılır. Bir darbeyi karşılar ve patlayıp etrafındaki meteorları siler.
- **⏱ ZAMAN TOPU**: Her şey 6 saniye yavaşlar, sen hızlı kalırsın.
- **💣 BOMBA GEZEGEN**: Çekim alanında 3 saniye tut: MEGA BOMBA yutabileceğin her cismi patlatır, tutulma efektiyle sana çeker; meteorlar parçalanır. Çok hızlı hareket edersen kaçar.
- **🌀 MİNİ KARA DELİK**: 6 saniye etrafında dönen yardımcı kara delik. Yuttukları sana akar, meteorları durdurur.
- **🟣 AŞIRI YÜK**: Sınıra kadar büyüyünce 15 saniye daha güçlü ama zor yönetilen bir kara delik. Sonunda çöker.
- **🪐 DEV GEZEGEN**: Boss (10, 40, 70…): hızla çarp ya da kopan parçaları yut. Yeşile dönünce bütünüyle yut.
- **🔴 KIRMIZI DEV**: Boss (20, 80, 110…): nefes alır gibi şişer, şiştikçe plazma saçar. Plazmayı yut; yeşile dönünce onu da yut.
- **💥 SÜPERNOVA**: Boss (30, 60, 90…): her patlamada enkaz saçar. Enkazı yut; yeşile dönünce onu da yut.
- **☢ RADYASYON**: 40. seviyeden itibaren boss'lar radyasyon dalgası saçar. Dalgaların arasındaki boşlukta dur; değersen küçülürsün. Kalkan ve Vortex seni korur. Radyasyon sürerken meteor gelmez.
- **👁 KARA DELİK İKİZİ**: Boss (50, 100…): senin kütlende bir kara delik. Kırmızıyken uzak dur, maviye dönünce yakala. İki kez yutman gerek.
- **⛽ YAKIT**: 16. seviyeden sonra her deneme yakıtla yapılır: kaybedilen deneme 1 yakıt harcar, kazanılan seviye harcamaz. Her 20 dakikada 1 yakıt dolar (en fazla 5). Seviye içindeki kalpler (canlar) ayrıdır: yakıt oyuna girme hakkın, can ise o seviyede kaç darbe kaldırabileceğin.
- **🪶 KOLAYLAŞTIR**: Aynı seviyede 3 kez olmazsa: 15 💎 ya da reklamla hedef %20 düşer.

Sayısal değerler: kalkan 10 sn (30 💎) · Süpernova 20 💎, seviye başına 2 kez, hedefin %15'i · Hawking 24. seviyeden, 25 sn bekleme · Kuasar jeti 28. seviyeden, 5 sn, 15 sn bekleme · Vortex 5 sn, puan ×2.

### Boss savaşı
- Her boss üç adımda yenilir: zayıf noktalara vur ya da kopan parçaları yut → boss yeşile döner → üstüne gidip bütünüyle yut.
- Hızla çarpmak (Dev Gezegen ve Kırmızı Dev) bir darbe sayılır; Süpernova'ya çarpılmaz.
- Radyasyon 40. seviyeden itibaren gelir: kırmızı yönlerden dalgalar yayılır, aradaki boşlukta durulur; değersen küçülürsün (can gitmez). Uyarıda ekranda soluk bir neon üçgen ve alarm sesi çıkar.
- Boss yutulunca: 1,5 sn ağır çekim, boss sarmal çizerek deliğe düşer, şok dalgası, "… YUTULDU · +puan · BOYUT ARTTI", kara delik büyür. Oyuncu bu sırada kontrolü kaybetmez.
- Her 50. seviyede boss yerine Kara Delik İkizi düellosu: iki kez yutulması gerekir.

## 6. Eşyalar

- **🎁 KAPTANIN HEDİYESİ**: Her 20 seviyede bir: dokuz kutudan en az üçünü aç, iki kutuda kara delik var. Üç kutudan sonra dilediğin an ödülleri al. Nadiren bir kutuda BÜYÜK HAZİNE saklıdır: 1000 yıldız ve 50 elmas. Reklam izleyerek bulma şansını yarı yarıya çıkarabilirsin.
- **🛡 KALKAN**: Oyunda kalkan butonuna dokun: 10 saniye boyunca çarpan her meteor parçalanır ve kopan yayların tamir edilir. Mağazadan alınır ya da 3 kalkan parçası toplanarak kazanılır. Günlük Kozmos ve meydan okumalarda kullanılmaz.
- **❤️ YEDEK CAN**: Canların bitince 1 canla kaldığın yerden devam et (oyun başına bir devam hakkı).
- **⏱ ZAMAN KRİSTALİ**: Boss ya da zor seviyede süre dolunca açılan pencerede kullanılır: bossta +30 sn, zor seviyede +15 sn. Kendiliğinden harcanmaz.
- **💎 SÜPERNOVA**: Oyunda elmas butonuna dokun (20 💎): ekrandaki her şey patlayıp kara deliğine süzülür, hedefin %15’i kadar bonus puan gelir, ardından 3 saniye meteorlar sana zarar veremez. Seviye başına 2 kez.
- **💎 ELMASLA DEVAM**: Canların bitince elmasla kaldığın yerden 2 canla devam et. Her kullanımda fiyat ikiye katlanır.

## 7. Olaylar ve sistemler
- **💫 KİLONOVA**: İki nötron yıldızı çarpışır; çekim dalgası her şeyi iter ve 14 altın ekrana birbirinden uzak noktalara saçılır. Her üç altından biri önce kameraya doğru gelir gibi büyüyüp yarı saydamlaşır, sonra başka bir yere konar. Altınlar güç düğmelerinin ve kara deliğin üstüne düşmez.
- **🔥 KUASAR JETİ**: 28. seviyeden itibaren: kara deliği tutarken ikinci parmakla ekrana bas ve gezdir. 5 saniye boyunca plazma ışını parmağını takip eder, parmak kalkınca kesilir, süre dolmadan yeniden basınca devam eder; meteorları yakar, puan veren cisimleri parçalayıp puanlarını verir, boss'lara hasar verir. 15 saniyede yeniden dolar. Dolum: her kullanımdan sonra 15 saniyede dolar. Üst bardaki 🔥 halkası dolumu gösterir; dolunca parlar, üç kez nabız atar, "JET HAZIR" yazar ve zil çalar. Ateşlerken halka boşalarak kalan süreyi gösterir.
- **💨 HAWKING SALINIMI**: 24. seviyeden itibaren: büyükken sağ alttaki Hawking düğmesi kütlenin bir kısmını radyasyona çevirir, meteorları yok eder.
- **🧭 HAFTALIK SEFER**: Her hafta dallanan bir yol: iki duraktan birini seç, 3 sefer canıyla bossa ulaş.
- **🌳 KÜTLE AĞACI**: Yuttuğun toplam kütleyle kalıcı küçük yetenekler aç (Klasik ve Sefer).
- **🪐 YÖRÜNGE BAHÇESİ**: Atlas’ta incelediğin cisimler kara deliğinin etrafında döner ve günde yıldız getirir.
- **🌬 YILDIZ RÜZGÂRI**: Bazı seviyelerde güçlü bir rüzgâr her şeyi yana sürükler. Rüzgârın geldiği yöne geç, cisimler sana aksın.
- **🌑 TUTULMA**: Ekran kararır; her 2 saniyede bir radar dalgası her şeyi gösterir. Karanlıkta puan ×1,5.
- **✨ TAKIMYILDIZ**: Numaralı yıldızları sırasıyla yut. Süre bitmeden tamamlarsan büyük bonus ve Atlas kaydı.
- **⏳ AĞIR ÇEKİM**: Bir meteor çarpmak üzereyken zaman bir an yavaşlar. Seviye başına 3 kez.
- **🃏 RİSK KARTI**: 12. seviyeden itibaren her 5 seviyede bir: seviyeyi zorlaştıran bir kart seçebilirsin, bitirirsen ekstra elmas kazanırsın.
- **🗝 HAZİNE ANAHTARI**: Mağazadan 90 elmasa: sonraki Kaptanın Hediyesi’nde Büyük Hazine kesin çıkar.

### Risk kartları (seviye öncesi isteğe bağlı)
- **METEOR FIRTINASI**: Meteorlar 2 kat. Puan ×1,5.
- **HIZLI EVREN**: Her şey %25 daha hızlı. Puan ×1,4.
- **AÇGÖZLÜ**: Hedef puan %25 daha yüksek.
- **CAM KALP**: Seviyeye 2 canla başla.
- **KARANLIK**: Seviyede iki tutulma olur. Puan ×1,3.

Cam Kalp seçilen seviye 3 yıldız serisine sayılmaz (2 canla 3 yıldız alınamayacağı için).

### Günün fırtınası (Hayatta Kal modifiyeleri)
- **RÜZGÂRLI GÜN**: Yıldız rüzgârı sık eser.
- **TUTULMA GECESİ**: Tutulmalar sık gelir.
- **YILDIZ YAĞMURU**: Takımyıldızlar sık belirir.
- **ALTIN YAĞMURU**: Altın gezegen ve kristal 2 kat, meteor da fazla.
- **DEVLER GÜNÜ**: Gezegenler sık gelir, daha hızlı büyürsün.
- **İKİZLER GÜNÜ**: Ayna taşları sık gelir.
- **HIZLI GÜN**: Her şey %15 hızlı, puan ×1,25.
- **KALABALIK GÜN**: Daha çok cisim, daha çok meteor.

## 8. Bölgeler
1. **DERİN UZAY**: Buradaki her ışık noktası uzak bir galaksi. Önce Güneş Sistemi'nin gezegenlerini yut.
2. **WESTERLUND 2**: Binlerce genç ve sıcak yıldız. Cüce gezegenler ve kayalık dünyalar bu bölgede.
3. **ORİON BULUTSUSU**: Dünya'ya en yakın büyük yıldız fabrikası. Buz ve gaz dünyaları burada.
4. **KARİNA BULUTSUSU**: Samanyolu'nun en parlak bulutsularından biri. Sıcak, parlak ve tehlikeli.
5. **KOZMİK UÇURUMLAR**: Webb'in gözünden bir yıldız doğum bölgesinin kenarı. Tüm dünyalar bir arada.

## 9. Tanıtım kartları (ilk karşılaşmada)

**İlk açılış akışı:** Oyun ilk kurulduğunda 3,5 saniyelik kısa bir açılış oynar: bir yıldız çöker ve kara delik doğar. Açılış dokununca geçilir; tam Lias Labs videosu Ayarlar'da kalır. Ardından doğrudan 1. seviye başlar; profil ekranı ve menü araya girmez. Oyuncuya otomatik bir isim (PİLOT-4821 gibi) ve rastgele bir avatar verilir. İlk üç seviyenin sonuç kartında "✏️ ADINI KOY" düğmesi çıkar. 3. seviye geçilince isim ekranı bir kez kendiliğinden açılır. Skor tablosu ilk kez açıldığında isim bir kez daha sorulur; "SONRA" ile geçilebilir. İlk oturumda günlük ödül penceresi açılmaz: 1. günün ödülü 2. seviye kazanılınca "HOŞ GELDİN HEDİYESİ" olarak gelir ve 7 günlük seri orada başlar.

**Akan ipuçları (1.–5. seviye):** Bilgi kartları bu seviyelerde oyunu durdurmaz. Üst barın altında 3–7 saniyelik bir şerit çıkar, ilgili cismin etrafında mavi bir halka parlar. Meteor/yaylar, kalkan, güç ve boss kartları yine oyunu durdurur. 6. seviyeden sonra bütün kartlar eskisi gibi durdurur.


- 🔥 **VORTEX**: Vortex barın doldu! Ekrana dokun: 5 saniye boyunca kara deliğin devleşir, her şeyi çeker, puanın ×2 olur ve meteorlar sana zarar veremez.
- ⚡ **GALİBİYET SERİSİ**: Seviyeleri üst üste geçtikçe serin büyür ve sonraki seviyeye kabuklarla başlarsın: 1 galibiyet 1 gümüş kabuk, 2 ve üstü 2 gümüş kabuk. Kaybedip devam etmeden çıkarsan seri sıfırlanır; devam edersen korunur.
- 🔥 **ZOR SEVİYE**: Süre dolmadan hedefe ulaş; meteorlar daha sık gelir. Güçlerini burada kullan.
- 🟡 **ALTIN KABUK**: Her evrenin son üç seviyesinde (x8, x9, x0) kazanılır: kusursuz kaçışlarla (x8'de 5, x9'da 4, boss'ta 3), boss / rakip / takımyıldızı günlük görevlerinin ödülüyle (saklanır, en fazla 1; bu seviyelerde kendiliğinden takılır), kalkanın süresi bitince, Hawking tek seferde 3+ meteor silince ya da boss'un zayıf noktalarını kırınca. Bir darbeyi karşılar ve patlayıp etrafındaki meteorları siler. Galibiyet serisi artık altın kabuk vermez.
- ⏱ **SÜRE DOLDU PENCERESİ**: Boss ya da zor seviyede süre bitince can gitmez; pencere yalnızca süre satar: ⏱ zaman kristali, 💎 20 (aynı seviyede her alımda iki katı: 20 → 40 → 80) ya da seviye başına 1 reklam (+15 sn). Yıldızla da süre alınabilir, seviye başına en fazla iki kez: önce 150 ⭐ ile +10 sn, sonra 300 ⭐ ile +15 sn. Yıldız yetmezse düğme soluk görünür ve mağazaya yönlendirmez.
- ⭐ **YILDIZLA DEVAM**: Canın bitince 300 ⭐ (zor seviyede 450 ⭐), günde en fazla 3 kez.
- 🕳️ **ARŞİVCİ GÖRÜNÜMLERİ**: Atlas'ta 10 cisimde ustalaşınca Arşiv Usturlabı, 20'de Yıldız Haritası, 29'un hepsinde Kozmik Koleksiyon kara delik görünümü açılır.
- 🔬 **LABORATUVAR DENGESİ**: Seviyenin önerdiği gücün üstündeki geliştirmeler yarım etki verir; 30 ve 60'tan sonra temel zorluk artmaya devam eder. Hawking ve Kuasar Jeti yalnızca laboratuvarda inşa edilince çalışır. Yeni özellikler evrime bağlıdır: Hawking 24. seviye + SÜPER KÜTLELİ evre (600 M), Kuasar Jeti 28. seviye + KUASAR evresi (1.500 M, evrimin sonu). İnşa süreleri: 5 dk, 20 dk, 1,5 sa, 4,5 sa, 10 sa, 18 sa, 30 sa, 2 gün, 3 gün, 4 gün.
- ⏩ **LAB HIZLANDIRMA**: İnşaları kısaltan dakika bakiyesi. Kaynaklar: her günlük giriş +10 dk (reklamla ×2), haftalık sandık +60 dk, üç günlük görevin tamamı +15 dk, Kaptanın Hediyesi kutularında 30/60 dk, seferde Hazine +30 dk ve Sefer Bossu +2 sa, Atlas'ta çok nadir cisimde ustalaşma +1 sa. Haftada yaklaşık 5–6 saat.
- 📐 **LABORATUVAR EKRANI**: Kaydırmadan tek ekrana sığar; sahne ekrana göre küçülür, seçili modülün inşası kendi kartında görünür, 2. yuva üstteki YUVA etiketinin yanındaki + ile (iki dokunuşla) alınır.
- 🌀 **BÖLGE GEÇİTLERİ**: Harita her zaman bulunduğun seviyeden açılır ama 1. seviyeye kadar bütün bölgeleri gösterir. Her 10 seviyelik bölge kendi gökyüzünde durur; iki bölgenin arasında siyah bir ışınlanma boşluğu vardır: yol eski bölgenin sonunda dönen bir solucan deliğine girer, yeni bölgenin başındaki delikten çıkar, aradaki ışık çizgisinde yeni bölgenin adı ve uzaklığı yazar. Her bölgenin girişinde adı, seviye aralığı, toplanan yıldızlar ve durumu (tamamlandı / devam ediyor / kilitli) olan bir kart vardır.
- ⚡ **IŞINLANMA ANI**: Bir bölgenin son seviyesi geçilip yeni bölgenin ilk seviyesi ilk kez açılırken kara delik hızlanarak döner, yıldızlar çizgiye uzar, bir parlamayla yeni gökyüzü gelir (dokununca atlanır). Harita o bölgede ilk kez açıldığında simgen geçitten geçerek yeni bölgeye kayar. İkisi de bölge başına bir kez oynar; tekrar oynanan seviyelerde çıkmaz.
- 🔔 **LABORATUVAR BİLDİRİMİ**: Ana menüde (oyun sırasında asla) üstten kayan bir kart: yeni açılan özellik (Hawking 24, Jet 28), yaklaşan güç isteyen seviye ya da boşta duran laboratuvar. En fazla 3 seviyede ve 12 dakikada bir; yeni özellik her zaman söylenir.
- 👾 **BOSS DENGESİ**: Boss canı 10. seviyede 40, her evrende +10 (50'de 80, sonra yavaş artar). Hızlı çarpma 2 saniyede bir kırar; Süpernova her 9 saniyede 5 enkaz saçar; boss canının %20'sine inince ve sen onun boyuna ulaşınca yutulabilir. Kabuk halkası tamamen kırılınca kaybolur, yerine yeşil bir parıltı kalır. Radyasyonsuz bosslarda meteor fırtınası sürer.
- 🧲 **MIKNATIS**: 3 saniye; laboratuvarda her seviye +0,5 sn (en fazla 8 sn).
- ❤️ **KALPLER**: Üst barda; can gidince kalp eriyip damlayarak söner.
- ⚪ **GÜMÜŞ KABUK**: Üst üste 3 kusursuz kaçış yaptın: bir yayın gümüş kabuk kazandı. Kabuk bir darbeyi emer, altındaki yay kopmaz.
- ⚡ **YAY ONARILDI**: Enerji topu kopmuş bir yayı onarır. Yayların tamsa Vortex barını doldurur.
- ☄️ **METEOR VE YAYLAR**: Meteor çarparsa bir yay kopar. Üç yay giderse bir kalp gider. Meteorların yolundan çekil.
- ☄️ **METEOR**: Kırmızı meteor tehlikeli: çarparsa kara deliğinin etrafındaki bir yayı koparır; 3 yay giderse 1 can gider. Önce yavaş girer, sonra hızlanır. Kırmızı oklar gideceği yolu gösterir, o yoldan çekil. Kıl payı kaçarsan KUSURSUZ KAÇIŞ!
- 🔷 **KRİSTAL**: Kristal çok değerli: +200 puan ve hızlı büyüme. Ama çoğu zaman yanında bir meteor olur, dikkat et.
- ⚡ **ENERJİ**: Enerji topu Vortex barını hızla doldurur. Kaçırma!
- 🌕 **ALTIN GEZEGEN**: Nadir ve çok hızlı: +500 puan. Yutmak için biraz büyümüş olman gerekir.
- ⏱ **ZAMAN TOPU**: Yut: her şey 6 saniye yavaşlar, sen hızlı kalırsın.
- 💣 **BOMBA GEZEGEN**: Bombayı çekim alanına al: etrafında döner, fitili yanar. 3 saniye alanında tutarsan MEGA BOMBA ekrandaki her şeyi sana çeker. Çok hızlı hareket edersen bomba kaçar.
- 🌀 **MİNİ KARA DELİK**: Yut: 6 saniye boyunca etrafında dönen yardımcı bir kara delik açılır. Onun yuttukları sana akar. Meteor ona çarparsa can gitmez.
- 🪐 **ÇOK BÜYÜK**: Bu cisim şimdilik senden büyük: çarpınca seker. Küçük cisimleri yiyerek büyü, sonra onu da yut.
- 🟣 **AŞIRI YÜK**: Sınıra kadar büyüdün! 15 saniye boyunca daha güçlüsün ama yönetmek zorlaşır. Sonra kara delik biraz küçülür.
- 🛡 **KALKAN**: İlk kalkanın hediye! Sağ alttaki kalkana dokun: 10 saniye meteorlar parçalanır, yayların onarılır.
- 🛡 **KALKAN PARÇASI**: Kalkan parçasını yut: 3 parça toplayınca 1 kalkan kazanırsın.
- 💨 **KÜÇÜLÜYOR**: Bir süre bir şey yutmazsan kara deliğin yavaşça küçülür. Yemeye devam et! Seviye sonunda ulaştığın en büyük boyut sayılır.
- ☄️ **KUYRUKLU YILDIZ**: Çok hızlı geçer. Yakalarsan combo süren 2 saniye uzar.
- 🌋 **BÖLÜNEN GEZEGEN**: Bu buzlu gezegen bütün olarak yutulmaz: kara deliğine çarpınca ikiye bölünür ve yarım kütleli iki parça hızla uzaklaşır. Peşlerinden git, ikisini de yut!
- ⚛️ **ANTİMADDE**: Yutma! Antimadde kara deliğini hemen küçültür ve 3 saniye boyunca cisimleri iter: o sürede hiçbir şey yutamazsın. Çekim alanına girerse içeri çekilir, uzak tut. Vortex açıkken zararsızdır.
- 🧲 **MIKNATIS TAŞI**: Bu mıknatıs taşını yut: 3 saniye boyunca (laboratuvarda 8 saniyeye kadar uzar) ekranda yutabileceğin her şey hızla sana çekilir.
- 💎 **SÜPERNOVA**: Elmas düğmesine dokun (20 💎): ekrandaki her şey sana akar, hedefin %15’i hemen gelir.
- 💫 **PULSAR**: Yanıp söner. Sadece parlarken yutulur ve 150 puan verir; sönükken kara deliğinden seker.
- 🪐 **UYDULU GEZEGEN**: Önce gezegeni yut, 3 saniye içinde uydusunu da yutarsan çift puan!
- 🌫️ **KARANLIK MADDE**: Görünmez! Arkasındaki yıldızları nasıl büktüğüne bak. Yakalarsan 120 puan.
- 🌀 **SOLUCAN DELİĞİ**: Turuncu kapı yakındaki cisimleri kendine çeker ve mavi kapıdan doğrudan kara deliğine gönderir.
- 🪐 **DEV GEZEGEN**: Hızla çarp ya da kopan parçaları yut. Yeşile dönünce bütünüyle yut!
- 🔴 **KIRMIZI DEV**: Şiştikçe plazma saçar. Plazmayı yut; yeşile dönünce onu da yut!
- ⛔ **KISITLI SEVİYE**: Bu seviyede bazı cisimler yasak: üstlerinde kırmızı işaret var. Seni iterler; üstlerine gidip çarparsan combo yarıya iner. Geri kalanını yiyerek hedefi tamamla.
- 📏 **BOYUT PENCERESİ**: Puan sadece kara delik üstteki yeşil aralıktayken gelir. Küçüksen büyü. Fazla büyürsen buharlaşırsın ve o sırada yediğin puan getirmez: yavaş ye, aralıkta kal.
- 🎯 **AV**: Altın av yutulmaz: kara deliğinle ona çarp, kabuğunu kır. İç halkadaki 10 parça kabuğudur; hızlı çarparsan 2–3 parça birden kırılır. Kabuk bitince av patlar. Dış halka süresidir; biterse av kaçar ve 1 can gider.
- 🌑 **RAKİP KARA DELİK**: Başka bir kara delik de burada avlanıyor ve büyüyor. Senden büyükken kırmızı parlar ve peşine düşer: dokunursa seni ısırır ve küçülürsün (can gitmez). Onu geçecek kadar büyüyünce maviye döner ve kaçar: yakala ve yut, seviye biter. Meteor ve antimadde onu da küçültür. Vortex açıkken her boyutta yutabilirsin.
- 🛡 **KORUYUCU**: Mavi gezegende hayat var. Kırmızı çizgili asteroitler ona doğru geliyor: yolunun önünde dur ve yut. Her çarpma gezegenin canını azaltır, her yakaladığın artırır. Süre dolduğunda gezegen hâlâ ayaktaysa görev tamam. Gezegen yok olursa 1 can gider ve savunma baştan başlar. Bu görevde meteor gelmez. Gezegenin atmosferine giremezsin.
- 👁 **KARA DELİK İKİZİ**: Kırmızıyken uzak dur, maviye dönünce yakala. İki kez yutman gerek.
- 🪞 **AYNA TAŞI**: Yut: 8 saniye boyunca ekranın öbür yarısında senin ayna görüntün olan ikinci bir kara delik açılır ve senin için yer. Meteor ona değerse kaybolur.
- 🌬 **YILDIZ RÜZGÂRI**: Güçlü bir rüzgâr her şeyi yana sürüklüyor. Rüzgârın geldiği yöne geç, cisimler sana aksın. Meteorlar etkilenmez.
- 🌑 **TUTULMA**: Ekran kararıyor. Sadece çevren aydınlık; her 2 saniyede bir radar dalgası her şeyi kısa süre gösterir. Karanlıkta puan ×1,5. Meteorların közüne dikkat!
- ✨ **TAKIMYILDIZ**: Bir takımyıldız belirdi. Yıldızları numara sırasıyla yut: sıradaki parlar. Sırası gelmeyen yıldızın içinden geçersin. Hepsini süre bitmeden yutarsan büyük bonus.
- 🌈 **SPEKTRUM**: Arka arkaya 5 farklı türde cisim yut: SPEKTRUM bonusu! Kara deliğinin altındaki noktalar serini gösterir. Aynı türden birini yutarsan seri baştan başlar, combo biterse silinir.
- 💫 **KİLONOVA**: İki nötron yıldızı birbirinin etrafında dönüp çarpışacak. Çarpışınca çekim dalgası her şeyi iter ve altın saçılır: altınları topla! Evrendeki altının çoğu böyle çarpışmalarda oluşur.
- 💨 **HAWKING SALINIMI**: Büyükken Hawking düğmesine dokun: biraz kütle verirsin, ekrandaki bütün meteorlar silinir.
- 🔥 **KUASAR JETİ**: Kara deliği tutarken ikinci parmakla bas ve gezdir: 5 saniye boyunca ışın taradığı her şeyi vurur. Üst bardaki 🔥 halkası dolunca jet yeniden hazırdır.
- ☢ **RADYASYON**: Boss dalga saçar. Dalgaların arasındaki boşlukta dur; kalkan seni korur.
- 💥 **SÜPERNOVA**: Her patlamada enkaz saçar. Enkazı yut; yeşile dönünce onu da yut!

## 10. Ekonomi ve mağaza

Satın alınabilir ürünler, abonelik, reklam yerleri, can sistemi ve Google Play kurulum adımları ayrıntılı olarak `MONETIZATION.md` dosyasında. Mağaza ve reklamlar yalnızca Google Play sürümünde açılır; web sürümü reklamsızdır.

## 11. Diller

Türkçe (kaynak dil) + İngilizce, Almanca, İspanyolca, Portekizce, Fransızca, Rusça, Arapça (sağdan sola), Endonezce, Kürtçe (Kurmancî). Çeviriler `i18n/*.json` dosyalarında; her dilde 1.364 metin. Oyun cihaz dilini otomatik seçer, ayarlardan değiştirilebilir.

## 12. Dosya yapısı

| Yol | İçerik |
|---|---|
| `index.html` | Derlenmiş, tek dosyalık oyun (yayına giden dosya) |
| `src/game.src.html` | Oyunun ana kaynağı: arayüz, menüler, mağaza, rehber, ses, i18n altyapısı |
| `src/v2.js` | Oyun motoru: kara delik, cisimler, seviyeler, bosslar, güçler, kartlar |
| `src/blocks/` | Kaynağa gömülen yardımcı bloklar |
| `src/build.py` | Derleyici: `python3 src/build.py` → `index.html` |
| `i18n/*.json` | 9 dilin çevirileri |
| `music/`, `intro.mp4`, `icons/` | Müzikler, giriş videosu, uygulama ikonları |
| `manifest.webmanifest`, `sw.js` | PWA (ana ekrana ekleme, çevrimdışı) |
| `privacy.html` | Gizlilik politikası |
| `android/` | Google Play (TWA) yapılandırması |
| `store/` | Play Store görselleri |
| `server/` | Liderlik tablosu için Cloudflare Worker (henüz kurulmadı) |
| `root-site/` | liaslabs.github.io ana sayfası |
| `.github/workflows/` | GitHub Pages yayını ve Android paket üretimi |
| `GOOGLE_PLAY.md`, `MONETIZATION.md`, `CODE_REVIEW.md` | Yayın rehberi, gelir modeli, kod denetim rehberi |

İmza anahtarı (keystore) depoda ve bu pakette **yoktur**; GitHub secret olarak saklanır.

## 13. Yayın akışı

1. `src/` ve `i18n/` düzenlenir → `python3 src/build.py`
2. `blackhole` dalına commit → `main`e PR → birleştirme
3. GitHub Pages `main`e her gönderimde siteyi otomatik yayınlar.


## 14. Açık tasarım kararları (kod denetiminden)

- **İki farklı "SÜPERNOVA":** 💎 elmas gücü ile 30, 60, 90… seviyelerdeki boss aynı adı taşıyor.
- **Elmas gücü baştan açık:** 💎 Süpernova düğmesi 1. seviyeden görünür ve kullanılabilir, tanıtım kartı ise 21. seviyede gelir.
- **İki yenilik bir arada:** 11. seviyede 360° + Av kuralı, 15. seviyede Mıknatıs + Asteroit Yasak kuralı aynı anda tanıtılıyor.
- **Çok zor seviyeler:** 39, 49 ve 59 (45 sn) insan benzeri bot tarafından güç kullanılmadan nadiren geçiliyor. Kalkan, Süpernova ve Hawking bu seviyeler için tasarlandı.


