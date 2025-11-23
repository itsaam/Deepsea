/**
 * Tests unitaires pour hashUtils.js
 */

const { hashPassword, comparePassword } = require("../hashUtils");

describe("hashUtils - hashPassword()", () => {
  test("devrait hasher un mot de passe", async () => {
    const password = "MonMotDePasse123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50); // Hash bcrypt fait ~60 caractères
  });

  test("devrait générer des hashs différents pour le même mot de passe", async () => {
    const password = "MonMotDePasse123!";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2); // Bcrypt utilise un salt aléatoire
  });

  test("devrait hasher des mots de passe vides", async () => {
    const hash = await hashPassword("");
    expect(hash).toBeDefined();
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("hashUtils - comparePassword()", () => {
  test("devrait valider un mot de passe correct", async () => {
    const password = "MonMotDePasse123!";
    const hash = await hashPassword(password);
    const isValid = await comparePassword(password, hash);

    expect(isValid).toBe(true);
  });

  test("devrait rejeter un mot de passe incorrect", async () => {
    const password = "MonMotDePasse123!";
    const hash = await hashPassword(password);
    const isValid = await comparePassword("MauvaisMotDePasse", hash);

    expect(isValid).toBe(false);
  });

  test("devrait être sensible à la casse", async () => {
    const password = "MonMotDePasse123!";
    const hash = await hashPassword(password);
    const isValid = await comparePassword("monmotdepasse123!", hash);

    expect(isValid).toBe(false);
  });

  test("devrait gérer les mots de passe vides", async () => {
    const hash = await hashPassword("");
    const isValid = await comparePassword("", hash);

    expect(isValid).toBe(true);
  });
});
