# Üretime çıkış planı · Blackhole Storm 1.5.1

Bu dosya, üretime çıkana kadar yapılacak her işin listesi. Her maddede **kim** (Sen / Ben / Birlikte), **nerede**, **nasıl** ve
**bitti mi** yazar. Bir madde bitince işaretlenir (☐ → ☑). Kural gereği Play Console'daki ürünler, fiyatlar, üretim sürümü ve politika
beyanları (veri güvenliği, içerik derecelendirmesi, reklam beyanı) **senin** elinden geçer; ben hazırlar ve kontrol ederim.

## Takvim

| Gün | Ne |
|---|---|
| **19 Eki Paz** | A: başvurudan önceki kontroller (Console) |
| **20 Eki Pzt** | B: üretim erişimi başvurusu (form cevapları aşağıda) |
| **20–27 Eki** | C: Google incelerken para, reklam, beyanlar, mağaza ve kod 69 hazırlığı |
| **Onay günü (~27 Eki)** | D: üretim sürümü, %20 kademeli dağıtım |
| **30 Eki Cum** | İlk kampanya (Hafta Sonu Fırtınası) kendiliğinden başlar |
| **Onaydan sonra 2 hafta** | E: izleme, %50 → %100, ilk ayarlar |

---

## A. Başvurudan önce (19 Eki) · Sen, Play Console

