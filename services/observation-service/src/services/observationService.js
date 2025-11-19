const prisma = require("../config/database");
const {
  validateObservationData,
  canSubmitObservation,
  canValidateObservation,
} = require("../utils/validators");

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

  return rejectedObservation;
};

module.exports = {
  createObservation,
  getObservationsBySpecies,
  validateObservation,
  rejectObservation,
};
