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
        const forceReview = req.body.forceReview === true; // Flag pour forcer la création

        // 🔒 VÉRIFIER LE RATE LIMIT EN PREMIER (sauf ADMIN)
        const { canSubmitObservation } = require("../utils/validators");
        if (req.user.role !== "ADMIN") {
          const submitCheck = await canSubmitObservation(
            req.user.id,
            observationData.speciesId,
            req.user.role
          );
          if (!submitCheck.valid) {
            return res.status(429).json({
              error: "Limite de soumission atteinte",
              details: submitCheck.error,
            });
          }
        }

        // Récupérer le nom de l'espèce depuis la DB
        const species = await prisma.species.findUnique({
          where: { id: parseInt(observationData.speciesId) },
          select: { name: true },
        });

        if (!species) {
          return res.status(404).json({ error: "Espèce non trouvée" });
        }

        const speciesName = species.name;

        // Appel à l'AI service pour analyser l'observation (APRÈS rate limit)
        let aiAnalysis = null;
        try {
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

            // Rejet automatique si spam détecté OU qualité trop faible
            if (aiAnalysis.isSpam || aiAnalysis.qualityScore < 3) {
              console.log(
                `🚫 Observation rejetée : spam/qualité insuffisante - User ID: ${req.user.id}, Username: ${req.user.username}, Score: ${aiAnalysis.qualityScore}/10`
              );

              // Si forceReview = true, vérifier si l'utilisateur peut l'utiliser
              if (forceReview) {
                // Vérifier combien de fois l'utilisateur a utilisé Force Review dans la dernière heure
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const recentUsages = await prisma.forceReviewUsage.count({
                  where: {
                    userId: req.user.id,
                    usedAt: {
                      gte: oneHourAgo,
                    },
                  },
                });

                if (recentUsages >= 1) {
                  return res.status(429).json({
                    error: "Limite de Force Review atteinte",
                    reason:
                      "Vous avez déjà utilisé le Force Review dans la dernière heure. Veuillez attendre avant de réessayer.",
                    canForceReview: false,
                  });
                }

                // Enregistrer l'utilisation du Force Review
                await prisma.forceReviewUsage.create({
                  data: {
                    userId: req.user.id,
                  },
                });

                console.log(
                  `⚠️ Force Review utilisé - User ID: ${req.user.id}, Username: ${req.user.username}`
                );
                // Continuer avec la création de l'observation
              } else {
                // Retourner l'erreur avec l'option de forcer
                return res.status(400).json({
                  error: "Observation rejetée automatiquement",
                  reason: aiAnalysis.isSpam
                    ? "Le contenu a été identifié comme spam par notre système d'analyse"
                    : "La description ne contient pas assez de détails scientifiques",
                  details: aiAnalysis.reason,
                  detectedIssues: aiAnalysis.detectedIssues || [],
                  canForceReview: true,
                  forceReviewMessage:
                    "Vous pouvez forcer la création de cette observation pour une revue manuelle (1 fois par heure).",
                });
              }
            }
          }
        } catch (aiError) {
          // L'AI service est down ou ne répond pas - REJET obligatoire
          console.error(
            "🚨 Service IA indisponible - Impossible de valider l'observation :",
            aiError.message
          );
          return res.status(503).json({
            error: "Service de validation temporairement indisponible",
            reason:
              "Notre système d'analyse automatique est actuellement hors ligne. Veuillez réessayer dans quelques instants.",
          });
        }

        // Création de l'observation avec l'analyse IA
        const newObservation = await observationService.createObservation(
          observationData,
          req.user.id,
          aiAnalysis,
          req.user.role
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
            req.user.id,
            req.user.role
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
          req.user.id,
          req.user.role
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
