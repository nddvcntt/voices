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
  const [isFullTrackMode, setIsFullTrackMode] = useState<boolean>(false);
  const [fullTrackUrl, setFullTrackUrl] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lưu trữ các giá trị mới nhất trong ref để event listener không bị stale closure
  const chunksRef = useRef<TextChunk[]>(chunks);
  const autoplayNextRef = useRef<boolean>(autoplayNext);
  const repeatModeRef = useRef<"none" | "one" | "all">(repeatMode);
  const onSynthesizeRef = useRef(onChunkSynthesizeNeeded);
  const playbackSpeedRef = useRef<number>(playbackSpeed);
  const isMutedRef = useRef<boolean>(isMuted);
  const volumeRef = useRef<number>(volume);
  const isFullTrackModeRef = useRef<boolean>(isFullTrackMode);
  const fullTrackUrlRef = useRef<string | null>(fullTrackUrl);

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

  useEffect(() => {
    isFullTrackModeRef.current = isFullTrackMode;
  }, [isFullTrackMode]);

  useEffect(() => {
    fullTrackUrlRef.current = fullTrackUrl;
  }, [fullTrackUrl]);

  // Hàm gán thời gian audio an toàn (kể cả khi metadata chưa load)
  const setAudioTimeSafely = useCallback((targetTime: number) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (audio.readyState >= 1) {
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    } else {
      const onLoaded = () => {
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
        audio.removeEventListener("loadedmetadata", onLoaded);
      };
      audio.addEventListener("loadedmetadata", onLoaded);
    }
  }, []);

  // Hàm phát TOÀN BỘ BÀI ĐỌC (Full Merged Track)
  const playFullTrack = useCallback(async (url: string, startFromSec: number = 0) => {
    if (!audioRef.current || !url) return;

    setIsFullTrackMode(true);
    isFullTrackModeRef.current = true;
    setFullTrackUrl(url);
    fullTrackUrlRef.current = url;

    // Chỉ đổi src nếu khác url hiện tại
    const currentSrc = audioRef.current.getAttribute("src") || audioRef.current.src;
    if (!currentSrc.includes(url)) {
      audioRef.current.src = url;
    }

    audioRef.current.playbackRate = playbackSpeedRef.current;
    audioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;

    setAudioTimeSafely(startFromSec);

    // Xác định chunk index tại startFromSec
    const currentList = chunksRef.current;
    let targetIndex = 0;
    if (currentList.length > 0) {
      const foundIdx = currentList.findIndex(
        (c) => c.timeline && startFromSec >= c.timeline.startSec && startFromSec < c.timeline.endSec
      );
      if (foundIdx !== -1) targetIndex = foundIdx;
    }
    setCurrentChunkIndex(targetIndex);

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Play full track error:", err);
      setIsPlaying(false);
    }
  }, [setAudioTimeSafely]);

  // Hàm phát một chunk theo index
  const playChunkByIndex = useCallback(async (index: number) => {
    const currentList = chunksRef.current;
    if (!audioRef.current || index < 0 || index >= currentList.length) return;

    const chunk = currentList[index];

    // NẾU ĐANG Ở CHẾ ĐỘ PHÁT TOÀN BÀI VÀ CHUNK CÓ TIMELINE:
    if (isFullTrackModeRef.current && fullTrackUrlRef.current && chunk.timeline) {
      audioRef.current.currentTime = chunk.timeline.startSec;
      setCurrentChunkIndex(index);
      setCurrentTime(chunk.timeline.startSec);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Playback error:", err);
      }
      return;
    }

    // NẾU PHÁT FILE RIÊNG LẺ CỦA CHUNK:
    let audioUrl = chunk.audioUrl;
    if (!audioUrl && onSynthesizeRef.current) {
      audioUrl = await onSynthesizeRef.current(chunk);
    }

    if (!audioUrl) return;

    setIsFullTrackMode(false);
    isFullTrackModeRef.current = false;

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

  // Chuyển sang chế độ đoạn rời
  const switchToChunkMode = useCallback((targetIndex?: number) => {
    const currentList = chunksRef.current;
    const indexToPlay = targetIndex ?? (currentChunkIndex ?? 0);
    if (indexToPlay >= 0 && indexToPlay < currentList.length) {
      playChunkByIndex(indexToPlay);
    } else {
      setIsFullTrackMode(false);
    }
  }, [currentChunkIndex, playChunkByIndex]);

  // Khởi tạo audio element DUY NHẤT MỘT LẦN khi mount, dọn dẹp khi unmount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      const curTime = audio.currentTime;
      setCurrentTime(curTime);
      setDuration(audio.duration || 0);

      // Nếu đang phát Full Track, tự động suy ra chunk nào đang được đọc
      if (isFullTrackModeRef.current) {
        const currentList = chunksRef.current;
        if (currentList.length > 0) {
          const matchedIndex = currentList.findIndex(
            (c) => c.timeline && curTime >= c.timeline.startSec && curTime < c.timeline.endSec
          );
          if (matchedIndex !== -1) {
            setCurrentChunkIndex(matchedIndex);
          } else if (currentList[currentList.length - 1]?.timeline) {
            const lastChunk = currentList[currentList.length - 1];
            if (lastChunk.timeline && curTime >= lastChunk.timeline.startSec) {
              setCurrentChunkIndex(currentList.length - 1);
            }
          }
        }
      }
    };

    const handleEnded = () => {
      // 1. Chế độ phát Full Track kết thúc
      if (isFullTrackModeRef.current) {
        if (repeatModeRef.current === "all" || repeatModeRef.current === "one") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        } else {
          setIsPlaying(false);
        }
        return;
      }

      // 2. Chế độ lặp lại đoạn đơn
      if (repeatModeRef.current === "one") {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }

      // 3. Chuyển sang đoạn tiếp theo
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

      // Nếu đang ở Full Track Mode và có url
      if (isFullTrackModeRef.current && fullTrackUrlRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        return;
      }

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
        audioRef.current.duration || 1000,
        audioRef.current.currentTime + 5
      );
    }
  }, []);

  const previousChunk = useCallback(() => {
    if (isFullTrackModeRef.current) {
      if (currentChunkIndex !== null && currentChunkIndex > 0) {
        const prevChunk = chunksRef.current[currentChunkIndex - 1];
        if (prevChunk?.timeline) {
          seek(prevChunk.timeline.startSec);
        }
      }
      return;
    }

    if (currentChunkIndex !== null && currentChunkIndex > 0) {
      playChunkByIndex(currentChunkIndex - 1);
    }
  }, [currentChunkIndex, playChunkByIndex, seek]);

  const nextChunk = useCallback(() => {
    const currentList = chunksRef.current;
    if (isFullTrackModeRef.current) {
      if (currentChunkIndex !== null && currentChunkIndex < currentList.length - 1) {
        const nxtChunk = currentList[currentChunkIndex + 1];
        if (nxtChunk?.timeline) {
          seek(nxtChunk.timeline.startSec);
        }
      }
      return;
    }

    if (currentChunkIndex !== null && currentChunkIndex < currentList.length - 1) {
      playChunkByIndex(currentChunkIndex + 1);
    }
  }, [currentChunkIndex, playChunkByIndex, seek]);

  // Nhảy trực tiếp đến vị trí một câu trong một đoạn
  const seekToSentence = useCallback(async (chunkIndex: number, sentenceIndex: number) => {
    const currentList = chunksRef.current;
    if (chunkIndex < 0 || chunkIndex >= currentList.length) return;
    const chunk = currentList[chunkIndex];
    if (!chunk || !chunk.sentences || sentenceIndex < 0 || sentenceIndex >= chunk.sentences.length) return;

    const sentence = chunk.sentences[sentenceIndex];
    const totalChars = Math.max(1, chunk.charCount);
    const charRatio = sentence.startCharIndex / totalChars;
    const chunkDuration = chunk.audioDurationSec || (chunk.timeline?.durationSec) || Math.ceil(chunk.wordCount / 2.7);
    const sentenceRelativeSec = Math.max(0, charRatio * chunkDuration);

    if (isFullTrackModeRef.current && fullTrackUrlRef.current && chunk.timeline) {
      const targetSec = chunk.timeline.startSec + sentenceRelativeSec;
      seek(targetSec);
      setCurrentChunkIndex(chunkIndex);
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
    } else {
      if (currentChunkIndex !== chunkIndex) {
        await playChunkByIndex(chunkIndex);
      }
      seek(sentenceRelativeSec);
    }
  }, [currentChunkIndex, playChunkByIndex, seek]);

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
    isFullTrackMode,
    fullTrackUrl,
    playChunkByIndex,
    playFullTrack,
    switchToChunkMode,
    seekToSentence,
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
