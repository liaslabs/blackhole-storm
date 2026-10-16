# Yol haritası (16 Ekim 2026)

Sosyal ve çok oyunculu özellikler **kademeli** gelir: oyuncu sayısı gerektirmeyenler hemen, oyuncu sayısına
dayananlar (canlı eşleşme gibi) ancak o sayıya ulaşınca. Eşik dolmadan açılan canlı mod boş kuyruk demektir;
oyuncu bekler, sıkılır ve bir daha denemez.

## Nasıl ölçüyoruz

- **Günlük aktif cihaz (GAC):** 1.5.0'daki günlük açılış sayacı (`/pings`). Her cihaz günde bir kez sayılır;
  kimlik tutulmaz. Bugün yalnızca test cihazları var (günde 3–9 açılış). Gerçek sayı 1.5.0 üretime çıkınca başlar.
- **Play Console:** yüklemeler, aylık aktif kullanıcı, elde tutma (1. / 7. / 30. gün).
- **Eşzamanlı oyuncu (eklenecek, 1.5.1):** canlı mod kararı için gerekir. Sunucu son 5 dakikada oyunda olan
  cihazları sayar (kimliksiz, yalnızca sayı). Akşam en yoğun saatteki değer esas alınır.
- Eşik, **14 gün üst üste** tutunca geçilmiş sayılır (tek günlük sıçrama sayılmaz).

## Takvim

