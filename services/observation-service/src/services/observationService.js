const prisma = require("../config/database");
const {
  validateObservationData,
  canSubmitObservation,
  canValidateObservation,
} = require("../utils/validators");
const reputationService = require("./reputationService");
const { updateSpeciesRarity } = require("../utils/rarityCalculator");

const createObservation = async (observationData, authorId) => {
  // Validation des données
  const dataValidation = validateObservationData(observationData);
  if (!dataValidation.valid) {
    throw new Error(dataValidation.errors.join(", "));
  }

  // Vérification du délai de 5 minutes
  const submitCheck = await canSubmitObservation(
    authorId,
    observationData.speciesId
  );
  if (!submitCheck.valid) {
    throw new Error(submitCheck.error);
  }

  // Vérifier que l'espèce existe
  const species = await prisma.species.findUnique({
    where: { id: parseInt(observationData.speciesId) },
  });

  if (!species) {
    throw new Error("Espèce non trouvée");
  }

  // Création de l'observation
  const newObservation = await prisma.observation.create({
    data: {
      speciesId: parseInt(observationData.speciesId),
      authorId: authorId,
      description: observationData.description,
      status: "PENDING",
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

const validateObservation = async (observationId, validatorId) => {
  // Vérification que l'utilisateur peut valider cette observation
  const validationCheck = await canValidateObservation(
    validatorId,
    parseInt(observationId)
  );
  if (!validationCheck.valid) {
    throw new Error(validationCheck.error);
  }

  const observation = validationCheck.observation;

  // Vérifier que l'observation est en attente
  if (observation.status !== "PENDING") {
    throw new Error("Cette observation a déjà été traitée");
  }

  // Mise à jour de l'observation
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

  // Mise à jour de la réputation
  // +3 pour l'auteur de l'observation
  await reputationService.updateReputation(observation.authorId, 3);

  // +1 si validé par un expert
  const isExpert = await reputationService.isUserExpert(validatorId);
  if (isExpert) {
    await reputationService.updateReputation(observation.authorId, 1);
  }

  // Mise à jour du rarityScore de l'espèce
  await updateSpeciesRarity(observation.speciesId);

  return validatedObservation;
};

const rejectObservation = async (observationId, validatorId) => {
  // Vérification que l'utilisateur peut rejeter cette observation
  const validationCheck = await canValidateObservation(
    validatorId,
    parseInt(observationId)
  );
  if (!validationCheck.valid) {
    throw new Error(validationCheck.error);
  }

  const observation = validationCheck.observation;

  // Vérifier que l'observation est en attente
  if (observation.status !== "PENDING") {
    throw new Error("Cette observation a déjà été traitée");
  }

  // Mise à jour de l'observation
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

  // Pénalité de réputation : -1 pour l'auteur
  await reputationService.updateReputation(observation.authorId, -1);

  return rejectedObservation;
};

module.exports = {
  createObservation,
  getAllObservations,
  getObservationsBySpecies,
  validateObservation,
  rejectObservation,
};
