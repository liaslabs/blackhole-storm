---
name: gemini
description: Gemini 4 Argon'a danış. Kullanıcı "Gemini'ye sor", "Argon'a sor", "ikinci görüş al" dediğinde veya Gemini ile karşılaştırma istediğinde kullan.
---

# Gemini 4 Argon'a danışma

`veo` MCP sunucusunun `ask_gemini` aracını kullan (`tools/veo-mcp/server.mjs`, varsayılan model `gemini-4-argon`).

1. Argon önceki konuşmayı görmez: `prompt`'a gereken tüm bağlamı yaz (kod parçası, hata, hedef).
   Dosya/görsel/PDF gerekiyorsa yollarını `file_paths` ile ekle.
2. Yanıtı kullanıcıya özetle; Argon'un önerisini kendi değerlendirmenle birlikte sun,
   körü körüne uygulama.
3. Token başına ücretlidir; çok büyük dosyaları göndermeden önce kullanıcıya sor.
