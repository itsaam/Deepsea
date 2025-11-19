const express = require("express");
const cors = require("cors");
require("dotenv").config();

const speciesRoutes = require("./routes/speciesRoutes");
const observationRoutes = require("./routes/observationRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/species", speciesRoutes);
app.use("/observations", observationRoutes);

// Route de base
app.get("/", (req, res) => {
  res.json({ message: "Observation Service API" });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🐟 Observation service running on port ${PORT}`);
});
