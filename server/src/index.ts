import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
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
if (!fs.existsSync(cacheDir)) {
  try { fs.mkdirSync(cacheDir, { recursive: true }); } catch (e) {}
}
app.use("/audio-cache", express.static(cacheDir));

// Routes
app.use("/api", ttsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "TheVoice Studio",
    version: "1.0.0",
    ttsBaseUrl: process.env.TTS_BASE_URL || "http://vieneu.vcntt.tech/v1",
    timestamp: new Date().toISOString()
  });
});

// Phục vụ giao diện Frontend tĩnh (production mode)
const candidates = [
  path.resolve(process.cwd(), "..", "client", "dist"),
  path.resolve(process.cwd(), "client", "dist"),
  path.resolve(process.cwd(), "public"),
];
const distDir = candidates.find((d) => fs.existsSync(d) && fs.existsSync(path.join(d, "index.html")));

if (distDir) {
  app.use(express.static(distDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/audio-cache") || req.path === "/health") {
      return next();
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎙️ TheVoice Studio running at: http://localhost:${PORT}`);
  console.log(`🔗 TTS Backend: ${process.env.TTS_BASE_URL || "http://vieneu.vcntt.tech/v1"}`);
  if (distDir) {
    console.log(`📦 Serving static client from: ${distDir}`);
  }
});
