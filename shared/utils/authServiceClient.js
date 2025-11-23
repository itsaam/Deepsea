/**
 * Client HTTP pour communiquer avec auth-service
 * Module partagé pour éviter la duplication de code entre services
 */
const axios = require("axios");

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:3001";

// Cache en mémoire pour éviter des appels répétés
const cacheUtilisateurs = new Map();
const DUREE_CACHE = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère les informations d'un utilisateur depuis auth-service
 * Utilise un cache en mémoire pour optimiser les performances
 * @param {number} userId - ID de l'utilisateur
 * @returns {Promise<object|null>} - Informations utilisateur ou null si erreur
 */
async function recupererInfosUtilisateur(userId) {
  try {
    // Vérifier le cache
    const cache = cacheUtilisateurs.get(userId);
    if (cache && Date.now() - cache.timestamp < DUREE_CACHE) {
      return cache.data;
    }

    // Appel à auth-service
    const response = await axios.get(
      `${AUTH_SERVICE_URL}/internal/user/${userId}`
    );

    // Mettre en cache
    cacheUtilisateurs.set(userId, {
      data: response.data,
      timestamp: Date.now(),
    });

    return response.data;
  } catch (error) {
    console.error(`Erreur récupération utilisateur ${userId}:`, error.message);
    return null;
  }
}

/**
 * Vide le cache utilisateur
 * Utile après une mise à jour de profil utilisateur
 * @param {number|null} userId - ID utilisateur spécifique ou null pour tout vider
 */
function viderCacheUtilisateur(userId = null) {
  if (userId) {
    cacheUtilisateurs.delete(userId);
  } else {
    cacheUtilisateurs.clear();
  }
}

/**
 * Récupère les informations de plusieurs utilisateurs en parallèle
 * @param {number[]} userIds - Tableau d'IDs utilisateurs
 * @returns {Promise<object[]>} - Tableau d'infos utilisateurs
 */
async function recupererPlusieursUtilisateurs(userIds) {
  const promises = userIds.map((id) => recupererInfosUtilisateur(id));
  const results = await Promise.all(promises);
  return results.filter((user) => user !== null);
}

module.exports = {
  recupererInfosUtilisateur,
  viderCacheUtilisateur,
  recupererPlusieursUtilisateurs,
};
