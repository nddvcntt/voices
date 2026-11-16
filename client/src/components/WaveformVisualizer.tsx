import React, { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  isPlaying: boolean;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  barCount?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  barCount = 32,
  height = 36,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const barWidth = Math.max(2, width / barCount - 2);
    const centerY = canvas.height / 2;

    // Vẽ trạng thái tĩnh khi không phát (tiết kiệm CPU)
    const drawIdle = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const idleHeight = 4;
      ctx.fillStyle = "rgba(100, 116, 139, 0.4)";

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + 2);
        const y = centerY - idleHeight / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, idleHeight, [2]);
        ctx.fill();
      }
    };

    if (!isPlaying) {
      drawIdle();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Khi đang phát nhạc: khởi tạo và chạy animation loop
    const phases = Array.from({ length: barCount }, () => Math.random() * Math.PI * 2);
    const speeds = Array.from({ length: barCount }, () => 0.05 + Math.random() * 0.1);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < barCount; i++) {
        phases[i] += speeds[i];
        // Sóng dao động tự nhiên kết hợp nhiều tần số
        const wave = Math.sin(phases[i]) * 0.5 + Math.sin(phases[i] * 1.8 + i * 0.2) * 0.3 + 0.2;
        const factor = Math.max(0.1, Math.min(1.0, wave));
        const barHeight = factor * (canvas.height - 6);

        const x = i * (barWidth + 2);
        const y = centerY - barHeight / 2;

        // Gradient màu cho từng cột
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (i % 3 === 0) {
          gradient.addColorStop(0, "#06b6d4"); // cyan
          gradient.addColorStop(1, "#3b82f6"); // blue
        } else if (i % 3 === 1) {
          gradient.addColorStop(0, "#3b82f6"); // blue
          gradient.addColorStop(1, "#6366f1"); // indigo
        } else {
          gradient.addColorStop(0, "#f59e0b"); // amber
          gradient.addColorStop(1, "#ef4444"); // red
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2]);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 5}
      height={height}
      className={`block ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};
