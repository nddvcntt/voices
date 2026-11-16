import React, { useState } from "react";
import {
  FileText,
  Clipboard,
  Trash2,
  Sparkles,
  Scissors,
  Clock,
  BookOpen,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface TextEditorProps {
  text: string;
  onChangeText: (text: string) => void;
  onChunk: (maxChars: number) => void;
  isChunking: boolean;
  maxChars: number;
  onChangeMaxChars: (val: number) => void;
}

const SAMPLE_TEXTS = [
  {
    title: "Thời sự & Trí tuệ nhân tạo (Chuẩn)",
    content: `Trí tuệ nhân tạo (AI) đang tạo ra những bước ngoặt lịch sử trong kỷ nguyên số hóa toàn cầu. Tại Việt Nam, Chiến lược quốc gia về nghiên cứu, phát triển và ứng dụng Trí tuệ nhân tạo đến năm 2030 đã xác định AI là công nghệ mũi nhọn hàng đầu. Việc làm chủ công nghệ lõi không chỉ thúc đẩy tăng trưởng kinh tế mà còn bảo đảm vững chắc chủ quyền số quốc gia trên không gian mạng.

Các ứng dụng tiên tiến như xử lý ngôn ngữ tự nhiên tiếng Việt, nhận dạng tiếng nói tự động và trợ lý ảo thông minh đang được triển khai sâu rộng tại các cơ quan hành chính và tổ chức nghiên cứu. Điều này giúp nâng cao năng suất lao động, tối ưu hóa quy trình nghiệp vụ và cung cấp dịch vụ công tiện ích, nhanh chóng cho nhân dân.

Để duy trì đà phát triển bền vững, các chuyên gia nhấn mạnh tầm quan trọng của việc xây dựng kho dữ liệu số dùng chung, đầu tư hạ tầng siêu máy tính tính toán song song, đồng thời hoàn thiện khung pháp lý và chuẩn mực đạo đức AI an toàn, minh bạch.`
  },
  {
    title: "Truyện ngắn & Tản văn (Truyền cảm)",
    content: `Mỗi mùa thu về, phố cổ Hà Nội lại khoác lên mình vẻ trầm mặc và dịu êm đến nao lòng. Dưới những hàng cây sấu già lá vàng lác đác bay trong gió heo may, hương hoa sữa nồng nàn thoang thoảng khắp từng ngõ nhỏ. Tiếng leng keng của chuyến tàu sớm, tiếng rao của gánh hàng cốm dẹp xanh non quyện trong làn sương sớm mùa thu tạo nên bức tranh bình yên khó tả.

Thời gian như chậm lại nơi góc quán quen cũ kỹ bên hồ Gươm phẳng lặng như gương. Nhấp một ngụm trà sen thơm ngát, ta chợt nhận ra rằng giữa dòng đời hối hả, những khoảnh khắc tĩnh lặng của tâm hồn chính là món quà quý giá nhất mà cuộc sống ban tặng cho mỗi chúng ta.`
  },
  {
    title: "Báo cáo Khoa học & Công nghệ (Thuyết minh)",
    content: `Hệ thống tổng hợp tiếng nói đa ngữ dựa trên mô hình học sâu VieNeu-TTS v3 Turbo là giải pháp tiên tiến trong việc chuyển đổi văn bản sang âm thanh tự nhiên. Mô hình sử dụng kiến trúc mạng nơ-ron hồi quy kết hợp cơ chế chú ý biến đổi (Transformer Attention Mechanism), cho phép tái tạo âm sắc, nhịp điệu và ngữ điệu câu một cách mượt mà, chân thực.

Đặc biệt, cơ chế cắt đoạn thông minh theo ngữ giới hạn 800 ký tự đảm bảo ngắt nghỉ trọn vẹn từng câu ngữ pháp, loại bỏ hiện tượng ngắt âm gãy khúc thường gặp ở các hệ thống truyền thống. Kết quả đo lường chỉ số MOS (Mean Opinion Score) đạt 4.85 trên thang điểm 5.0 đối với cả ba phương ngữ Bắc, Trung và Nam.`
  }
];

export const TextEditor: React.FC<TextEditorProps> = ({
  text,
  onChangeText,
  onChunk,
  isChunking,
  maxChars,
  onChangeMaxChars,
}) => {
  const [copied, setCopied] = useState(false);

  // Thống kê văn bản
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  // Ước tính số câu
  const sentenceCount = text.trim() ? (text.match(/[.!?…]+(\s|$)/g) || []).length || 1 : 0;
  // Ước tính thời gian đọc (~160 từ/phút)
  const estMinutes = Math.floor(wordCount / 160);
  const estSeconds = Math.ceil((wordCount % 160) / 2.7);

  // Dán từ clipboard
  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChangeText(clipText);
      }
    } catch (err) {
      console.warn("Clipboard access denied:", err);
    }
  };

  return (
    <div className="bg-studio-900/60 rounded-2xl border border-studio-800 p-5 backdrop-blur-md space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              1. Nhập hoặc Dán Văn Bản (Paste Text)
            </h2>
            <p className="text-2xs text-slate-400">
              Hệ thống tự động cắt đoạn theo dấu kết thúc câu, không cắt vụn từ
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePasteClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold bg-studio-800 hover:bg-studio-700 text-slate-300 hover:text-white border border-studio-700 transition"
          >
            <Clipboard className="w-3.5 h-3.5" />
            Dán nhanh
          </button>
          {text && (
            <button
              type="button"
              onClick={() => onChangeText("")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-2xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Sample text quick picks */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-3xs font-semibold text-slate-400 flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> Mẫu thử nghiệm:
        </span>
        {SAMPLE_TEXTS.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChangeText(sample.content)}
            className="px-2.5 py-1 rounded-md text-3xs font-medium bg-studio-950 hover:bg-studio-800 text-slate-300 hover:text-white border border-studio-800 transition"
          >
            {sample.title}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          rows={7}
          placeholder="Dán hoặc gõ văn bản bạn muốn chuyển đổi thành giọng nói tại đây... (Ví dụ: tin tức, báo cáo, bài thuyết trình, tản văn...)"
          className="w-full px-4 py-3 rounded-xl bg-studio-950 border border-studio-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition resize-y leading-relaxed"
        />

        {/* Counter floating banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-2xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Ký tự: <strong className="text-slate-200">{charCount.toLocaleString()}</strong>
            </span>
            <span>
              Số từ: <strong className="text-slate-200">{wordCount.toLocaleString()}</strong>
            </span>
            <span>
              Số câu: <strong className="text-slate-200">{sentenceCount}</strong>
            </span>
            <span className="flex items-center gap-1 text-amber-400/90">
              <Clock className="w-3 h-3" /> ~{estMinutes > 0 ? `${estMinutes}p ` : ""}{estSeconds}s đọc
            </span>
          </div>

          <div className="text-3xs text-slate-400 italic">
            * Khuyến nghị: Cắt đoạn tự động theo 800 ký tự để giọng đọc mượt mà nhất
          </div>
        </div>
      </div>

      {/* Chunking Engine Settings & Action */}
      <div className="pt-2 border-t border-studio-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <label className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Scissors className="w-4 h-4 text-cyan-400" />
            Giới hạn cắt đoạn:
          </label>
          <div className="flex items-center gap-1">
            {[500, 800, 1000].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => onChangeMaxChars(limit)}
                className={`px-2.5 py-1 rounded-lg text-2xs font-semibold transition ${
                  maxChars === limit
                    ? "bg-cyan-600 text-white shadow-sm shadow-cyan-500/20"
                    : "bg-studio-950 text-slate-400 hover:text-white border border-studio-800"
                }`}
              >
                {limit} ký tự {limit === 800 && "★"}
              </button>
            ))}
          </div>
          <span className="text-3xs text-emerald-400 font-medium hidden sm:inline">
            (Bảo đảm cắt hết câu)
          </span>
        </div>

        <button
          type="button"
          disabled={!text.trim() || isChunking}
          onClick={() => onChunk(maxChars)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 transition active:scale-95"
        >
          {isChunking ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin" />
              Đang phân tích & cắt đoạn...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Tự Động Cắt Đoạn (Hết câu)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
