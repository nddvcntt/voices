import { Router, Request, Response } from "express";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { TtsClient } from "../services/ttsClient.js";
import { chunkTextBySentences } from "../services/textChunker.js";
import { mergeAudioBuffers, getAudioDuration } from "../services/audioMerger.js";

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

    const rawSpeed = Number(speed);
    const safeSpeed = !isNaN(rawSpeed) && rawSpeed > 0 ? rawSpeed : 1.0;
    const rawTemp = Number(temperature);
    const safeTemp = !isNaN(rawTemp) && rawTemp > 0 ? rawTemp : 0.8;

    const { buffer, contentType, cached } = await ttsClient.synthesize({
      input: content,
      voice: voice || "Minh Đức",
      speed: safeSpeed,
      temperature: safeTemp,
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

// 4. TẠO TẤT CẢ & TỰ ĐỘNG GHÉP THÀNH 1 FILE MP3 LIỀN MẠCH (Batch Synthesize & Auto-Merge)
ttsRouter.post("/batch-synthesize-and-merge", async (req: Request, res: Response) => {
  try {
    const { chunks, defaultVoice, speed, temperature } = req.body;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Danh sách chunks không được để trống"
      });
    }

    const cacheDir = path.resolve(process.cwd(), "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const rawSpeed = Number(speed);
    const safeSpeed = !isNaN(rawSpeed) && rawSpeed > 0 ? rawSpeed : 1.0;
    const rawTemp = Number(temperature);
    const safeTemp = !isNaN(rawTemp) && rawTemp > 0 ? rawTemp : 0.8;

    // Bước 1: Tổng hợp âm thanh cho tất cả các chunk với Bounded Concurrency = 3
    const processedChunks = await mapWithConcurrency(chunks, 3, async (chunk) => {
      const text = (chunk.text || "").trim();
      const voice = chunk.voice || defaultVoice || "Minh Đức";

      if (!text) {
        return {
          ...chunk,
          status: "error",
          errorMessage: "Văn bản rỗng",
          durationSec: 0,
        };
      }

      try {
        const { buffer } = await ttsClient.synthesize({
          input: text,
          voice,
          speed: safeSpeed,
          temperature: safeTemp,
          response_format: "mp3",
        });

        // Tạo file cache cố định
        const hash = crypto.createHash("sha256").update(`chunk_${voice}_${safeSpeed}_${text}`).digest("hex");
        const fileName = `${hash}.mp3`;
        const filePath = path.join(cacheDir, fileName);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, buffer);
        }

        // Đo thời lượng chính xác
        const durationSec = await getAudioDuration(buffer, "mp3");

        return {
          ...chunk,
          status: "ready",
          voice,
          audioUrl: `/audio-cache/${fileName}`,
          audioDurationSec: durationSec,
          buffer,
        };
      } catch (err: any) {
        console.error(`Error synthesizing chunk ${chunk.id}:`, err);
        return {
          ...chunk,
          status: "error",
          errorMessage: err.message || "Lỗi tổng hợp",
          durationSec: 0,
        };
      }
    });

    // Lọc các buffer hợp lệ để ghép
    const validBuffers: Buffer[] = [];
    for (const c of processedChunks) {
      if (c.buffer && Buffer.isBuffer(c.buffer)) {
        validBuffers.push(c.buffer);
      }
    }

    if (validBuffers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có đoạn âm thanh nào được tạo thành công"
      });
    }

    // Bước 2: Ghép toàn bộ các buffer MP3 thành 1 file MP3 duy nhất bằng FFmpeg
    const mergedBuffer = await mergeAudioBuffers(validBuffers, "mp3");
    const mergedHash = crypto.createHash("sha256").update(Buffer.concat(validBuffers.slice(0, 3))).digest("hex").slice(0, 16);
    const mergedFileName = `merged_${Date.now()}_${mergedHash}.mp3`;
    const mergedFilePath = path.join(cacheDir, mergedFileName);
    fs.writeFileSync(mergedFilePath, mergedBuffer);

    const fullAudioUrl = `/audio-cache/${mergedFileName}`;
    const totalDuration = await getAudioDuration(mergedBuffer, "mp3");

    // Bước 3: Tính toán timeline offsets cho từng đoạn trong file tổng
    let accumulatedTime = 0;
    const resultChunks = processedChunks.map((c) => {
      const dur = c.audioDurationSec || 0;
      const startSec = accumulatedTime;
      const endSec = accumulatedTime + dur;
      accumulatedTime = endSec;

      return {
        id: c.id,
        index: c.index,
        text: c.text,
        charCount: c.charCount,
        wordCount: c.wordCount,
        sentences: c.sentences,
        voice: c.voice,
        status: c.status,
        errorMessage: c.errorMessage,
        audioUrl: c.audioUrl,
        audioDurationSec: dur,
        timeline: {
          startSec: Math.round(startSec * 100) / 100,
          endSec: Math.round(endSec * 100) / 100,
          durationSec: Math.round(dur * 100) / 100,
        }
      };
    });

    res.json({
      success: true,
      data: {
        fullAudioUrl,
        totalDuration: Math.round(totalDuration * 100) / 100,
        totalChunks: resultChunks.length,
        readyChunks: resultChunks.filter(c => c.status === "ready").length,
        chunks: resultChunks,
      }
    });
  } catch (error: any) {
    console.error("Batch synthesize and merge error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Lỗi khi tổng hợp và tự động ghép file âm thanh"
    });
  }
});

// 5. Tải file MP3 đã ghép trực tiếp
ttsRouter.post("/merge-chunks", async (req: Request, res: Response) => {
  try {
    const { chunks, defaultVoice, speed } = req.body;

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Danh sách chunks không được để trống"
      });
    }

    const validChunks = chunks.filter((c) => (c.text || "").trim().length > 0);
    if (validChunks.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Không có đoạn văn bản nào có nội dung để tạo âm thanh"
      });
    }

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
