require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const aiRoutes = require("./routes/ai.routes");
const ollamaService = require("./services/ollama.service");

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", aiRoutes);

// Health check route
app.get("/health", async (req, res) => {
  const ollamaStatus = await ollamaService.healthCheck();

  res.status(ollamaStatus ? 200 : 503).json({
    status: ollamaStatus ? "healthy" : "unhealthy",
    service: "ai-service",
    ollama: ollamaStatus ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({
    service: "DeepSea AI Service",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      analyze: "POST /api/analyze",
      detectSpam: "POST /api/detect-spam",
      extractFeatures: "POST /api/extract-features",
      suggestTaxonomy: "POST /api/suggest-taxonomy",
      compare: "POST /api/compare",
      summarize: "POST /api/summarize",
    },
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 AI Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);

  // Check Ollama connection
  const ollamaStatus = await ollamaService.healthCheck();
  if (ollamaStatus) {
    console.log("✅ Ollama connected successfully");
  } else {
    console.warn(
      "⚠️  Ollama not available - make sure it's running on",
      process.env.OLLAMA_URL
    );
  }
});

module.exports = app;
