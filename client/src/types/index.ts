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
  estimatedStartSec?: number;
  estimatedEndSec?: number;
}

export type ChunkStatus = "idle" | "synthesizing" | "ready" | "error";

export interface ChunkTimeline {
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface TextChunk {
  id: string;
  index: number;
  text: string;
  charCount: number;
  wordCount: number;
  sentences: SentenceItem[];
  voice?: string;
  status: ChunkStatus;
  errorMessage?: string;
  audioUrl?: string;
  audioBlob?: Blob;
  audioDurationSec?: number;
  timeline?: ChunkTimeline;
}

export interface ChunkAnalysisResult {
  totalChunks: number;
  totalChars: number;
  totalWords: number;
  estimatedSeconds: number;
  chunks: TextChunk[];
}

export interface BatchMergeResult {
  fullAudioUrl: string;
  totalDuration: number;
  totalChunks: number;
  readyChunks: number;
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
  isFullTrackMode: boolean;
}
