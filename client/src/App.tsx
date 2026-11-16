import React, { useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { Header } from "./components/Header";
import { TextEditor } from "./components/TextEditor";
import { VoiceSelector } from "./components/VoiceSelector";
import { ChunkList } from "./components/ChunkList";
import { KaraokeView } from "./components/KaraokeView";
import { ProAudioPlayer } from "./components/ProAudioPlayer";
import { FullscreenKaraokeModal } from "./components/FullscreenKaraokeModal";
import { ShortcutsModal } from "./components/ShortcutsModal";
import type { TtsVoice, TextChunk } from "./types";
import { api } from "./services/api";
import { localChunkText } from "./services/chunker";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

export const App: React.FC = () => {
  // 1. Text & Chunking States
  const [text, setText] = useState<string>("");
  const [maxChars, setMaxChars] = useState<number>(800); // Yêu cầu: tự động cắt đoạn theo 800 ký tự (chuẩn hết câu)
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [isChunking, setIsChunking] = useState<boolean>(false);

  // 2. Voice & Audio Settings States
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [defaultVoice, setDefaultVoice] = useState<string>("Minh Đức");
  const [speed, setSpeed] = useState<number>(1.0);
  const [temperature, setTemperature] = useState<number>(0.8);
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none");

  // 3. UI View States
  const [activeView, setActiveView] = useState<"editor" | "karaoke">("editor");
  const [isSynthesizingAll, setIsSynthesizingAll] = useState<boolean>(false);
  const [isDownloadingFull, setIsDownloadingFull] = useState<boolean>(false);
  const [showFullscreenKaraoke, setShowFullscreenKaraoke] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Hiển thị toast thông báo
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 4. Load voices on mount
  useEffect(() => {
    api
      .getVoices()
      .then((res) => {
        if (res.voices && res.voices.length > 0) {
          setVoices(res.voices);
          if (res.default) setDefaultVoice(res.default);
        }
      })
      .catch((err) => {
        console.error("Failed to load voices:", err);
      });
  }, []);

  // 5. Hàm tổng hợp 1 chunk
  const handleSynthesizeSingleChunk = useCallback(
    async (targetChunk: TextChunk): Promise<string | undefined> => {
      // Cập nhật trạng thái chunk sang synthesizing
      setChunks((prev) =>
        prev.map((c) =>
          c.id === targetChunk.id ? { ...c, status: "synthesizing", errorMessage: undefined } : c
        )
      );

      try {
        const voiceToUse = targetChunk.voice || defaultVoice;
        const { blob, url } = await api.synthesize({
          text: targetChunk.text,
          voice: voiceToUse,
          speed,
          temperature,
        });

        // Tạo đối tượng audio để đo thời lượng thực tế
        const tempAudio = new Audio(url);
        let audioDurationSec = Math.ceil(targetChunk.wordCount / 2.7);
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            audioDurationSec = tempAudio.duration;
            setChunks((prev) =>
              prev.map((c) =>
                c.id === targetChunk.id ? { ...c, audioDurationSec } : c
              )
            );
          }
        };

        setChunks((prev) =>
          prev.map((c) =>
            c.id === targetChunk.id
              ? {
                  ...c,
                  status: "ready",
                  audioUrl: url,
                  audioBlob: blob,
                  audioDurationSec,
                }
              : c
          )
        );

        return url;
      } catch (err: any) {
        console.error("Synthesize error for chunk:", targetChunk.id, err);
        setChunks((prev) =>
          prev.map((c) =>
            c.id === targetChunk.id
              ? { ...c, status: "error", errorMessage: err.message || "Lỗi tạo giọng nói" }
              : c
          )
        );
        return undefined;
      }
    },
    [defaultVoice, speed, temperature]
  );

  // 6. Audio Player Hook
  const {
    currentChunkIndex,
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    playChunkByIndex,
    togglePlay,
    seek,
    rewind5s,
    forward5s,
    previousChunk,
    nextChunk,
    setPlaybackSpeed,
    setVolume,
    toggleMute,
  } = useAudioPlayer({
    chunks,
    defaultVoice,
    autoplayNext,
    repeatMode,
    onChunkSynthesizeNeeded: handleSynthesizeSingleChunk,
  });

  // 7. Xử lý Cắt đoạn Thông minh (Smart Sentence Chunking)
  const handleChunkText = async (targetMaxChars: number) => {
    if (!text.trim()) return;

    setIsChunking(true);
    try {
      // Gọi API server để phân tích và cắt câu
      const res = await api.chunkText(text, targetMaxChars);
      const generatedChunks = res.chunks.map((c) => ({
        ...c,
        voice: defaultVoice,
        status: "idle" as const,
      }));

      setChunks(generatedChunks);
      showToast(`Đã cắt thành công ${generatedChunks.length} đoạn (Độ dài tối đa ${targetMaxChars} ký tự, chuẩn hết câu)`);
    } catch (err) {
      console.warn("Server chunking failed, fallback to local chunker:", err);
      // Fallback thuật toán local
      const localChunks = localChunkText(text, targetMaxChars).map((c) => ({
        ...c,
        voice: defaultVoice,
        status: "idle" as const,
      }));
      setChunks(localChunks);
      showToast(`Đã cắt thành công ${localChunks.length} đoạn (Offline Engine)`);
    } finally {
      setIsChunking(false);
    }
  };

  // 8. Đổi giọng đọc cho 1 đoạn riêng biệt
  const handleUpdateChunkVoice = (chunkId: string, voiceId: string) => {
    setChunks((prev) =>
      prev.map((c) => (c.id === chunkId ? { ...c, voice: voiceId } : c))
    );
  };

  // 9. Tổng hợp giọng nói cho TOÀN BỘ các đoạn
  const handleSynthesizeAll = async () => {
    if (chunks.length === 0 || isSynthesizingAll) return;

    setIsSynthesizingAll(true);
    let successCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      // Nếu đã ready rồi thì bỏ qua
      if (c.status === "ready" && c.audioUrl) {
        successCount++;
        continue;
      }

      await handleSynthesizeSingleChunk(c);
      successCount++;
    }

    setIsSynthesizingAll(false);
    showToast(`Đã tạo âm thanh thành công cho ${successCount}/${chunks.length} đoạn!`);

    // Pháo hoa ăn mừng
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // Tự động phát đoạn đầu tiên nếu chưa phát
    if (chunks.length > 0) {
      playChunkByIndex(0);
    }
  };

  // 10. Tải toàn bộ các đoạn ghép thành 1 file MP3 hoàn chỉnh
  const handleDownloadFullTrack = async () => {
    if (chunks.length === 0 || isDownloadingFull) return;

    setIsDownloadingFull(true);
    showToast("Đang chuẩn bị ghép toàn bộ các đoạn thành 1 tệp MP3...");

    try {
      const mergedBlob = await api.mergeChunks(chunks, defaultVoice, speed);
      const url = URL.createObjectURL(mergedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TheVoice_FullTrack_${new Date().getTime()}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Tải về toàn bộ bài đọc MP3 thành công!");
    } catch (err: any) {
      console.error("Download full track error:", err);
      showToast(err.message || "Lỗi khi ghép file MP3");
    } finally {
      setIsDownloadingFull(false);
    }
  };

  // 11. Bắt phím tắt toàn cục
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Không kích hoạt khi đang gõ trong textarea hoặc input
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        rewind5s();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        forward5s();
      } else if (e.key === "[" || e.key.toLowerCase() === "p") {
        previousChunk();
      } else if (e.key === "]" || e.key.toLowerCase() === "n") {
        nextChunk();
      } else if (e.key.toLowerCase() === "m") {
        toggleMute();
      } else if (e.key.toLowerCase() === "f") {
        setShowFullscreenKaraoke((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, rewind5s, forward5s, previousChunk, nextChunk, toggleMute]);

  const readyCount = chunks.filter((c) => c.status === "ready").length;
  const currentChunk = currentChunkIndex !== null ? chunks[currentChunkIndex] : null;

  return (
    <div className="min-h-screen bg-studio-950 text-slate-100 font-sans pb-36">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 bg-studio-900 border border-blue-500/60 text-blue-200 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl shadow-blue-500/20 animate-in slide-in-from-top-4 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <Header
        onOpenShortcuts={() => setShowShortcuts(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        readyCount={readyCount}
        totalChunks={chunks.length}
      />

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Voice Selector always accessible at top */}
        <VoiceSelector
          voices={voices}
          selectedVoice={defaultVoice}
          onSelectVoice={(vId) => {
            setDefaultVoice(vId);
            // Cập nhật cho các chunk chưa tạo audio
            setChunks((prev) =>
              prev.map((c) => (c.status === "idle" ? { ...c, voice: vId } : c))
            );
          }}
          speed={speed}
          onSpeedChange={(s) => {
            setSpeed(s);
            setPlaybackSpeed(s);
          }}
          temperature={temperature}
          onTemperatureChange={setTemperature}
        />

        {/* View 1: Editor & Chunk List */}
        {activeView === "editor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Text Input & Chunking */}
            <div className="lg:col-span-6 space-y-6">
              <TextEditor
                text={text}
                onChangeText={setText}
                onChunk={handleChunkText}
                isChunking={isChunking}
                maxChars={maxChars}
                onChangeMaxChars={setMaxChars}
              />
            </div>

            {/* Right Column: Chunk Cards & Batch Actions */}
            <div className="lg:col-span-6 space-y-6">
              <ChunkList
                chunks={chunks}
                voices={voices}
                defaultVoice={defaultVoice}
                onUpdateChunkVoice={handleUpdateChunkVoice}
                onSynthesizeChunk={handleSynthesizeSingleChunk}
                onSynthesizeAll={handleSynthesizeAll}
                isSynthesizingAll={isSynthesizingAll}
                activeChunkIndex={currentChunkIndex}
                isPlaying={isPlaying}
                onPlayChunk={playChunkByIndex}
                onTogglePlay={togglePlay}
              />
            </div>
          </div>
        )}

        {/* View 2: Karaoke Live Synced View */}
        {activeView === "karaoke" && (
          <KaraokeView
            chunks={chunks}
            activeChunkIndex={currentChunkIndex}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlayChunk={playChunkByIndex}
            onTogglePlay={togglePlay}
            onOpenFullscreen={() => setShowFullscreenKaraoke(true)}
          />
        )}
      </main>

      {/* Pro Audio Player (Fixed Bottom) */}
      <ProAudioPlayer
        currentChunk={currentChunk}
        currentChunkIndex={currentChunkIndex}
        totalChunks={chunks.length}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        playbackSpeed={playbackSpeed}
        volume={volume}
        isMuted={isMuted}
        repeatMode={repeatMode}
        autoplayNext={autoplayNext}
        onTogglePlay={togglePlay}
        onSeek={seek}
        onPreviousChunk={previousChunk}
        onNextChunk={nextChunk}
        onRewind5s={rewind5s}
        onForward5s={forward5s}
        onSpeedChange={setPlaybackSpeed}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onToggleRepeat={() => {
          setRepeatMode((prev) =>
            prev === "none" ? "one" : prev === "one" ? "all" : "none"
          );
        }}
        onToggleAutoplay={() => setAutoplayNext((prev) => !prev)}
        onOpenFullscreen={() => setShowFullscreenKaraoke(true)}
        onDownloadFullTrack={handleDownloadFullTrack}
        isDownloadingFull={isDownloadingFull}
      />

      {/* Fullscreen Karaoke Modal */}
      <FullscreenKaraokeModal
        isOpen={showFullscreenKaraoke}
        onClose={() => setShowFullscreenKaraoke(false)}
        chunks={chunks}
        activeChunkIndex={currentChunkIndex}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onTogglePlay={togglePlay}
        onPreviousChunk={previousChunk}
        onNextChunk={nextChunk}
        onPlayChunk={playChunkByIndex}
      />

      {/* Shortcuts Guide Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
};

export default App;
