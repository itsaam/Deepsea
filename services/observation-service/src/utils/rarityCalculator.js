const prisma = require("../config/database");

/**
 * Calcule le rarityScore d'une espèce
 * Formule : 1 + (nombreObservationsValidées / 5)
 */
function calculateRarityScore(validatedObservationsCount) {
  return 1 + validatedObservationsCount / 5;
}

/**
 * Met à jour le rarityScore d'une espèce
 */
async function updateSpeciesRarity(speciesId) {
  const validatedCount = await prisma.observation.count({
    where: {
      speciesId,
      status: "VALIDATED",
    },
  });

  const rarityScore = calculateRarityScore(validatedCount);

  await prisma.species.update({
    where: { id: speciesId },
    data: { rarityScore },
  });

  return rarityScore;
}

module.exports = {
  calculateRarityScore,
  updateSpeciesRarity,
};
