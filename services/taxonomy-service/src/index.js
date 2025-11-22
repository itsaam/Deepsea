require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const taxonomyRoutes = require("./routes/taxonomyRoutes");
const adminRoutes = require("./routes/adminRoutes");

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/taxonomy", taxonomyRoutes);
app.use("/admin", adminRoutes);
app.use("/expert", adminRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "taxonomy-service" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5002;
  app.listen(PORT, () => {
    console.log(`🔬 Taxonomy Service listening on port ${PORT}`);
  });
}
