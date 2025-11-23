import nacl from "tweetnacl";
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from "tweetnacl-util";

/**
 * Générer une paire de clés pour un utilisateur
 */
export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();

  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

/**
 * Chiffrer un message avec la clé publique du destinataire
 */
export function encryptMessage(message, recipientPublicKey, senderSecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Use TextEncoder for proper Uint8Array conversion
  const encoder = new TextEncoder();
  const messageUint8 = encoder.encode(message);
  const recipientPublicKeyUint8 = decodeBase64(recipientPublicKey);
  const senderSecretKeyUint8 = decodeBase64(senderSecretKey);

  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKeyUint8,
    senderSecretKeyUint8
  );

  // Combiner nonce + message chiffré
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return encodeBase64(fullMessage);
}

/**
 * Déchiffrer un message reçu
 */
export function decryptMessage(
  encryptedMessage,
  senderPublicKey,
  recipientSecretKey
) {
  try {
    const fullMessageUint8 = decodeBase64(encryptedMessage);
    const senderPublicKeyUint8 = decodeBase64(senderPublicKey);
    const recipientSecretKeyUint8 = decodeBase64(recipientSecretKey);

    // Extraire nonce et message
    const nonce = fullMessageUint8.slice(0, nacl.box.nonceLength);
    const message = fullMessageUint8.slice(nacl.box.nonceLength);

    const decrypted = nacl.box.open(
      message,
      nonce,
      senderPublicKeyUint8,
      recipientSecretKeyUint8
    );

    if (!decrypted) {
      throw new Error("Échec du déchiffrement");
    }

    // Use TextDecoder for proper Uint8Array to string conversion
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Message chiffré - Impossible de déchiffrer]";
  }
}

/**
 * Chiffrer la clé privée avec le mot de passe de l'utilisateur
 */
export function encryptPrivateKey(secretKey, password) {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

  // Use TextEncoder to properly convert password to Uint8Array
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const passwordKey = nacl
    .hash(passwordBytes)
    .slice(0, nacl.secretbox.keyLength);

  const secretKeyUint8 = decodeBase64(secretKey);
  const encrypted = nacl.secretbox(secretKeyUint8, nonce, passwordKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return encodeBase64(fullMessage);
}

/**
 * Déchiffrer la clé privée avec le mot de passe
 */
export function decryptPrivateKey(encryptedSecretKey, password) {
  try {
    const fullMessageUint8 = decodeBase64(encryptedSecretKey);

    // Use TextEncoder to properly convert password to Uint8Array
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    const passwordKey = nacl
      .hash(passwordBytes)
      .slice(0, nacl.secretbox.keyLength);

    const nonce = fullMessageUint8.slice(0, nacl.secretbox.nonceLength);
    const encrypted = fullMessageUint8.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(encrypted, nonce, passwordKey);

    if (!decrypted) {
      throw new Error("Mot de passe incorrect");
    }

    return encodeBase64(decrypted);
  } catch (error) {
    console.error("Failed to decrypt private key:", error);
    throw new Error("Impossible de déchiffrer la clé privée");
  }
}
