import React from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: "Space", desc: "Phát hoặc Tạm dừng âm thanh (Play / Pause)" },
    { key: "Mũi tên Trái (←)", desc: "Tua lùi 5 giây" },
    { key: "Mũi tên Phải (→)", desc: "Tua tiến 5 giây" },
    { key: "Phím [ hoặc P", desc: "Chuyển về đoạn trước đó" },
    { key: "Phím ] hoặc N", desc: "Chuyển sang đoạn kế tiếp" },
    { key: "Phím M", desc: "Bật / Tắt tiếng (Mute)" },
    { key: "Phím F", desc: "Bật / Tắt chế độ Sân khấu Karaoke toàn màn hình" },
    { key: "Esc", desc: "Đóng các hộp thoại hoặc thoát toàn màn hình" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-studio-900 border border-studio-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Phím Tắt Điều Khiển Pro Player</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-studio-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-studio-950/60 border border-studio-800/60"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-studio-800 border border-studio-700 font-mono text-2xs font-bold text-blue-300">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
