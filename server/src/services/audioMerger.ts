import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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
