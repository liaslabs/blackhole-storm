# Yol haritası (15 Ekim 2026)

Sosyal ve çok oyunculu özellikler **kademeli** gelir: oyuncu sayısı gerektirmeyenler hemen, oyuncu sayısına
dayananlar (canlı eşleşme gibi) ancak o sayıya ulaşınca. Eşik dolmadan açılan canlı mod boş kuyruk demektir;
oyuncu bekler, sıkılır ve bir daha denemez.

## Nasıl ölçüyoruz

- **Günlük aktif cihaz (GAC):** 1.5.0'daki günlük açılış sayacı (`/pings`). Her cihaz günde bir kez sayılır;
  kimlik tutulmaz. Bugün yalnızca test cihazları var (günde 3–9 açılış). Gerçek sayı 1.5.0 üretime çıkınca başlar.
- **Play Console:** yüklemeler, aylık aktif kullanıcı, elde tutma (1. / 7. / 30. gün).
- **Eşzamanlı oyuncu (eklenecek, 1.5.2):** canlı mod kararı için gerekir. Sunucu son 5 dakikada oyunda olan
  cihazları sayar (kimliksiz, yalnızca sayı). Akşam en yoğun saatteki değer esas alınır.
- Eşik, **14 gün üst üste** tutunca geçilmiş sayılır (tek günlük sıçrama sayılmaz).

## Takvim

| Sürüm | Hedef | İçerik | Eşik |
|---|---|---|---|
| **1.5.0** | 17–20 Eki üretim | Filolar, avatarlar, değerlendirme kartı, yıldız tozu arka planı, menüde yarış sayacı, yeni mağaza kartları | – |
| **1.5.1** | ~3 Kas | **Filo görevleri** (geliştiriliyor, `rel(11)`): günde 3 değişen görev (★/★★/★★★), OYNA düğmesi, eşit donanım (göreve özel 3 can, kalkan ve Süpernova; Lab ve avatar güçleri kapalı), günde görev başına 3 hak, füzyon yakıtı ve kişisel stok harcanmaz, puan yalnızca filoya. Filo Zinciri (ortak hedef). **Oyuncu etiketi** (NOVA #4821). **Dünya filo sıralaması:** Bu hafta / Tüm zamanlar / Kupalar, ilk 50 dışındaki filo kendi sırasını görür. **Filo profili:** amblem, kaptan, üyelerin avatarı, seviyesi ve başarıları, KATIL. | – |
| **1.5.2** | 1.5.1'den sonra | Android bakım güncellemesi (R8, AGP 9.0); yeni özellik içermez. | – |
| **1.5.3** | ~24 Kas | **Çok oyuncu 1. aşama (canlı bağlantı gerektirmez):** Yardım İste (aynı seviyede 3 yenilgiden sonra; filo üyelerine ve paylaşım bağlantısıyla dışarıya), Destek paketi (o seviyeye +1 kalkan; yardım edene filo puanı ve "Yardımsever" rozeti), **Hayalet Düello** (aynı tohum, rakibin kara deliği yarı saydam hayalet, skor karşılaştırma; eşit donanım). Eşzamanlı oyuncu sayacı. Japonca mağaza sayfası. | – |
| **1.6.0** | Eşik 1'den sonra | **Arkadaşlar:** etiketle ya da filo profilinden EKLE, istek + kabul (tek taraflı ekleme yok), en fazla 100, engelle. Oyun içinde "Filoma davet et" kartı. Tıklayınca oyunu açıp kodu kendiliğinden yazan davet bağlantısı (liaslabs alan adında doğrulama dosyası). **Google Play Games ile giriş:** kalıcı kimlik ve buluta kayıt (telefon değişince arkadaşlar ve filo kaybolmaz). Premium avatar üretici (kask, kıyafet, renk, arka plan; ücretli parçalar). | **Eşik 1:** GAC ≥ 300 |
| **1.7.0** | Eşik 2'den sonra | **Canlı 1v1 kapışma:** 90 sn, aynı alanda iki kara delik (bugünkü rakip kara delik yapısı), rastgele eşleşme ya da arkadaşı çağırma; 20 sn'de eşleşme yoksa **açıkça "bot" yazan** rakip. Tartışmalı cisimde son söz sunucunun (hile önlemi). Yalnızca hazır mesaj ve emoji. **Anlık bildirimler** (yardım isteği, davet, yarış başladı); gizlilik metni ve Data safety güncellenir. | **Eşik 2:** GAC ≥ 1.000 ve en yoğun saatte ≥ 50 eşzamanlı |
| **1.8.0** | Eşik 3'ten sonra | **Canlı birlikte kazan:** yardım çağrısına dost kara delik olarak katılma, geçilirse ikisine de ödül. Kapışma ligi ve sezon sıralaması. | **Eşik 3:** GAC ≥ 5.000 |
| (karar sonra) | – | **Gerçek fotoğraf:** aşağıdaki şartlar sağlanmadan açılmaz. | GAC ≥ 10.000 + hukuki görüş + moderasyon bütçesi |

Takvim, 1.5.0'ın üretim onayına göre kayar; her sürüm önce Dahili test, sonra Alpha, sonra üretim.

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
