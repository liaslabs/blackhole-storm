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
| 1.4.5 | 12 | 7 Eki | Derlendi (main 6e88e07), yüklenecek |
| 1.4.6 | 13 | 10 Eki | Hazır (REL=6) |
| 1.4.7 | 14 | 13 Eki | Hazır, `rel(7)` ile kapalı |
| 1.4.8 | 15 | 16 Eki | Gelen geri bildirimler |

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

## 1.4.6 (10 Ekim)
- Kasma: 90 ve 144 Hz ekranlarda (yenileme hızı değişen telefonlarda) düzensiz kare aralığı giderildi.
- Kasma raporu: seviye ortasında belirgin takılma olursa isimsiz kısa not (gizlilik sayfasında anlatılıyor).
- Bölünen gezegen: iki parça artık ekrandan çıkmıyor.

```
<en-US>
• Smoother play on 90 Hz and 144 Hz screens: no more stutter
• Split planets: both halves now stay on screen
• Anonymous stutter reports help us find slow spots
</en-US>
```

## 1.4.7 (13 Ekim) · `REL` 7 yapılacak
- Kademeli dokunma hassasiyeti + Ayarlar › Hassasiyet (Normal / Kademeli / Yüksek).
- Solucan deliği antimaddeyi ve yasaklı cisimleri almıyor (kaçılamayan isabet oluyordu).
- Yasaklı seviyeler: bomba, ekrandaki yasaklı cisimlerin yasağını kaldırıyor.

```
<en-US>
• New: graded touch sensitivity (Settings › Sensitivity): a quick swipe reaches the far edge in one move
• Wormholes no longer fling antimatter or forbidden bodies at you
• Restricted levels: a bomb lifts the ban from forbidden bodies on screen
</en-US>
```

## 1.4.8 (16 Ekim) · `REL` 8 yapılacak
- (geri bildirimlerden eklenecek)
