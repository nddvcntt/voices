import React from "react";
import type { TextChunk, TtsVoice } from "../types";
import {
  Sparkles,
  Play,
  Pause,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Mic,
  Layers,
  Music,
  SlidersHorizontal,
} from "lucide-react";

interface ChunkListProps {
  chunks: TextChunk[];
  voices: TtsVoice[];
  defaultVoice: string;
  onUpdateChunkVoice: (chunkId: string, voiceId: string) => void;
  onSynthesizeChunk: (chunk: TextChunk) => void;
  onSynthesizeAll: () => void;
  isSynthesizingAll: boolean;
  onBatchSynthesizeAndMerge: () => void;
  isBatchMerging: boolean;
  fullAudioUrl?: string | null;
  totalDuration?: number;
  isFullTrackMode?: boolean;
  onPlayFullTrack?: () => void;
  onSwitchToChunkMode?: () => void;
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
  onBatchSynthesizeAndMerge,
  isBatchMerging,
  fullAudioUrl,
  totalDuration,
  isFullTrackMode,
  onPlayFullTrack,
  onSwitchToChunkMode,
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

  const formatSecs = (secs?: number) => {
    if (!secs || isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-studio-900/60 rounded-2xl border border-studio-800 p-5 backdrop-blur-md space-y-4">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-studio-800/80">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>2. Danh Sách Phân Đoạn ({chunks.length} đoạn)</span>
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {readyCount}/{chunks.length} sẵn sàng
            </span>
          </h2>
          <p className="text-2xs text-slate-400">
            Tự động cắt tối đa 800 ký tự chuẩn hết câu ngữ pháp, không ngắt vụn từ
          </p>
        </div>

        {/* Action Buttons: Batch Synthesize & Merge All */}
        <div className="flex flex-wrap items-center gap-2">
          {/* NÚT TẠO TẤT CẢ VÀ TỰ GHÉP NỐI 1 BÀI MP3 (YÊU CẦU CHÍNH) */}
          <button
            type="button"
            disabled={isBatchMerging || isSynthesizingAll}
            onClick={onBatchSynthesizeAndMerge}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 shadow-lg shadow-indigo-600/25 transition active:scale-95 ring-1 ring-white/10"
            title="Tổng hợp giọng nói cho tất cả các đoạn và dùng FFmpeg tự động ghép thành 1 file MP3 liền mạch"
          >
            {isBatchMerging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                <span>Đang tạo & ghép nối MP3...</span>
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Tạo Tất Cả & Tự Ghép MP3 ({chunks.length})</span>
              </>
            )}
          </button>

          {/* Nút phụ: Tạo từng đoạn rời */}
          <button
            type="button"
            disabled={isSynthesizingAll || isBatchMerging}
            onClick={onSynthesizeAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-studio-800 hover:bg-studio-700 hover:text-white border border-studio-700 disabled:opacity-50 transition active:scale-95"
            title="Tạo giọng nói lần lượt cho từng đoạn riêng lẻ"
          >
            {isSynthesizingAll ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>Tạo Riêng Lẻ</span>
          </button>
        </div>
      </div>

      {/* BANNER KẾT QUẢ KHI ĐÃ GHÉP THÀNH 1 FILE MP3 TOÀN BÀI */}
      {fullAudioUrl && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-purple-950/60 border border-blue-500/40 shadow-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300">
                <Music className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Đã Ghép Xong Toàn Bài Liền Mạch
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    FFmpeg Merged
                  </span>
                </div>
                <p className="text-2xs text-slate-300">
                  Thời lượng tổng: <strong>{formatSecs(totalDuration)}</strong> ({Math.round(totalDuration || 0)}s) · {chunks.length} đoạn đã hòa âm
                </p>
              </div>
            </div>

            {/* Quick Actions for Merged Track */}
            <div className="flex items-center gap-2">
              {/* Nút Phát Toàn Bài */}
              <button
                type="button"
                onClick={onPlayFullTrack}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-md ${
                  isFullTrackMode && isPlaying
                    ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                }`}
              >
                {isFullTrackMode && isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Tạm dừng bài ghép
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Phát toàn bài liền mạch
                  </>
                )}
              </button>

              {/* Nút Tải Toàn Bài MP3 */}
              <a
                href={fullAudioUrl}
                download={`TheVoice_FullTrack_${Date.now()}.mp3`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-studio-900/90 hover:bg-studio-800 text-slate-200 hover:text-white border border-studio-700 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tải MP3 Đã Ghép</span>
              </a>
            </div>
          </div>

          {/* Toggle Chế độ phát */}
          <div className="flex items-center justify-between pt-2 border-t border-blue-500/20 text-2xs text-slate-400">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-blue-400" />
              Chế độ phát hiện tại:{" "}
              <strong className={isFullTrackMode ? "text-cyan-300" : "text-amber-300"}>
                {isFullTrackMode ? "🎵 Toàn bài liền mạch (Full Merged Track)" : "📑 Từng đoạn riêng lẻ"}
              </strong>
            </span>

            {isFullTrackMode ? (
              <button
                type="button"
                onClick={onSwitchToChunkMode}
                className="text-2xs text-slate-300 hover:text-white underline underline-offset-2"
              >
                Chuyển về phát từng đoạn riêng lẻ
              </button>
            ) : (
              <button
                type="button"
                onClick={onPlayFullTrack}
                className="text-2xs text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
              >
                Chuyển sang phát toàn bài liền mạch
              </button>
            )}
          </div>
        </div>
      )}

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
                  {chunk.timeline && (
                    <span className="text-3xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono">
                      ⏱ {formatSecs(chunk.timeline.startSec)} - {formatSecs(chunk.timeline.endSec)}
                    </span>
                  )}
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
                      <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng
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
                            <Play className="w-3 h-3" /> {isFullTrackMode && chunk.timeline ? "Tua tới đoạn này" : "Phát đoạn này"}
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
                      disabled={chunk.status === "synthesizing" || isBatchMerging}
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
