import React, { useEffect, useRef, useState } from "react";
import type { TextChunk } from "../types";
import {
  Maximize2,
  Radio,
  ArrowDownCircle,
  Eye,
  CheckCircle2,
  Pause,
  Play
} from "lucide-react";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { findActiveSentenceIndex } from "../services/chunker";

interface KaraokeViewProps {
  chunks: TextChunk[];
  activeChunkIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isFullTrackMode?: boolean;
  onPlayChunk: (index: number) => void;
  onTogglePlay: () => void;
  onOpenFullscreen: () => void;
  onSeekToSentence?: (chunkIndex: number, sentenceIndex: number) => void;
}

export const KaraokeView: React.FC<KaraokeViewProps> = ({
  chunks,
  activeChunkIndex,
  isPlaying,
  currentTime,
  duration,
  isFullTrackMode = false,
  onPlayChunk,
  onTogglePlay,
  onOpenFullscreen,
  onSeekToSentence,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const activeChunkRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tự động cuộn theo đoạn đang đọc
  useEffect(() => {
    if (autoScroll && activeChunkRef.current) {
      activeChunkRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeChunkIndex, autoScroll]);

  if (chunks.length === 0) {
    return (
      <div className="bg-studio-900/60 rounded-2xl border border-studio-800 p-12 text-center text-slate-500 space-y-3">
        <Radio className="w-10 h-10 text-blue-500/50 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-200">Chưa có nội dung để hiển thị Karaoke</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Vui lòng nhập văn bản ở tab Biên tập và nhấn "Tự Động Cắt Đoạn", sau đó tổng hợp giọng nói để trải nghiệm đồng bộ Karaoke chuyên nghiệp.
        </p>
      </div>
    );
  }

  // Tính câu nào đang được đọc trong chunk hiện tại
  const currentChunk = activeChunkIndex !== null ? chunks[activeChunkIndex] : null;
  const chunkStartTime = currentChunk?.timeline?.startSec ?? 0;
  const chunkDuration = currentChunk?.timeline?.durationSec ?? duration;
  const relativeTime = isFullTrackMode && currentChunk?.timeline
    ? Math.max(0, currentTime - chunkStartTime)
    : currentTime;
  const activeDuration = isFullTrackMode && currentChunk?.timeline
    ? chunkDuration
    : duration;
  const activeSentenceIndex = findActiveSentenceIndex(currentChunk, relativeTime, activeDuration);

  return (
    <div className="bg-studio-900/70 rounded-2xl border border-studio-800 p-6 backdrop-blur-xl space-y-5">
      {/* Karaoke Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-studio-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Đồng Bộ Lời Đọc Karaoke (Teleprompter)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Live Sync
              </span>
            </div>
            <p className="text-2xs text-slate-400">
              Nhấp trực tiếp vào bất kỳ câu hoặc đoạn nào để nghe ngay tức thì
            </p>
          </div>
        </div>

        {/* Toolbar Tools */}
        <div className="flex items-center gap-2">
          {/* Auto Scroll Toggle */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold border transition ${
              autoScroll
                ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                : "bg-studio-950 border-studio-800 text-slate-400 hover:text-white"
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            Tự cuộn: {autoScroll ? "Bật" : "Tắt"}
          </button>

          {/* Fullscreen Modal trigger */}
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-2xs font-bold bg-studio-800 hover:bg-studio-700 text-slate-200 hover:text-white border border-studio-700 transition shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Sân khấu toàn màn hình
          </button>
        </div>
      </div>

      {/* Main Karaoke View Area */}
      <div
        ref={containerRef}
        className="space-y-6 max-h-[620px] overflow-y-auto px-2 py-3 custom-scrollbar"
      >
        {chunks.map((chunk, chunkIdx) => {
          const isThisChunkActive = activeChunkIndex === chunkIdx;
          const isChunkReady = chunk.status === "ready" && Boolean(chunk.audioUrl);

          return (
            <div
              key={chunk.id}
              ref={isThisChunkActive ? activeChunkRef : null}
              onClick={() => {
                if (isChunkReady) {
                  if (isThisChunkActive) {
                    onTogglePlay();
                  } else {
                    onPlayChunk(chunkIdx);
                  }
                }
              }}
              className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer relative group ${
                isThisChunkActive
                  ? "bg-gradient-to-b from-blue-950/60 via-studio-900/90 to-studio-950 border-blue-500/80 shadow-2xl shadow-blue-500/20 ring-1 ring-blue-500/40 scale-[1.01]"
                  : "bg-studio-950/50 border-studio-800/80 hover:border-studio-700 hover:bg-studio-950/80 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Top Meta Bar */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-studio-800/60">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shadow-md ${
                      isThisChunkActive
                        ? "bg-blue-600 text-white shadow-blue-500/30"
                        : "bg-studio-800 text-slate-400"
                    }`}
                  >
                    {chunkIdx + 1}
                  </span>
                  <div>
                    <h3
                      className={`text-xs font-bold ${
                        isThisChunkActive ? "text-blue-300" : "text-slate-300"
                      }`}
                    >
                      Đoạn {chunkIdx + 1} / {chunks.length}
                    </h3>
                    <span className="text-3xs text-slate-400">
                      Giọng đọc: <strong>{chunk.voice || "Mặc định"}</strong> · {chunk.charCount} ký tự
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isThisChunkActive && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                      <WaveformVisualizer isPlaying={isPlaying} barCount={16} height={18} />
                      <span className="text-3xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1">
                        {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                        {isPlaying ? "Đang phát" : "Tạm dừng"}
                      </span>
                    </div>
                  )}

                  {!isChunkReady && (
                    <span className="text-3xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Chưa tạo âm thanh
                    </span>
                  )}
                </div>
              </div>

              {/* Karaoke Sentence Stream */}
              <div className="space-y-2 leading-relaxed text-slate-300">
                {chunk.sentences && chunk.sentences.length > 0 ? (
                  chunk.sentences.map((sentence, sIdx) => {
                    const isSentenceActive = isThisChunkActive && activeSentenceIndex === sIdx;

                    return (
                      <span
                        key={sentence.index}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSeekToSentence) {
                            onSeekToSentence(chunkIdx, sIdx);
                          } else if (isChunkReady) {
                            onPlayChunk(chunkIdx);
                          }
                        }}
                        title="Nhấp để nghe đọc từ câu này"
                        className={`inline-block py-1 px-2 my-0.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                          isSentenceActive
                            ? "karaoke-active-sentence font-bold text-base scale-[1.02] shadow-sm ring-1 ring-amber-400/40"
                            : isThisChunkActive
                            ? "text-slate-200 hover:text-white hover:bg-white/10"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                      >
                        {sentence.text}{" "}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm">{chunk.text}</p>
                )}
              </div>

              {/* Bottom Quick Play Tooltip */}
              <div className="mt-3 pt-2 flex items-center justify-between text-3xs text-slate-400 border-t border-studio-800/40">
                <span className="flex items-center gap-1 text-slate-400">
                  <Eye className="w-3 h-3" /> Nhấn vào đoạn này để {isThisChunkActive && isPlaying ? "tạm dừng" : "nghe phát thử"}
                </span>
                {isChunkReady && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
