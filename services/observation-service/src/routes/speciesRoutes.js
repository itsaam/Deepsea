const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const speciesService = require("../services/speciesService");

// POST /species - Créer une nouvelle espèce
router.post("/", authMiddleware, async (req, res) => {
  try {
    const newSpecies = await speciesService.createSpecies(
      req.body,
      req.user.id
    );
    res.status(201).json(newSpecies);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /species/:id - Récupérer une espèce par ID
router.get("/:id", async (req, res) => {
  try {
    const species = await speciesService.getSpeciesById(req.params.id);
    if (!species) {
      return res.status(404).json({ error: "Espèce non trouvée" });
    }
    res.status(200).json(species);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /species - Récupérer toutes les espèces
router.get("/", async (req, res) => {
  try {
    const species = await speciesService.getAllSpecies();
    res.status(200).json(species);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
