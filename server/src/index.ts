import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import { ttsRouter } from "./routes/ttsRoutes.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5050;

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static cache serving
const cacheDir = path.resolve(process.cwd(), "cache");
app.use("/audio-cache", express.static(cacheDir));

// Routes
app.use("/api", ttsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "TheVoice API",
    version: "1.0.0",
    ttsBaseUrl: process.env.TTS_BASE_URL || "http://vieneu.vcntt.tech/v1",
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎙️ TheVoice API Server running at: http://localhost:${PORT}`);
  console.log(`🔗 TTS Backend: ${process.env.TTS_BASE_URL || "http://vieneu.vcntt.tech/v1"}`);
});
