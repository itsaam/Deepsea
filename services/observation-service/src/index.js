const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
require("dotenv").config();

const speciesRoutes = require("./routes/speciesRoutes");
const observationRoutes = require("./routes/observationRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/species", speciesRoutes);
app.use("/observations", observationRoutes);

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "Observation Service API" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "observation-service", port: PORT });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🐟 Observation service running on port ${PORT}`);
});
