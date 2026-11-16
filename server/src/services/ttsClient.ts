import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface VoiceItem {
  id: string;
  label: string;
  slug: string;
  gender: "Nam" | "Nữ";
  region: "Bắc" | "Trung" | "Nam";
  style: string;
}

export interface SynthesizeOptions {
  input: string;
  voice?: string;
  speed?: number;
  response_format?: "mp3" | "wav";
  temperature?: number;
  model?: string;
}

export class TtsClient {
  private readonly baseUrl: string;
  private readonly cacheDir: string;
  private voiceCache: VoiceItem[] | null = null;

  constructor(baseUrl?: string, cacheDir?: string) {
    this.baseUrl = (baseUrl || process.env.TTS_BASE_URL || "http://vieneu.vcntt.tech/v1").replace(/\/+$/, "");
    this.cacheDir = cacheDir || path.resolve(process.cwd(), "cache");

    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (e) {
      console.warn("Could not create cache directory:", e);
    }
  }

  async getVoices(): Promise<{ default: string; voices: VoiceItem[] }> {
    if (this.voiceCache && this.voiceCache.length > 0) {
      return { default: "Minh Đức", voices: this.voiceCache };
    }

    try {
      const res = await fetch(`${this.baseUrl}/audio/voices`, {
        signal: AbortSignal.timeout(5000),
      });

      if (res.ok) {
        const json = await res.json() as any;
        if (json.data && Array.isArray(json.data)) {
          this.voiceCache = json.data.map((item: any) => {
            let gender: "Nam" | "Nữ" = "Nam";
            let region: "Bắc" | "Trung" | "Nam" = "Bắc";
            let style = "Tự nhiên";

            const parts = item.label.split("—")[1]?.split("·").map((p: string) => p.trim()) || [];
            if (parts.length >= 1) {
              if (parts[0].includes("Nữ")) gender = "Nữ";
              else gender = "Nam";
            }
            if (parts.length >= 2) {
              if (parts[1].includes("Trung")) region = "Trung";
              else if (parts[1].includes("Nam")) region = "Nam";
              else region = "Bắc";
            }
            if (parts.length >= 3) {
              style = parts[2].replace(/^Phong cách\s*/i, "").replace(/^Giọng đọc\s*/i, "");
            }

            return {
              id: item.id,
              label: item.label,
              slug: item.slug,
              gender,
              region,
              style,
            };
          });

          return { default: json.default || "Minh Đức", voices: this.voiceCache || [] };
        }
      }
    } catch (err) {
      console.warn("Failed to fetch remote voices, using verified fallback catalog:", err);
    }

    const fallbacks: VoiceItem[] = [
      { id: "Minh Đức", label: "Minh Đức — Nam · Bắc · Phong cách tin tức", slug: "minhduc", gender: "Nam", region: "Bắc", style: "Tin tức" },
      { id: "Phạm Tuyên", label: "Phạm Tuyên — Nam · Bắc · Phong cách tự nhiên", slug: "phamtuyen", gender: "Nam", region: "Bắc", style: "Tự nhiên" },
      { id: "Thái Sơn", label: "Thái Sơn — Nam · Nam · Phong cách kể chuyện", slug: "thaison", gender: "Nam", region: "Nam", style: "Kể chuyện" },
      { id: "Xuân Vĩnh", label: "Xuân Vĩnh — Nam · Nam · Phong cách tự nhiên", slug: "xuanvinh", gender: "Nam", region: "Nam", style: "Tự nhiên" },
      { id: "Thanh Bình", label: "Thanh Bình — Nam · Bắc · Phong cách kể chuyện", slug: "thanhbinh", gender: "Nam", region: "Bắc", style: "Kể chuyện" },
      { id: "Trúc Ly", label: "Trúc Ly — Nữ · Bắc · Phong cách tự nhiên", slug: "trucly", gender: "Nữ", region: "Bắc", style: "Tự nhiên" },
      { id: "Ngọc Linh", label: "Ngọc Linh — Nữ · Bắc · Phong cách kể chuyện", slug: "ngoclinh", gender: "Nữ", region: "Bắc", style: "Kể chuyện" },
      { id: "Đoan Trang", label: "Đoan Trang — Nữ · Bắc · Phong cách tự nhiên", slug: "doantrang", gender: "Nữ", region: "Bắc", style: "Tự nhiên" },
      { id: "Mai Anh", label: "Mai Anh — Nữ · Bắc · Phong cách tin tức", slug: "maianh", gender: "Nữ", region: "Bắc", style: "Tin tức" },
      { id: "Thục Đoan", label: "Thục Đoan — Nữ · Nam · Phong cách kể chuyện", slug: "thucdoan", gender: "Nữ", region: "Nam", style: "Kể chuyện" },
      { id: "Minh Triết", label: "Minh Triết — Nam · Nam · Phong cách tin tức", slug: "minhtriet", gender: "Nam", region: "Nam", style: "Tin tức" },
      { id: "Thùy Dung", label: "Thùy Dung — Nữ · Nam · Phong cách tin tức", slug: "thuydung", gender: "Nữ", region: "Nam", style: "Tin tức" },
      { id: "Quang Sơn", label: "Quang Sơn — Nam · Trung · Phong cách tự nhiên", slug: "quangson", gender: "Nam", region: "Trung", style: "Tự nhiên" },
      { id: "Ngọc Trân", label: "Ngọc Trân — Nữ · Trung · Phong cách tự nhiên", slug: "ngoctran", gender: "Nữ", region: "Trung", style: "Tự nhiên" },
      { id: "Mỹ Duyên", label: "Mỹ Duyên — Nữ · Nam · Phong cách đọc truyện", slug: "myduyen", gender: "Nữ", region: "Nam", style: "Đọc truyện" },
      { id: "Quỳnh Anh", label: "Quỳnh Anh — Nữ · Bắc · Phong cách đọc truyện", slug: "quynhanh", gender: "Nữ", region: "Bắc", style: "Đọc truyện" },
      { id: "Đức Trí", label: "Đức Trí — Nam · Nam · Phong cách đọc truyện", slug: "ductri", gender: "Nam", region: "Nam", style: "Đọc truyện" },
      { id: "Kim Thanh", label: "Kim Thanh — Nữ · Nam · Phong cách đọc truyện", slug: "kimthanh", gender: "Nữ", region: "Nam", style: "Đọc truyện" },
      { id: "Ngọc Huyền", label: "Ngọc Huyền — Nữ · Bắc · Giọng đọc tự nhiên", slug: "ngochuyen", gender: "Nữ", region: "Bắc", style: "Tự nhiên" },
      { id: "Adam", label: "Adam — Nam · Nam · Giọng đọc tự nhiên", slug: "adam", gender: "Nam", region: "Nam", style: "Tự nhiên" },
    ];

    this.voiceCache = fallbacks;
    return { default: "Minh Đức", voices: fallbacks };
  }

