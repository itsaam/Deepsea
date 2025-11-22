const prisma = require("../config/database");
const {
  validateObservationData,
  canSubmitObservation,
  canValidateObservation,
} = require("../utils/validators");
const reputationService = require("./reputationService");
const { updateSpeciesRarity } = require("../utils/rarityCalculator");

const createObservation = async (
  observationData,
  authorId,
  aiAnalysis = null,
  userRole = null
) => {
  const dataValidation = validateObservationData(observationData);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors.join(", "));
  }

  // ⚠️ Le rate limit est maintenant vérifié dans le controller AVANT l'appel IA
  // On garde cette vérification en backup au cas où
  const submitCheck = await canSubmitObservation(
    authorId,
    observationData.speciesId,
    userRole
  );
  if (!submitCheck.valid) {
    throw new Error(submitCheck.error);
  }

  const species = await prisma.species.findUnique({
    where: { id: parseInt(observationData.speciesId) },
  });

  if (!species) {
    throw new Error("Espèce non trouvée");
  }

  if (species.deleted) {
    throw new Error(
      "Impossible de créer une observation sur une espèce supprimée"
    );
  }

  const newObservation = await prisma.observation.create({
    data: {
      speciesId: parseInt(observationData.speciesId),
      authorId: authorId,
      description: observationData.description,
      status: "PENDING",
      aiAnalysis: aiAnalysis, // Stockage de l'analyse IA
    },
    include: {
      species: true,
    },
  });

  return newObservation;
};

const getAllObservations = async (status) => {
  const where = status ? { status } : {};

  const observations = await prisma.observation.findMany({
    where,
    include: {
      species: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return observations;
};

const getObservationsBySpecies = async (speciesId) => {
  const observations = await prisma.observation.findMany({
    where: {
      speciesId: parseInt(speciesId),
    },
    include: {
      species: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return observations;
};

const validateObservation = async (
  observationId,
  validatorId,
  userRole = null
) => {
  const validationCheck = await canValidateObservation(
    validatorId,
    parseInt(observationId),
    userRole
  );
  if (!validationCheck.valid) {
    throw new Error(validationCheck.error);
  }

  const observation = validationCheck.observation;

  if (observation.status !== "PENDING") {
    throw new Error("Cette observation a déjà été traitée");
  }

  const validatedObservation = await prisma.observation.update({
    where: { id: parseInt(observationId) },
    data: {
      status: "VALIDATED",
      validatedBy: validatorId,
      validatedAt: new Date(),
    },
    include: {
      species: true,
    },
  });
  await reputationService.updateReputation(observation.authorId, 3);

  const isExpert = await reputationService.isUserExpert(validatorId);
  if (isExpert) {
    await reputationService.updateReputation(observation.authorId, 1);
  }

  await updateSpeciesRarity(observation.speciesId);

  return validatedObservation;
};

const rejectObservation = async (
  observationId,
  validatorId,
  userRole = null
) => {
  const validationCheck = await canValidateObservation(
    validatorId,
    parseInt(observationId),
    userRole
  );
  if (!validationCheck.valid) {
    throw new Error(validationCheck.error);
  }

  const observation = validationCheck.observation;

  if (observation.status !== "PENDING") {
    throw new Error("Cette observation a déjà été traitée");
  }

  const rejectedObservation = await prisma.observation.update({
    where: { id: parseInt(observationId) },
    data: {
      status: "REJECTED",
      validatedBy: validatorId,
      validatedAt: new Date(),
    },
    include: {
      species: true,
    },
  });

  await reputationService.updateReputation(observation.authorId, -1);

  return rejectedObservation;
};

const softDeleteObservation = async (observationId, userId) => {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
  });

  if (!observation) {
    throw new Error("Observation non trouvée");
  }

  if (observation.deleted) {
    throw new Error("Cette observation est déjà supprimée");
  }

  const deletedObservation = await prisma.observation.update({
    where: { id: observationId },
    data: {
      deleted: true,
      deletedBy: userId,
      deletedAt: new Date(),
    },
    include: {
      species: true,
    },
  });

  return deletedObservation;
};

const restoreObservation = async (observationId) => {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
  });

  if (!observation) {
    throw new Error("Observation non trouvée");
  }

  if (!observation.deleted) {
    throw new Error("Cette observation n'est pas supprimée");
  }

  const restoredObservation = await prisma.observation.update({
    where: { id: observationId },
    data: {
      deleted: false,
      deletedBy: null,
      deletedAt: null,
    },
    include: {
      species: true,
    },
  });

  return restoredObservation;
};

const getObservationById = async (observationId) => {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
    include: {
      species: true,
    },
  });

  return observation;
};

module.exports = {
  createObservation,
  getAllObservations,
  getObservationsBySpecies,
  validateObservation,
  rejectObservation,
  softDeleteObservation,
  restoreObservation,
  getObservationById,
};