| # | İş | Nerede | Beklenen |
|---|---|---|---|
| A1 ☑ | Üretim erişimi kartı | Kontrol paneli | "12 test kullanıcısı · 14 gün" ölçütü yeşil (19 Eki'de dolar; 20 Eki sabahı tekrar bak). 18 Eki: 13. gün |
| A2 ☑ | Testçi listesi | Test edin ve yayınlayın › Kapalı test › Alpha › Test kullanıcıları | En az 12 kişi kayıtlı, hiçbiri çıkmamış |
| A3 ☑ | Alpha sürümü | Aynı yer › Sürümler | Kod 68 "Yayında" |
| A4 ☑ | Uygulama içeriği | Politika › Uygulama içeriği | Bütün maddeler "Tamamlandı" (eksik varsa başvuru düğmesi açılmaz). 18 Eki: 10 beyan tamam, bekleyen yok; Politika durumu: sorun yok |
| A5 ☑ | Çökme ve ANR | Kalite › Android vitals | Kötü davranış eşiklerinin altında (çökme < %1,09, ANR < %0,47). Değerleri bana yaz. 18 Eki: 28 günde ikisi de sıfır |
| A6 ☑ | Lansman öncesi raporu | Test edin ve yayınlayın › Lansman öncesi raporu (kod 68) | Hata/uyarı listesi. Ekran görüntüsünü bana gönder, birlikte bakarız. 18 Eki: kod 68 için rapor yok (şart değil); ayarlar doğru, kod 69'da bakılacak |
| A7 ☑ | Test geri bildirimleri | Puanlar ve yorumlar › Test geri bildirimleri | Gelen bir şey varsa not al. 18 Eki: 4 geri bildirim, hepsi 5 yıldız, hepsi yanıtlandı |

---

## B. Üretim erişimi başvurusu (20 Eki) · Sen

> ✅ **19 Eki 20:00 TSİ gönderildi** ("Üretim erişimi başvurunuzu aldık", inceleme genelde 7 gün ya da daha kısa). Formda her kutu en fazla
> 300 karakter; gönderilen metinler aşağıda. Altındaki uzun metinler hazırlık taslağıdır.
>
> 1 · Testçileri nereden buldunuz: *First from family and friends, who played on their own phones. To reach more devices, countries and languages, we also used a testing service that provided additional testers. Family and friends gave most of the detailed feedback, through a WhatsApp group.*
> 1 · Test kullanıcısı bulmak: **Ne zor ne de kolay**
> 1 · Etkileşim: *Testers used all main features: levels, tutorial, Cosmic Lab, shop, Daily Race and fleet missions. Sessions were short, as expected for an arcade game; DAU/MAU was about 59%. Fleet races need many players, so they were used less. We expect lower daily return after launch.*
> 1 · Geri bildirim: *Via a WhatsApp group, the in-game feedback button, Play test feedback (all 5 stars, each answered) and watching players. Main points: stutters on some phones, crackling music on Android, an unclear continue screen, slow first levels and too-easy middle levels.*
> 2 · Hedef kitle: *Players aged 13 and over who enjoy short, casual arcade sessions on Android phones, especially fans of "eat and grow" games. The game is fully translated into 10 languages, including Turkish, English, Spanish, Portuguese, Arabic and Japanese, so the audience is global.*
> 2 · Ayıran özellikler: *A physics-based black hole that grows by swallowing asteroids, moons and planets. Long-term upgrades in the Cosmic Lab. Fleets of up to 20 players with daily missions on equal gear and a weekend race. A Daily Race where everyone plays the same universe. No account needed.*
> 2 · İlk yıl yükleme: **0 – 10 bin**
> 3 · Değişiklikler: *Fixed stutters on some phones and crackling music on Android. Redesigned the continue screen so each option shows its cost. Made early levels livelier and middle levels harder, scaled to upgrades. Added cloud backup, an in-game feedback button and a web test page. Over 60 builds tested.*
> 3 · Hazır olduğuna karar: *We played every update ourselves and with family and friends before release, ran automated bot tests across all levels, and reviewed the UI, economy, server and engine. Android vitals shows no crashes or ANRs in 28 days. Purchases are verified on our server; scores use Play Integrity.*

**Kontrol paneli › Üretime başvur.** Üç bölüm var; **İleri**'ye basmadan sayfadan çıkma, yazılanlar kaybolur.
Cevapları önce bir yere kopyala, sonra yapıştır. İngilizce yazmanı öneririm (inceleme ekibi için en güvenlisi); altında Türkçesi var.

### Bölüm 1 · Kapalı testiniz hakkında

**Test kullanıcısı bulmak ne kadar kolaydı?** → **Ne kolay ne zor** (orta seçenek)

**Test kullanıcıları uygulamanın tüm özelliklerini kullandı mı?** → **Evet**

**Kullanım, üretimde beklenen kullanıcı davranışına benziyor muydu? Farklar neler?**

> Mostly yes. Testers played short sessions of a few levels at a time, which is how we expect most players to use an arcade
> game. They used the classic levels, the tutorial, the Cosmic Lab upgrades, the shop, the Daily Race and the fleet missions.
> On most days, more than half of our monthly active testers opened the game (DAU/MAU about 59% in Play Console).
> The main difference: fleets and the weekend fleet race are designed for many players, so with a small test group they were
> used less than we expect in production; we tested them further with our own accounts and automated tests. Testers also
> came back more often than we expect from typical players, so we plan for a lower daily return rate after launch.

> *(Türkçesi: Büyük ölçüde evet. Testçiler birkaç seviyelik kısa oturumlar oynadı; bir arcade oyunda beklediğimiz kullanım bu. Klasik
> seviyeler, eğitim, Kozmik Lab, mağaza, Günlük Yarış ve filo görevleri kullanıldı. Çoğu gün aylık aktif testçilerin yarısından fazlası
> oyunu açtı (Play Console'da GEKS/AEKS yaklaşık %59). Fark: filolar ve hafta sonu yarışı çok oyuncu için
> tasarlandı, küçük grupta beklenenden az kullanıldı; kendi hesaplarımızla ve otomatik testlerle ayrıca denedik. Testçiler sıradan
> oyunculardan daha sık geri geldi; yayından sonra günlük dönüş oranının daha düşük olacağını hesaba katıyoruz.)*

**Geri bildirimleri özetleyin ve nasıl topladığınızı açıklayın.**

> We collected feedback through a WhatsApp group with family members, friends and other testers we invited, the in-game
> "Send feedback" button (Settings, opens an e-mail with the version and language), Play's private test feedback, and by watching family
> members and friends play on their own phones. The main points were:
> 1. Short stutters during play on some phones.
> 2. Crackling in the music on Android.
> 3. The continue screen after losing a life was hard to understand (it was not clear what a button would cost).
> 4. The first levels felt slow, with too few objects on screen; later, the middle levels felt too easy.
> 5. A tester using a child account could not join the test track.
>
> Ratings in Play's private test feedback were all 5 stars, and we replied to each one.

> *(Türkçesi: Geri bildirimi aile, arkadaşlar ve davet ettiğimiz diğer testçilerle kurduğumuz WhatsApp grubundan, oyun içi "Geri bildirim gönder" düğmesinden, Play'in
> gizli test geri bildiriminden ve aile ile arkadaşları kendi telefonlarında oynarken izleyerek topladık. Başlıcaları: bazı telefonlarda takılma,
> Android'de müzikte cızırtı, can gidince çıkan devam ekranının anlaşılmaması, ilk seviyelerin yavaş ve boş, ara seviyelerin kolay
> gelmesi, çocuk hesabıyla teste katılamama. Play test geri bildirimlerindeki puanların hepsi 5 yıldız; her birine yanıt verdik.)*

### Bölüm 2 · Oyununuz hakkında

**Hedef kitle**

> Players aged 13 and over who enjoy short, casual arcade sessions on Android phones, especially fans of "eat and grow"
> games. The game is fully translated into 10 languages (Turkish, English, Spanish, Portuguese, French, German, Russian,
> Arabic, Indonesian, Japanese), so the audience is global.

**Oyununuzu benzersiz kılan özellikler**

> - A physics-based black hole that grows as it swallows asteroids, moons and planets, with meteors, antimatter and bosses to avoid.
> - Long-term progress through the Cosmic Lab, plus levels whose challenge keeps up with the player's upgrades.
> - Fleets of up to 20 players who fill weekly chests together and race other fleets every weekend.
> - Three daily fleet missions with equal gear for everyone, so skill decides the medals, not purchases.
> - A Daily Race in which everyone plays the same 60-second universe.
> - Occasional weekend events with their own tasks and rewards.
> - No account needed; progress can be backed up with Google Play Games.

**İlk yıl tahmini yükleme aralığı** → Pazarlama bütçesi olmadığı için en düşük ikinci aralığı (ör. **1.000–10.000**) öneririm. Bu
cevap mağazada görünmez ve görünürlüğü etkilemez; yüksek seçmek bir şey kazandırmaz.

### Bölüm 3 · Üretime hazırlık

**Kapalı testten öğrendiklerinizle yaptığınız değişiklikler**

> 1. Stutters: we removed the heavy effects and spread start-up work over idle moments.
> 2. Music: on Android the audio now uses a larger buffer, so the crackling is gone and sound effects still feel immediate.
> 3. Continue screen: redesigned so every option shows what it gives and what it costs, with spare lives shown on the menu.
> 4. Difficulty: the first levels have more objects and move faster; the middle and late levels became harder, scaled to the
>    player's upgrades and capped.
> 5. Child accounts: we opened a web test page for testers who cannot join a Play test track.
> 6. Progress: cloud backup through Google Play Games.
> 7. Other fixes: the Android back button closes screens instead of leaving the game, a damaged save is kept aside instead
>    of being overwritten, and an in-game feedback button was added.
> 8. Shipped as more than 60 builds through internal and closed testing.

**Üretime hazır olduğunuzu nasıl belirlediniz?**

> - We played every update on our own phones and with family members and friends before releasing it to testers.
> - We ran automated play tests (bots) across the level range for difficulty and stability.
> - We reviewed the interface flows, the in-game economy, the server and the game engine before the final closed test builds.
> - Android vitals shows no crashes and no ANRs in the last 28 days of the closed test.
> - Purchases are verified on our server, and the leaderboards and fleet scores use Play Integrity.
> - Player names go through a multi-language filter, and players can report names.

> *(A5 kontrolü, 18 Eki: son 28 günde kilitlenme ve ANR sıfır. Lansman öncesi raporu kod 68 için oluşmadığından cümleden çıkarıldı.)*

---

## C. İnceleme sürerken (20–27 Eki)

Sıra önemli: **C1 → C2 → C3 → C4 → C5** (para), **C6–C8** (beyanlar), **C9–C11** (reklam), **C12–C14** (mağaza ve derleme).

### Para (Play Console)

| # | Kim | İş | Nasıl |
|---|---|---|---|
| C0 | Sen | **20/B hesabı** | ☑ İstisna belgesi geldi (20 Eki). Belgeyle bankada **20/B hasılat hesabı** aç (TL); banka gelen ödemelerden %15 stopajı kendisi keser. Bankaya AdMob reklam gelirinin de kapsamda sayılıp sayılmadığını sor. Bu hesabın IBAN'ı C1 ve C10'a girilir |
| C1 ☑ | Sen | **Ödeme profili** — **24 Eki**: AdSense ile ortak mevcut bireysel profil bağlandı, herkese açık satıcı profili Lias Labs / liaslabs.games@gmail.com / ekstre adı LIASLABS. **Banka hesabı henüz yok** (20/B hesabı açılınca eklenecek; kazanç birikir) | Ayarlar › Ödeme profili › Oluştur: hesap türü **Bireysel**, ad ve adres, IBAN: **C0'daki 20/B hesabı** (TL); AdMob'daki mevcut ödeme profili önerilirse onu seç. Bilgileri bana yazma, depoya girmesin |
| C2 ☑ | Sen | **%15 hizmet ücreti** — **24 Eki** hesap grubu (yalnız Lias Labs, ilişkili hesap yok) kuruldu ve kaydolundu | Ayarlar › Hizmet ücreti kademeleri (veya Kontrol paneli kartı) › kayıt ol. Kayıt olmazsan Google %30 keser |
| C3 ☑ | Ben (API) | **Ürünler** — **24 Eki** 11 tek seferlik ürün Play Developer API ile oluşturuldu ve etkinleştirildi (Actions › Play mağaza girişi › products; liste `store/play-urunleri.md`, diller `store/play-urunleri-diller.json`, 12 mağaza dili). Fiyat ya da metin değişince dosyayı düzeltip aynı görevi `apply` ile çalıştır | Para kazanma › Ürünler › Uygulama içi ürünler › Ürün oluştur. Kimlikler aşağıdaki tabloyla **harfi harfine** aynı (bir kimlik bir kez kullanılınca geri alınamaz). Her ürünü oluşturduktan sonra **Etkinleştir** |
| C3b | Sen | **Abonelik** | Para kazanma › Ürünler › Abonelikler › `vip_monthly`, temel plan `monthly`, aylık otomatik yenilenen, ₺39,99 |
| C4 | Sen | **Lisans testi** | Ayarlar (hesap) › Lisans testi: kendi Gmail'ini ve aileden deneyecek kişileri ekle, yanıt **RESPOND_NORMALLY**. Bu hesaplar test kartıyla para ödemeden alır |
| C5 | Birlikte | **Satın alma denemesi** | Kod 68'de mağazadan her türden birer ürün al: `starter` (tek sefer), `gems_s` (tekrar), `cosmic_id` (kalıcı), `vip_monthly` (abonelik). Ben her birinin sunucuda doğrulandığını ve oyunda verildiğini kontrol ederim; sonra uygulamayı silip kurup **Satın alımları geri yükle** denenir |

**Ürün tablosu** (`MONETIZATION.md` ile aynı; fiyatları sen girersin). **24 Eki kararı (B):** Türkiye TL fiyatı, diğer ülkeler ABD
fiyatından Google'ın çevirisiyle (TL'nin kabaca onda biri, dolar). Ürün sayfasında satın alma seçeneği kimliği `default`, tür **Satın al**,
geriye dönük uyumlu açık (uygulama fiyatı bu seçenekten okur). Varsayılan dil en-US, Türkçe çeviri "Çevirileri yönet"ten.

| Kimlik | Ad | Türkiye | ABD (temel) |
|---|---|---|---|
| `quasar_hoard` | Kuasar Hazinesi | ₺199,99 | $19.99 |
| `starter` | Başlangıç Paketi | ₺19,99 | $1.99 |
| `captain` | Kaptan Seti | ₺29,99 | $2.99 |
| `cosmic_id` | Kozmik Kimlik | ₺19,99 | $1.99 |
| `no_ads` | Reklamsız Oyna | ₺99,99 | $4.99 (yurt dışı piyasası; kural dışı) |
| `gems_s` | Avuç Elmas | ₺9,99 | $0.99 |
| `gems_m` | Kese Elmas | ₺24,99 | $2.49 |
| `gems_l` | Sandık Elmas | ₺49,99 | $4.99 |
| `stars_pack` | Yıldız Yığını | ₺12,99 | $1.29 |
| `lives_pack` | Can Deposu | ₺19,99 | $1.99 |
| `time_pack` | Zaman Kristalleri | ₺9,99 | $0.99 |
| `vip_monthly` | VIP Kulüp (abonelik) | ₺39,99 / ay | $3.99 / ay |

### Beyanlar (Play Console › Politika › Uygulama içeriği)

| # | Kim | İş | Ne değişiyor |
|---|---|---|---|
| C6 ☑ | Sen (ben listeyi verdim) | **Veri güvenliği** — **22 Eki 04:50 TSİ incelemeye gönderildi**: tek gerçek ekleme *Uygulama etkinliği › Kullanıcı tarafından oluşturulan diğer içerikler* (toplanıyor, paylaşılmıyor, kısa süreli değil, isteğe bağlı, Uygulama işlevselliği); Analiz ve Sahtekarlığı önleme amaçları zaten vardı. | Mevcut cevaplar `GOOGLE_PLAY.md`'de. Kontrol edilecek eklemeler: **Uygulama etkinliği › Uygulama içi etkileşimler** için amaç **Analiz** (kimliksiz kullanım sayaçları); **Uygulama etkinliği › Diğer kullanıcı içeriği**: filo adı, hazır duvar mesajları ve filo çağrıları, amaç **Uygulama işlevleri**; **Cihaz veya diğer kimlikler**'e amaç **Dolandırıcılığı önleme, güvenlik** (Play Integrity ile cihaz doğrulama); bulut yedek oyuncunun kendi Google hesabında (Play Games Kayıtlı Oyunlar), isteğe bağlı. Kaydetmeden önce bana ekran görüntüsünü gönder, birlikte bakarız |
| C7 ☑ | Sen | **İçerik derecelendirmesi (IARC)** — **22 Eki: yeni anket gerekmedi**; 4 Eki anketi çevrimiçi etkileşim, engelleme, bildirme ve dijital satın almayı zaten içeriyor (PEGI 3, IARC 3+, ESRB E, USK 0; Brezilya 14). | Anketi yeniden aç: "Kullanıcılar etkileşime girebilir mi" → **Evet** (oyuncu ve filo adları, hazır mesajlar; serbest sohbet yok); dijital satın alma **Evet**; konum paylaşımı **Hayır**. Sonuç değişirse yeni derecelendirmeyi uygula |
| C8 | Sen | Diğer maddeler | Reklamlar **Evet**; Reklam kimliği **Evet / Reklam veya pazarlama**; Hedef kitle **13+** (Aileler programı yok); Uygulama erişimi **giriş gerekmez**; Haber, Devlet, Finans, Sağlık **Hayır**. Hesap yok, bu yüzden hesap silme bağlantısı gerekmiyor |

### Reklam (AdMob)

Reklam birimleri zaten var ve kodda yazılı: Ödüllü `…/4584098403`, Geçiş `…/3873651965`.

| # | Kim | İş | Nasıl |
|---|---|---|---|
| C9 ☑ | Sen | **GDPR mesajı** — **24 Eki kontrol: 4 Eki'den beri yayında** (İngilizce + 6 dil, Blackhole Storm). **AdMob mağaza bağlantısı (D5) ☑ 24 Eki 00:24 TSİ**: Play'e bağlandı ve doğrulandı, AdMob incelemesi 2–3 gün (o zamana kadar sınırlı reklam). | AdMob › Gizlilik ve mesajlaşma › Avrupa düzenlemeleri › Mesaj oluştur: uygulama Blackhole Storm, tüm diller, "Yönet" seçeneği açık › **Yayınla**. Oyundaki izin penceresi bunu kullanır; yayınlanmazsa Avrupa'da reklam az gelir. İsteğe bağlı: ABD eyalet düzenlemeleri mesajı |
| C10 | Sen | **Ödeme ve vergi** | AdMob › Ödemeler: ABD vergi formu **W-8BEN ☑** (11 Eki onaylandı, Hizmetler %0, 2029'a kadar). Kalan: **Türkiye vergi bilgileri** (20/B belgesi geldi, doldurulabilir) ve **banka** (AdMob ancak kazanç eşiğe ulaşınca ekletir; C0'daki 20/B hesabı). Bakiye ~10 $ olunca postayla **adres PIN**'i gelir, girilir. Ödeme eşiği ~100 $ |
| C11 | Sen | **Güvenlik ayarları** | Engelleme kontrolleri › hassas kategoriler: kumar, flört, alkol engelli; içerik derecelendirmesi en fazla **T (Gençler)**. Ayarlar › Test cihazları: **kendi telefonunu ekle** (kendi reklamına dokunmak hesabı kapattırabilir) |

### Mağaza ve derleme

| # | Kim | İş | Nasıl |
|---|---|---|---|
| C12 | Ben → Sen | **Gizlilik metni** | Filo çağrısı ve kampanyalar için iki cümle, tarih güncellemesi. Önizleme → onay → web'e |
| C13 | Ben → Sen | **Mağaza görselleri** | Filo ve kampanya ekran görüntüleri (önizleme → onay → Play API ile yükleme). Kategori **Arcade**, iletişim e-postası ve web sitesi aynı kalır |
| C14 | Ben | **Kod 69 (üretim derlemesi)** | `ADS_LIVE=true` (gerçek reklam), Ayarlar'daki ♪ ms satırı kalkar, güven listesi (TRUST_PIDS) son kontrolü, sürüm notu. Filo düzeltmeleri (19 Eki, `blackhole`'da hazır: görev dönüşü önce filo, ✕ ve madalya hemen; hazır mesaj ve ÇAĞIR anında) bu derlemeyle gider; web de aynı gün. Sunucu da aynı gün yayınlanır (21 Eki: şampiyonluk ödülü alındıysa kart tekrar çıkmaz, `champ.got`). Büyük ekran (21 Eki): tablette/katlanabilirde yön kilidi yok, telefonda dikey (Play önerisi); Dahili testte bir telefonda dikey kaldığına bak. Önce Dahili teste: sen test cihazı ekli telefonunda gerçek reklamın "test" etiketiyle geldiğini görürsün. Alpha'ya **gönderilmez** (testçiler kod 68'de kalır) |
| C15 ☑ | Sen | **Ülkeler** — **🎉 23 Eki ~18:00 TSİ YAYINDA: Play Store sayfası herkese açık (18:01 TSİ kontrolünde 200, önceki 15:02'de 404); kod 69 (1.5.1), 177 ülke, %100.** **22 Eki: 177 ülke + Dünyanın geri kalanı eklendi.** **Üretim sürümü 69 (1.5.1) 22 Eki 04:59 TSİ incelemeye gönderildi** (ülkeler ve Veri güvenliğiyle tek inceleme; ilk üretim sürümünde kademeli yayın yok, onayla %100; yönetilen yayınlama kapalı, onaylanınca kendiliğinden yayına girer; sürüm notu en-US; tek uyarı: R8 eşleme dosyası yok, 1.5.2'de). | Üretim › Ülkeler/bölgeler: tümü (önerim). Çıkarmak istediğin ülke varsa söyle |