  async synthesize(options: SynthesizeOptions): Promise<{ buffer: Buffer; contentType: string; cached: boolean }> {
    const text = options.input.trim();
    if (!text) {
      throw new Error("EMPTY_TEXT");
    }

    const voice = options.voice || "Minh Đức";
    const rawSpeed = Number(options.speed);
    const speed = !isNaN(rawSpeed) && rawSpeed > 0 ? Math.max(0.5, Math.min(2.0, rawSpeed)) : 1.0;
    const format = options.response_format || "mp3";
    const rawTemp = Number(options.temperature);
    const temperature = !isNaN(rawTemp) && rawTemp > 0 ? rawTemp : 0.8;
    const model = options.model || "vieneu-tts-v3-turbo";

    const key = `${model}_${voice}_${speed}_${format}_${temperature}_${text}`;
    const hash = crypto.createHash("sha256").update(key).digest("hex");
    const filePath = path.join(this.cacheDir, `${hash}.${format}`);

    const contentType = format === "mp3" ? "audio/mpeg" : "audio/wav";

    // Kiểm tra cache tệp trên ổ đĩa
    if (fs.existsSync(filePath)) {
      try {
        const buffer = fs.readFileSync(filePath);
        return { buffer, contentType, cached: true };
      } catch (e) {
        // Nếu lỗi đọc cache thì tiếp tục fetch mới
      }
    }

    // Gửi request tới VieNeu TTS API
    const payload = {
      model,
      input: text,
      voice,
      response_format: format,
      speed,
      temperature,
    };

    const res = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`TTS synthesis error (${res.status}): ${errText || res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Lưu vào cache
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (e) {
      console.warn("Failed to write TTS cache file:", e);
    }

    return { buffer, contentType, cached: false };
  }
}
