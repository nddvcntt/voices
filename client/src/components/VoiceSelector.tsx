import React, { useState, useRef } from "react";
import { TtsVoice } from "../types";
import { Mic, Play, Pause, Check, SlidersHorizontal, Volume2, Sparkles, Filter } from "lucide-react";
import { api } from "../services/api";

interface VoiceSelectorProps {
  voices: TtsVoice[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onSelectVoice,
  speed,
  onSpeedChange,
  temperature,
  onTemperatureChange,
}) => {
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);

  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Lọc danh sách giọng đọc
  const filteredVoices = voices.filter((v) => {
    if (genderFilter !== "all" && v.gender !== genderFilter) return false;
    if (regionFilter !== "all" && v.region !== regionFilter) return false;
    if (styleFilter !== "all" && !v.style.toLowerCase().includes(styleFilter.toLowerCase())) return false;
    return true;
  });

  // Tìm giọng đang chọn
  const currentVoiceObj = voices.find((v) => v.id === selectedVoice) || voices[0];

  // Xử lý nghe thử giọng đọc
  const handlePreview = async (voice: TtsVoice, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingVoice === voice.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPreviewingVoice(null);
      return;
    }

    setPreviewingVoice(voice.id);
    try {
      const sampleText = `Xin chào, tôi là ${voice.id}, giọng đọc trí tuệ nhân tạo tiếng Việt.`;
      const { url } = await api.synthesize({
        text: sampleText,
        voice: voice.id,
        speed: 1.0,
      });

      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio();
      }
      previewAudioRef.current.src = url;
      previewAudioRef.current.play();
      previewAudioRef.current.onended = () => {
        setPreviewingVoice(null);
      };
    } catch (err) {
      console.error("Preview failed:", err);
      setPreviewingVoice(null);
    }
  };

  return (
    <div className="bg-studio-900/60 rounded-2xl border border-studio-800 p-5 backdrop-blur-md space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Chọn Giọng Đọc AI (VieNeu-TTS)
            </h2>
            <p className="text-2xs text-slate-400">
              {voices.length} giọng đọc tự nhiên đa vùng miền & phong cách
            </p>
          </div>
        </div>

        {currentVoiceObj && (
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Đang chọn: {currentVoiceObj.id}</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* Gender */}
        <div>
          <label className="block text-2xs font-semibold text-slate-400 mb-1">Giới tính</label>
          <div className="flex bg-studio-950 p-1 rounded-lg border border-studio-800">
            {[
              { id: "all", label: "Tất cả" },
              { id: "Nam", label: "Nam" },
              { id: "Nữ", label: "Nữ" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGenderFilter(tab.id)}
                className={`flex-1 py-1 rounded-md text-2xs font-medium transition ${
                  genderFilter === tab.id
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="block text-2xs font-semibold text-slate-400 mb-1">Vùng miền</label>
          <div className="flex bg-studio-950 p-1 rounded-lg border border-studio-800">
            {[
              { id: "all", label: "Tất cả" },
              { id: "Bắc", label: "Bắc" },
              { id: "Trung", label: "Trung" },
              { id: "Nam", label: "Nam" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRegionFilter(tab.id)}
                className={`flex-1 py-1 rounded-md text-2xs font-medium transition ${
                  regionFilter === tab.id
                    ? "bg-blue-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <label className="block text-2xs font-semibold text-slate-400 mb-1">Phong cách</label>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-studio-950 border border-studio-800 text-2xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả phong cách</option>
            <option value="tin tức">Tin tức thời sự</option>
            <option value="tự nhiên">Đàm thoại tự nhiên</option>
            <option value="kể chuyện">Kể chuyện truyền cảm</option>
            <option value="đọc truyện">Đọc truyện audio</option>
          </select>
        </div>
      </div>

      {/* Voice Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          const isPreviewing = previewingVoice === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 relative ${
                isSelected
                  ? "bg-blue-950/40 border-blue-500 shadow-md shadow-blue-500/20 ring-1 ring-blue-500/50"
                  : "bg-studio-950/60 border-studio-800/80 hover:border-studio-700 hover:bg-studio-950"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    {voice.id}
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-3xs px-1.5 py-0.2 rounded font-semibold ${
                      voice.gender === "Nữ" ? "bg-rose-500/20 text-rose-300" : "bg-cyan-500/20 text-cyan-300"
                    }`}>
                      {voice.gender}
                    </span>
                    <span className="text-3xs px-1.5 py-0.2 rounded font-semibold bg-slate-800 text-slate-300">
                      Miền {voice.region}
                    </span>
                  </div>
                </div>

                {/* Preview Button */}
                <button
                  type="button"
                  onClick={(e) => handlePreview(voice, e)}
                  title="Nghe thử giọng"
                  className={`p-2 rounded-lg text-xs font-semibold transition ${
                    isPreviewing
                      ? "bg-amber-500 text-slate-950 animate-pulse shadow-md shadow-amber-500/30"
                      : "bg-studio-800 hover:bg-studio-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {isPreviewing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              </div>

              <div className="text-3xs text-slate-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-400" />
                <span>{voice.style}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Speed & Temperature Controls */}
      <div className="pt-2 border-t border-studio-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-slate-400 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3" /> Tốc độ đọc
            </span>
            <span className="font-mono font-bold text-blue-400">{speed.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex gap-1">
              {[0.75, 1.0, 1.25].map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-1.5 py-0.5 rounded text-3xs font-semibold ${
                    speed === s ? "bg-blue-600 text-white" : "bg-studio-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Temperature / Tone */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-2xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Âm điệu (Biến thiên giọng)
            </span>
            <span className="font-mono font-bold text-cyan-400">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.2"
            step="0.05"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-studio-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
