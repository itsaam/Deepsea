const prisma = require("../config/database");
const {
  validateSpeciesData,
  isSpeciesNameUnique,
} = require("../utils/validators");
const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:3003";

const createSpecies = async (speciesData, authorId) => {
  // Validation basique des données (sans la liste des espèces bannies)
  const dataValidation = validateSpeciesData(speciesData);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors.join(", "));
  }

  // Vérification de l'unicité du nom
  const uniqueCheck = await isSpeciesNameUnique(speciesData.name);
  if (!uniqueCheck.valid) {
    throw new Error(uniqueCheck.error);
  }

  // 🤖 Validation IA : vérifier si c'est une espèce aquatique
  try {
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/analyze`,
      {
        description: `Vérifie si "${speciesData.name}" est une espèce marine ou aquatique (poisson, mammifère marin, crustacé, mollusque, etc.). Rejette si c'est un animal terrestre ou aérien.`,
        speciesName: speciesData.name,
      },
      { timeout: 10000 }
    );

    if (
      aiResponse.data?.data?.isSpam ||
      aiResponse.data?.data?.qualityScore < 5
    ) {
      throw new Error(
        `"${speciesData.name}" ne semble pas être une espèce aquatique valide. Seules les espèces marines et aquatiques sont acceptées dans DeepSea.`
      );
    }
  } catch (aiError) {
    // Si l'IA ne répond pas, on laisse passer (fallback gracieux)
    console.warn(
      "⚠️ Service IA indisponible pour valider l'espèce, création autorisée"
    );
  }

  // Création de l'espèce
  const newSpecies = await prisma.species.create({
    data: {
      name: speciesData.name,
      authorId: authorId,
    },
  });

  return newSpecies;
};

const getSpeciesById = async (speciesId) => {
  const species = await prisma.species.findUnique({
    where: { id: parseInt(speciesId) },
    include: {
      observations: true,
    },
  });

  // Ne pas afficher les espèces supprimées (sauf pour ADMIN qui peut les restaurer)
  if (species && species.deleted) {
    return null;
  }

  return species;
};

const getAllSpecies = async (sortBy = "createdAt") => {
  const orderBy =
    sortBy === "rarity" ? { rarityScore: "desc" } : { createdAt: "desc" };

  const species = await prisma.species.findMany({
    where: {
      deleted: false, // Ne pas afficher les espèces supprimées
    },
    include: {
      _count: {
        select: { observations: true },
      },
    },
    orderBy,
  });

  return species;
};

const softDeleteSpecies = async (speciesId, userId) => {
  const species = await prisma.species.findUnique({
    where: { id: speciesId },
  });

  if (!species) {
    throw new Error("Espèce non trouvée");
  }

  if (species.deleted) {
    throw new Error("Cette espèce est déjà supprimée");
  }

  const deletedSpecies = await prisma.species.update({
    where: { id: speciesId },
    data: {
      deleted: true,
      deletedBy: userId,
      deletedAt: new Date(),
    },
  });

  return deletedSpecies;
};

const restoreSpecies = async (speciesId) => {
  const species = await prisma.species.findUnique({
    where: { id: speciesId },
  });

  if (!species) {
    throw new Error("Espèce non trouvée");
  }

  if (!species.deleted) {
    throw new Error("Cette espèce n'est pas supprimée");
  }

  const restoredSpecies = await prisma.species.update({
    where: { id: speciesId },
    data: {
      deleted: false,
      deletedBy: null,
      deletedAt: null,
    },
  });

  return restoredSpecies;
};

module.exports = {
  createSpecies,
  getSpeciesById,
  getAllSpecies,
  softDeleteSpecies,
  restoreSpecies,
};
