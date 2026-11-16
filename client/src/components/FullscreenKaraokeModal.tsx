import React, { useEffect, useRef } from "react";
import type { TextChunk } from "../types";
import { X, Play, Pause, SkipBack, SkipForward, Radio } from "lucide-react";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { findActiveSentenceIndex } from "../services/chunker";

interface FullscreenKaraokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  chunks: TextChunk[];
  activeChunkIndex: number | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onPreviousChunk: () => void;
  onNextChunk: () => void;
  onPlayChunk: (index: number) => void;
}

export const FullscreenKaraokeModal: React.FC<FullscreenKaraokeModalProps> = ({
  isOpen,
  onClose,
  chunks,
  activeChunkIndex,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onPreviousChunk,
  onNextChunk,
  onPlayChunk,
}) => {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isOpen, activeChunkIndex]);

  // Đóng khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const currentChunk = activeChunkIndex !== null ? chunks[activeChunkIndex] : null;
  const activeSentenceIndex = findActiveSentenceIndex(currentChunk, currentTime, duration);

  return (
    <div className="fixed inset-0 z-50 bg-studio-950/98 backdrop-blur-3xl flex flex-col justify-between overflow-hidden text-slate-100 p-6 md:p-12 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-studio-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white">
              Sân Khấu Karaoke & Máy Nhắc Lời (Teleprompter)
            </h2>
            <p className="text-xs text-slate-400">
              Đang phát đoạn {(activeChunkIndex ?? 0) + 1} / {chunks.length} · Giọng:{" "}
              <strong className="text-blue-400">{currentChunk?.voice || "Minh Đức"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <WaveformVisualizer isPlaying={isPlaying} barCount={32} height={28} />
          <button
            type="button"
            onClick={onClose}
            className="p-3 rounded-full bg-studio-900 hover:bg-studio-800 text-slate-400 hover:text-white border border-studio-800 transition"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Karaoke Big Text Scroll */}
      <div className="flex-1 overflow-y-auto my-8 px-4 md:px-16 space-y-12 custom-scrollbar">
        {chunks.map((chunk, cIdx) => {
          const isThisActive = activeChunkIndex === cIdx;

          return (
            <div
              key={chunk.id}
              ref={isThisActive ? activeRef : null}
              onClick={() => onPlayChunk(cIdx)}
              className={`p-8 md:p-12 rounded-3xl transition-all duration-300 cursor-pointer ${
                isThisActive
                  ? "bg-gradient-to-b from-blue-950/80 to-studio-900/90 border-2 border-blue-500/90 shadow-2xl shadow-blue-500/25 ring-2 ring-blue-500/50 scale-[1.02]"
                  : "bg-studio-950/40 border border-studio-900 opacity-40 hover:opacity-80"
              }`}
            >
              <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-wider text-blue-400">
                <span>ĐOẠN {cIdx + 1}</span>
                <span>·</span>
                <span>{chunk.charCount} KÝ TỰ</span>
              </div>

              <div className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed md:leading-loose">
                {chunk.sentences && chunk.sentences.length > 0 ? (
                  chunk.sentences.map((sentence, sIdx) => {
                    const isSentenceActive = isThisActive && activeSentenceIndex === sIdx;

                    return (
                      <span
                        key={sentence.index}
                        className={`inline-block py-1.5 px-3 my-1 rounded-xl transition-all duration-300 ${
                          isSentenceActive
                            ? "bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/40 scale-105"
                            : isThisActive
                            ? "text-slate-200"
                            : "text-slate-500"
                        }`}
                      >
                        {sentence.text}{" "}
                      </span>
                    );
                  })
                ) : (
                  <p>{chunk.text}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Minimalist Floating Controls */}
      <div className="pt-6 border-t border-studio-800/80 flex items-center justify-center gap-6">
        <button
          type="button"
          disabled={activeChunkIndex === null || activeChunkIndex <= 0}
          onClick={onPreviousChunk}
          className="p-3 rounded-full bg-studio-900 hover:bg-studio-800 text-slate-300 hover:text-white border border-studio-800 disabled:opacity-30 transition"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-200 transform active:scale-95 ${
            isPlaying
              ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/30"
              : "bg-blue-600 hover:bg-blue-500 ring-4 ring-blue-500/30"
          }`}
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>

        <button
          type="button"
          disabled={activeChunkIndex === null || activeChunkIndex >= chunks.length - 1}
          onClick={onNextChunk}
          className="p-3 rounded-full bg-studio-900 hover:bg-studio-800 text-slate-300 hover:text-white border border-studio-800 disabled:opacity-30 transition"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
