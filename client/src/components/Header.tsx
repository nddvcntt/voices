import React from "react";
import { Mic, Radio, Sparkles, Activity, Keyboard } from "lucide-react";

interface HeaderProps {
  onOpenShortcuts: () => void;
  activeView: "editor" | "karaoke";
  setActiveView: (view: "editor" | "karaoke") => void;
  readyCount: number;
  totalChunks: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenShortcuts,
  activeView,
  setActiveView,
  readyCount,
  totalChunks,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-studio-800 bg-studio-950/80 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
          <Mic className="w-5 h-5 text-white animate-pulse-subtle" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-white flex items-center">
              The<span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Voice</span>
            </h1>
            <span className="px-2 py-0.5 text-2xs font-bold uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Pro Studio
            </span>
          </div>
          <p className="text-2xs text-slate-400 hidden sm:block">
            Chuyển đổi văn bản thành giọng nói tiếng Việt tự nhiên & thông minh
          </p>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex items-center bg-studio-900 p-1 rounded-xl border border-studio-800">
        <button
          onClick={() => setActiveView("editor")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === "editor"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Biên tập & Đoạn ({totalChunks})
        </button>
        <button
          onClick={() => setActiveView("karaoke")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeView === "karaoke"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Đồng bộ Karaoke
          {readyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-emerald-500/20 text-emerald-300 font-mono">
              {readyCount}/{totalChunks}
            </span>
          )}
        </button>
      </div>

      {/* Engine Status & Tools */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-studio-900 border border-studio-800 text-2xs">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">Động cơ:</span>
          <span className="text-slate-200 font-medium">VieNeu-TTS v3 Turbo</span>
        </div>

        <button
          onClick={onOpenShortcuts}
          title="Phím tắt điều khiển"
          className="p-2 rounded-lg bg-studio-900 hover:bg-studio-800 text-slate-400 hover:text-white border border-studio-800 transition"
        >
          <Keyboard className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
