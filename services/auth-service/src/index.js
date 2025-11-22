const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const internalRoutes = require("./routes/internalRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

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

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/internal", internalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use((err, req, res, _next) => {
  console.error("Erreur non gérée:", err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🔐 Auth service running on port ${PORT}`);
  });
}
