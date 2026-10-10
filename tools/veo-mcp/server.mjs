#!/usr/bin/env node
// Veo MCP sunucusu — Claude Code'un Google Veo 3.1 ile video üretmesini sağlar.
// Bağımlılık yok: Node 18+ yerleşik fetch ve stdio üzerinden JSON-RPC (MCP) kullanır.
//
//   GEMINI_API_KEY   Google AI Studio'dan alınan anahtar (zorunlu, faturalandırma açık olmalı)
//   VEO_OUTPUT_DIR   Videoların kaydedileceği klasör (varsayılan: <proje>/generated-videos)
//   VEO_MAX_WAIT_SEC generate_video'nun sonucu bekleyeceği en uzun süre (varsayılan: 360)
//
// CLI ile deneme:  node tools/veo-mcp/server.mjs cli "bir kara delik etrafında dönen yıldızlar"

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline";

const API = "https://generativelanguage.googleapis.com/v1beta";
const MODELS = {
  fast: "veo-3.1-fast-generate-preview",
  standard: "veo-3.1-generate-preview",
  lite: "veo-3.1-lite-generate-preview",
};
const OUTPUT_DIR = path.resolve(
  process.env.VEO_OUTPUT_DIR || path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), "generated-videos"),
);
const MAX_WAIT_MS = Number(process.env.VEO_MAX_WAIT_SEC || 360) * 1000;
const POLL_MS = 10_000;

function apiKey() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY tanımlı değil. https://aistudio.google.com/apikey adresinden anahtar alıp " +
        "ortam değişkeni olarak ayarlayın (Veo için faturalandırma açık olmalı).",
    );
  }
  return key;
}