| Sürüm | Hedef | İçerik | Eşik |
|---|---|---|---|
| **1.5.0** | yedek (kod 47) | Filolar, avatarlar, değerlendirme kartı, yıldız tozu arka planı, menüde yarış sayacı, yeni mağaza kartları. **Filo görevleri** de bu sürüme girdi (kod 44–47): günde 3 görev, eşit donanım, 3 hak, Filo Zinciri, yeni filo menüsü, filo hatırlatıcıları. | – |
| **1.5.1** | ~27–30 Eki, ilk üretim (kod 48) | 1.5.0'ın hepsi + **ölç + koru:** kimliksiz olay sayaçları (eğitim adımları, 1/3/5/10. seviye, ilk ölüm saniyesi, filoya katılma, görev, mağaza, reklam, bildirim izni), kurulum yaşı aralığıyla geri dönüş (kimliksiz D1/D7), yıldız giriş/çıkış sayaçları, Play Integrity (1 hafta yalnız kayıt, sonra zorunlu), şüpheli skor raporu, eşzamanlı oyuncu sayacı, şifreli okuma sayfası. **Bulut yedek (yalnız yedek modu)**, testten geçerse ilk üretimde; geçmezse 1–2 hafta sonra 1.5.1.x ile (aşağıda). | – |
| **1.5.2** | ~20 Kas | **Sağlamlaştır:** Android bakım (R8, AGP 9.0), eski `rel(≤10)` dallarını silme, test botlarını `tools/` + CI'ya taşıma, otomatik düşük kalite (ilk 10 sn FPS < 45), yedekten geri yükleme provası. **Canlı filo** (aşağıda): filo ekranında "Filoda neler oldu" şeridi, menüde "X filosu sizi geçti" uyarısı, yarış sekmesinde 30 sn'de bir yenilenen skorlar. | – |
| **1.5.3** | ~4 Ara | **İlk 10 dakika:** 1.5.1 verisine göre sade ilk oturum (önce yalnız OYNA; Lab, Atlas, Filo seviyeyle açılır), Atlas/rehber/mağazadaki eski emojiler ICO stiline, görev hedeflerinin gerçek dağılımla ayarı, ekonomi raporu. Mağaza deneyi (Play Console, onayla). | – |
| **1.5.4** | ~18 Ara | **Büyüt:** derin bağlantı (App Links, `assetlinks.json`), davet bağlantısı filo koduyla açar, "arkadaşını getir" ödülü (davetli 5. seviyeye ulaşınca), klip paylaşımı (son 8 sn + bağlantılı filigran). **Çok oyuncu 1. aşama(canlı bağlantı gerektirmez):** Yardım İste (aynı seviyede 3 yenilgiden sonra; filo üyelerine ve paylaşım bağlantısıyla dışarıya), Destek paketi (o seviyeye +1 kalkan; yardım edene filo puanı ve "Yardımsever" rozeti), **Hayalet Düello** (aynı tohum, rakibin kara deliği yarı saydam hayalet, skor karşılaştırma; eşit donanım). **Oyuncu etiketi** (NOVA #4821), **dünya filo sıralaması** (Bu hafta / Tüm zamanlar / Kupalar), **filo profili**. Japonca mağaza sayfası. | – |
| – | 21 Ara – 4 Oca | **Dondurma:** üretime yayın yok; izleme ve acil düzeltme. | – |
| **1.6.0** | ~Ocak sonu | **Kimlik:** Google Play Games ile tam eşitleme (iki cihazda oynayan için çakışma kuralları; yedek modu 1.5.1'de geliyor), kalıcı kimlik. Filo kozmetikleri (yıldızla). Günde sınırlı ödüllü reklam. | – |
| **1.6.x** | Eşik 1'den sonra | **Arkadaşlar:** etiketle ya da filo profilinden EKLE, istek + kabul (tek taraflı ekleme yok), en fazla 100, engelle. Oyun içinde "Filoma davet et" kartı. Premium avatar üretici (kask, kıyafet, renk, arka plan; ücretli parçalar). | **Eşik 1:** GAC ≥ 300 |
| **1.7.0** | Eşik 2'den sonra | **Canlı 1v1 kapışma:** 90 sn, aynı alanda iki kara delik (bugünkü rakip kara delik yapısı), rastgele eşleşme ya da arkadaşı çağırma; 20 sn'de eşleşme yoksa **açıkça "bot" yazan** rakip. Tartışmalı cisimde son söz sunucunun (hile önlemi). Yalnızca hazır mesaj ve emoji. **Anlık bildirimler** (yardım isteği, davet, yarış başladı); gizlilik metni ve Data safety güncellenir. | **Eşik 2:** GAC ≥ 1.000 ve en yoğun saatte ≥ 50 eşzamanlı |
| **1.8.0** | Eşik 3'ten sonra | **Canlı birlikte kazan:** yardım çağrısına dost kara delik olarak katılma, geçilirse ikisine de ödül. Kapışma ligi ve sezon sıralaması. | **Eşik 3:** GAC ≥ 5.000 |
| (karar sonra) | – | **Gerçek fotoğraf:** aşağıdaki şartlar sağlanmadan açılmaz. | GAC ≥ 10.000 + hukuki görüş + moderasyon bütçesi |

Takvim, 1.5.0'ın üretim onayına göre kayar; her sürüm önce Dahili test, sonra Alpha, sonra üretim.

**16 Ekim düzeltmesi:** kişisel hesapta üretim için 12 testçi × 14 gün kapalı test şart; süre 19 Ekim'de doluyor, üretim
erişimi başvurusu 20 Ekim, Google incelemesi ~7 gün. Üretim ay sonuna kaydığı için ilk üretim sürümü 1.5.1 (kod 48: 1.5.0 +
ölçüm ve Integrity) olacak; böylece ilk oyuncuların verisi ilk günden toplanır. Sorun çıkarsa test edilmiş kod 47 çıkar.

### Sıra ve neden (16 Ekim'de onaylandı)

**Ölç → Koru → Sağlamlaştır → Sadeleştir → Büyüt → Kimlik → Gelir → Push.** Her basamak bir sonrakinin ön şartı:
veri olmadan ilk 10 dakika neye göre sadeleşir bilinmez; koruma olmadan büyüme hileciyi de büyütür; bulut kayıt temiz kod
ve Integrity üstüne kurulur. İyileştirmeler 1.5.0'dan **sonra** gelir: kod 47 test edildi, uygulamaya dokunan her değişiklik
testi sıfırlar; ayarların yarısı gerçek veriyle yapılır. Yayın haftası yalnız uygulamaya dokunmayan sunucu ve işletim işleri.
Üretime çıkış her sürümde aşamalı (%20 → %100). Maliyet: hepsi ücretsiz katmanlarda (Cloudflare, Play Integrity, Play Games,
FCM, App Links, mağaza deneyleri, GitHub Actions).

### Bulut yedek (16 Ekim onaylandı, ilk üretim hedefi)

Sonradan geçiş kayıpsız (ilk açılışta telefondaki kayıt buluta yüklenir); beklemenin bedeli yalnız arada telefon
değiştiren, kaybeden ya da yeniden kuran oyuncunun ilerlemesi. Bu yüzden tam eşitleme 1.6.0'da kalır, ama **yalnız yedek
modu** öne alınır:
- Oyun ilerlemeyi arada bir Google Saved Games'e yedekler (oyuncunun kendi Google hesabı; bizim sunucuda kişisel veri yok).
  Giriş Play Games ile çoğunlukla kendiliğinden; oyuncu bir şeye basmaz.
- Telefondaki kayıt **boşsa** (yeni telefon, yeniden kurulum) "Kaydın bulundu, geri yükleyelim mi?" sorulur. Dolu kaydın
  üstüne hiçbir zaman yazılmaz: çakışma riski yok. Ayarlarda yedek satırı (son yedek zamanı).
- Kurulum numarası kayıtla taşınır: filo üyeliği ve sıralama da yeni telefona geçer.
- Play Games profili olmayan, web ve (olası) Family Link hesapları bugünkü gibi yedeksiz oynar.
- Maliyet 0 ₺; emek ~1 hafta; uygulama ~1–2 MB büyür.

Sıra: önce önizleme (kayıt bulundu kartı + ayar satırı) → onay → sahibi Play Console'da Play Games Services kurulumu
(adım adım tarif; uygulama imzalama anahtarı SHA-1'i ile kimlik bilgisi) → yazım ve iki cihazla test (yedekle, sil, yeniden
kur, geri yükle; dolu kayda dokunmama) → Dahili test → kapalı test. Üretim erişimi başvurusu (20 Eki) buna bağlı değil;
yedek hazır değilse üretim beklemez.

### Canlı filo ve ad (16 Ekim kararı)

- **Ad "Filo" kalır.** "İttifak" strateji oyunlarında yaygın ama savaş çağrıştırır; "Filo" uzay temasına uyar, bize özgü
  ve düğmede kısa. Değiştirmek puan getirmez; 11 dilde ~100 metin, 12 dilde mağaza kartı ve üretimden hemen önce risk demek.
- **Canlı filo, 1.5.2** (oyuncular filolara dağıldıktan sonra en çok işe yarar):
  1. Filo ekranının ilk sayfasında kısa **"Filoda neler oldu"** şeridi. Duvardaki olaylara (sandık, sıra yükseldi, altın
     madalya) eklenir: her 10 seviye, Günün Fırtınası sonucu, kişisel rekor, günün en çok puan getireni.
  2. **"Geçildin" uyarısı:** oyun açılınca, son bakıştan beri yarış sırası düştüyse menüde FİLO'nun altında
     "🏁 Nova filosu sizi geçti · 120 puan geride". Bildirim gerektirmez.
  3. **Canlı yarış sekmesi:** açıkken 30 sn'de bir yenilenir, sırası değişen filo ▲/▼ ile parlar, "üstündeki filoya X puan"
     satırı canlı.
- **Telefona "geçildin" bildirimi** sunucudan gönderim (FCM) ister: ücretsiz, ama Firebase projesi, bildirim adresi saklama,
  gizlilik metni ve Veri güvenliği formu güncellemesi gerekir. 1.7.0'da (eşik 2) kalır; filolar büyürse öne alınır. Kural:
  yalnız hafta sonu yarışında, günde en fazla 1.

### Güven modeli (16 Ekim onaylandı, kod 49 + sunucu, üretimden önce)

Play Integrity'nin kararına göre üç sınıf:
1. **Değiştirilmiş APK** (`UNRECOGNIZED_VERSION`): skor tamamen reddedilir, hiçbir listede görünmez.
2. **Doğrulanmış** (Play'den kurulmuş, güvenilir cihaz): ana dünya sıralaması ve günlük yıldız ödülü.
3. **Doğrulanamayan** (kilidi açık/root'lu cihaz, token yok, web): ana sıralamaya girmez; oyuncu kendi skorunu ve
   "doğrulanmamış" sırasını görür, ödül almaz. Oyunda 11 dilde kısa açıklama.

Filolar da aynı kurala bağlı: doğrulanamayan cihazın oyun puanları ve görev madalyaları filo yarışına ve sandıklara sayılmaz
(filo puanı istekleri de token taşır). Sahibinin test telefonları istisna: kurulum numaraları GitHub secret'ı `TRUST_PIDS`
(depoda değil), sunucu yayınında Cloudflare'e aktarılır. Kayıt haftası (kod 48 kapalı testte) sınıflar yalnız sayılır
(`node tools/rapor.mjs`); ayrım kod 49 ile ve `INTEGRITY = "enforce"` ile açılır. Her sınıfta mevcut kontroller sürer:
puan/süre tavanı, günde 40 gönderim, bildir, tavana yakın sonuç listesi, filoda günde 300 puan ve görev süre kontrolü.

### Haftalık iş planı

| Hafta | Tarih | İş | Kabul |
|---|---|---|---|
| 0 | 16–20 Eki | Kod 48 (1.5.1) Dahili test → kapalı test (Alpha); 20 Eki üretim erişimi başvurusu (sahibi); mağaza listesi ve video (önizleme + onay); filo görevi süre kontrolü (sunucu); haftalık şifreli D1 yedeği; günlük izleme (`/errs`, `/pings`, Android vitals) | Üretimde 47; ilk yedek; sahte anlık sonuç reddedilir; çökme < %1,09 |
| 0–1 | 17–26 Eki | Bulut yedek: önizleme + onay (17–18 Eki); Play Games Services kurulumu (sahibi); yazım + iki cihaz testi (20–25 Eki, Google incelemesi sürerken); Dahili test → kapalı test | Boş telefonda geri yükler, dolu kayda dokunmaz; testten geçerse ilk üretimde |
| 1–2 | 19 Eki – 1 Kas | 1.5.1: olay sayaçları (günde tek toplu gönderim, kimliksiz), kurulum yaşı, yıldız giriş/çıkış, Integrity proje numarası + kayıt modu, şüpheli skor raporu, okuma sayfası. Kod 48 Dahili test ~29 Eki | Sayaçlar sunucuda; Veri güvenliği formu güncel (sahibi doldurur) |
| 2 | 2–4 Kas | 1.5.1 Alpha → üretim; Integrity bir hafta kayıttan sonra zorunlu | Üretimde 1.5.1 |
| 3–4 | 2–15 Kas | 1.5.2: Canlı filo (önizleme + onay); R8 + AGP 9; `rel(≤10)` temizliği (her adım bot + seviye testi); `tools/` + CI duman testi; otomatik düşük kalite; geri yükleme provası | Davranış farkı yok; CI yeşil; yedek yerelde açılır |
| 5–6 | 16–29 Kas | 1.5.3: 2 haftalık huniden en çok kayıp veren 2 nokta (önizleme) → sade ilk oturum; emoji temizliği; görev hedefleri gerçek dağılımla; ekonomi raporu; mağaza deneyi (onayla) | Önizleme onaylı; hedefler veriye dayalı |
| 7–8 | 30 Kas – 13 Ara | 1.5.4: `assetlinks.json` (main'e onayla); davet bağlantısı; arkadaşını getir; klip paylaşımı; Yardım İste, Destek, Hayalet Düello; oyuncu etiketi; dünya filo sıralaması; filo profili | Bağlantı uygulamayı açar; ödül kötüye kullanılamaz |
| – | 21 Ara – 4 Oca | Dondurma | – |
| 9+ | Ocak | 1.6.0: Play Games tam eşitleme (çakışma kuralları); filo kozmetikleri; sınırlı ödüllü reklam (yeni ürün gerekirse sahibi ekler) | Telefon değişince ilerleme korunur |

## Gerçek fotoğraf: şartlar

Yalnızca kabul edilmiş bağlantılara (karşılıklı arkadaş) gösterilse bile:

- **Fotoğraf kişisel veridir** (KVKK, GDPR). Rızayı **fotoğraftaki kişi** verir; bakan arkadaşın onayı bunun yerine
  geçmez. Fotoğrafta başka biri varsa onun rızası da gerekir ve uygulama bunu doğrulayamaz: kural "yalnızca
  kendi yüzün, tek başına".
- **Yaş:** çocukların fotoğrafı en riskli kısım. KVKK'da reşit olmayanın rızası velisi üzerinden, GDPR'de ülkeye göre
  13–16 yaş sınırı, ABD'de 13 yaş altı için COPPA. En sade çözüm: fotoğraf yalnızca 18 yaş üstüne.
- **Yurt dışına aktarım:** fotoğraf Cloudflare'da (yurt dışında) durur. KVKK'nın 2024 düzenlemesiyle yurt dışı
  aktarımın kendi kuralları var (standart sözleşme ve bildirim gibi).
- **Biyometri:** yüz tanıma yapılmadığı sürece düz fotoğraf özel nitelikli veri sayılmaz; otomatik içerik süzgeci
  yüz tanıma yapmamalı.
- **Play kuralları:** kullanıcı içeriği için kullanım şartları, şikâyet, engelleme ve moderasyon zorunlu.
  Data safety formuna "Fotoğraflar" eklenir (formu oyun sahibi günceller).
- **Ekran görüntüsü engellenemez:** bağlantıya gösterilen fotoğraf kaydedilip yayılabilir; kullanıcıya açıkça söylenir.
- **Uygulama:** yükleme → otomatik içerik süzgeci (çıplaklık, şiddet, uygunsuz içerik) → onaylanınca görünür →
  3 şikâyette gizlenir → elle inceleme kuyruğu. Ücret, fotoğraf onaylandıktan sonra alınır. Silme her an mümkün ve
  sunucudan da silinir.
- Açmadan önce bir KVKK avukatının görüşü alınır.
