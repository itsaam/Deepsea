require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const gatewayRoutes = require("./routes/gatewayRoutes");
const rateLimitMiddleware = require("./middlewares/rateLimitMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Logging middleware (optionnel mais utile)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );
  next();
});

// Route racine
app.get("/", (req, res) => {
  res.json({
    service: "DeepSea API Gateway",
    version: "1.0.0",
    status: "ok",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: "/api/*",
      auth: "/api/auth/*",
      observations: "/api/observations*",
      species: "/api/species*",
      taxonomy: "/api/taxonomy*",
    },
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

// Routes principales (toutes sous /api)
app.use("/api", gatewayRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  console.error("[Gateway Error]:", err);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
  });
});

// Démarrage du serveur
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API Gateway démarré sur le port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Services configurés:`);
    console.log(`   - Auth: ${process.env.AUTH_SERVICE_URL}`);
    console.log(`   - Observation: ${process.env.OBSERVATION_SERVICE_URL}`);
    console.log(`   - Taxonomy: ${process.env.TAXONOMY_SERVICE_URL}`);
  });
}

module.exports = app;
