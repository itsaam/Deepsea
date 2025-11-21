const prisma = require("../config/database");
const {
  validateSpeciesData,
  isSpeciesNameUnique,
} = require("../utils/validators");
const { getAsciiArtByName } = require("../utils/asciiArt");

const createSpecies = async (speciesData, authorId) => {
  // Validation des données
  const dataValidation = validateSpeciesData(speciesData);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors.join(", "));
  }

  // Vérification de l'unicité du nom
  const uniqueCheck = await isSpeciesNameUnique(speciesData.name);
  if (!uniqueCheck.valid) {
    throw new Error(uniqueCheck.error);
  }

  // Création de l'espèce
  const newSpecies = await prisma.species.create({
    data: {
      name: speciesData.name,
      authorId: authorId,
    },
  });

  // Ajouter l'ASCII art
  const asciiArt = getAsciiArtByName(speciesData.name);
  return {
    ...newSpecies,
    asciiArt: asciiArt.art,
    asciiName: asciiArt.name,
  };
};

const getSpeciesById = async (speciesId) => {
  const species = await prisma.species.findUnique({
    where: { id: parseInt(speciesId) },
    include: {
      observations: true,
    },
  });

  return species;
};

const getAllSpecies = async (sortBy = "createdAt") => {
  const orderBy =
    sortBy === "rarity" ? { rarityScore: "desc" } : { createdAt: "desc" };

  const species = await prisma.species.findMany({
    include: {
      _count: {
        select: { observations: true },
      },
    },
    orderBy,
  });

  return species;
};

module.exports = {
  createSpecies,
  getSpeciesById,
  getAllSpecies,
};
