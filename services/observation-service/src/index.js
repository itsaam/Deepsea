const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

const speciesRoutes = require("./routes/speciesRoutes");
const observationRoutes = require("./routes/observationRoutes");
const notificationRoutes = require("./routes/notification.routes");
const replyRoutes = require("./routes/replyRoutes");
const voteRoutes = require("./routes/voteRoutes");
const reputationRoutes = require("./routes/reputationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Middlewares
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

// Check sanction status route
const authMiddleware = require("./middlewares/authMiddleware");
const sanctionMiddleware = require("./middlewares/sanctionMiddleware");
app.get("/check-sanction", authMiddleware, sanctionMiddleware, (req, res) => {
  res.json({ status: "ok", message: "No active sanctions" });
});

// Routes
app.use("/species", speciesRoutes);
app.use("/observations", observationRoutes);
app.use("/notifications", notificationRoutes);
app.use("/reputation", reputationRoutes);
app.use("/admin", adminRoutes);
app.use("/", replyRoutes);
app.use("/", voteRoutes);

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "API Service d'Observation" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "observation-service", port: PORT });
});

const PORT = process.env.PORT || 3002;

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🐟 Observation service running on port ${PORT}`);
  });
}
