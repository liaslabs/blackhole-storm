# Sinematik açılış: kara deliğe yaklaşan mürettebat (yapay zekâ video promptları)

Tanıtım videosunun başına gelecek, gerçek film görünümlü açılış. Hikâye oyunun kendi girişine bağlanır
("BİR YILDIZ ÇÖKÜYOR… SEN BİR KARA DELİKSİN"): bir araştırma gemisinin mürettebatı ilk kez bir kara deliğe yaklaşır,
gemi çekime kapılır, kamera deliğin içine düşer ve görüntü oyundaki kara deliğe dönüşür.

**Araç:** Veo 3 (sesi ve konuşmayı da üretir) ya da Kling / Runway / Sora. Her çekim ayrı üretilir (5–8 sn), kurguda kısaltılır.
**Promptlar İngilizce**, çünkü bu modeller İngilizceyi en iyi anlar. Her çekim promptunun **başına "Stil kitabı"nı aynen yapıştır**:
yüzlerin, kokpitin ve kara deliğin çekimden çekime aynı kalmasını sağlayan şey budur.

**Uzunluk:** 30 sn tam sürüm (YouTube, sosyal medya) + 12 sn kısa sürüm (Play tanıtım videosu ve reklamlar; aşağıda).
**Format:** 16:9 üret, önemli her şeyi kadrajın ortasında tut; aynı çekimden 9:16 dikey kesilebilsin.
**Yazı yok:** Modeller yazıyı bozar. Başlıklar ("SEN BİR KARA DELİKSİN", oyun adı) kurguda eklenir.

---

## 1. Stil kitabı (her promptun başına)

```
STYLE BIBLE — Photorealistic live-action science-fiction feature film. Shot on ARRI Alexa 65, anamorphic lenses,
natural skin texture with pores and fine sweat, subtle film grain, high dynamic range, deep blacks, motivated
practical lighting only. Color: cold teal shadows inside the ship, warm orange-gold light from the black hole.
Important action kept in the center of frame (safe for a 9:16 crop). No on-screen text, no logos, no subtitles,
no readable writing on screens or patches.

CREW (keep identical in every shot):
- Commander ELIF — Turkish woman, 42, short dark hair with grey streaks, strong calm face, thin scar through her
  left eyebrow, navy flight suit with an orange shoulder patch, no helmet.
- Pilot JONAH — Black British man, 34, shaved head, short beard, grey flight suit, fingerless gloves.
- Scientist MEI — Japanese woman, 28, black hair tied back, slim headset with a boom mic, light grey flight suit.
All three are fictional people and must not resemble any real actor.

SHIP "ARGO" COCKPIT (keep identical): realistic NASA/SpaceX-style deep-space research vessel. Three seats side by side,
matte grey panels, worn physical toggle switches and rotary knobs, glass displays glowing amber and teal with
abstract gauges and waveforms only, a thick curved panoramic window with light condensation at its edges,
loose cables and a floating pen drifting in zero gravity, small red warning lamps.

THE BLACK HOLE (scientifically accurate, immense): a perfectly black round shadow edged by a razor-thin bright
photon ring; a vast accretion disk of glowing plasma, white-hot near the center, fading to gold, orange and deep red
outward; gravitational lensing bends the far side of the disk over and under the shadow into a glowing halo;
one side of the disk clearly brighter than the other (Doppler beaming); background stars smeared into arcs near
the edge; slow rotation; it fills the sky and dwarfs the ship.
```

**Negatif prompt** (araç destekliyorsa):
```
text, letters, subtitles, watermark, logo, cartoon, anime, CGI look, plastic skin, extra fingers, distorted hands,
warped faces, helmet visor glare hiding the face, lens flare overload, low resolution, jitter, morphing
```

---

## 2. Çekim listesi (30 sn)

