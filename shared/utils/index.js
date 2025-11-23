/**
 * Point d'entrée principal du module @deepsea/shared-utils
 * Exporte tous les utilitaires partagés entre microservices
 */

module.exports = {
  // Détection de spam et validation de contenu
  ...require("./detectionSpam"),

  // Hachage de mots de passe
  ...require("./hashUtils"),

  // Gestion des erreurs dans les controllers
  ...require("./gestionErreurs"),

  // Client pour communiquer avec auth-service
  ...require("./authServiceClient"),
};
