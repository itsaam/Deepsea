const analysisService = require('../services/analysis.service');
const { validationResult } = require('express-validator');

class AIController {
  /**
   * POST /api/analyze
   * Analyse complète d'une observation
   */
  async analyzeObservation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, speciesName } = req.body;

      const analysis = await analysisService.analyzeObservation(description, speciesName);

      return res.status(200).json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error analyzing observation:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze observation',
        message: error.message
      });
    }
  }

  /**
   * POST /api/detect-spam
   * Détecte si une observation est du spam
   */
  async detectSpam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description } = req.body;

      const result = await analysisService.detectSpam(description);

      return res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error detecting spam:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to detect spam',
        message: error.message
      });
    }
  }

  /**
   * POST /api/extract-features
   * Extrait les caractéristiques d'une créature
   */
  async extractFeatures(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description } = req.body;

      const features = await analysisService.extractFeatures(description);

      return res.status(200).json({
        success: true,
        data: features,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error extracting features:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to extract features',
        message: error.message
      });
    }
  }

  /**
   * POST /api/suggest-taxonomy
   * Suggère une classification taxonomique
   */
  async suggestTaxonomy(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, speciesName } = req.body;

      const taxonomy = await analysisService.suggestTaxonomy(description, speciesName);

      return res.status(200).json({
        success: true,
        data: taxonomy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error suggesting taxonomy:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to suggest taxonomy',
        message: error.message
      });
    }
  }

  /**
   * POST /api/compare
   * Compare deux observations pour détecter similarités
   */
  async compareSimilarity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description1, description2 } = req.body;

      const comparison = await analysisService.compareSimilarity(description1, description2);

      return res.status(200).json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error comparing observations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to compare observations',
        message: error.message
      });
    }
  }

  /**
   * POST /api/summarize
   * Génère un résumé d'une observation
   */
  async summarize(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description } = req.body;

      const summary = await analysisService.summarize(description);

      return res.status(200).json({
        success: true,
        data: { summary },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error summarizing:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to summarize observation',
        message: error.message
      });
    }
  }
}

module.exports = new AIController();
