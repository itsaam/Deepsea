const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const voteController = {
  // 👍👎 Voter ou changer son vote sur une observation
  async voteObservation(req, res) {
    try {
      const { observationId } = req.params;
      const { value } = req.body; // 1 pour upvote, -1 pour downvote
      const userId = req.user.id;

      // Valider le vote
      if (![1, -1].includes(value)) {
        return res.status(400).json({
          error: "Le vote doit être 1 (upvote) ou -1 (downvote)",
        });
      }

      // Vérifier que l'observation existe
      const observation = await prisma.observation.findUnique({
        where: { id: parseInt(observationId) },
      });

      if (!observation) {
        return res.status(404).json({ error: "Observation non trouvée" });
      }

      if (observation.deleted) {
        return res.status(410).json({ error: "Observation supprimée" });
      }

      // Empêcher de voter pour sa propre observation
      if (observation.authorId === userId) {
        return res.status(403).json({
          error: "Vous ne pouvez pas voter pour votre propre observation",
        });
      }

      // Créer ou mettre à jour le vote (upsert)
      const vote = await prisma.vote.upsert({
        where: {
          observationId_userId: {
            observationId: parseInt(observationId),
            userId: userId,
          },
        },
        update: {
          value: value,
        },
        create: {
          observationId: parseInt(observationId),
          userId: userId,
          value: value,
        },
      });

      // Calculer le score total
      const voteStats = await prisma.vote.groupBy({
        by: ["observationId"],
        where: {
          observationId: parseInt(observationId),
        },
        _sum: {
          value: true,
        },
        _count: {
          value: true,
        },
      });

      const totalScore = voteStats[0]?._sum?.value || 0;
      const totalVotes = voteStats[0]?._count?.value || 0;

      res.json({
        success: true,
        message: value === 1 ? "Upvote ajouté" : "Downvote ajouté",
        vote: {
          id: vote.id,
          value: vote.value,
          createdAt: vote.createdAt,
        },
        stats: {
          totalScore,
          totalVotes,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors du vote:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 🗑️ Retirer son vote
  async removeVote(req, res) {
    try {
      const { observationId } = req.params;
      const userId = req.user.id;

      // Vérifier que le vote existe
      const vote = await prisma.vote.findUnique({
        where: {
          observationId_userId: {
            observationId: parseInt(observationId),
            userId: userId,
          },
        },
      });

      if (!vote) {
        return res.status(404).json({ error: "Vote non trouvé" });
      }

      // Supprimer le vote
      await prisma.vote.delete({
        where: {
          observationId_userId: {
            observationId: parseInt(observationId),
            userId: userId,
          },
        },
      });

      // Calculer le nouveau score
      const voteStats = await prisma.vote.groupBy({
        by: ["observationId"],
        where: {
          observationId: parseInt(observationId),
        },
        _sum: {
          value: true,
        },
        _count: {
          value: true,
        },
      });

      const totalScore = voteStats[0]?._sum?.value || 0;
      const totalVotes = voteStats[0]?._count?.value || 0;

      res.json({
        success: true,
        message: "Vote retiré",
        stats: {
          totalScore,
          totalVotes,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors du retrait du vote:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 📊 Obtenir les stats de vote d'une observation
  async getVoteStats(req, res) {
    try {
      const { observationId } = req.params;
      const userId = req.user?.id;

      // Vérifier que l'observation existe
      const observation = await prisma.observation.findUnique({
        where: { id: parseInt(observationId) },
      });

      if (!observation) {
        return res.status(404).json({ error: "Observation non trouvée" });
      }

      // Récupérer les stats
      const [voteStats, upvotes, downvotes, userVote] = await Promise.all([
        prisma.vote.groupBy({
          by: ["observationId"],
          where: {
            observationId: parseInt(observationId),
          },
          _sum: {
            value: true,
          },
          _count: {
            value: true,
          },
        }),
        prisma.vote.count({
          where: {
            observationId: parseInt(observationId),
            value: 1,
          },
        }),
        prisma.vote.count({
          where: {
            observationId: parseInt(observationId),
            value: -1,
          },
        }),
        userId
          ? prisma.vote.findUnique({
              where: {
                observationId_userId: {
                  observationId: parseInt(observationId),
                  userId: userId,
                },
              },
            })
          : null,
      ]);

      const totalScore = voteStats[0]?._sum?.value || 0;
      const totalVotes = voteStats[0]?._count?.value || 0;

      res.json({
        success: true,
        stats: {
          totalScore,
          totalVotes,
          upvotes,
          downvotes,
          userVote: userVote ? userVote.value : null,
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des stats:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },

  // 🏆 Obtenir les observations les mieux votées
  async getTopObservations(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Récupérer les observations avec leur score
      const observations = await prisma.observation.findMany({
        where: {
          deleted: false,
        },
        include: {
          species: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              votes: true,
              replies: true,
            },
          },
        },
        skip,
        take: limit,
      });

      // Calculer le score pour chaque observation
      const observationsWithScores = await Promise.all(
        observations.map(async (obs) => {
          const voteStats = await prisma.vote.groupBy({
            by: ["observationId"],
            where: {
              observationId: obs.id,
            },
            _sum: {
              value: true,
            },
          });

          return {
            ...obs,
            voteScore: voteStats[0]?._sum?.value || 0,
          };
        })
      );

      // Trier par score décroissant
      observationsWithScores.sort((a, b) => b.voteScore - a.voteScore);

      const total = await prisma.observation.count({
        where: { deleted: false },
      });

      res.json({
        success: true,
        observations: observationsWithScores,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du top:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  },
};

module.exports = voteController;
