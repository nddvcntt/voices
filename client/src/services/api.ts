import type { TtsVoice, TextChunk, ChunkAnalysisResult } from "../types";

export const API_BASE = ""; // Relative path through Vite proxy

export const api = {
  /**
   * Lấy danh mục giọng đọc
   */
  async getVoices(): Promise<{ default: string; voices: TtsVoice[] }> {
    try {
      const res = await fetch(`${API_BASE}/api/voices`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      throw new Error(json.error || "Failed to load voices");
    } catch (err) {
      console.warn("Using local voice catalog fallback:", err);
      // Fallback
      return {
        default: "Minh Đức",
        voices: [
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
        ]
      };
    }
  },

  /**
   * Cắt đoạn thông minh theo 800 ký tự (chuẩn hết câu)
   */
  async chunkText(text: string, maxChars: number = 800): Promise<ChunkAnalysisResult> {
    const res = await fetch(`${API_BASE}/api/chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, maxChars }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Tạo giọng nói cho một phân đoạn
   */
  async synthesize(options: {
    text: string;
    voice: string;
    speed?: number;
    temperature?: number;
    signal?: AbortSignal;
  }): Promise<{ blob: Blob; url: string }> {
    const res = await fetch(`${API_BASE}/api/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: options.text,
        voice: options.voice,
        speed: options.speed ?? 1.0,
        temperature: options.temperature ?? 0.8,
        response_format: "mp3",
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}: Lỗi khi tạo âm thanh`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { blob, url };
  },

  /**
   * Ghép toàn bộ các đoạn thành 1 file MP3 tổng hợp
   */
  async mergeChunks(chunks: TextChunk[], defaultVoice: string, speed: number = 1.0): Promise<Blob> {
    const payloadChunks = chunks.map(c => ({
      text: c.text,
      voice: c.voice || defaultVoice,
    }));

    const res = await fetch(`${API_BASE}/api/merge-chunks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chunks: payloadChunks,
        defaultVoice,
        speed,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Lỗi khi ghép file MP3 toàn bài");
    }

    return await res.blob();
  }
};
