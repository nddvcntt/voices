# 🎙️ TheVoice — AI Neural Text-to-Speech Studio & Karaoke Teleprompter

> Nền tảng chuyển đổi văn bản thành giọng nói (Text-to-Speech) thông minh, tự động cắt đoạn tối đa 800 ký tự (chuẩn hết câu ngữ pháp), tích hợp 20 giọng đọc nơ-ron tiếng Việt chất lượng cao (VieNeu-TTS), hiển thị đồng bộ Karaoke trực tiếp và Trình phát nhạc chuyên nghiệp (Pro Audio Player).

## 🌐 Địa Chỉ Truy Cập Dịch Vụ

- **Tên miền chính thức (HTTPS)**: **[https://voice.vcntt.tech](https://voice.vcntt.tech)**
- **Địa chỉ mạng nội bộ đơn vị**: `http://192.168.0.11:6969`
- **Kiểm tra trạng thái (Healthcheck)**:
  ```bash
  curl https://voice.vcntt.tech/health
  ```
  *Kết quả trả về*:
  ```json
  {"status":"ok","app":"TheVoice Studio","version":"1.0.0","ttsBaseUrl":"http://vieneu.vcntt.tech/v1"}
  ```

---

## 🌟 Tính Năng Nổi Bật

1. **Nhập & Dán Văn Bản Tiện Lợi (Smart Paste & Input)**:
   - Hỗ trợ dán văn bản dung lượng lớn, tự động đếm số ký tự, số từ, số câu và ước lượng thời gian phát âm thanh.
   - Tích hợp nút **"Dán nhanh"**, **"Xóa"** và các **Mẫu thử nghiệm** đa dạng (Thời sự - KH&CN, Tản văn - Truyện ngắn, Thuyết minh kỹ thuật).

2. **Cắt Đoạn Tự Động 800 Ký Tự Chuẩn Hết Câu (Smart Sentence Chunking)**:
   - Thuật toán nhận diện cấu trúc ngữ pháp và các dấu kết thúc câu (`.`, `!`, `?`, `…`, `\n`).
   - Xử lý thông minh các trường hợp ngoại lệ (từ viết tắt: *GS., PGS., TS., BS., Đ/c, TP.*, số thập phân *3.14*, ngày tháng).
   - **Cam kết 100% không bao giờ cắt vụn nửa chừng câu văn**; luôn bảo đảm trọn vẹn ngữ nghĩa từng câu khi chuyển giao cho engine giọng nói.

3. **Chọn Giọng Đọc Đa Dạng (20 Neural Voices)**:
   - Tích hợp danh mục 20 giọng đọc nơ-ron tự nhiên từ **VieNeu-TTS v3 Turbo**:
     - **Miền Bắc**: Minh Đức (Tin tức), Trúc Ly (Tự nhiên), Mai Anh (Tin tức), Ngọc Linh (Kể chuyện), Đoan Trang (Tự nhiên)...
     - **Miền Trung**: Quang Sơn (Tự nhiên), Ngọc Trân (Tự nhiên)...
     - **Miền Nam**: Thái Sơn (Kể chuyện), Xuân Vĩnh (Tự nhiên), Minh Triết (Tin tức), Thùy Dung (Tin tức), Thục Đoan (Kể chuyện), Mỹ Duyên (Đọc truyện), Đức Trí (Đọc truyện), Adam (Tự nhiên)...
   - Bộ lọc tiện lợi: Giới tính (Nam / Nữ), Vùng miền (Bắc / Trung / Nam), Phong cách.
   - **Nút "Nghe thử giọng"** (Preview Voice): Nghe trực tiếp câu chào mẫu của từng giọng đọc trước khi áp dụng.
   - Cho phép chọn giọng mặc định toàn bài hoặc **chỉ định giọng riêng cho từng đoạn** để tạo hội thoại đa giọng đọc.
   - Tùy chỉnh tốc độ đọc (0.5x - 2.0x) và âm điệu / độ biến thiên giọng (Temperature).

4. **Hiển Thị Đồng Bộ Lời Đọc Karaoke (Live Synced Karaoke & Teleprompter)**:
   - Đồng bộ thời gian thực theo từng phân đoạn (Chunk) và từng câu văn (Sentence) đang đọc.
   - Đoạn đang phát nổi bật với hiệu ứng phát sáng neon; câu đang đọc sáng rực phong cách Karaoke chuyên nghiệp.
   - **Tự động cuộn mượt mà (Auto-scroll)** theo tiến độ bài đọc.
   - **Click-to-Seek**: Nhấp chuột trực tiếp vào bất kỳ câu hoặc đoạn nào trong giao diện Karaoke để nghe ngay tức thì.
   - **Sân khấu Karaoke toàn màn hình (Cinema Teleprompter)** với cỡ chữ lớn, tối ưu cho người thuyết trình và biên tập viên lồng tiếng.

5. **Trình Phát Nhạc Chuyên Nghiệp (Pro Audio Player Bar)**:
   - Dock điều khiển cố định ở đáy màn hình phong cách Hi-Fi Studio Pro.
   - Nút Play/Pause lớn nổi bật, Tua lùi 5s, Tua tiến 5s, Chuyển đoạn trước/sau.
   - Chế độ lặp lại: Không lặp, Lặp đoạn này (Repeat 1), Lặp toàn bài (Repeat All).
   - Chế độ tự động phát đoạn kế tiếp (Autoplay Next).
   - **Realtime Waveform Spectrum**: Visualizer sóng âm thanh sống động hiển thị nhịp điệu giọng nói.
   - Điều chỉnh tốc độ phát âm thanh (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x) và thanh âm lượng kèm Mute.
   - **Tải tệp âm thanh**:
     - Tải từng đoạn lẻ (.MP3).
     - **Tải trọn vẹn toàn bộ bài đọc** đã được tự động ghép nối thành 1 file MP3 duy nhất.
   - Hỗ trợ đầy đủ phím tắt bàn phím (Space, Mũi tên trái/phải, P/N, M, F, Esc).

---

## 🚀 Hướng Dẫn Khởi Chạy (Quick Start)

### 1. Cài đặt các gói phụ thuộc (Chỉ chạy lần đầu)
Mở terminal tại thư mục `d:\TTNT\thevoice`:
```bash
npm run install:all
```

### 2. Khởi chạy Hệ thống
Chạy đồng thời cả Backend API (port `5050`) và Frontend UI (port `5173`):
```bash
npm run dev
```

Sau đó mở trình duyệt tại: **`http://localhost:5173`**

*(Hoặc nhấp đúp vào tệp `start.bat` trên Windows để tự động mở hệ thống)*

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

```
thevoice/
├── package.json              # Quản lý script khởi chạy song song (concurrently)
├── start.bat                 # Script nhấp đúp khởi chạy trên Windows
├── README.md                 # Tài liệu hướng dẫn sử dụng
│
├── server/                   # Backend API (Node.js + Express + TypeScript)
│   ├── .env                  # Cấu hình PORT=5050, TTS_BASE_URL=http://vieneu.vcntt.tech/v1
│   ├── cache/                # Lưu trữ cache tệp MP3 theo hash SHA-256
│   └── src/
│       ├── index.ts          # Express server, CORS, static cache
│       ├── routes/
│       │   └── ttsRoutes.ts  # /api/voices, /api/chunk, /api/synthesize, /api/merge-chunks
│       ├── services/
│       │   ├── textChunker.ts# Thuật toán cắt đoạn thông minh <= 800 ký tự (hết câu)
│       │   ├── ttsClient.ts  # Kết nối VieNeu-TTS API và quản lý file cache
│       │   └── audioMerger.ts# Ghép nhiều file MP3 thành 1 file duy nhất bằng FFmpeg
│       └── utils/
│           └── sentenceSplitter.ts # Bộ tách câu ngữ pháp tiếng Việt chuẩn hóa
│
└── client/                   # Frontend UI (React 19 + Vite + Tailwind CSS + Lucide)
    ├── index.html            # Entry HTML (Dark theme)
    ├── vite.config.ts        # Proxy /api sang port 5050
    └── src/
        ├── App.tsx           # Ứng dụng trung tâm & điều phối State
        ├── types/index.ts    # TypeScript interfaces
        ├── services/api.ts   # Gọi API backend
        ├── hooks/
        │   └── useAudioPlayer.ts # Hook quản lý audio player, timeline, seeking
        └── components/
            ├── Header.tsx    # Thanh điều hướng & trạng thái
            ├── TextEditor.tsx# Nhập/dán text, đếm từ, nút mẫu, cắt đoạn
            ├── VoiceSelector.tsx # Lọc 20 giọng đọc, nút nghe thử giọng
            ├── ChunkList.tsx # Danh sách thẻ đoạn, đổi giọng riêng từng đoạn
            ├── KaraokeView.tsx # Hiển thị đồng bộ Karaoke câu/đoạn, click-to-seek
            ├── ProAudioPlayer.tsx # Trình phát nhạc pro cố định bottom
            ├── WaveformVisualizer.tsx # Canvas visualizer sóng âm thời gian thực
            ├── FullscreenKaraokeModal.tsx # Sân khấu Karaoke toàn màn hình
            └── ShortcutsModal.tsx # Bảng tra cứu phím tắt bàn phím
```

---

## ⌨️ Phím Tắt Bàn Phím (Keyboard Shortcuts)

| Phím | Chức năng |
| :--- | :--- |
| **Space** | Phát hoặc Tạm dừng âm thanh (Play / Pause) |
| **← (Mũi tên Trái)** | Tua lùi 5 giây |
| **→ (Mũi tên Phải)** | Tua tiến 5 giây |
| **[** hoặc **P** | Chuyển về đoạn trước đó |
| **]** hoặc **N** | Chuyển sang đoạn kế tiếp |
| **M** | Bật / Tắt tiếng (Mute) |
| **F** | Mở / Đóng Sân khấu Karaoke toàn màn hình |
| **Esc** | Thoát toàn màn hình hoặc đóng hộp thoại |
