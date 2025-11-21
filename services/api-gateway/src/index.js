require("dotenv").config();
const express = require("express");
const cors = require("cors");
const gatewayRoutes = require("./routes/gatewayRoutes");
const rateLimitMiddleware = require("./middlewares/rateLimitMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware (optionnel mais utile)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`
  );
  next();
});

// Rate limiting
app.use("/api", rateLimitMiddleware);

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
