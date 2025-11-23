/**
 * Utilitaires pour la validation de contenu (anti-spam)
 */

/**
 * Détecte si un texte est du spam évident avec des patterns regex
 * @param {string} content - Le contenu à analyser
 * @returns {boolean} - true si spam détecté
 */
const isSpamContent = (content) => {
  const cleanContent = content.trim().toLowerCase();

  // Patterns de spam évidents
  const spamPatterns = [
    /^(.)\1{5,}$/, // aaaaaa, zzzzzz
    /^[a-z]{20,}$/, // azeazeazeazeaze (lettres sans sens)
    /^(test|lol|mdr|xd)+$/i, // test, lol, mdr
    /^[0-9]+$/, // que des chiffres
    /^[^a-z0-9]{10,}$/i, // que des symboles
    /^(.{2,5})\1{3,}$/, // motifs répétés (azeazeaze)
    /^(a|e|i|o|u){10,}$/i, // que des voyelles
    /https?:\/\/|www\./i, // URLs (spam publicitaire)
  ];

  return spamPatterns.some((pattern) => pattern.test(cleanContent));
};

/**
 * Valide le contenu d'un commentaire/reply
 * @param {string} content - Le contenu à valider
 * @returns {{isValid: boolean, error?: string}} - Résultat de la validation
 */
const validateReplyContent = (content) => {
  const trimmedContent = content.trim();

  // Vérifier longueur minimale
  if (trimmedContent.length < 3) {
    return {
      isValid: false,
      error: "Le commentaire doit contenir au moins 3 caractères",
    };
  }

  // Vérifier longueur maximale
  if (trimmedContent.length > 1000) {
    return {
      isValid: false,
      error: "Le commentaire ne peut pas dépasser 1000 caractères",
    };
  }

  // Détecter le spam
  if (isSpamContent(trimmedContent)) {
    return {
      isValid: false,
      error:
        "Contenu détecté comme spam ou non pertinent. Veuillez fournir un commentaire constructif.",
    };
  }

  return { isValid: true };
};

module.exports = {
  isSpamContent,
  validateReplyContent,
};
