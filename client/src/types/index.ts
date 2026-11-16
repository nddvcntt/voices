export interface TtsVoice {
  id: string;
  label: string;
  slug: string;
  gender: "Nam" | "Nữ";
  region: "Bắc" | "Trung" | "Nam";
  style: string;
}

export interface SentenceItem {
  index: number;
  text: string;
  charCount: number;
  startCharIndex: number;
  endCharIndex: number;
  // Thời gian ước lượng trong chunk (giây)
  estimatedStartSec?: number;
  estimatedEndSec?: number;
}

export type ChunkStatus = "idle" | "synthesizing" | "ready" | "error";

export interface TextChunk {
  id: string;
  index: number;
  text: string;
  charCount: number;
  wordCount: number;
  sentences: SentenceItem[];
  // Cấu hình riêng cho chunk
  voice?: string;
  status: ChunkStatus;
  errorMessage?: string;
  // Dữ liệu audio sau khi tổng hợp
  audioUrl?: string;
  audioBlob?: Blob;
  audioDurationSec?: number;
}

export interface ChunkAnalysisResult {
  totalChunks: number;
  totalChars: number;
  totalWords: number;
  estimatedSeconds: number;
  chunks: TextChunk[];
}

export interface GlobalSettings {
  defaultVoice: string;
  speed: number;
  temperature: number;
  maxCharsPerChunk: number;
  autoplayNext: boolean;
  repeatMode: "none" | "one" | "all";
}

export interface PlayerState {
  currentChunkIndex: number | null;
  currentSentenceIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  speed: number;
}
