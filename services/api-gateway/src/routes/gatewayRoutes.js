const express = require("express");
const router = express.Router();
const { proxyRequest } = require("../utils/proxy");
const jwtMiddleware = require("../middlewares/jwtMiddleware");
const services = require("../config/services");

// Routes publiques (auth) - pas de JWT requis
router.all("/auth/*", (req, res) => {
  proxyRequest(services.AUTH_SERVICE, req, res);
});

// Routes protégées - JWT requis

// Admin routes (Auth Service)
router.all("/admin/*", jwtMiddleware, (req, res) => {
  proxyRequest(services.AUTH_SERVICE, req, res);
});

// Observations routes
router.all("/observations*", jwtMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Species routes
router.all("/species*", jwtMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Reputation routes (Observation Service)
router.all("/reputation/*", jwtMiddleware, (req, res) => {
  proxyRequest(services.OBSERVATION_SERVICE, req, res);
});

// Taxonomy routes
router.all("/taxonomy*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/phylum*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/class*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/order*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/family*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

router.all("/genus*", jwtMiddleware, (req, res) => {
  proxyRequest(services.TAXONOMY_SERVICE, req, res);
});

module.exports = router;
