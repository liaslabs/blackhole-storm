# Play Console tek seferlik ürünleri (Chrome'daki Claude için talimat)

24 Eki kararı. Kimlikler oyunun koduyla (`src/game.src.html` › `IAP`) birebir aynı. Abonelik (`vip_monthly`) oyunda henüz
kapalı (`IAP_HOLD`), bu listede yok.

Aşağıdaki kod bloğunun tamamı Chrome'daki Claude paneline yapıştırılır.

```
Google Play Console'da "Blackhole Storm: Black Hole" uygulaması için aşağıdaki 11 tek seferlik ürünü oluştur
(Para kazanma › Ürünler › Tek seferlik ürünler › Ürün oluştur). Ürün ve fiyat girme iznini bu iş için veriyorum.

KURALLAR
- Ürün kimliğini harfi harfine yaz; kimlik sonradan değiştirilemez ve tekrar kullanılamaz. Emin olmadığın bir şeyde dur ve bana sor.
- Bu iş dışında hiçbir şeye dokunma: sürümler, üretim, politika beyanları, ödeme profili, kullanıcılar ve izinler.
- "starter" taslak olarak zaten başlatılmış olabilir: varsa onu tamamla, yeniden oluşturma.
- Varsayılan dil İngilizce (en-US): Ad ve Açıklama'ya EN metni yaz. "Çevirileri yönet"ten Türkçe (tr-TR) ekleyip TR metni yaz.
- Simge, etiketler, yaş derecelendirmesi, ödeme konumu kısıtlaması: boş/olduğu gibi. Vergi kategorisi: Dijital uygulama satışları.
- Satın alma seçeneği kimliği: default · Satın alma türü: Satın al · Gelişmiş seçeneklerde "geriye dönük uyumlu" açık olmalı.
- Fiyat: Amerika Birleşik Devletleri tam olarak USD fiyatı olsun, diğer ülkeleri Google o fiyattan çevirsin
  (Set prices menüsündeki çevirme seçeneği). Sonra Türkiye'yi elle TL fiyatına ayarla. Kaydetmeden önce ABD ve Türkiye fiyatını kontrol et.
- Her ürünü kaydettikten sonra etkinleştir (Etkin durumuna getir).
- Bitince 11 ürünün kimliğini, durumunu, ABD ve Türkiye fiyatını liste olarak yaz.

ÜRÜNLER (kimlik | ABD | Türkiye | EN ad | EN açıklama | TR ad | TR açıklama)
1. starter | $1.99 | ₺19,99 | Starter Pack | One-time pack: 300 gems, 3,000 stars, 10 extra lives, 5 shields and 3 time crystals. | Başlangıç Paketi | Tek seferlik paket: 300 elmas, 3.000 yıldız, 10 yedek can, 5 kalkan ve 3 zaman kristali.
2. quasar_hoard | $19.99 | ₺199,99 | Quasar Hoard | One-time pack: 2,400 gems, a permanent 2nd lab slot, 24h lab boost, the exclusive Quasar Crown look, 10 shields, 10 extra lives, 5 time crystals. | Kuasar Hazinesi | Tek seferlik paket: 2.400 elmas, kalıcı 2. lab yuvası, 24 saat lab hızlandırma, yalnızca bu pakette Kuasar Tacı, 10 kalkan, 10 yedek can, 5 zaman kristali.
3. captain | $2.99 | ₺29,99 | Captain's Kit | Makes the game easier: 5 shields, 5 extra lives, 3 time crystals and 100 gems. | Kaptan Seti | Oyunu kolaylaştırır: 5 kalkan, 5 yedek can, 3 zaman kristali ve 100 elmas.
4. cosmic_id | $1.99 | ₺19,99 | Cosmic ID | Your name inside your black hole (up to 11 letters) plus the Pink Storm and Pixel Nebula looks. One-time, permanent. | Kozmik Kimlik | İsmin kara deliğinin içinde (11 harfe kadar), Pembe Fırtına ve Piksel Nebula görünümleri. Tek sefer, kalıcı.
5. no_ads | $4.99 | ₺99,99 | Play Ad-Free | Removes interstitial ads for good; ad rewards arrive instantly without watching an ad. One-time, permanent. | Reklamsız Oyna | Araya giren reklamlar tamamen kalkar; reklamlı ödüller reklam izlemeden anında gelir. Tek sefer, kalıcı.
6. gems_s | $0.99 | ₺9,99 | Handful of Gems | 80 gems to spend on shields, extra lives, time crystals and more. | Avuç Elmas | Kalkan, yedek can, zaman kristali ve daha fazlası için 80 elmas.
7. gems_m | $2.49 | ₺24,99 | Pouch of Gems | 250 gems (25% extra) to spend on shields, extra lives, time crystals and more. | Kese Elmas | 250 elmas (%25 fazlası): kalkan, yedek can, zaman kristali ve daha fazlası için.
8. gems_l | $4.99 | ₺49,99 | Chest of Gems | 700 gems (75% extra) to spend on shields, extra lives, time crystals and more. | Sandık Elmas | 700 elmas (%75 fazlası): kalkan, yedek can, zaman kristali ve daha fazlası için.
9. stars_pack | $1.29 | ₺12,99 | Star Pile | A pile of 2,000 stars to spend anywhere in Blackhole Storm. | Yıldız Yığını | Blackhole Storm'da istediğin yerde harcamak için 2.000 yıldız.
10. lives_pack | $1.99 | ₺19,99 | Life Depot | 10 extra lives so you can keep playing when your lives run out. | Can Deposu | Canların bitince oynamaya devam etmen için 10 yedek can.
11. time_pack | $0.99 | ₺9,99 | Time Crystals | 5 time crystals: each adds +15 seconds when time runs out (+30 in boss fights). | Zaman Kristalleri | 5 zaman kristali: süre dolunca her biri +15 sn ekler (boss'ta +30 sn).
```