| # | Süre | Çekim | Ses |
|---|---|---|---|
| 1 | 0–4 sn | Dış, çok geniş: minik gemi, ufukta kara delik | Neredeyse sessizlik, derin uğultu, telsiz cızırtısı |
| 2 | 4–7 sn | İç, mürettebatın arkasından: pencere turuncu yanıyor | Uyarı bip sesleri, gemi gıcırtısı |
| 3 | 7–10 sn | Yakın plan: komutanın gözlerinde diskin yansıması | Komutan fısıldar |
| 4 | 10–13 sn | Detay: göstergeler kırmızıya tırmanıyor, saat yavaşlıyor | Kalp atışı başlar |
| 5 | 13–17 sn | Dış, gövdeye paralel kamera: motorlar çekime karşı ateşliyor | Motor gürlemesi, müzik yükselir |
| 6 | 17–20 sn | Ağırlıksız su damlası pencereye doğru uzar (gelgit etkisi) | Bilim insanı konuşur |
| 7 | 20–24 sn | Pencereden bakış: gölge büyüyor, yıldızlar halkaya dönüşüyor | Müzik doruğa çıkar, sarsıntı |
| 8 | 24–26 sn | Ani sessizlik: komutan gözlerini kapatır | Tam sessizlik |
| 9 | 26–30 sn | Kamera kara deliğe düşer, ışıklar içeri akar → oyundaki kara delik | Tek derin vuruş, oyun müziği girer |

---

## 3. Çekim promptları

Her birinin başına **Stil kitabı** gelir.

**Çekim 1 · Ölçek**
```
SHOT 1, 6 seconds. Extreme wide establishing shot in deep space. The tiny silhouette of the research ship ARGO,
lit only from one side, drifts toward a gigantic black hole that occupies the right two thirds of the frame; the
lensed accretion disk arcs over and under the black shadow like a burning halo. The ship is a speck against it.
Camera: very slow push-in on a 24mm lens, perfectly smooth. Mood: awe and dread, total stillness.
Sound: almost silence, a deep sub-bass drone, faint crackle of radio static.
```

**Çekim 2 · Kokpit**
```
SHOT 2, 6 seconds. Interior cockpit, wide shot from behind the three seats looking out through the panoramic window.
Orange-gold light from the accretion disk floods the cockpit and silhouettes Commander ELIF (center), Pilot JONAH
(left, both hands on the control stick) and Scientist MEI (right, at her console). Red warning lamps pulse slowly.
A pen floats past the camera in zero gravity. Camera: subtle handheld, 35mm, slight drift forward.
Sound: soft repeating warning beep, metal hull creaking under strain.
```

**Çekim 3 · Komutanın yüzü**
```
SHOT 3, 5 seconds. Close-up of Commander ELIF's face, 85mm lens, very shallow depth of field. The glowing ring of
the accretion disk is reflected in her eyes. Fine sweat on her forehead, the scar through her left eyebrow visible.
She stays calm and says quietly, in a low steady voice: "Hold her steady, Jonah."
Camera: locked off, a barely perceptible push-in. Light: warm orange key from the window, cold teal fill from the
displays. Sound: her voice, the drone underneath.
```
Türkçe sürüm için replik: *"Sabit tut, Jonah."*

**Çekim 4 · Göstergeler ve zaman**
```
SHOT 4, 4 seconds. Insert shots on the instrument panel: analog needles climbing into a red zone, a glass display
with abstract waveforms stretching and slowing down, and a small analog clock on the panel whose second hand
visibly slows almost to a stop (time dilation). No readable numbers or text.
Camera: macro lens, slow lateral slide across the panel. Light: amber glow, red warning light pulsing.
Sound: a heartbeat begins, low and slow, under the drone.
```

**Çekim 5 · Gemi çekime karşı**
```
SHOT 5, 6 seconds. Exterior tracking shot running alongside the hull of ARGO, camera mounted close to the ship's
flank. The black hole fills the entire background; the bright side of the accretion disk lights the hull in hot
orange, the lensed far side of the disk arcs over the top of the frame. The main engines and side thrusters fire
hard against the pull, blue exhaust bending slightly toward the black hole. Debris and ice crystals stream past
toward the shadow. Camera: tracking with the ship, slight vibration, 28mm.
Sound: deep engine roar felt more than heard, strings enter and rise.
```

**Çekim 6 · Gelgit damlası**
```
SHOT 6, 5 seconds. Inside the cockpit, medium close-up of Scientist MEI. A floating sphere of water drifts in front
of her face and slowly stretches into a long thin teardrop pointing toward the window, pulled by the tidal force.
She watches it, then looks toward the commander and says, breathless: "Commander... it's pulling us in."
Camera: 50mm, slow rack focus from the water drop to her eyes. Light: orange window light, teal console light.
Sound: her voice, heartbeat faster, a rising tone.
```
Türkçe sürüm için replik: *"Komutan… bizi içine çekiyor."*

