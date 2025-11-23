/**
 * Utilitaire centralisé pour la gestion des erreurs dans les controllers
 * Module partagé pour éviter la duplication de code try/catch identiques
 */

/**
 * Gère les erreurs des controllers de manière uniforme
 * Détermine automatiquement le code HTTP approprié selon le message d'erreur
 *
 * @param {Error} erreur - L'erreur capturée
 * @param {Response} res - Objet Response Express
 * @param {string} contexte - Nom de l'action pour les logs (ex: "inscription", "connexion")
 * @returns {Response} - Réponse HTTP avec le code d'erreur approprié
 */
function gererErreurController(erreur, res, contexte = "action") {
  console.error(`Erreur ${contexte}:`, erreur);

  const message = erreur.message || "Erreur interne du serveur";

  // Liste des mots-clés indiquant une erreur métier (400 Bad Request)
  const erreursMetier = [
    "already in use",
    "required",
    "invalid",
    "not found",
    "expired",
    "too weak",
    "limite",
    "interdit",
    "refusé",
    "incorrecte",
    "manquant",
  ];

  // Vérifier si c'est une erreur métier
  const estErreurMetier = erreursMetier.some((motCle) =>
    message.toLowerCase().includes(motCle.toLowerCase())
  );

  if (estErreurMetier) {
    return res.status(400).json({ error: message });
  }

  // Erreur serveur (500) par défaut
  return res.status(500).json({ error: "Erreur interne du serveur" });
}

/**
 * Wrapper pour exécuter une fonction async avec gestion d'erreur automatique
 * Simplifie encore plus le code des controllers
 *
 * @param {Function} fonctionAsync - Fonction async à exécuter
 * @param {string} contexte - Contexte pour les logs
 * @returns {Function} - Middleware Express
 *
 * @example
 * router.post('/register', avecGestionErreur(async (req, res) => {
 *   const result = await authService.register(req.body);
 *   return res.status(201).json(result);
 * }, 'inscription'));
 */
function avecGestionErreur(fonctionAsync, contexte = "action") {
  return async (req, res, next) => {
    try {
      await fonctionAsync(req, res, next);
    } catch (erreur) {
      gererErreurController(erreur, res, contexte);
    }
  };
}

module.exports = {
  gererErreurController,
  avecGestionErreur,
};
