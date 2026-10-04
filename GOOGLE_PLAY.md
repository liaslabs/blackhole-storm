# Blackhole Storm · Google Play'e yayınlama rehberi

Oyun bir **PWA** (yüklenebilir web uygulaması). Google Play'e **Trusted Web Activity (TWA)** olarak,
yani siteyi tam ekran açan küçük bir Android uygulaması olarak girer. Android paketi **Bubblewrap**
ile GitHub Actions'ta otomatik üretilir; bilgisayarına Android Studio kurman gerekmez.

## Depoda hazır olanlar

| Dosya | Ne işe yarar |
|---|---|
| `.github/workflows/pages.yml` | `main` dalına her gönderimde oyunu GitHub Pages'e yayınlar |
| `.github/workflows/android-keystore.yml` | Android imza anahtarını **bir kez** üretir |
| `.github/workflows/android.yml` | İmzalı Play paketini (`.aab`) ve test APK'sını üretir |
| `android/twa-manifest.json` | Paket adı, adres, renkler, ikonlar (Bubblewrap ayarı) |
| `android/assetlinks.example.json` | Alan adı doğrulama dosyası şablonu |
| `manifest.webmanifest`, `sw.js`, `icons/` | PWA: yükleme, çevrimdışı çalışma, ikonlar |
| `privacy.html` | Gizlilik politikası (TR + EN) |
| `store/` | Tanıtım görseli (1024×500) ve 6 ekran görüntüsü (1080×1920): oyun, boss, laboratuvar, harita, ana ekran, Hayatta Kal |
| `root-site/` | `liaslabs.github.io` deposuna kopyalanacak dosyalar (adım 4) |
| `MONETIZATION.md` | Mağaza ürünleri, reklam yerleri, paranın hesaba geçişi |

Varsayılan adres ve paket adı:

- Site: `https://liaslabs.github.io/blackhole-storm/`
- Paket adı: `com.liaslabs.blackholestorm` (Play'e ilk yüklemeden sonra **değiştirilemez**)

---

## 1. Siteyi yayınla (GitHub Pages)

1. Bu dalı `main`'e birleştir (PR'ı merge et).
2. GitHub → depo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Actions** sekmesinde "Web sitesini yayınla" iş akışı yeşil olunca oyun
   `https://liaslabs.github.io/blackhole-storm/` adresinde açılır.
4. Telefonda Chrome ile aç: menüde "Uygulamayı yükle" çıkmalı, uçak modunda da açılmalı.

> Gizlilik politikasının adresi: `https://liaslabs.github.io/blackhole-storm/privacy.html`.
> Yayıncı: **Lias Labs** · iletişim: `liaslabs.games@gmail.com` (gizlilik sayfasına işlendi).

## 2. İmza anahtarını oluştur (bir kez)

1. Depo → **Settings → Secrets and variables → Actions → New repository secret**:
   - Ad: `ANDROID_KEYSTORE_PASSWORD`, değer: en az 8 karakterlik güçlü bir şifre. Şifreyi bir yere de not et.
