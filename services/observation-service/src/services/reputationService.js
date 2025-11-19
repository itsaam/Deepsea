const prisma = require("../config/database");

/**
 * Met à jour la réputation d'un utilisateur
 */
async function updateReputation(userId, points) {
  const reputation = await prisma.userReputation.upsert({
    where: { userId },
    update: {
      score: { increment: points },
    },
    create: {
      userId,
      score: points,
    },
  });

  // Promouvoir en expert si score >= 10
  if (reputation.score >= 10 && !reputation.isExpert) {
    await prisma.userReputation.update({
      where: { userId },
      data: { isExpert: true },
    });
  }

  return reputation;
}

/**
 * Vérifie si un utilisateur est expert
 */
async function isUserExpert(userId) {
  const reputation = await prisma.userReputation.findUnique({
    where: { userId },
  });
  return reputation?.isExpert || false;
}

/**
 * Récupère la réputation d'un utilisateur
 */
async function getUserReputation(userId) {
  return await prisma.userReputation.findUnique({
    where: { userId },
  });
}

module.exports = {
  updateReputation,
  isUserExpert,
  getUserReputation,
};
