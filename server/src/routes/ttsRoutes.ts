import { Router, Request, Response } from "express";
import { TtsClient } from "../services/ttsClient.js";
import { chunkTextBySentences } from "../services/textChunker.js";
import { mergeAudioBuffers } from "../services/audioMerger.js";

export const ttsRouter = Router();
const ttsClient = new TtsClient();

/**
 * Thực thi các tác vụ bất đồng bộ với giới hạn số luồng đồng thời (Bounded Concurrency)
 * Đảm bảo kết quả giữ nguyên 100% thứ tự của mảng gốc
 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

// 1. Lấy danh sách giọng đọc
ttsRouter.get("/voices", async (_req: Request, res: Response) => {
  try {
    const data = await ttsClient.getVoices();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch voices"
    });
  }
});

// 2. Tự động cắt đoạn thông minh theo tối đa 800 ký tự (chuẩn hết câu)
ttsRouter.post("/chunk", (req: Request, res: Response) => {
  try {
    const { text, maxChars } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "Trường 'text' là bắt buộc và phải là chuỗi ký tự"
      });
    }

    const targetMax = typeof maxChars === "number" && maxChars > 0 ? maxChars : 800;
    const chunks = chunkTextBySentences(text, { maxChars: targetMax });

    const totalChars = text.length;
    const totalWords = text.trim().split(/\s+/).filter(Boolean).length;
    // Ước lượng thời gian đọc: trung bình tiếng Việt đọc khoảng 160-180 từ/phút (~ 2.7 từ/giây)
    const estimatedSeconds = Math.ceil(totalWords / 2.7);

    res.json({
      success: true,
      data: {
        totalChunks: chunks.length,
        totalChars,
        totalWords,
        estimatedSeconds,
        chunks,
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Lỗi khi phân tách câu và cắt đoạn"
    });
  }
});

// 3. Tổng hợp giọng nói cho một đoạn văn bản
ttsRouter.post("/synthesize", async (req: Request, res: Response) => {
  try {
    const { input, text, voice, speed, temperature, response_format } = req.body;
    const content = (input || text || "").trim();

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp nội dung văn bản cần chuyển thành giọng nói"
      });
    }

    const { buffer, contentType, cached } = await ttsClient.synthesize({
      input: content,
      voice: voice || "Minh Đức",
      speed: Number(speed) || 1.0,
      temperature: Number(temperature) ?? 0.8,
      response_format: response_format === "wav" ? "wav" : "mp3",
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("X-Cache-Hit", cached ? "HIT" : "MISS");
    res.send(buffer);
  } catch (error: any) {
    console.error("Synthesis error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Lỗi khi tạo giọng nói"
    });
  }
});

// 4. Batch synthesis & ghép nối toàn bộ các đoạn thành 1 file MP3 hoàn chỉnh (Bounded Concurrency = 3)
ttsRouter.post("/merge-chunks", async (req: Request, res: Response) => {
  try {
    const { chunks, defaultVoice, speed } = req.body;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Danh sách chunks không được để trống"
      });
    }

    // Lọc các chunk có nội dung hợp lệ
    const validChunks = chunks.filter((c) => (c.text || "").trim().length > 0);

    if (validChunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có đoạn văn bản nào có nội dung để tạo âm thanh"
      });
    }

    // Tổng hợp song song 3 luồng (bounded concurrency) giúp tăng tốc gấp 3 lần
    const audioBuffers = await mapWithConcurrency(validChunks, 3, async (chunk) => {
      const text = chunk.text.trim();
      const voice = chunk.voice || defaultVoice || "Minh Đức";
      const { buffer } = await ttsClient.synthesize({
        input: text,
        voice,
        speed: Number(speed) || 1.0,
        response_format: "mp3",
      });
      return buffer;
    });

    const mergedBuffer = await mergeAudioBuffers(audioBuffers, "mp3");

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", 'attachment; filename="thevoice-full.mp3"');
    res.setHeader("Content-Length", mergedBuffer.length.toString());
    res.send(mergedBuffer);
  } catch (error: any) {
    console.error("Merge error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Lỗi khi ghép file âm thanh"
    });
  }
});
