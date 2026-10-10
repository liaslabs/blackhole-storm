# Sürüm geçmişi · kapalı test (Ekim 2026)

Kapalı test 5 Ekim 2026'da başladı (TestMyApps: 14 testçi, 16 gün + arkadaşlar). Güncellemeler kademeli çıkar.
Kodda `REL` (src/game.src.html) o derlemenin sürümüdür; sonraki sürümü bekleyen özellikler `rel(n)` ile kapalıdır,
geliştirici linkinde (`?dev`) hepsi açıktır. Her derlemeden önce `REL` sürüme göre artırılır.

Her güncellemede:
1. **Play Console** → Test edin ve yayınlayın → Kapalı test → Alpha → *Yeni sürüm oluştur* → AAB → aşağıdaki
   **sürüm notu (en-US)** → Kaydet → Yayın özeti → incelemeye gönder. Testçiler bu notu Play Store'da "Yenilikler" olarak görür.
2. **TestMyApps** → WhatsApp'tan "yeni sürüm yüklendi" mesajı (testçiler güncellesin diye).
3. Bu dosya → durum ve tarih güncellenir.

| Sürüm | Kod | Plan | Durum |
|---|---|---|---|
| 1.4.4 | 11 | 5 Eki | Yayında (ilk kapalı test sürümü) |
| 1.4.5 | 12 | 8 Eki | Yayında (8 Eki 09:17 onaylandı; main 6e88e07) |
| 1.4.6 | 13 | 8 Eki | Yayında (8 Eki 11:55 onaylandı; öne alındı: 1.4.5'teki başlık çubuğu hatası; main ffcbfba) |
| 1.4.7 | 18 | 9 Eki | **Yayında** (9 Eki 16:04 onaylandı; main c4a0c5b). 15:41'de Alpha incelemesine gönderildi (Dahili test'te kod 18: reklamsız ve reklamlı oturumda takılma raporu yok). Öne alındı (testçiler takılma bildirdi). Kod 14 Dahili test'te denendi (reklam ve üst bar sorunsuz, hassasiyet fazla geldi); kod 15 = yumuşak hassasiyet (kullanılmadı); kod 16 = yumuşak hassasiyet + ayrıntılı takılma raporu (raporlar ve uçak modu testi: takılma önceden yüklenmiş reklamdan); kod 17 = oyun sırasında hazırda reklam yok + kalkan nabzı (takılma sürdü, held0); kod 18 = reklam kütüphanesi ihtiyaç anında başlar + ana iş parçacığı bekçisi. Önce Dahili test, sonra Alpha |
| 1.4.8 | 19 | 12 Eki | Hazır, `rel(8)` ile kapalı: düzeltmeler ve görsel (zorluk 1.4.7 ile aynı). 11 Eki Dahili test, 12 Eki Alpha |
| 1.4.9 | 20 | 16 Eki | Hazır, `rel(9)` ile kapalı: zorluk güncellemesi. 12–15 Eki Dahili test'te ayar, 16 Eki Alpha |
| 1.5.0 | 21 | ~24 Eki | Üretimden sonra: Android bakım güncellemesi |

## 1.4.5 (7 Ekim)
- Koruyucu seviyeleri: gezegen son kalpte düşünce elmasla/yıldızla devam etmek görevi baştan başlatıyordu; artık kaldığı süreden sürüyor.
- Android: oyun kendini "oyun" olarak tanıtıyor (tablet ve katlanabilirlerde dikey kalır), standart tam ekran ayarı (Play önerileri).
- Mağaza: "internet yok" ile "paketler yakında" ayrı mesajlar; bağlantı yüzünden olmayan satın almada "ücret alınmadı" uyarısı.

```
<en-US>
• Guardian levels: a continue now resumes the defense where it was, instead of starting over
• Tablets and foldables: the game stays in portrait
• Shop: clear messages when you are offline and while packs are not available yet
</en-US>
```

