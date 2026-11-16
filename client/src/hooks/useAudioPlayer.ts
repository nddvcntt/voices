import { useState, useRef, useEffect, useCallback } from "react";
import { TextChunk } from "../types";

interface UseAudioPlayerProps {
  chunks: TextChunk[];
  defaultVoice: string;
  autoplayNext: boolean;
  repeatMode: "none" | "one" | "all";
  onChunkSynthesizeNeeded?: (chunk: TextChunk) => Promise<string | undefined>;
}

export function useAudioPlayer({
  chunks,
  defaultVoice,
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

  // Khởi tạo audio element một lần
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      // Xử lý khi kết thúc đoạn
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      setCurrentChunkIndex((prev) => {
        if (prev === null) return null;

        const nextIndex = prev + 1;
        if (nextIndex < chunks.length) {
          if (autoplayNext) {
            playChunkByIndex(nextIndex);
            return nextIndex;
          } else {
            setIsPlaying(false);
            return prev;
          }
        } else {
          // Đã hết bài
          if (repeatMode === "all" && chunks.length > 0) {
            playChunkByIndex(0);
            return 0;
          } else {
            setIsPlaying(false);
            return null;
          }
        }
      });
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [chunks, autoplayNext, repeatMode]);

  // Đồng bộ volume & speed với audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Hàm phát một chunk theo index
  const playChunkByIndex = useCallback(
    async (index: number) => {
      if (!audioRef.current || index < 0 || index >= chunks.length) return;

      const chunk = chunks[index];
      let audioUrl = chunk.audioUrl;

      // Nếu chunk chưa có audioUrl nhưng có callback yêu cầu tạo
      if (!audioUrl && onChunkSynthesizeNeeded) {
        audioUrl = await onChunkSynthesizeNeeded(chunk);
      }

      if (!audioUrl) return;

      audioRef.current.src = audioUrl;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.volume = isMuted ? 0 : volume;
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
    },
    [chunks, playbackSpeed, volume, isMuted, onChunkSynthesizeNeeded]
  );

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentChunkIndex === null && chunks.length > 0) {
        // Tìm chunk đầu tiên có audio
        const firstReady = chunks.findIndex((c) => c.status === "ready" && c.audioUrl);
        if (firstReady !== -1) {
          playChunkByIndex(firstReady);
        } else {
          playChunkByIndex(0);
        }
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    }
  }, [isPlaying, currentChunkIndex, chunks, playChunkByIndex]);

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
    if (currentChunkIndex !== null && currentChunkIndex < chunks.length - 1) {
      playChunkByIndex(currentChunkIndex + 1);
    }
  }, [currentChunkIndex, chunks.length, playChunkByIndex]);

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
