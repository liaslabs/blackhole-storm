# Mağaza sayfası çevirileri (Play Console)

Her klasör bir Play Console dilidir. İçinde:

- `title.txt` → **Uygulama adı** (en fazla 30 karakter)
- `short.txt` → **Kısa açıklama** (en fazla 80)
- `full.txt` → **Tam açıklama** (en fazla 4000)
- `screenshots/` → o dilin arayüzüyle çekilmiş 6 telefon ekran görüntüsü (1080×1920)

| Klasör | Play Console dili | Ekran görüntüleri |
|---|---|---|
| `en-US` | English (United States) — **varsayılan dil** | `en-US/screenshots` |
| `tr-TR` | Türkçe | `tr-TR/screenshots` |
| `es-ES` | Español (España) | `es-ES/screenshots` |
| `es-419` | Español (Latinoamérica) | `es-ES/screenshots` (aynısı) |
| `pt-BR` | Português (Brasil) | `pt-BR/screenshots` |
| `pt-PT` | Português (Portugal) | `pt-BR/screenshots` (aynısı) |
| `fr-FR` | Français (France) | `fr-FR/screenshots` |
| `de-DE` | Deutsch | `de-DE/screenshots` |
| `ru-RU` | Русский | `ru-RU/screenshots` |
| `ar` | العربية | `ar/screenshots` |
| `id` | Indonesia | `id/screenshots` |

Kürtçe Play'de mağaza dili olarak yok; Kürtçe telefonlar İngilizce sayfayı görür (oyunun kendisi Kürtçe açılır).

**Play Console'da:** Büyüme › Mağaza varlığı › Ana mağaza girişi. Önce varsayılan dil (İngilizce) doldurulur.
Sonra sağ üstteki **Çevirileri yönet › Kendi çevirilerimi ekle** ile diller eklenir; her dil için üstteki dil seçiciden
o dili seçip üç metni ve ekran görüntülerini yapıştır/yükle. Uygulama simgesi (`icons/icon-512.png`) ve tanıtım görseli
(`store/feature-graphic-1024x500.jpg`, yazısız) bütün diller için aynıdır.