---

## D. Onay günü (~27 Eki)

| # | Kim | İş |
|---|---|---|
| D1 | Sen | Google'dan "üretim erişimi onaylandı" e-postası gelir (hesap sahibine). Bana haber ver |
| D2 | Sen | Test edin ve yayınlayın › **Üretim › Yeni sürüm oluştur › Kitaplıktan ekle › kod 69**. Sürüm notu hazır (en-US). Ülkeler C15 |
| D3 | Sen | **Kademeli dağıtım %20** › İncelemeye gönder. Üretim sürümünün incelemesi birkaç saat ile birkaç gün sürebilir |
| D4 | Ben | Yayın e-postası gelince: sunucu, reklam, satın alma ve sayaçların canlıda çalıştığını kontrol ederim |
| D5 | Sen | AdMob › Uygulama ayarları › **Uygulama mağazası ayrıntıları ekle** (Play'deki uygulamayı bağla) |
| D6 | Sen | Aile ve testçilere "oyun yayında" mesajı (taslağı ben hazırlarım). Puan istemek serbest, ama karşılığında ödül vermek yasak |

## E. Yayından sonraki 2 hafta

| Gün | İş |
|---|---|
| Her sabah | Ben günlük raporu çekerim: açılışlar (sürüm/dil), eğitimi bitirme, ilk seviyeler, satın almalar, reklam izlenmesi, hatalar |
| +2 gün | Vitals iyiyse **%50**, ardından +2 gün **%100** (sen, Üretim › Dağıtımı artır) |
| 30 Eki | İlk kampanya kendiliğinden başlar; ben menüde göründüğünü kontrol ederim |
| ☑ 24 Eki | **Yapıldı, sunucu yayında (24 Eki 11:51 TSİ):** asıl neden her yeni worker'daki ~25 sıralı şema komutuydu (her filo isteği ~4 sn; HAFTA ve YARIŞ açılmıyor gibiydi). Şema sürümü (`fleet_meta`) + `fleet_pts (wk, fid, day)` dizini: /fleets/top 4,1 → 0,3–0,7 sn, /fleets/fm 4,2 → 0,7–1,1 sn, /fleet 3,9 → 0,2–0,3 sn. Önceki not: `fleet_pts` için `(wk, fid, day)` dizini ve tek sorguda toplam, önce yerelde ölç, sonra sunucu yayını (onayla) |
| +1 hafta | İlk ayar turu: geri dönüş, zorluk, mağaza dönüşümü (P1) |
| +2–4 hafta | Viral işler (P2): paylaşım kartı, filo davetiyle gelen oyuncuya hediye, Günlük Yarış meydan okuma bağlantısı |

## Başvuru reddedilirse

Google "teste devam et" derse kapalı test sürer; aynı testçiler kayıtlı kaldıkça yeni 14 gün gerekmez. Reddin nedenine göre cevapları
birlikte güncelleyip yeniden başvururuz. Bu süre boyunca C maddeleri boşa gitmez, hepsi yine lazım.
