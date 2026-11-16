import { splitIntoSentences } from "../utils/sentenceSplitter.js";

export interface SentenceInfo {
  index: number;
  text: string;
  charCount: number;
  startCharIndex: number;
  endCharIndex: number;
}

export interface TextChunk {
  id: string;
  index: number;
  text: string;
  charCount: number;
  wordCount: number;
  sentences: SentenceInfo[];
}

export interface ChunkOptions {
  maxChars?: number; // Mặc định 800 ký tự theo yêu cầu
}

/**
 * Tách một câu quá dài (> maxChars) theo các dấu phân tách tự nhiên (;, :, ,, khoảng trắng)
 */
function splitOverlongSentence(sentence: string, maxChars: number): string[] {
  if (sentence.length <= maxChars) {
    return [sentence];
  }

  const parts: string[] = [];
  // Thử tách theo dấu phẩy, chấm phẩy, hai chấm
  const clauses = sentence.split(/([;:,—–-])\s+/);
  let current = "";

  for (let i = 0; i < clauses.length; i++) {
    const clause = clauses[i];
    if (!clause) continue;

    if ((current + " " + clause).trim().length <= maxChars) {
      current = current ? `${current} ${clause}` : clause;
    } else {
      if (current.trim().length > 0) {
        parts.push(current.trim());
      }
      // Nếu bản thân clause đơn lẻ vẫn dài hơn maxChars, tách theo từ
      if (clause.length > maxChars) {
        const words = clause.split(/\s+/);
        let wordChunk = "";
        for (const w of words) {
          if ((wordChunk + " " + w).trim().length <= maxChars) {
            wordChunk = wordChunk ? `${wordChunk} ${w}` : w;
          } else {
            if (wordChunk.trim()) parts.push(wordChunk.trim());
            wordChunk = w;
          }
        }
        if (wordChunk.trim()) current = wordChunk.trim();
        else current = "";
      } else {
        current = clause;
      }
    }
  }

  if (current.trim().length > 0) {
    parts.push(current.trim());
  }

  return parts.length > 0 ? parts : [sentence];
}

/**
 * Tự động cắt văn bản thành các đoạn (chunks) theo giới hạn ký tự (mặc định 800),
 * TUYỆT ĐỐI KHÔNG CẮT NỬA CHỪNG CÂU, LUÔN CẮT HẾT CÂU.
 */
export function chunkTextBySentences(
  text: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const maxChars = options.maxChars && options.maxChars > 0 ? options.maxChars : 800;

  if (!text || typeof text !== "string" || !text.trim()) {
    return [];
  }

  // Bước 1: Tách toàn bộ văn bản thành các câu độc lập
  const rawSentences = splitIntoSentences(text);
  if (rawSentences.length === 0) {
    return [];
  }

  // Xử lý các câu cá biệt quá dài (> maxChars)
  const normalizedSentences: string[] = [];
  for (const s of rawSentences) {
    if (s.length > maxChars) {
      const subParts = splitOverlongSentence(s, maxChars);
      normalizedSentences.push(...subParts);
    } else {
      normalizedSentences.push(s);
    }
  }

  // Bước 2: Gom các câu vào từng chunk mà không vượt quá maxChars
  const chunks: TextChunk[] = [];
  let currentSentences: string[] = [];
  let currentLength = 0;

  const pushCurrentChunk = () => {
    if (currentSentences.length === 0) return;

    const chunkText = currentSentences.join(" ");
    const chunkSentences: SentenceInfo[] = [];
    let charOffset = 0;

    for (let i = 0; i < currentSentences.length; i++) {
      const s = currentSentences[i];
      const start = charOffset;
      const end = charOffset + s.length;
      chunkSentences.push({
        index: i,
        text: s,
        charCount: s.length,
        startCharIndex: start,
        endCharIndex: end,
      });
      charOffset = end + 1; // Tính thêm khoảng trắng nối
    }

    const wordCount = chunkText.trim().split(/\s+/).filter(Boolean).length;
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      index: chunks.length,
      text: chunkText,
      charCount: chunkText.length,
      wordCount,
      sentences: chunkSentences,
    });

    currentSentences = [];
    currentLength = 0;
  };

  for (const sentence of normalizedSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Chiều dài nếu ghép thêm câu này (kèm 1 dấu cách nối)
    const additionalLength = currentLength === 0 ? trimmed.length : trimmed.length + 1;

    if (currentLength + additionalLength <= maxChars) {
      currentSentences.push(trimmed);
      currentLength += additionalLength;
    } else {
      // Đã chạm hoặc vượt ngưỡng 800 ký tự -> Hoàn thành chunk hiện tại (cắt hết câu!)
      pushCurrentChunk();

      // Bắt đầu chunk mới với câu này
      currentSentences.push(trimmed);
      currentLength = trimmed.length;
    }
  }

  // Đẩy chunk cuối cùng còn lại
  pushCurrentChunk();

  return chunks;
}
