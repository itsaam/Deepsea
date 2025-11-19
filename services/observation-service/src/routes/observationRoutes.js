const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const observationService = require("../services/observationService");

// POST /observations - Créer une nouvelle observation
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newObservation = await observationService.createObservation(
      req.body,
      req.user.id
    );
    res.status(201).json(newObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /species/:id/observations - Récupérer les observations d'une espèce
router.get("/species/:id/observations", async (req, res) => {
  try {
    const observations = await observationService.getObservationsBySpecies(
      req.params.id
    );
    res.status(200).json(observations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /observations/:id/validate - Valider une observation
router.post("/:id/validate", authMiddleware, async (req, res) => {
  try {
    const validatedObservation = await observationService.validateObservation(
      req.params.id,
      req.user.id
    );
    res.status(200).json(validatedObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /observations/:id/reject - Rejeter une observation
router.post("/:id/reject", authMiddleware, async (req, res) => {
  try {
    const rejectedObservation = await observationService.rejectObservation(
      req.params.id,
      req.user.id
    );
    res.status(200).json(rejectedObservation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