## 1.4.6 (8 Ekim, öne alındı)
- Düzeltme: 1.4.5'te oyunun üstünde "Blackhole Storm" yazan bir başlık çubuğu çıkıp üst barı örtüyordu. Sebep: `EdgeToEdge.enable()` `super.onCreate`'ten önce çağrılınca pencere, Capacitor temayı değiştirmeden önce başlık çubuklu temayla kuruluyordu. Satır kaldırıldı; `MainActivity` 1.4.4 ile birebir aynı.
- Kasma: 90 ve 144 Hz ekranlarda (yenileme hızı değişen telefonlarda) düzensiz kare aralığı giderildi.
- Kasma raporu: seviye ortasında belirgin takılma olursa isimsiz kısa not (gizlilik sayfasında anlatılıyor).
- Bölünen gezegen: iki parça artık ekrandan çıkmıyor.

```
<en-US>
• Fixed: a title bar covered the top of the game screen in 1.4.5
• Smoother play on 90 Hz and 144 Hz screens: no more stutter
• Split planets: both halves now stay on screen
• Anonymous stutter reports help us find slow spots
</en-US>
```

## 1.4.7 (9 Ekim, öne alındı) · `REL` 7 yapılacak
- Kasma: oyun sırasında hafızaya kayıt yapılmıyor (1.4.6'da 12 sn'de 8 kayıt vardı: atlas, başarım, ipucu); kayıt seviye sonu, duraklatma veya arka plana geçişte. Menü kalp sayacı oyun sırasında ekranı güncellemiyor.
- Kasma: müzik parçaları (bölge ve boss) seviye içinde değil, menüde ve sonuç ekranında açılıyor (decode). Titreşim çağrıları oyun sırasında en sık 90 ms'de bir (her biri uygulamanın yerel tarafına gidip geliyor).
- Kasma raporu artık takılma anındaki kendi JS süremizi, hafıza temizliğini (heapΔ), son kaydı, son reklamdan geçen süreyi, seviyenin kaçıncı saniyesi olduğunu ve son 1,5 sn'de oturumda ilk kez görülen cisim/olay/yazıları (yeni bir ekran kartı programı derleniyor olabilir) da yazıyor.
- Kasma (reklam, ANDROID değişikliği): reklam kapanınca sıradaki hemen yüklenmiyordu artık; yükleme sonuç ekranı, devam teklifi ve menüde (`adsPreload`). Reklam motoru oyun sırasında hiç başlatılmıyor. Kullanıcı reklamdan sonraki seviyede takılma gözlemledi. **Önce Dahili test'te denenecek.**
- Kasma: oyun içi güç düğmelerinde canlı bulanıklık (backdrop-filter) kaldırıldı, koyu cam arka plan; 'devam et' kaydı 0,4 sn sonra (kullanıcı devamdan sonra takılma gözlemledi).
- Kod 16, takılma raporu: donma anındaki kare süreleri, 50 ms nabız (sayfa meşgul mü boşta mı), Chrome long-animation-frame dökümü (kod / kare / sayfa düzeni, en uzun kod parçası), hemen önceki Android çağrıları (titreşim, reklam, bildirim), müzik çözme ve sesler, devamdan / arka plandan dönüşten beri geçen süre, ekran kartı adı ve tahmin (`→ script / layout / page(no js) / gpu/os` + `ad, cont, resume, app, new, update`). Seviye başı (kuran kareden sonra) ve sonuç / devam ekranı da oturumda birer kez raporlanır; oturum başına en fazla 4 not. Gizlilik sayfası güncellendi.
- Kod 17, takılmanın asıl sebebi (ANDROID değişikliği): kod 16 raporları takılma anında sayfanın meşgul olduğunu ama bizim kodun boşta olduğunu gösterdi; uçak modunda 4 seviyede hiç takılma olmadı. Önceden yüklenmiş tam ekran reklam, uygulamanın paylaşılan web sürecinde kendi sayfasını çalıştırıp oyunu ara ara bekletiyordu. Artık açılışta reklam yüklenmez; ödüllü reklam düğmeye basınca yüklenir ("Reklam yükleniyor…", 8 sn'de gelmezse "Şu an reklam yok"); ara reklam sadece sırası geldiğinde sonuç ekranında yüklenir; seviye başlarken elde kalan reklam bırakılır (`adsDrop`). Rapor: `held0/1`.
- Kod 18 (ANDROID): kod 17 raporlarında elde reklam yokken (`held0`) de 0,2–0,4 sn takılma sürdü. WebView karesi uygulamanın ana iş parçacığına bağlı, reklam kütüphanesi de işinin bir kısmını orada yapıyor (Unity/native oyunlar kendi çizim iş parçacığında çizdiği için etkilenmiyor). Kütüphane (`MobileAds.initialize`) artık açılışta değil, ilk reklam gerektiğinde başlar; izin formu açılışta kalır. "Reklam yükleniyor" yazısı kaldırıldı, oyuncu en fazla 10 sn bekler. Bekçi: ana iş parçacığı 120 ms+ tutulursa süresi ve o anki kod rapora `ui sdk0/1 310ms@-2 gms.ads… 7/9` olarak düşer.
- Kod 17: kalkan ve Hawking düğmelerinin nabzı her karede yeniden çizilen gölge yerine bir kez çizilen, sadece yanıp sönen parlama (`onizleme/kalkan-nabzi.png`).
- Bölünen gezegen parçaları 2 kat uzaklaşır, döner ve yanıp söner; L60+ boss radyasyonu 3 dalga, L80+ daha sık.
- Kademeli dokunma hassasiyeti + Ayarlar › Hassasiyet (Normal / Kademeli / Yüksek). Kod 14'te varsayılan Kademeli (2×) Dahili test'te fazla geldi (meteorlara çarpılıyordu); kod 15/16: varsayılan **Normal** (hıza göre en fazla 1,25×), Kademeli 1,6×, Yüksek 2,2×; hızlanma daha yüksek parmak hızında başlar, normal kaçış 1:1 kalır.
- Solucan deliği antimaddeyi ve yasaklı cisimleri almıyor (kaçılamayan isabet oluyordu).
- Yasaklı seviyeler: bomba, ekrandaki yasaklı cisimlerin yasağını kaldırıyor.

```
<en-US>
• New: touch sensitivity (Settings › Sensitivity): Normal, Graded or High; a quick swipe carries the hole further
• Wormholes no longer fling antimatter or forbidden bodies at you
• Restricted levels: a bomb lifts the ban from forbidden bodies on screen
• Fewer hitches: no saving during play, and ads load between levels, not during them
• Split planets: halves fly further apart, spin and blink
• Later bosses send three radiation waves
</en-US>
```

## 1.4.8 (12 Ekim) · `REL` 8 yapılacak · düzeltmeler ve görsel, zorluk 1.4.7 ile aynı
- Rekorlarım: her mod kendi en iyi 10 skorunu tutar (Normal, Zor Mod, Hayatta Kal, 60 sn), liste modlara göre bölümlü; "HAYATTA KAL REKORU" kutusu. Önceden tek bir ilk 10 vardı ve uzun Normal koşuları Hayatta Kal skorlarını dışarıda bırakıyordu.
- Bölünen gezegen: parçalar girintili çıkıntılı yarım ay (cisim gölgelendiricisinde kesik yüz), bölünmede beyaz kırık çizgisi, kaya kırıntıları ve kısa parlama; parçalar daha hızlı (430–490) ve daha geniş açıyla ayrılır. Ekranda en fazla 8 parça (L41+ 12), fazlası ekrandan kaçar; ilk 6 sn kenardan seker, 10 sn yutulmayan kaçar; 2 parça 1 cisim yeri tutar (önceden parçalar birikip yeni cisim gelişini kesebiliyordu).
- Takımyıldızlar bütün oyun alanına yayılır, iki yıldız arası en az 125; süre 6 sn yerine 8 sn + yıldız başına 2,2 sn.
- Kara delik antimaddeyi çekmez (Vortex dahil; Altın Yay ve seviye sonu hariç): sadece üstüne gidilirse zarar verir.
- İpucu kartları ve yeni cisim tanıtımları sessiz (TAMAM düğmesinin tıkı kalır).
- Kilonova: iki nötron yıldızının çevresinde "uzay dalgası" ağı. Sadece görsel; dalganın hızı ve itişi aynı.
- Takılma (1.4.7 raporlarından): (1) bölge arka plan fotoğrafları menüde önceden açılır, bulanık kopyası küçük boyutta yüklenir (Hayatta Kal'da bölge değişirken 150–280 ms takılıyordu, `IMG data:jpeg` dinleyicisi); Hayatta Kal koşu boyunca bölge değiştirmez. (2) Seviye başında tuvaller boyutu değişmediyse yeniden kurulmaz (moto g67'de her seviye başında 1,4–1,6 sn `nSyncAndDrawFrame`; 3 seviye başında 12 tuval sıfırlaması → 0). (3) Arka plan çizim çözünürlüğü en fazla 1,75× (2× yerine; görüntü farkı yok, `onizleme/arkaplan-cozunurluk.png`). (4) Menüde cüzdan rozetlerinde canlı bulanıklık kalktı.

```
<en-US>
• Smoother level starts and storms on mid-range phones
• My Records: each mode keeps its own best scores, Survival included
• Split planets break into jagged half-moons that fly further apart
• Constellations spread over the whole screen, with more time to finish
• The black hole no longer pulls antimatter in
• Kilonova: see space itself ripple as two neutron stars merge
</en-US>
```

## 1.4.9 (16 Ekim) · `REL` 9 yapılacak · zorluk güncellemesi
- Dolu ekran: cisimler ~1,7 kat sık, ekranda en fazla 14/16/18; L2–10'da %20 hızlı; 6–8'lik kaya sağanakları; hedef puanlar L2–6'da ×2, sonra ×1,5; L1 öğretici %35 hızlı.
- Yaylar: L1–10 3 yay, L11–60 2 yay, L61+ yaysız; yaysızken 2 enerji topu = 20 sn Yay Kalkanı. L11 ve L61'de tanıtım kartı (bot: L41+ yaysızken 0/28 kazanma, uçurum gibiydi).
- Altın Yay: çok nadir (yaklaşık 40 seviyede bir, L8'den itibaren) çift altın halka. Yutulunca 10 sn boyunca meteor, antimadde, yasaklı ve dev cisimler dahil her şey yutulur; hiçbir şey zarar vermez.
- Zor Mod: L1–60 2 yay, L61+ yaysız (2 kalp, meteor ×1,6, hedef ×1,5 aynen).
- Hayatta Kal (Günün Fırtınası) süresiz: hız 12'den başlar, her 30 sn +5, sınırsız; ilk 2 dk 2 yay sonra yaysız; dakikada bir meteor kuşağı; 4. dakikadan sonra Kara Fırtına her 30 sn'de %35 daha çok meteor (çiftler halinde) ve %8 hız. Saniye puanı +20, her dakika +10 artar; bitiş bonusu yok.
- Hedef: Normal modda bir seviye 8–10 denemede geçilebilmeli. 12–15 Ekim Dahili test'te kendi telefonda ayarlanacak.

```
<en-US>
• A fuller screen from the first level: more to swallow, faster action
• New, very rare Golden Arc: for 10 s you swallow everything, even meteors
• Tougher later levels: fewer arcs per heart, with an arc shield from level 61
• Survival is now endless, and from minute 4 the Black Storm takes over
</en-US>
```

## 1.5.0 (~24 Ekim, üretimden sonra) · Android bakım güncellemesi
- R8 sıkıştırma (`minifyEnabled true`) + Capacitor, Play Billing, AdMob ve bildirim eklentileri için keep kuralları.
  Play Console "Uygulama paketi gezgini": DEX optimizasyonu düşük, kod karartma %2. Önce kendi telefonda satın alma,
  reklam, bildirim, paylaşım ve titreşim tek tek denenecek.
- AGP 8.13 → 9.0 yükseltmesi (Play önerisi).
- Uçtan uca ekran (Play önerisi): `EdgeToEdge.enable(this)` bu sefer `super.onCreate`'ten **sonra** çağrılacak (1.4.5'teki başlık çubuğu hatası önceye konduğu içindi). Önce **Dahili test** kanalında kendi telefonda denenecek, sonra kapalı/üretim kanalına.
