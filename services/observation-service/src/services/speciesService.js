const prisma = require("../config/database");
const {
  validateSpeciesData,
  isSpeciesNameUnique,
} = require("../utils/validators");

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

  return newSpecies;
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

const getAllSpecies = async () => {
  const species = await prisma.species.findMany({
    include: {
      _count: {
        select: { observations: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return species;
};

module.exports = {
  createSpecies,
  getSpeciesById,
  getAllSpecies,
};