async function api(url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { "x-goog-api-key": apiKey(), "Content-Type": "application/json", ...init.headers },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini API ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function inlineImage(file) {
  const ext = path.extname(file).toLowerCase();
  const mimeType = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" }[ext];
  if (!mimeType) throw new Error(`Desteklenmeyen görsel türü: ${file}`);
  return { inlineData: { mimeType, data: (await readFile(file)).toString("base64") } };
}

async function startVideo(args) {
  const model = MODELS[args.model || "fast"];
  if (!model) throw new Error(`Bilinmeyen model: ${args.model} (fast | standard | lite)`);

  const instance = { prompt: args.prompt };
  if (args.image_path) instance.image = await inlineImage(args.image_path);
  if (args.last_frame_path) instance.lastFrame = await inlineImage(args.last_frame_path);

  const parameters = {};
  if (args.aspect_ratio) parameters.aspectRatio = args.aspect_ratio;
  if (args.resolution) parameters.resolution = args.resolution;
  if (args.duration_seconds) parameters.durationSeconds = String(args.duration_seconds);
  if (args.negative_prompt) parameters.negativePrompt = args.negative_prompt;

  const op = await api(`${API}/models/${model}:predictLongRunning`, {
    method: "POST",
    body: JSON.stringify({ instances: [instance], parameters }),
  });
  return op.name;
}

// Operasyonu bir kez sorgular; bittiyse videoları indirir.
async function checkVideo(operation, outputName) {
  const op = await api(`${API}/${operation}`);
  if (!op.done) return { done: false, operation };
  if (op.error) throw new Error(`Video üretilemedi: ${JSON.stringify(op.error)}`);

  const resp = op.response?.generateVideoResponse ?? {};
  const samples = resp.generatedSamples ?? [];
  if (!samples.length) {
    const reasons = resp.raiseMediaFilteredReasons?.join("; ");
    throw new Error(`Video dönmedi${reasons ? ` (güvenlik filtresi: ${reasons})` : ""}: ${JSON.stringify(op.response).slice(0, 500)}`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const base = (outputName || `veo-${new Date().toISOString().replace(/[:.]/g, "-")}`).replace(/\.mp4$/i, "");
  const files = [];
  for (const [i, sample] of samples.entries()) {
    const res = await fetch(sample.video.uri, { headers: { "x-goog-api-key": apiKey() }, redirect: "follow" });
    if (!res.ok) throw new Error(`Video indirilemedi: ${res.status}`);
    const file = path.join(OUTPUT_DIR, samples.length > 1 ? `${base}-${i + 1}.mp4` : `${base}.mp4`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    files.push(file);
  }
  return { done: true, operation, files };
}

async function generateVideo(args) {
  const operation = await startVideo(args);
  if (args.wait === false) return { done: false, operation };
  const deadline = Date.now() + MAX_WAIT_MS;
  for (;;) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const result = await checkVideo(operation, args.output_name);
    if (result.done || Date.now() > deadline) return result;
  }
}

function describe(result) {
  if (result.done) return `Video hazır:\n${result.files.join("\n")}`;
  return (
    `Video hâlâ üretiliyor. Operasyon: ${result.operation}\n` +
    `Biraz sonra check_video aracını bu operasyon adıyla çağırın.`
  );
}

const TOOLS = [
  {
    name: "generate_video",
    description:
      "Google Veo 3.1 ile metinden (veya görselden) sesli video üretir ve MP4 olarak diske kaydeder. " +
      "Genelde 1-6 dakika sürer. Ücretlidir (saniye başına faturalanır); fast modeli varsayılandır.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Sahnenin ayrıntılı tarifi (İngilizce en iyi sonucu verir). Diyalog için tırnak, ses efektleri için açıklama ekleyin." },
        model: { type: "string", enum: ["fast", "standard", "lite"], description: "fast (varsayılan, ucuz), standard (en kaliteli), lite (en ucuz)" },
        aspect_ratio: { type: "string", enum: ["16:9", "9:16"], description: "Varsayılan 16:9" },
        resolution: { type: "string", enum: ["720p", "1080p", "4k"], description: "Varsayılan 720p; 1080p/4k yalnızca 8 saniyede" },
        duration_seconds: { type: "integer", enum: [4, 6, 8], description: "Varsayılan 8" },
        negative_prompt: { type: "string", description: "İstenmeyen öğeler" },
        image_path: { type: "string", description: "İlk kare olarak kullanılacak görselin yolu (görselden videoya)" },
        last_frame_path: { type: "string", description: "Son kare görseli (image_path ile birlikte)" },
        output_name: { type: "string", description: "Dosya adı (uzantısız)" },
        wait: { type: "boolean", description: "false ise sadece başlatır ve operasyon adını döner" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "check_video",
    description: "generate_video ile başlatılmış bir Veo operasyonunun durumunu sorgular; bittiyse videoyu indirir.",
    inputSchema: {
      type: "object",
      properties: {
        operation: { type: "string", description: "generate_video'nun döndürdüğü operasyon adı" },
        output_name: { type: "string", description: "Dosya adı (uzantısız)" },
      },
      required: ["operation"],
    },
  },
];

async function callTool(name, args) {
  if (name === "generate_video") return describe(await generateVideo(args));
  if (name === "check_video") return describe(await checkVideo(args.operation, args.output_name));
  throw new Error(`Bilinmeyen araç: ${name}`);
}

async function handle(msg) {
  switch (msg.method) {
    case "initialize":
      return {
        protocolVersion: msg.params?.protocolVersion || "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "veo", version: "1.0.0" },
      };
    case "tools/list":
      return { tools: TOOLS };
    case "tools/call":
      try {
        const text = await callTool(msg.params.name, msg.params.arguments || {});
        return { content: [{ type: "text", text }] };
      } catch (err) {
        return { content: [{ type: "text", text: String(err.message || err) }], isError: true };
      }
    case "ping":
      return {};
    default:
      throw Object.assign(new Error(`Method not found: ${msg.method}`), { code: -32601 });
  }
}

function serve() {
  const send = (obj) => process.stdout.write(JSON.stringify(obj) + "\n");
  createInterface({ input: process.stdin }).on("line", async (line) => {
    if (!line.trim()) return;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
    }
    if (msg.id === undefined) return; // bildirim (ör. notifications/initialized)
    try {
      send({ jsonrpc: "2.0", id: msg.id, result: await handle(msg) });
    } catch (err) {
      send({ jsonrpc: "2.0", id: msg.id, error: { code: err.code || -32603, message: String(err.message || err) } });
    }
  });
}

if (process.argv[2] === "cli") {
  const prompt = process.argv.slice(3).join(" ");
  if (!prompt) {
    console.error('Kullanım: node tools/veo-mcp/server.mjs cli "video tarifi"');
    process.exit(1);
  }
  callTool("generate_video", { prompt }).then(console.log, (err) => {
    console.error(err.message || err);
    process.exit(1);
  });
} else {
  serve();
}
