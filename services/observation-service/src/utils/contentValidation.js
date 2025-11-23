/**
 * Utilitaires pour la validation de contenu (anti-spam)
 * DÉPRÉCIÉ: Utiliser detectionSpam.js à la place
 * Ce fichier est conservé pour compatibilité mais redirige vers le module unifié
 */

const {
  detecterSpam,
  validerContenuCommentaire,
} = require("../../../../shared/utils/detectionSpam");

/**
 * @deprecated Utiliser detecterSpam() de detectionSpam.js
 * Détecte si un texte est du spam évident
 * @param {string} content - Le contenu à analyser
 * @returns {boolean} - true si spam détecté
 */
const isSpamContent = (content) => {
  const result = detecterSpam(content, 3);
  return result.isSpam;
};

/**
 * @deprecated Utiliser validerContenuCommentaire() de detectionSpam.js
 * Valide le contenu d'un commentaire/reply
 * @param {string} content - Le contenu à valider
 * @returns {{isValid: boolean, error?: string}} - Résultat de la validation
 */
const validateReplyContent = (content) => {
  const result = validerContenuCommentaire(content);
  return {
    isValid: result.valide,
    error: result.erreur,
  };
};

module.exports = {
  isSpamContent,
  validateReplyContent,
  // Export des nouvelles fonctions recommandées
  detecterSpam,
  validerContenuCommentaire,
};
