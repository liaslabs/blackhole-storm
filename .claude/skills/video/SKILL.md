---
name: video
description: Google Veo 3.1 ile video üret. Kullanıcı video, klip, fragman, tanıtım videosu, animasyon veya "şunu videoya çevir" istediğinde kullan.
---

# Veo ile video üretme

`veo` MCP sunucusunun `generate_video` aracını kullan (`tools/veo-mcp/server.mjs`).

1. Kullanıcının isteğini **İngilizce**, ayrıntılı bir Veo prompt'una çevir:
   özne + eylem + ortam + kamera hareketi (dolly, pan, drone shot…) + ışık/stil + ses
   (diyalog tırnak içinde, ses efektleri ve müzik ayrıca tarif edilir).
2. Ayarlar: kullanıcı belirtmediyse `model: "fast"`, `duration_seconds: 8`,
   `aspect_ratio` mobil/Shorts/Reels için `9:16`, diğerleri için `16:9`.
   `standard` veya `1080p`/`4k` daha pahalıdır; yalnızca istenirse kullan.
3. Görselden video için `image_path` ver (ör. `store/` altındaki ekran görüntüleri).
4. Araç operasyon adı dönerse (süre doldu), bir süre sonra `check_video` ile sorgula.
5. Bitince dosya yolunu kullanıcıya bildir; bulut oturumundaysan dosyayı `SendUserFile` ile gönder.

Her üretim ücretlidir (saniye başına). Aynı istek için art arda çok sayıda video üretmeden önce kullanıcıya sor.
`GEMINI_API_KEY` eksik hatası gelirse kurulum için `tools/veo-mcp/README.md`'yi göster.
