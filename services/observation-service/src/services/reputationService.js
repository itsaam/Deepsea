const prisma = require("../config/database");
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

/**
 * Appelle auth-service pour promouvoir un utilisateur en EXPERT
 */
async function promoteUserToExpert(userId) {
  try {
    const response = await axios.post(
      `${AUTH_SERVICE_URL}/internal/promote-expert`,
      { userId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ User ${userId} promoted to EXPERT in auth-service`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to promote user ${userId} to EXPERT:`,
      error.response?.data || error.message
    );
    // On ne throw pas l'erreur pour ne pas bloquer le flow de réputation
  }
}

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

    // Appeler auth-service pour synchroniser le rôle
    await promoteUserToExpert(userId);
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
