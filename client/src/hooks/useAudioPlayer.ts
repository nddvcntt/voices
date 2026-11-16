import { useState, useRef, useEffect, useCallback } from "react";
import type { TextChunk } from "../types";

interface UseAudioPlayerProps {
  chunks: TextChunk[];
  defaultVoice: string;
  autoplayNext: boolean;
  repeatMode: "none" | "one" | "all";
  onChunkSynthesizeNeeded?: (chunk: TextChunk) => Promise<string | undefined>;
}

export function useAudioPlayer({
  chunks,
  autoplayNext,
  repeatMode,
  onChunkSynthesizeNeeded,
}: UseAudioPlayerProps) {
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lưu trữ các giá trị mới nhất trong ref để event listener không bị stale closure
  // và không làm re-run effect tạo mới Audio element
  const chunksRef = useRef<TextChunk[]>(chunks);
  const autoplayNextRef = useRef<boolean>(autoplayNext);
  const repeatModeRef = useRef<"none" | "one" | "all">(repeatMode);
  const onSynthesizeRef = useRef(onChunkSynthesizeNeeded);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const isMutedRef = useRef<boolean>(isMuted);
  const volumeRef = useRef<number>(volume);

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  useEffect(() => {
    autoplayNextRef.current = autoplayNext;
  }, [autoplayNext]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    onSynthesizeRef.current = onChunkSynthesizeNeeded;
  }, [onChunkSynthesizeNeeded]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Hàm phát một chunk theo index
  const playChunkByIndex = useCallback(async (index: number) => {
    const currentList = chunksRef.current;
    if (!audioRef.current || index < 0 || index >= currentList.length) return;

    const chunk = currentList[index];
    let audioUrl = chunk.audioUrl;

    // Nếu chunk chưa có audioUrl nhưng có callback yêu cầu tạo
    if (!audioUrl && onSynthesizeRef.current) {
      audioUrl = await onSynthesizeRef.current(chunk);
    }

    if (!audioUrl) return;

    audioRef.current.src = audioUrl;
    audioRef.current.playbackRate = playbackSpeedRef.current;
    audioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
    audioRef.current.currentTime = 0;

    setCurrentChunkIndex(index);
    setCurrentTime(0);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback error:", err);
      setIsPlaying(false);
    }
  }, []);

  // Khởi tạo audio element DUY NHẤT MỘT LẦN khi mount, dọn dẹp khi unmount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      // 1. Chế độ lặp lại đoạn đơn
      if (repeatModeRef.current === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      // 2. Chuyển sang đoạn tiếp theo
      setCurrentChunkIndex((prevIndex) => {
        if (prevIndex === null) return null;

        const currentList = chunksRef.current;
        const nextIndex = prevIndex + 1;

        if (nextIndex < currentList.length) {
          if (autoplayNextRef.current) {
            playChunkByIndex(nextIndex);
            return nextIndex;
          } else {
            setIsPlaying(false);
            return prevIndex;
          }
        } else {
          // Đã hết danh sách đoạn
          if (repeatModeRef.current === "all" && currentList.length > 0) {
            playChunkByIndex(0);
            return 0;
          } else {
            setIsPlaying(false);
            return null;
          }
        }
      });
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [playChunkByIndex]);

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const currentList = chunksRef.current;
      if (currentChunkIndex === null && currentList.length > 0) {
        // Tìm chunk đầu tiên có audio sẵn sàng
        const firstReady = currentList.findIndex((c) => c.status === "ready" && c.audioUrl);
        if (firstReady !== -1) {
          playChunkByIndex(firstReady);
        } else {
          playChunkByIndex(0);
        }
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  }, [isPlaying, currentChunkIndex, playChunkByIndex]);

  // Tua thời gian
  const seek = useCallback((timeSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeSec;
      setCurrentTime(timeSec);
    }
  }, []);

  const rewind5s = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  }, []);

  const forward5s = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration || 100,
        audioRef.current.currentTime + 5
      );
    }
  }, []);

  const previousChunk = useCallback(() => {
    if (currentChunkIndex !== null && currentChunkIndex > 0) {
      playChunkByIndex(currentChunkIndex - 1);
    }
  }, [currentChunkIndex, playChunkByIndex]);

  const nextChunk = useCallback(() => {
    const currentList = chunksRef.current;
    if (currentChunkIndex !== null && currentChunkIndex < currentList.length - 1) {
      playChunkByIndex(currentChunkIndex + 1);
    }
  }, [currentChunkIndex, playChunkByIndex]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return {
    audioRef,
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
  };
}
