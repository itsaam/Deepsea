module.exports = {
  AUTH_SERVICE: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
  OBSERVATION_SERVICE:
    process.env.OBSERVATION_SERVICE_URL || "http://localhost:3002",
  TAXONOMY_SERVICE: process.env.TAXONOMY_SERVICE_URL || "http://localhost:5002",
};
