/**
 * Module centralisé pour la détection de spam et validation de contenu
 * Partagé entre tous les services du projet DeepSea
 */

/**
 * Patterns regex pour détecter le spam
 * Partagé entre tous les services pour cohérence
 */
const PATTERNS_SPAM = [
  /^(.)\1{5,}$/, // Caractères répétés (aaaaaa, zzzzzz)
  /^[a-z]{20,}$/, // Lettres sans sens (azeazeazeaze)
  /^(test|lol|mdr|xd|spam|fake|blabla)+$/i, // Mots test répétés
  /^[0-9]+$/, // Que des chiffres
  /^[^a-z0-9]{10,}$/i, // Que des symboles
  /^(.{2,5})\1{3,}$/, // Motifs répétés (azeazeaze, 123123123)
];

/**
 * Mots-clés interdits pour le spam évident
 */
const MOTS_SPAM = [
  "viagra",
  "casino",
  "porn",
  "xxx",
  "click here",
  "buy now",
  "free money",
  "win prize",
];

/**
 * Détecte si un texte est du spam
 * @param {string} texte - Texte à analyser
 * @param {number} longueurMin - Longueur minimale acceptable (défaut: 10)
 * @returns {object} - { isSpam: boolean, raison: string|null }
 */
function detecterSpam(texte, longueurMin = 10) {
  if (!texte || typeof texte !== "string") {
    return { isSpam: true, raison: "Texte vide ou invalide" };
  }

  const texteNettoye = texte.trim().toLowerCase();

  // Vérifier longueur minimale
  if (texteNettoye.length < longueurMin) {
    return { isSpam: true, raison: "Texte trop court" };
  }

  // Vérifier patterns regex
  for (const pattern of PATTERNS_SPAM) {
    if (pattern.test(texteNettoye)) {
      return {
        isSpam: true,
        raison: "Pattern de spam détecté (caractères répétés ou non-sens)",
      };
    }
  }

  // Vérifier mots-clés interdits
  for (const mot of MOTS_SPAM) {
    if (texteNettoye.includes(mot)) {
      return { isSpam: true, raison: `Mot interdit détecté: ${mot}` };
    }
  }

  return { isSpam: false, raison: null };
}

/**
 * Valide le contenu d'un commentaire/reply
 * @param {string} contenu - Contenu à valider
 * @returns {object} - { valide: boolean, erreur: string|null }
 */
function validerContenuCommentaire(contenu) {
  if (!contenu || contenu.trim().length === 0) {
    return { valide: false, erreur: "Le contenu ne peut pas être vide" };
  }

  if (contenu.length > 2000) {
    return {
      valide: false,
      erreur: "Le contenu ne peut pas dépasser 2000 caractères",
    };
  }

  const spamCheck = detecterSpam(contenu, 3); // Longueur min plus courte pour commentaires
  if (spamCheck.isSpam) {
    return {
      valide: false,
      erreur: `Contenu refusé: ${spamCheck.raison}`,
    };
  }

  return { valide: true, erreur: null };
}

/**
 * Calcule un score de qualité pour un texte (0-10)
 * Basé sur la longueur, diversité des mots, ponctuation
 * @param {string} texte - Texte à évaluer
 * @returns {number} - Score de 0 à 10
 */
function calculerScoreQualite(texte) {
  if (!texte) return 0;

  let score = 0;
  const mots = texte.trim().split(/\s+/);

  // Longueur (0-3 points)
  if (texte.length >= 50) score += 3;
  else if (texte.length >= 20) score += 2;
  else if (texte.length >= 10) score += 1;

  // Nombre de mots (0-2 points)
  if (mots.length >= 10) score += 2;
  else if (mots.length >= 5) score += 1;

  // Diversité lexicale (0-2 points)
  const motsUniques = new Set(mots.map((m) => m.toLowerCase()));
  const tauxDiversite = motsUniques.size / mots.length;
  if (tauxDiversite > 0.7) score += 2;
  else if (tauxDiversite > 0.5) score += 1;

  // Ponctuation (0-1 point)
  if (/[.!?,;:]/.test(texte)) score += 1;

  // Majuscules appropriées (0-1 point)
  if (/^[A-Z]/.test(texte) && !/^[A-Z\s]+$/.test(texte)) score += 1;

  // Pas de CAPS LOCK excessif (0-1 point)
  const majuscules = (texte.match(/[A-Z]/g) || []).length;
  const tauxMajuscules = majuscules / texte.length;
  if (tauxMajuscules < 0.3) score += 1;

  return Math.min(score, 10);
}

module.exports = {
  detecterSpam,
  validerContenuCommentaire,
  calculerScoreQualite,
  PATTERNS_SPAM, // Export pour tests
};
