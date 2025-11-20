const prisma = require("../config/database");
const { isBannedSpecies, getBannedWord } = require("./bannedSpecies");

/**
 * Vérifie qu'un utilisateur ne peut pas valider sa propre observation
 */
const canValidateObservation = async (userId, observationId) => {
  const observation = await prisma.observation.findUnique({
    where: { id: observationId },
  });

  if (!observation) {
    return { valid: false, error: "Observation non trouvée" };
  }

  if (observation.authorId === userId) {
    return {
      valid: false,
      error: "Vous ne pouvez pas valider votre propre observation",
    };
  }

  return { valid: true, observation };
};

/**
 * Vérifie qu'un utilisateur n'a pas soumis d'observation pour cette espèce
 * dans les 5 dernières minutes
 */
const canSubmitObservation = async (userId, speciesId) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const recentObservation = await prisma.observation.findFirst({
    where: {
      authorId: userId,
      speciesId: speciesId,
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  if (recentObservation) {
    return {
      valid: false,
      error:
        "Vous avez déjà soumis une observation pour cette espèce dans les 5 dernières minutes",
    };
  }

  return { valid: true };
};

/**
 * Vérifie qu'une espèce avec ce nom n'existe pas déjà
 */
const isSpeciesNameUnique = async (name, excludeId = null) => {
  const existing = await prisma.species.findFirst({
    where: {
      name: name,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    return { valid: false, error: "Une espèce avec ce nom existe déjà" };
  }

  return { valid: true };
};

/**
 * Valide les données d'une observation
 */
const validateObservationData = (data) => {
  const errors = [];

  if (!data.description || data.description.trim().length === 0) {
    errors.push("La description est obligatoire");
  }

  if (!data.speciesId) {
    errors.push("L'ID de l'espèce est obligatoire");
  }

  if (data.dangerLevel && (data.dangerLevel < 1 || data.dangerLevel > 5)) {
    errors.push("Le niveau de danger doit être entre 1 et 5");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
};

/**
 * Valide les données d'une espèce
 */
const validateSpeciesData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Le nom est obligatoire");
  }

  if (data.name && data.name.length < 3) {
    errors.push("Le nom doit contenir au moins 3 caractères");
  }

  // Vérification des espèces bannies (animaux terrestres/aériens)
  if (data.name && isBannedSpecies(data.name)) {
    const bannedWord = getBannedWord(data.name);
    errors.push(
      `Cette espèce n'est pas autorisée dans DeepSea. "${bannedWord}" est un animal terrestre ou aérien. Seules les espèces aquatiques sont acceptées.`
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
};

module.exports = {
  canValidateObservation,
  canSubmitObservation,
  isSpeciesNameUnique,
  validateObservationData,
  validateSpeciesData,
};
