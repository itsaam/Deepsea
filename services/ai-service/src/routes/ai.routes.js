const express = require("express");
const { body } = require("express-validator");
const aiController = require("../controllers/ai.controller");
const jwtMiddleware = require("../middlewares/jwtMiddleware");

const router = express.Router();

// Validation middleware
const validateDescription = [
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10 and 5000 characters"),
];

const validateSpeciesName = [
  body("speciesName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Species name must be between 2 and 200 characters"),
];

const validateTwoDescriptions = [
  body("description1")
    .trim()
    .notEmpty()
    .withMessage("Description 1 is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description 1 must be between 10 and 5000 characters"),
  body("description2")
    .trim()
    .notEmpty()
    .withMessage("Description 2 is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description 2 must be between 10 and 5000 characters"),
];

/**
 * @route   POST /api/analyze
 * @desc    Analyse complète d'une observation
 * @access  Private (JWT requis)
 */
router.post(
  "/analyze",
  jwtMiddleware,
  [...validateDescription, ...validateSpeciesName],
  aiController.analyzeObservation
);

/**
 * @route   POST /api/detect-spam
 * @desc    Détecte si une observation est du spam
 * @access  Private (JWT requis)
 */
router.post(
  "/detect-spam",
  jwtMiddleware,
  validateDescription,
  aiController.detectSpam
);

/**
 * @route   POST /api/extract-features
 * @desc    Extrait les caractéristiques d'une créature
 * @access  Private (JWT requis)
 */
router.post(
  "/extract-features",
  jwtMiddleware,
  validateDescription,
  aiController.extractFeatures
);

/**
 * @route   POST /api/suggest-taxonomy
 * @desc    Suggère une classification taxonomique
 * @access  Private (JWT requis)
 */
router.post(
  "/suggest-taxonomy",
  jwtMiddleware,
  [...validateDescription, ...validateSpeciesName],
  aiController.suggestTaxonomy
);

/**
 * @route   POST /api/compare
 * @desc    Compare deux observations
 * @access  Private (JWT requis)
 */
router.post(
  "/compare",
  jwtMiddleware,
  validateTwoDescriptions,
  aiController.compareSimilarity
);

/**
 * @route   POST /api/summarize
 * @desc    Résume une observation
 * @access  Private (JWT requis)
 */
router.post(
  "/summarize",
  jwtMiddleware,
  validateDescription,
  aiController.summarize
);

/**
 * @route   POST /api/chat
 * @desc    Chat avec le bot DeepSea
 * @access  Private (JWT requis)
 */
router.post("/chat", jwtMiddleware, aiController.chat);

module.exports = router;
