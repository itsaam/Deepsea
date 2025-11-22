const observationService = require("../services/observationService");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3003";

const observationController = {
  createObservation(req, res) {
    (async () => {
      try {
        const observationData = req.body;

        // Récupérer le nom de l'espèce depuis la DB
        const species = await prisma.species.findUnique({
          where: { id: parseInt(observationData.speciesId) },
          select: { name: true },
        });

        if (!species) {
          return res.status(404).json({ error: "Espèce non trouvée" });
        }

        const speciesName = species.name;

        // Appel à l'AI service pour analyser l'observation
        let aiAnalysis = null;
        try {
          console.log(
            `📡 Appel au service IA pour analyser l'observation de "${speciesName}"...`
          );
          const aiResponse = await axios.post(
            `${AI_SERVICE_URL}/api/analyze`,
            {
              description: observationData.description,
              speciesName: speciesName,
            },
            {
              timeout: 30000, // 30 secondes de timeout
            }
          );

          if (aiResponse.data && aiResponse.data.success) {
            aiAnalysis = aiResponse.data.data;
            console.log("✅ Analyse IA reçue:", {
              isSpam: aiAnalysis.isSpam,
              recommendation: aiAnalysis.recommendation,
              qualityScore: aiAnalysis.qualityScore,
            });

            // Rejet automatique si spam détecté
            if (aiAnalysis.isSpam) {
              console.log(
                `🚫 Observation rejetée : spam détecté par l'IA - User ID: ${
                  req.user.id
                }, Username: ${
                  req.user.username
                }, Description: "${observationData.description.substring(
                  0,
                  50
                )}..."`
              );
              return res.status(400).json({
                error: "Observation rejetée automatiquement",
                reason:
                  "Le contenu a été identifié comme spam par notre système d'analyse",
                details: aiAnalysis.reason,
                detectedIssues: aiAnalysis.detectedIssues || [],
              });
            }
          }
        } catch (aiError) {
          // L'AI service est down ou ne répond pas - on continue sans l'analyse
          console.warn(
            "⚠️ Service IA indisponible, création de l'observation sans analyse :",
            aiError.message
          );
        }

        // Création de l'observation avec l'analyse IA (si disponible)
        const newObservation = await observationService.createObservation(
          observationData,
          req.user.id,
          aiAnalysis
        );

        res.status(201).json({
          ...newObservation,
          aiSuggestion: aiAnalysis
            ? {
                recommendation: aiAnalysis.recommendation,
                confidence: aiAnalysis.confidence,
                qualityScore: aiAnalysis.qualityScore,
                reason: aiAnalysis.reason,
              }
            : null,
        });
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la création de l'observation",
          details: error.message,
        });
      }
    })();
  },

  getObservationsBySpecies(req, res) {
    (async () => {
      try {
        const speciesId = req.params.speciesId;
        const observations = await observationService.getObservationsBySpecies(
          speciesId
        );
        res.status(200).json(observations);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la récupération des observations",
          details: error.message,
        });
      }
    })();
  },

  validateObservation(req, res) {
    (async () => {
      try {
        const observationId = req.params.observationId;
        const validatedObservation =
          await observationService.validateObservation(
            observationId,
            req.user.id
          );
        res.status(200).json(validatedObservation);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la validation de l'observation",
          details: error.message,
        });
      }
    })();
  },

  rejectObersvation(req, res) {
    (async () => {
      try {
        const observationId = req.params.observationId;
        const rejectedObservation = await observationService.rejectObservation(
          observationId,
          req.user.id
        );
        res.status(200).json(rejectedObservation);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors du rejet de l'observation",
          details: error.message,
        });
      }
    })();
  },

  softDeleteObservation(req, res) {
    (async () => {
      try {
        const observationId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const deletedObservation =
          await observationService.softDeleteObservation(observationId, userId);
        res.status(200).json(deletedObservation);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la suppression logique de l'observation",
          details: error.message,
        });
      }
    })();
  },

  restoreObservation(req, res) {
    (async () => {
      try {
        const observationId = parseInt(req.params.id, 10);
        const restoredObservation = await observationService.restoreObservation(
          observationId
        );
        res.status(200).json(restoredObservation);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la restauration de l'observation",
          details: error.message,
        });
      }
    })();
  },

  getAllObservations(req, res) {
    (async () => {
      try {
        const includeDeleted = req.query.includeDeleted === "true";
        const observations = await observationService.getAllObservations(
          includeDeleted
        );
        res.status(200).json(observations);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la récupération des observations",
          details: error.message,
        });
      }
    })();
  },

  getObservationWithAiSuggestion(req, res) {
    (async () => {
      try {
        const observationId = parseInt(req.params.id, 10);
        const observation = await observationService.getObservationById(
          observationId
        );

        if (!observation) {
          return res.status(404).json({ error: "Observation non trouvée" });
        }

        // Formatter la réponse avec les suggestions IA si disponibles
        const response = {
          ...observation,
          aiSuggestion: observation.aiAnalysis
            ? {
                recommendation: observation.aiAnalysis.recommendation,
                confidence: observation.aiAnalysis.confidence,
                qualityScore: observation.aiAnalysis.qualityScore,
                reason: observation.aiAnalysis.reason,
                isValid: observation.aiAnalysis.isValid,
                detectedIssues: observation.aiAnalysis.detectedIssues || [],
              }
            : null,
        };

        res.status(200).json(response);
      } catch (error) {
        res.status(500).json({
          error: "Erreur lors de la récupération de l'observation",
          details: error.message,
        });
      }
    })();
  },
};

module.exports = observationController;
