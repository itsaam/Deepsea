createSpecies(req, res) {
    const speciesData = req.body;
    speciesService.createSpecies(speciesData, req.user.id)
      .then((newSpecies) => {
        res.status(201).json(newSpecies);
      })
      .catch((error) => {
        res.status(500).json({ error: "Erreur lors de la création de l'espèce", details: error.message });
      });
  }

  getSpeciesById(req, res) {
    const speciesId = req.params.id;
    speciesService.getSpeciesById(speciesId)
      .then((species) => {
        if (species) {
          res.status(200).json(species);
        } else {
          res.status(404).json({ error: "Espèce non trouvée" });
        }
      })
      .catch((error) => {
        res.status(500).json({ error: "Erreur lors de la récupération de l'espèce", details: error.message });
      });
  }

  getAllSpecies(req, res) {
    speciesService.getAllSpecies()
      .then((speciesList) => {
        res.status(200).json(speciesList);
      })
      .catch((error) => {
        res.status(500).json({ error: "Erreur lors de la récupération des espèces", details: error.message });
      });
  }