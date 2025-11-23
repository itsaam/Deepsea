const prisma = require("../config/database");
const {
  validateObservationData,
  canSubmitObservation,
  canValidateObservation,
} = require("../utils/validators");
const reputationService = require("./reputationService");
const { updateSpeciesRarity } = require("../utils/rarityCalculator");
const notificationService = require("./notificationService");
const {
  recupererInfosUtilisateur: getUserInfo,
} = require("../../../../shared/utils/authServiceClient");

// Fonction pour enrichir les observations avec les usernames
const enrichObservationsWithUsernames = async (observations) => {
  const observationsArray = Array.isArray(observations)
    ? observations
    : [observations];

  const enriched = await Promise.all(
    observationsArray.map(async (obs) => {
      const enrichedObs = { ...obs };

      // Récupérer le username du validateur si présent
      if (obs.validatedBy) {
        const validatorInfo = await getUserInfo(obs.validatedBy);
        if (validatorInfo) {
          enrichedObs.validatorUsername = validatorInfo.username;
        }
      }

      // Récupérer le username de l'auteur
      const authorInfo = await getUserInfo(obs.authorId);
      if (authorInfo) {
        enrichedObs.authorUsername = authorInfo.username;
      }

      return enrichedObs;
    })
  );

  return Array.isArray(observations) ? enriched : enriched[0];
};

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

  // Enrichir avec les usernames
  return await enrichObservationsWithUsernames(observations);
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

  // Enrichir avec les usernames
  return await enrichObservationsWithUsernames(observations);
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

  // 🔔 Créer une notification pour l'auteur
  await notificationService.createNotification(
    observation.authorId,
    "OBSERVATION_VALIDATED",
    "Observation validée !",
    `Votre observation de l'espèce "${validatedObservation.species.name}" a été validée.`,
    observationId
  );

  // Enrichir avec le username du validateur
  return await enrichObservationsWithUsernames(validatedObservation);
};

const rejectObservation = async (
  observationId,
  validatorId,
  userRole = null,
  rejectionReason = null
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

  // Récupérer le username du validateur
  const validatorInfo = await getUserInfo(validatorId);
  const validatorUsername =
    validatorInfo?.username || `Utilisateur #${validatorId}`;

  const rejectedObservation = await prisma.observation.update({
    where: { id: parseInt(observationId) },
    data: {
      status: "REJECTED",
      validatedBy: validatorId,
      validatedAt: new Date(),
      rejectionReason: rejectionReason, // Stocker la raison du rejet
    },
    include: {
      species: true,
    },
  });

  await reputationService.updateReputation(observation.authorId, -1);

  // 🔔 Créer une notification pour l'auteur avec la raison ET le username du validateur
  const notificationMessage = rejectionReason
    ? `Votre observation de l'espèce "${rejectedObservation.species.name}" a été rejetée par ${validatorUsername}.\n\nRaison: ${rejectionReason}`
    : `Votre observation de l'espèce "${rejectedObservation.species.name}" a été rejetée par ${validatorUsername}.`;

  await notificationService.createNotification(
    observation.authorId,
    "OBSERVATION_REJECTED",
    "Observation rejetée",
    notificationMessage,
    observationId
  );

  // Enrichir avec le username du validateur
  return await enrichObservationsWithUsernames(rejectedObservation);
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

  if (!observation) return null;

  // Enrichir avec les usernames
  return await enrichObservationsWithUsernames(observation);
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