2. **Actions → "Android imza anahtarı oluştur (bir kez)" → Run workflow**.
3. Bitince çalıştırmanın sayfasında:
   - Özet bölümünde **SHA-256 parmak izi** yazar. Kopyala (adım 4'te lazım).
   - **android-keystore-GIZLI** dosyasını indir. İçinde iki dosya var:
     - `ANDROID_KEYSTORE_B64.txt` → içindeki metnin tamamını yeni bir secret'a yapıştır: ad `ANDROID_KEYSTORE_B64`.
     - `android.keystore` → güvenli bir yerde sakla (ör. şifreli bulut klasörü). **Kaybolursa güncelleme yükleyemezsin.**
4. İndirdikten sonra o çalıştırmayı sil (sağ üst "…" → Delete workflow run). Dosya zaten 1 gün sonra kendiliğinden silinir.

## 3. Android paketini üret

1. **Actions → "Android paketi üret" → Run workflow**:
   - Sürüm kodu: ilk yükleme için `1`. Her yeni yüklemede bir artır (2, 3, …).
   - Sürüm adı: `1.0.0` gibi.
2. Bitince çalıştırmanın altındaki dosyayı indir:
   - `app-release-bundle.aab` → Play Console'a yüklenecek paket.
   - `app-release-signed.apk` → kendi telefonuna kurup denemek için.

> Paket, ikonları yayındaki siteden indirir; bu yüzden adım 1 tamamlanmış olmalı.

## 4. Alan adı doğrulaması (adres çubuğunu gizler)

Android, uygulamanın siteye ait olduğunu `https://liaslabs.github.io/.well-known/assetlinks.json`
dosyasından doğrular. Bu dosya alan adının **kökünde** olmalı; `blackhole-storm` deposunun Pages
adresi `/blackhole-storm/` altında olduğu için oraya konamaz. Çözüm, tek dosyalık ikinci bir depo:

1. GitHub'da **liaslabs** kuruluşunun altında `liaslabs.github.io` adında **herkese açık** yeni bir depo oluştur.
2. Bu depodaki `root-site/` klasörünün içeriğini oraya kopyala:
   - `.nojekyll` (boş dosya)
   - `.well-known/assetlinks.json`: `android/assetlinks.example.json` şablonunu kopyala, parmak izlerini yaz:
     - adım 2'deki **yükleme anahtarı** SHA-256'sı,
     - Play Console → uygulaman → **Test ve yayınla → Kurulum → Uygulama bütünlüğü → Uygulama imzalama**
       sayfasındaki **uygulama imzalama anahtarı** SHA-256'sı (Play, uygulamayı kendi anahtarıyla yeniden imzalar).
3. O depoda **Settings → Pages → Source: Deploy from a branch → main / (root)**.
4. Kontrol: `https://liaslabs.github.io/.well-known/assetlinks.json` tarayıcıda JSON göstermeli.

Doğrulama olmadan da uygulama çalışır, sadece üstte ince bir adres çubuğu görünür. Kapalı teste bununla başlanabilir.

## 3b. Yeni Android uygulaması (Capacitor) · geçiş aşamasında

Oyun, AdMob reklamları ve telefon içi bildirimler için **Capacitor** kabuğuna taşınıyor (`app/` klasörü). Oyun dosyası aynı;
uygulama onu kendi içinde taşır (internetsiz açılır). Paket adı ve yükleme anahtarı TWA ile aynı olduğu için Play bunu **güncelleme** olarak alır.

- Paket üret: **Actions → "Android uygulaması üret (Capacitor)" → Run workflow** · sürüm kodu (TWA'da 1 kullanıldıysa 2) ve sürüm adı.
  Çıktıda `.aab` (Play Console'a) ve `.apk` (kendi telefonuna kurup denemek için) var.
- **Dikkat:** TWA sürümünden bu sürüme geçen test kullanıcılarının oyun ilerlemesi sıfırlanır (kayıt ayrı yerde tutuluyor). Bu yüzden geçiş
  herkese açık yayından **önce** yapılır; kapalı test kullanıcılarına önceden haber ver. Web sitesindeki oyun etkilenmez.
- Durum: oyun, paylaşım, klip paylaşma, titreşim, geri hareketi, dünya sıralaması çalışır. 2. aşama: Google Play satın alma
  (Play Billing 9) ve sunucu doğrulaması eklendi; ürünler Play Console'da oluşturulup 5e yapılınca mağazada görünür.
  Reklam 3., bildirimler 4. aşamada.
- Dünya sıralamasının uygulamada çalışması için sunucunun güncel olması gerekir (bkz. 5b; sunucu uygulamanın adresine izin verir).
- Eski TWA iş akışı ("Android paketi üret") geçiş bitene kadar yedek olarak duruyor.

## 5. Play Console

1. **Geliştirici hesabı**: [play.google.com/console](https://play.google.com/console) (tek seferlik kayıt ücreti).
2. **Uygulama oluştur**: ad "Blackhole Storm", varsayılan dil Türkçe, **Oyun**, **Ücretsiz**.
3. **Kapalı test zorunluluğu (bizim hesap bireysel, bu şart geçerli)**: 13 Kasım 2023'ten sonra açılan kişisel hesaplarda üretime çıkmadan önce
   **en az 12 test kullanıcısı 14 gün kesintisiz** kapalı teste katılmış olmalı. Kapalı test kanalı
   oluştur, test kullanıcılarının e-postalarını ekle, `.aab` dosyasını yükle, katılım linkini paylaş.
4. **Mağaza girişi** (aşağıdaki metinler hazır): ikon `icons/icon-512.png`, tanıtım görseli
   `store/feature-graphic-1024x500.jpg`, telefon ekran görüntüleri `store/screenshot-*.jpg`.
5. **Uygulama içeriği** formları için cevaplar:

| Form | Cevap |
|---|---|
| Gizlilik politikası | `https://liaslabs.github.io/blackhole-storm/privacy.html` |
| Uygulama erişimi | Tüm işlevler giriş gerektirmeden kullanılabilir |
| Reklamlar | Reklam ağı eklenene kadar **Hayır**; eklenince **Evet** (bkz. MONETIZATION.md) |
| Reklam kimliği (Advertising ID) | **Hayır**, kullanılmıyor (reklam ağı eklenince yeniden bakılacak) |
| İçerik derecelendirme | Kategori: Oyun. Şiddet, korku, kumar, cinsellik, küfür yok; sohbet/mesajlaşma yok. **Kullanıcılar bilgi paylaşabiliyor mu: Evet** (dünya sıralamasında oyuncu adları görünür; kötü söz filtresi ve ⚑ bildir var). **Dijital ürün satın alma var**; parayla satılan rastgele ödül (şans kutusu) yok. Beklenen sonuç: 3+ / Herkes, "Kullanıcılar Etkileşimde Bulunur" ve "Uygulama İçi Satın Alma" notlarıyla |
| Hedef kitle | **13 yaş ve üzeri** önerilir (13 yaş altını seçmek "Aileler" politikasının ek şartlarını getirir) |
| Veri güvenliği | **Veri toplanıyor: Evet · Paylaşılıyor: Hayır.** Aşağıdaki "Veri güvenliği formu" bölümüne bak |
| Kamu sağlığı, haber, finans, devlet | Hayır |

**Veri güvenliği formu (ayrıntı).** Sıralama sunucusu (Cloudflare) ve satın alma onayı yüzünden form "veri toplanıyor" diye doldurulur:

- Veri aktarımda şifreleniyor mu? **Evet** (HTTPS). Kullanıcı veri silinmesini isteyebilir mi? **Evet**: `liaslabs.games@gmail.com` adresine yazarak (kayıtlar zaten 90 günde silinir).
- **Kişisel bilgiler › Ad:** toplanıyor, paylaşılmıyor, isteğe bağlı (oyuncu adı; kullanıcı Ayarlar'dan sıralamayı kapatabilir), amaç **Uygulama işlevleri**, kişiyle ilişkilendirilmiyor.
- **Cihaz veya diğer kimlikler:** toplanıyor (oyunun ürettiği rastgele kurulum numarası), paylaşılmıyor, isteğe bağlı, amaç **Uygulama işlevleri**.
- **Uygulama etkinliği › Diğer kullanıcı tarafından oluşturulan içerik / Uygulama içi etkileşimler:** günlük fırtına skoru ve süresi; toplanıyor, paylaşılmıyor, isteğe bağlı, amaç **Uygulama işlevleri**.
- **Finansal bilgiler › Satın alma geçmişi:** toplanıyor (satın alma jetonu ve ürün adı; Google'da doğrulanır, aynı satın almanın tekrar kullanılmaması için kurulum numarasıyla 2 yıl saklanır), paylaşılmıyor, amaç **Uygulama işlevleri** ve **Dolandırıcılığı önleme, güvenlik**. Kart ve ödeme bilgileri Google'da kalır.
- Bildirilen isimler: bildirenin kurulum numarası ve bildirilen satırın o güne ait kodu sunucuda saklanır (90 gün). Yukarıdaki "Cihaz veya diğer kimlikler" maddesi bunu kapsar.
- Konum, kişiler, fotoğraf/video, ses, dosya, sağlık, mesaj, tarama geçmişi: **toplanmıyor**. Kayıtlı klipler cihazda kalır.


6. **Uygulama içi ürünler:** Play Console → Para kazanma → Ürünler → Uygulama içi ürünler. Ürün kimlikleri, içerikleri ve önerilen fiyatlar `MONETIZATION.md` içinde. `vip_monthly` aboneliği ayrıca **Abonelikler** bölümünde, aylık otomatik yenilenen bir temel planla oluşturulur. Bunun için önce Ödemeler profili (banka hesabı) oluşturulmalı.
7. **Sürüm**: yeni bir `.aab` her zaman daha büyük bir sürüm koduyla yüklenir (adım 3).

## 5b. Sunucu güncellemesi (isim filtresi ve bildirim)

Oyuncu adlarındaki kötü söz filtresi ve sıralamadaki ⚑ bildirim, sıralama sunucusunun yeni sürümüyle çalışır. Bir kez:

```
cd server
npx wrangler deploy
```

Bilgisayar yoksa: **Actions → "Sunucuyu yayınla"** (bir kez Cloudflare anahtarı gerekir, adımlar `server/README.md` → "Telefondan yükleme").

Yeni `reports` tablosu sunucu tarafından kendiliğinden oluşturulur; mevcut skorlar etkilenmez. Sunucu güncellenene kadar oyun eskisi gibi çalışır, yalnızca ⚑ düğmesi görünmez (oyunda isim girerken filtre zaten çalışır).

## 5c. Kapalı test, reklamlar ve satın almalar

- **Reklamlar:** oyunda henüz reklam ağı yok. Bu yüzden Play sürümünde (kapalı test dahil) reklam izleme düğmeleri ve "Reklamsız Oyna" ürünü görünmez; reklamla alınan ödüllerin elmas/yıldız/bekleme seçenekleri çalışır. Kapalı testte senin yapman gereken bir şey yok. Herkese açık yayından önce reklam ağı seçilir (MONETIZATION.md › Reklam ağı seçimi); bağlanınca düğmeler ve "Reklamsız Oyna" kendiliğinden açılır.
- **Satın almalar:** Play Console'da ürünler oluşturulunca kapalı testte de çalışır. Lisans test kullanıcısı olarak eklenen hesaplar (Ayarlar › Lisans testi) gerçek para ödemeden dener. Ürünleri açmadan **önce** 5e yapılmalı: uygulama hiçbir ürünü sunucu doğrulamadan vermez (MONETIZATION.md › Satın alma doğrulaması).

## 5d. Geri dönüşü olmayan adımlar (dikkat)

- **Paket adı** `com.liaslabs.blackholestorm`: ilk yüklemeden sonra değiştirilemez.
- **Ürün kimlikleri** (MONETIZATION.md'deki `starter`, `gems_s` …): bir kimlik silinse bile tekrar kullanılamaz; tabloda yazdığı gibi, harfi harfine oluştur.
- **Yükleme anahtarı** (`android.keystore` ve şifresi): kaybolursa Play Console'dan sıfırlama istemek gerekir; güvenli iki yerde sakla.
- **Sürüm kodu:** her yeni paket daha büyük bir sürüm koduyla yüklenir; geri alınamaz.
- **Hedef kitle "13 yaş altı"** seçilirse "Aileler" politikası devreye girer ve sonradan çıkmak inceleme gerektirir; 13+ öneriliyor.

## 5e. Satın alma doğrulaması ve hile koruması (Play Console'a yükledikten sonra)

Bunlar uygulama Play Console'a yüklendikten sonra yapılır; o zamana kadar uygulama satın alma göstermez, sıralama eskisi gibi çalışır.

1. **Hizmet hesabı (satın alma doğrulaması):** Play Console › Kurulum › API erişimi → Google Cloud projesi bağla → hizmet hesabı oluştur →
   JSON anahtarını indir → Play Console › Kullanıcılar ve izinler'de bu hesaba uygulama için "Finansal verileri görüntüleme" ve
   "Siparişleri ve abonelikleri yönetme" izni ver.
2. **GitHub'a iki gizli bilgi:** depo › Settings › Secrets and variables › Actions › New repository secret:
   `GP_SA` = indirilen JSON dosyasının tüm içeriği, `GP_PKG` = `com.liaslabs.blackholestorm`.
3. **Actions → "Sunucuyu yayınla" → Run workflow.** Gizli bilgiler Cloudflare'e aktarılır.
4. **Play Integrity (modlu/kopya uygulamaların sıralamaya girmesini engeller):** Play Console › Test ve yayın › Uygulama bütünlüğü →
   Play Integrity API → aynı Google Cloud projesini bağla. Projenin **numarasını** (Cloud Console ana sayfasında "Proje numarası") bana ver;
   oyuna eklerim, önce sunucu yalnızca izler (`INTEGRITY = "log"`), sorun yoksa zorunlu yaparız (`"enforce"`).
   Not: zorunlu olunca web sürümü skor gönderemez (web sürümü kolayca değiştirilebildiği için), yalnızca sıralamayı görür.
5. **Otomatik koruma** (isteğe bağlı): Uygulama bütünlüğü sayfasında "Otomatik koruma" sunuluyorsa açılabilir; Play dışından kurulan
   değiştirilmiş kopyalar Play'den indirmeye yönlendirilir.

## 6. Görseller ve lisanslar

- Bölge fotoğrafları: NASA, ESA, CSA, STScI (Hubble ve Webb), **CC BY 4.0**. Kaynak belirtmek zorunlu; oyunda
  *Ayarlar → Emeği geçenler* bunu karşılıyor, mağaza açıklamasının sonunda da satır var.
- Gezegen dokuları: Solar System Scope, CC BY 4.0. Sesler ve müzik: Kenney.nl ve OpenGameArt, CC0.
- **Astronot portreleri** (Eve Dönüş görevi) proje sahibinin Google Gemini (Nano Banana) ile ürettiği görsellerden
  kırpıldı. NASA logosu ve bayrak bilerek kadraj dışında bırakıldı (NASA amblemi izinsiz kullanılamaz).
  Üretim tarihini ve kullanılan komutu sakla.
- Seviye haritasının arka planı kod ile üretiliyor, lisans gerektirmiyor.

---

## Mağaza metinleri

### Türkçe

**Uygulama adı (30):** Blackhole Storm

**Kısa açıklama (80):**
> Kara deliği sürükle, gezegenleri yut, büyü ve kuasara dönüş!

**Uzun açıklama:**
> Gerçek Hubble ve James Webb fotoğraflarıyla kurulmuş bir evrende kara deliğini parmağınla sürükle. Kendinden küçük gök cisimlerini yut ve büyü, meteorlardan kaç, kara deliğini kuasara dönüşene kadar evrimleştir.
>
> • Tek parmakla oynanır: sürükle, yut, büyü
> • 5 bölge ve aralarında ışınlanma: Derin Uzay, Westerlund 2, Orion, Karina ve Webb'in Kozmik Uçurumları
> • Her 10 seviyede bir boss: Dev Gezegen, Kırmızı Dev, Süpernova ve dahası
> • Güçler: kalkan, süpernova, mıknatıs, Hawking salınımı ve kuasar jeti
> • Laboratuvar: kara deliğini geliştir; evrimleştikçe yeni modüller açılır
> • Kuyruklu yıldız, pulsar, antimadde, nötron yıldızı, kilonova, karanlık madde ve daha fazlası
> • Seviye haritası ve yıldızlar: eski seviyeleri tekrar oyna, üç yıldızın peşine düş
> • Günün Fırtınası: herkes aynı fırtınada hayatta kalmaya çalışır; dünya sıralaması ve günlük ödüller
> • Günlük Yarış ve meydan okuma linkleri: sonucunu paylaş, arkadaşını yarışa çağır
> • Kozmik Atlas: yuttuğun her cismin gerçek bilimsel bilgisi
> • 9 dil, hesap gerekmez, internetsiz de oynanır
>
> Görseller: NASA, ESA, CSA, STScI (CC BY 4.0) · Gezegen dokuları: Solar System Scope (CC BY 4.0) · Ses: Kenney.nl, OpenGameArt (CC0)

### English

**Short description (80):**
> Drag your black hole, swallow worlds, grow and become a quasar!

**Full description:**
> Drag a black hole with your finger through a universe built from real Hubble and James Webb images. Swallow anything smaller than you, dodge meteors, and evolve your black hole all the way into a quasar.
>
> • One-finger play: drag, swallow, grow
> • 5 regions linked by warp gates: Deep Field, Westerlund 2, Orion, Carina and Webb's Cosmic Cliffs
> • A boss every 10 levels: Giant Planet, Red Giant, Supernova and more
> • Powers: shield, supernova, magnet, Hawking burst and quasar jet
> • Laboratory: upgrade your black hole; new modules open as it evolves
> • Comets, pulsars, antimatter, neutron stars, kilonovae, dark matter and more
> • Level map with stars: replay levels and chase three stars
> • Storm of the Day: everyone survives the same storm, with a world ranking and daily prizes
> • Daily Race and challenge links: share your result and dare a friend
> • Cosmic Atlas: real science about every body you swallow
> • 9 languages, no account needed, plays offline
>
> Images: NASA, ESA, CSA, STScI (CC BY 4.0) · Planet textures: Solar System Scope (CC BY 4.0) · Audio: Kenney.nl, OpenGameArt (CC0)