**Çekim 7 · Ufuk**
```
SHOT 7, 6 seconds. Point of view through the panoramic window. The black shadow grows until it fills most of the
window; the thin photon ring burns around it; background stars smear into concentric rings; the lensed disk wraps
over and under the shadow. Condensation on the window edges glows orange. Instruments in the lower edge of frame
flicker. Camera: forward, slowly accelerating, increasing shake.
Sound: music reaches its peak — rising pitch that never resolves, pounding low drums, alarms overlapping.
```

**Çekim 8 · Sessizlik**
```
SHOT 8, 3 seconds. Extreme close-up of Commander ELIF. Everything goes still. She slowly closes her eyes; a single
strand of hair floats across her face. The orange light on her skin brightens to white.
Camera: locked, 100mm macro. Sound: complete silence.
```

**Çekim 9 · İçeri düşüş → oyun**
```
SHOT 9, 5 seconds. The camera falls straight into the black hole: streaks of starlight and glowing plasma stretch
inward toward the center, the photon ring rushes outward past the frame edges, everything collapses into pure
black. In the final second a single glowing ring of red and violet light ignites in the center of the black frame.
Camera: continuous forward fall, accelerating. Sound: one deep, heavy impact, then a low hum.
```
Kurguda son kareye oyundaki kara delik ve oyunun açılış yazıları eklenir: **"BİR YILDIZ ÇÖKÜYOR…" → "SEN BİR KARA DELİKSİN"**,
ardından gerçek oyun görüntüleri gelir. Son halka oyunun simgesindeki kırmızı-mor kara deliğe benzesin diye çekim 9 böyle yazıldı.

---

## 4. Müzik promptu (Suno, Udio, Stable Audio gibi araçlar için)

```
Cinematic dark ambient trailer cue, 30 seconds, no vocals, 70 BPM.
0-10s: near silence, deep sub-bass drone, distant metallic creaks, faint radio static.
10-17s: slow low heartbeat pulse, a single cello note sustained, tension builds.
17-24s: string ostinato and a rising Shepard tone that never resolves, pounding low taiko drums, layered alarms.
24-26s: hard cut to complete silence.
26-30s: one massive low braam impact, then a warm synth pad in a minor key that fades into an electronic game theme.
Mood: awe, dread, vastness of space. Style: modern space-film score, organ-like low synths, sparse and huge.
```
İstersen müzik yerine sona doğru oyunun kendi parçası (`music/boss.mp3`) bağlanır; telif sorunu olmaz.

---

## 5. Kısa sürüm (12 sn): Play tanıtım videosu ve reklamlar

Play'deki tanıtım videosu mağaza sayfasında sessiz başlar ve oyunu göstermesi beklenir. Sinematik bölüm kısa kalmalı:
**çekim 1 (2 sn) → çekim 3 (2 sn) → çekim 7 (3 sn) → çekim 9 (2 sn) → "SEN BİR KARA DELİKSİN" (1 sn) → oynanış.**
Sessiz izlenince de anlaşılsın diye replikler altyazı olarak kurguda eklenir.

---

## 6. Dikkat edilecekler

- **Yüzler tutarlı kalsın:** Önce her karakter için tek bir portre üret (ön, yan), beğendiğini "referans görsel" olarak
  her çekime ver (Veo/Kling/Runway'de görselden video). Yalnızca metinle her çekimde yüz değişebilir.
- **Gerçek kişi yok:** Karakterler kurgusal; tanınan bir oyuncuya benzerse o çekimi yeniden üret (reklam politikaları
  ve kişilik hakları).
- **Reklam kuralları:** Google Ads ve Play, videonun oyunu yanıltıcı göstermemesini ister. Sinematik bölümden sonra gerçek
  oynanış mutlaka gelmeli; videoyu baştan sona sinematik yapma.
- **Kara delik doğru görünsün:** "Interstellar" gibi film adları prompta yazılmaz; yukarıdaki bilimsel tarif (gölge, foton
  halkası, bükülmüş disk, bir tarafın daha parlak olması) aynı etkiyi verir.
- **Ses:** Veo 3 sesi ve konuşmayı birlikte üretir. Diğer araçlarda konuşma ayrı seslendirilir (ElevenLabs gibi),
  müzik ayrı konur.
