import React, { useState } from "react";
import type { TextChunk } from "../types";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Download,
  Repeat,
  Repeat1,
  Maximize2,
  Mic
} from "lucide-react";
import { WaveformVisualizer } from "./WaveformVisualizer";

interface ProAudioPlayerProps {
  currentChunk: TextChunk | null;
  currentChunkIndex: number | null;
  totalChunks: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackSpeed: number;
  volume: number;
  isMuted: boolean;
  repeatMode: "none" | "one" | "all";
  autoplayNext: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPreviousChunk: () => void;
  onNextChunk: () => void;
  onRewind5s: () => void;
  onForward5s: () => void;
  onSpeedChange: (speed: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleRepeat: () => void;
  onToggleAutoplay: () => void;
  onOpenFullscreen: () => void;
  onDownloadFullTrack: () => void;
  isDownloadingFull: boolean;
}

export const ProAudioPlayer: React.FC<ProAudioPlayerProps> = ({
  currentChunk,
  currentChunkIndex,
  totalChunks,
  isPlaying,
  currentTime,
  duration,
  playbackSpeed,
  volume,
  isMuted,
  repeatMode,
  autoplayNext,
  onTogglePlay,
  onSeek,
  onPreviousChunk,
  onNextChunk,
  onRewind5s,
  onForward5s,
  onSpeedChange,
  onVolumeChange,
  onToggleMute,
  onToggleRepeat,
  onToggleAutoplay,
  onOpenFullscreen,
  onDownloadFullTrack,
  isDownloadingFull,
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-studio-950/95 border-t border-studio-800/90 backdrop-blur-2xl px-4 lg:px-8 py-3.5 shadow-2xl shadow-black/80">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Track Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-[200px]">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/10">
            <Mic className="w-6 h-6" />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white truncate">
                {currentChunk
                  ? `Đoạn ${(currentChunkIndex ?? 0) + 1} / ${totalChunks}`
                  : "Chưa chọn đoạn phát"}
              </h4>
              <span className="text-3xs uppercase px-1.5 py-0.2 rounded font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                PRO
              </span>
            </div>
            <p className="text-2xs text-slate-400 truncate">
              Giọng: <strong className="text-slate-200">{currentChunk?.voice || "Minh Đức"}</strong>
            </p>
          </div>
        </div>

        {/* Center Main Controls & Seekbar */}
        <div className="flex flex-col items-center gap-2 w-full md:w-2/4 max-w-2xl">
          {/* Action Buttons Row */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Repeat Mode */}
            <button
              type="button"
              onClick={onToggleRepeat}
              title={`Lặp lại: ${
                repeatMode === "none" ? "Không" : repeatMode === "one" ? "Lặp đoạn này" : "Lặp toàn bài"
              }`}
              className={`p-1.5 rounded-lg text-xs transition ${
                repeatMode !== "none"
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-4 h-4 text-blue-400" />
              ) : (
                <Repeat className={`w-4 h-4 ${repeatMode === "all" ? "text-blue-400" : ""}`} />
              )}
            </button>

            {/* Previous Chunk */}
            <button
              type="button"
              disabled={currentChunkIndex === null || currentChunkIndex <= 0}
              onClick={onPreviousChunk}
              title="Đoạn trước đó"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            {/* Rewind 5s */}
            <button
              type="button"
              onClick={onRewind5s}
              title="Tua lùi 5 giây"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-3xs ml-0.5">5s</span>
            </button>

            {/* Main Play/Pause Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl ${
                isPlaying
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30 ring-4 ring-amber-500/20"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/35 ring-4 ring-blue-500/20"
              }`}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            {/* Forward 5s */}
            <button
              type="button"
              onClick={onForward5s}
              title="Tua tiến 5 giây"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition flex items-center"
            >
              <span className="text-3xs mr-0.5">5s</span>
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Next Chunk */}
            <button
              type="button"
              disabled={currentChunkIndex === null || currentChunkIndex >= totalChunks - 1}
              onClick={onNextChunk}
              title="Đoạn kế tiếp"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Autoplay Next Toggle */}
            <button
              type="button"
              onClick={onToggleAutoplay}
              title={`Tự phát đoạn kế tiếp: ${autoplayNext ? "BẬT" : "TẮT"}`}
              className={`px-2 py-0.5 rounded text-3xs font-bold transition border ${
                autoplayNext
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                  : "bg-studio-900 border-studio-800 text-slate-500"
              }`}
            >
              AUTO
            </button>
          </div>

          {/* Seekbar and Waveform Row */}
          <div className="w-full flex items-center gap-3 text-2xs">
            <span className="font-mono text-slate-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1 relative flex items-center group">
              <input
                type="range"
                min="0"
                max={duration > 0 ? duration : 100}
                step="0.1"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer focus:outline-none accent-blue-500 group-hover:h-2 transition-all"
              />
            </div>

            <span className="font-mono text-slate-400 w-10">
              {formatTime(duration)}
            </span>

            {/* Realtime Waveform Spectrum */}
            <div className="hidden sm:block">
              <WaveformVisualizer isPlaying={isPlaying} barCount={20} height={20} />
            </div>
          </div>
        </div>

        {/* Right Utilities (Volume, Speed, Downloads, Stage) */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          {/* Playback Speed Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 rounded-lg bg-studio-900 hover:bg-studio-800 border border-studio-800 text-2xs font-mono font-bold text-slate-200 transition"
              title="Tốc độ phát âm thanh"
            >
              {playbackSpeed}x
            </button>

            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-studio-900 border border-studio-800 rounded-xl p-1 shadow-2xl flex flex-col gap-1 min-w-[70px] z-50">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      onSpeedChange(spd);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2 py-1 rounded text-2xs font-semibold text-left transition ${
                      playbackSpeed === spd
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-studio-800"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="text-slate-400 hover:text-white transition"
              title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Download Full Track */}
          <button
            type="button"
            disabled={isDownloadingFull || totalChunks === 0}
            onClick={onDownloadFullTrack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-bold bg-studio-800 hover:bg-studio-700 text-slate-200 hover:text-white border border-studio-700 disabled:opacity-40 transition shadow-sm"
            title="Tải toàn bộ bài đọc thành 1 tệp MP3 hoàn chỉnh"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Tải trọn bài (.MP3)</span>
          </button>

          {/* Cinema Stage Teleprompter */}
          <button
            type="button"
            onClick={onOpenFullscreen}
            className="p-2 rounded-lg bg-studio-900 hover:bg-studio-800 text-slate-400 hover:text-white border border-studio-800 transition"
            title="Mở Sân khấu Karaoke toàn màn hình"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
