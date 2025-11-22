const express = require("express");
const router = express.Router();
const { proxyRequest } = require("../utils/proxy");
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const rateLimitMiddleware = require("../middlewares/rateLimitMiddleware");
const services = require("../config/services");

// Routes publiques (auth) - pas de JWT requis
router.all("/auth/*", rateLimitMiddleware, (req, res) => {
  proxyRequest(services.AUTH_SERVICE, req, res);
});

// Routes protégées - JWT requis PUIS rate limit (skip ADMIN)

// Admin routes (Auth Service)
router.all("/admin/*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.AUTH_SERVICE, req, res);
});

// Observations routes
router.all("/observations*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Species routes
router.all("/species*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Reputation routes (Observation Service)
router.all("/reputation/*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Notifications routes (Observation Service)
router.all(
  "/notifications*",
  jwtMiddleware,
  rateLimitMiddleware,
  (req, res) => {
    proxyRequest(services.OBSERVATION_SERVICE, req, res);
  }
);

// Taxonomy routes
router.all("/taxonomy*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/phylum*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/class*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/order*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/family*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/genus*", jwtMiddleware, rateLimitMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

module.exports = router;
