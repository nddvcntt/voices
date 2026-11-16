/**
 * Bộ tách câu thông minh tiếng Việt & đa ngôn ngữ
 * Bảo toàn các trường hợp viết tắt phổ biến, số thập phân, ngày tháng
 */

// Danh sách các từ viết tắt phổ biến không được coi là kết thúc câu
const ABBREVIATIONS = new Set([
  "gs", "pgs", "ts", "ths", "bs", "thầy", "cô", "đ/c", "đc", "tp", "tt",
  "q", "p", "tx", "hđnd", "ubnd", "bch", "tw", "bt", "ttg", "pbt",
  "hn", "hcm", "đh", "thpt", "thcs", "nxb", "cty", "tnhh", "cp",
  "mr", "mrs", "ms", "dr", "prof", "st", "inc", "ltd", "corp",
  "eg", "ie", "vs", "vol", "no", "approx", "dept", "est"
]);

/**
 * Tách một văn bản thô thành danh sách các câu hoàn chỉnh
 */
export function splitIntoSentences(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) return [];

  // Tách tạm theo đoạn văn (dòng trống) để bảo đảm cấu trúc
  const paragraphs = normalized.split(/\n{2,}/);
  const allSentences: string[] = [];

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    const sentencesInPara = splitParagraph(trimmedPara);
    allSentences.push(...sentencesInPara);
  }

  return allSentences.filter(s => s.trim().length > 0);
}

/**
 * Tách một đoạn văn thành các câu dựa trên dấu kết thúc câu (. ! ? ...)
 */
function splitParagraph(paragraph: string): string[] {
  const result: string[] = [];
  let current = "";
  const len = paragraph.length;

  for (let i = 0; i < len; i++) {
    const char = paragraph[i];
    const nextChar = i + 1 < len ? paragraph[i + 1] : "";
    const prevChar = i > 0 ? paragraph[i - 1] : "";

    current += char;

    // Kiểm tra dấu xuống dòng đơn trong đoạn
    if (char === "\n") {
      if (current.trim().length > 0) {
        result.push(current.trim());
        current = "";
      }
      continue;
    }

    // Kiểm tra các dấu kết thúc câu tiềm năng (. ! ? …)
    const isPeriod = char === ".";
    const isExclamation = char === "!";
    const isQuestion = char === "?";
    const isEllipsisChar = char === "…" || (char === "." && nextChar === "." && i + 2 < len && paragraph[i + 2] === ".");

    if (isPeriod || isExclamation || isQuestion || isEllipsisChar) {
      // 1. Kiểm tra dấu chấm trong số: ví dụ 3.14, 1.000.000
      if (isPeriod && /\d/.test(prevChar) && /\d/.test(nextChar)) {
        continue;
      }

      // 2. Nếu là dấu 3 chấm "...", gom hết các dấu chấm liên tiếp
      if (isPeriod && nextChar === ".") {
        while (i + 1 < len && paragraph[i + 1] === ".") {
          i++;
          current += paragraph[i];
        }
      }

      // 3. Kiểm tra xem có dấu đóng ngoặc hoặc ngoặc kép ngay sau không
      while (i + 1 < len && /["'”’\)\]\}]/.test(paragraph[i + 1])) {
        i++;
        current += paragraph[i];
      }

      // 4. Kiểm tra từ viết tắt trước dấu chấm
      if (isPeriod) {
        const words = current.trim().split(/\s+/);
        const lastWord = words[words.length - 1]
          .replace(/[^\p{L}\d]/gu, "")
          .toLowerCase();

        if (ABBREVIATIONS.has(lastWord)) {
          // Là từ viết tắt (học hàm, chức danh, địa danh, xưng hô), không bao giờ coi dấu chấm là kết thúc câu
          continue;
        }
      }

      // 5. Kiểm tra ký tự kế tiếp: thường phải là khoảng trắng hoặc hết chuỗi
      const remainder = paragraph.slice(i + 1);
      if (remainder.length === 0 || /^\s/.test(remainder)) {
        const trimmed = current.trim();
        if (trimmed.length > 0) {
          result.push(trimmed);
          current = "";
        }
      }
    }
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}
