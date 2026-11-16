import { TextChunk, SentenceItem } from "../types";

const ABBREVIATIONS = new Set([
  "gs", "pgs", "ts", "ths", "bs", "thầy", "cô", "đ/c", "đc", "tp", "tt",
  "q", "p", "tx", "hđnd", "ubnd", "bch", "tw", "bt", "ttg", "pbt",
  "mr", "mrs", "ms", "dr", "prof", "st", "inc", "ltd", "corp",
  "eg", "ie", "vs", "vol", "no"
]);

export function localSplitSentences(text: string): string[] {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n{2,}/);
  const results: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    let current = "";
    const len = trimmed.length;

    for (let i = 0; i < len; i++) {
      const char = trimmed[i];
      const nextChar = i + 1 < len ? trimmed[i + 1] : "";
      const prevChar = i > 0 ? trimmed[i - 1] : "";
      current += char;

      if (char === "\n") {
        if (current.trim().length > 0) {
          results.push(current.trim());
          current = "";
        }
        continue;
      }

      const isPeriod = char === ".";
      const isExclamation = char === "!";
      const isQuestion = char === "?";
      const isEllipsis = char === "…" || (char === "." && nextChar === "." && i + 2 < len && trimmed[i + 2] === ".");

      if (isPeriod || isExclamation || isQuestion || isEllipsis) {
        if (isPeriod && /\d/.test(prevChar) && /\d/.test(nextChar)) {
          continue;
        }

        if (isPeriod && nextChar === ".") {
          while (i + 1 < len && trimmed[i + 1] === ".") {
            i++;
            current += trimmed[i];
          }
        }

        while (i + 1 < len && /["'”’\)\]\}]/.test(trimmed[i + 1])) {
          i++;
          current += trimmed[i];
        }

        if (isPeriod) {
          const words = current.trim().split(/\s+/);
          const lastWord = words[words.length - 1].replace(/[^\p{L}\d]/gu, "").toLowerCase();
          if (ABBREVIATIONS.has(lastWord)) {
            continue;
          }
        }

        const remainder = trimmed.slice(i + 1);
        if (remainder.length === 0 || /^\s/.test(remainder)) {
          if (current.trim().length > 0) {
            results.push(current.trim());
            current = "";
          }
        }
      }
    }

    if (current.trim().length > 0) {
      results.push(current.trim());
    }
  }

  return results.filter(s => s.length > 0);
}

export function localChunkText(text: string, maxChars: number = 800): TextChunk[] {
  if (!text || !text.trim()) return [];

  const sentences = localSplitSentences(text);
  if (sentences.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentSentences: string[] = [];
  let currentLength = 0;

  const pushChunk = () => {
    if (currentSentences.length === 0) return;
    const chunkText = currentSentences.join(" ");
    const sentenceItems: SentenceItem[] = [];
    let offset = 0;

    for (let i = 0; i < currentSentences.length; i++) {
      const s = currentSentences[i];
      const start = offset;
      const end = offset + s.length;
      sentenceItems.push({
        index: i,
        text: s,
        charCount: s.length,
        startCharIndex: start,
        endCharIndex: end,
      });
      offset = end + 1;
    }

    const wordCount = chunkText.trim().split(/\s+/).filter(Boolean).length;
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      index: chunks.length,
      text: chunkText,
      charCount: chunkText.length,
      wordCount,
      sentences: sentenceItems,
      status: "idle",
    });

    currentSentences = [];
    currentLength = 0;
  };

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const addLen = currentLength === 0 ? trimmed.length : trimmed.length + 1;
    if (currentLength + addLen <= maxChars) {
      currentSentences.push(trimmed);
      currentLength += addLen;
    } else {
      pushChunk();
      currentSentences.push(trimmed);
      currentLength = trimmed.length;
    }
  }

  pushChunk();
  return chunks;
}
