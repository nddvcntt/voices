import React from "react";
import { TextChunk, TtsVoice } from "../types";
import {
  Sparkles,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Volume2,
  Mic
} from "lucide-react";

interface ChunkListProps {
  chunks: TextChunk[];
  voices: TtsVoice[];
  defaultVoice: string;
  onUpdateChunkVoice: (chunkId: string, voiceId: string) => void;
  onSynthesizeChunk: (chunk: TextChunk) => void;
  onSynthesizeAll: () => void;
  isSynthesizingAll: boolean;
  activeChunkIndex: number | null;
  isPlaying: boolean;
  onPlayChunk: (index: number) => void;
  onTogglePlay: () => void;
}

export const ChunkList: React.FC<ChunkListProps> = ({
  chunks,
  voices,
  defaultVoice,
  onUpdateChunkVoice,
  onSynthesizeChunk,
  onSynthesizeAll,
  isSynthesizingAll,
  activeChunkIndex,
  isPlaying,
  onPlayChunk,
  onTogglePlay,
}) => {
  if (chunks.length === 0) {
    return (
      <div className="bg-studio-900/40 rounded-2xl border border-dashed border-studio-800 p-8 text-center text-slate-500 space-y-2">
        <Sparkles className="w-8 h-8 text-blue-500/50 mx-auto animate-pulse" />
        <h3 className="text-sm font-semibold text-slate-300">Chưa có phân đoạn nào</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Dán văn bản ở trên và nhấn <strong>"Tự Động Cắt Đoạn (Hết câu)"</strong> để chia văn bản thành các đoạn âm thanh hoàn chỉnh.
        </p>
      </div>
    );
  }

  const readyCount = chunks.filter((c) => c.status === "ready").length;

  return (
    <div className="bg-studio-900/60 rounded-2xl border border-studio-800 p-5 backdrop-blur-md space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>2. Danh Sách Các Đoạn ({chunks.length} đoạn)</span>
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {readyCount}/{chunks.length} đã tạo audio
            </span>
          </h2>
          <p className="text-2xs text-slate-400">
            Tất cả các đoạn được cắt trọn vẹn theo câu ngữ pháp, không vượt quá giới hạn ký tự
          </p>
        </div>

        {/* Batch Synthesize All Button */}
        <button
          type="button"
          disabled={isSynthesizingAll}
          onClick={onSynthesizeAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 shadow-lg shadow-emerald-600/20 transition active:scale-95"
        >
          {isSynthesizingAll ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Đang tổng hợp toàn bộ...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Tạo Giọng Nói Toàn Bộ ({chunks.length})
            </>
          )}
        </button>
      </div>

      {/* Chunks List */}
      <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
        {chunks.map((chunk, idx) => {
          const isActive = activeChunkIndex === idx;
          const currentVoice = chunk.voice || defaultVoice;
          const isChunkPlaying = isActive && isPlaying;

          return (
            <div
              key={chunk.id}
              className={`p-4 rounded-xl border transition-all ${
                isActive
                  ? "bg-blue-950/40 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/40"
                  : "bg-studio-950/70 border-studio-800/80 hover:border-studio-700"
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-studio-800/60">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center border border-blue-500/30">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-200">
                    Đoạn {idx + 1}
                  </span>
                  <span className="text-3xs px-2 py-0.5 rounded-full bg-studio-900 text-slate-400 border border-studio-800">
                    {chunk.charCount} ký tự · {chunk.wordCount} từ · {chunk.sentences.length} câu
                  </span>
                </div>

                {/* Voice selector for this chunk */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-2xs text-slate-400">
                    <Mic className="w-3 h-3 text-blue-400" />
                    <span>Giọng:</span>
                  </div>
                  <select
                    value={currentVoice}
                    onChange={(e) => onUpdateChunkVoice(chunk.id, e.target.value)}
                    className="py-1 px-2 rounded-lg bg-studio-900 border border-studio-800 text-2xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.id} ({v.region} · {v.gender})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chunk Content */}
              <div className="py-3">
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {chunk.text}
                </p>
              </div>

              {/* Card Footer & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-studio-800/60 text-2xs">
                {/* Status Indicator */}
                <div className="flex items-center gap-1.5">
                  {chunk.status === "idle" && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Chưa tạo âm thanh
                    </span>
                  )}
                  {chunk.status === "synthesizing" && (
                    <span className="text-cyan-400 flex items-center gap-1 font-semibold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Đang tổng hợp giọng nói...
                    </span>
                  )}
                  {chunk.status === "ready" && (
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng phát
                      {chunk.audioDurationSec && (
                        <span className="text-slate-400 font-normal">
                          (~{Math.round(chunk.audioDurationSec)}s)
                        </span>
                      )}
                    </span>
                  )}
                  {chunk.status === "error" && (
                    <span className="text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {chunk.errorMessage || "Lỗi tạo giọng nói"}
                    </span>
                  )}
                </div>

                {/* Chunk Action Buttons */}
                <div className="flex items-center gap-2">
                  {chunk.status === "ready" && chunk.audioUrl ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            onTogglePlay();
                          } else {
                            onPlayChunk(idx);
                          }
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-2xs font-bold transition shadow-sm ${
                          isChunkPlaying
                            ? "bg-amber-500 text-slate-950"
                            : "bg-blue-600 hover:bg-blue-500 text-white"
                        }`}
                      >
                        {isChunkPlaying ? (
                          <>
                            <Pause className="w-3 h-3" /> Tạm dừng
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" /> Phát đoạn này
                          </>
                        )}
                      </button>

                      <a
                        href={chunk.audioUrl}
                        download={`thevoice_doan_${idx + 1}.mp3`}
                        className="p-1.5 rounded-lg bg-studio-900 hover:bg-studio-800 text-slate-400 hover:text-white border border-studio-800 transition"
                        title="Tải tệp MP3 đoạn này"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={chunk.status === "synthesizing"}
                      onClick={() => onSynthesizeChunk(chunk)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition shadow-sm"
                    >
                      <Sparkles className="w-3 h-3" />
                      Tạo âm thanh đoạn này
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
