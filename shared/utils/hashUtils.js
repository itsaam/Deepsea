/**
 * Utilitaires pour le hachage de mots de passe avec bcrypt
 * Module partagé entre tous les services nécessitant de l'authentification
 */
const bcrypt = require("bcrypt");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10;

/**
 * Hash un mot de passe avec bcrypt
 * @param {string} password - Mot de passe en clair
 * @returns {Promise<string>} - Mot de passe haché
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare un mot de passe en clair avec un hash
 * @param {string} plain - Mot de passe en clair
 * @param {string} hash - Mot de passe haché
 * @returns {Promise<boolean>} - true si correspondance
 */
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
