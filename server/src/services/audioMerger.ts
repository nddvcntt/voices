import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Đo thời lượng (giây) của một file âm thanh bằng ffprobe
 */
export async function getAudioDuration(buffer: Buffer, format: "mp3" = "mp3"): Promise<number> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thevoice-probe-"));
  const tempFile = path.join(tempDir, `sample.${format}`);

  try {
    fs.writeFileSync(tempFile, buffer);
    const { stdout } = await execFileAsync("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      tempFile
    ]);

    const dur = parseFloat(stdout.trim());
    return !isNaN(dur) && dur > 0 ? dur : 0;
  } catch (err) {
    // Fallback: Ước lượng theo kích thước buffer cho MP3 128kbps (~16KB/s)
    const estimated = buffer.length / 16000;
    return Math.max(1, Math.round(estimated * 10) / 10);
  } finally {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  }
}

/**
 * Ghép nhiều file audio MP3 thành 1 file duy nhất bằng ffmpeg concat
 */
export async function mergeAudioBuffers(
  buffers: Buffer[],
  format: "mp3" = "mp3"
): Promise<Buffer> {
  if (buffers.length === 0) {
    throw new Error("No audio buffers to merge");
  }
  if (buffers.length === 1) {
    return buffers[0];
  }

  // Thư mục tạm thời
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "thevoice-merge-"));
  const inputFiles: string[] = [];
  const listFilePath = path.join(tempDir, "inputs.txt");
  const outputFilePath = path.join(tempDir, `merged.${format}`);

  try {
    for (let i = 0; i < buffers.length; i++) {
      const filePath = path.join(tempDir, `part_${i}.${format}`);
      fs.writeFileSync(filePath, buffers[i]);
      inputFiles.push(filePath);
    }

    // Tạo file danh sách cho ffmpeg concat (escape dấu nháy đơn)
    const listContent = inputFiles
      .map(file => {
        const safePath = file.replace(/\\/g, "/").replace(/'/g, "'\\''");
        return `file '${safePath}'`;
      })
      .join("\n");
    fs.writeFileSync(listFilePath, listContent, "utf8");

    // Chạy ffmpeg
    try {
      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", listFilePath,
        "-c", "copy",
        outputFilePath
      ]);

      if (fs.existsSync(outputFilePath)) {
        return fs.readFileSync(outputFilePath);
      }
    } catch (ffmpegErr) {
      console.warn("FFmpeg concat failed, falling back to direct MP3 buffer concatenation:", ffmpegErr);
    }

    // Fallback nếu ffmpeg không khả dụng hoặc lỗi:
    // MP3 là stream of frames, có thể nối trực tiếp các buffer MP3 hợp lệ
    return Buffer.concat(buffers);
  } finally {
    // Dọn dẹp thư mục tạm
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup error
    }
  }
}
