# Veo MCP — Claude Code ile video üretimi

Claude Code'a Google **Veo 3.1** (Gemini API) ile video üretme yeteneği ekler.
Bağımlılık yok; sadece Node 18+ gerekir. Proje kökündeki `.mcp.json` sunucuyu otomatik tanıtır,
`.claude/skills/video` de Claude'a nasıl kullanacağını anlatır.

## Kurulum

1. **API anahtarı:** <https://aistudio.google.com/apikey> → *Create API key*.
2. **Faturalandırma:** Veo'nun ücretsiz katmanı yok. Anahtarın bağlı olduğu Google Cloud projesinde
   faturalandırmayı açın. Google AI Pro üyeliği uygulama içi Veo kotası verir ama API'yi kapsamaz;
   bunun yerine aboneliğe dahil **aylık Google Cloud kredisini** (Pro: $10/ay) Google Developer Program
   sayfasından (<https://developers.google.com/program>) etkinleştirip aynı faturalandırma hesabına bağlayın.
3. **Anahtarı tanıtın:**
   - Bilgisayarda: `export GEMINI_API_KEY=...` (ör. `~/.zshrc` / `~/.bashrc`), sonra `claude`'u yeniden başlatın.
   - Claude Code web/bulut: ortam ayarlarında *Environment variables* alanına `GEMINI_API_KEY=...` ekleyin
     ve yeni oturum açın.
4. Claude Code ilk açılışta `.mcp.json`'daki `veo` sunucusunu onaylamanızı ister → onaylayın.
   `/mcp` ile bağlı olduğunu kontrol edebilirsiniz.

## Kullanım

Claude'a doğal dille söyleyin:

> Kara delik etrafında dönen parlak yıldızlarla 8 saniyelik dikey bir oyun tanıtım videosu üret.

Videolar `generated-videos/` klasörüne kaydedilir (git'e eklenmez). Komut satırından deneme:

```bash
node tools/veo-mcp/server.mjs cli "a glowing black hole swallowing stars, cinematic"
```

| Ortam değişkeni    | Varsayılan                | Açıklama                                   |
| ------------------ | ------------------------- | ------------------------------------------ |
| `GEMINI_API_KEY`   | —                         | Zorunlu                                    |
| `VEO_OUTPUT_DIR`   | `<proje>/generated-videos`| Kayıt klasörü                              |
| `VEO_MAX_WAIT_SEC` | `360`                     | Bekleme süresi; aşılırsa `check_video` ile |

## Modeller ve maliyet

| `model`    | Model ID                        | Not                     |
| ---------- | ------------------------------- | ----------------------- |
| `fast`     | `veo-3.1-fast-generate-preview` | Varsayılan              |
| `standard` | `veo-3.1-generate-preview`      | En kaliteli, en pahalı  |
| `lite`     | `veo-3.1-lite-generate-preview` | En ucuz, 4k yok         |

Saniye başına ücretlendirilir; güncel fiyatlar: <https://ai.google.dev/gemini-api/docs/pricing>.
Üretilen videolar Google sunucularında 2 gün tutulur; araç bunları hemen indirir.
