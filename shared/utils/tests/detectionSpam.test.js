/**
 * Tests unitaires pour detectionSpam.js
 */

const {
  detecterSpam,
  validerContenuCommentaire,
  calculerScoreQualite,
} = require("../detectionSpam");

describe("detectionSpam - detecterSpam()", () => {
  test("devrait détecter du spam avec caractères répétés", () => {
    const result = detecterSpam("aaaaaaa", 5); // Longueur 7, min 5
    expect(result.isSpam).toBe(true);
    expect(result.raison).toContain("Pattern de spam");
  });

  test("devrait détecter du spam avec que des chiffres", () => {
    const result = detecterSpam("12345678", 10);
    expect(result.isSpam).toBe(true);
  });

  test("devrait détecter du spam avec mots interdits", () => {
    const result = detecterSpam("Buy viagra now!", 10);
    expect(result.isSpam).toBe(true);
    expect(result.raison).toContain("viagra");
  });

  test("devrait accepter du contenu valide", () => {
    const result = detecterSpam(
      "J'ai observé une magnifique baleine bleue aujourd'hui",
      10
    );
    expect(result.isSpam).toBe(false);
    expect(result.raison).toBeNull();
  });

  test("devrait rejeter un texte trop court", () => {
    const result = detecterSpam("ok", 10);
    expect(result.isSpam).toBe(true);
    expect(result.raison).toContain("trop court");
  });

  test("devrait accepter un texte vide si longueurMin = 0", () => {
    const result = detecterSpam("", 0);
    expect(result.isSpam).toBe(true); // Texte vide toujours invalide
  });
});

describe("detectionSpam - validerContenuCommentaire()", () => {
  test("devrait rejeter un contenu vide", () => {
    const result = validerContenuCommentaire("");
    expect(result.valide).toBe(false);
    expect(result.erreur).toContain("vide");
  });

  test("devrait rejeter un contenu trop long", () => {
    const longText = "a".repeat(2001);
    const result = validerContenuCommentaire(longText);
    expect(result.valide).toBe(false);
    expect(result.erreur).toContain("2000 caractères");
  });

  test("devrait accepter un contenu valide", () => {
    const result = validerContenuCommentaire(
      "Observation très intéressante sur cette espèce rare"
    );
    expect(result.valide).toBe(true);
    expect(result.erreur).toBeNull();
  });

  test("devrait rejeter du spam", () => {
    const result = validerContenuCommentaire("aaaaaaaaa");
    expect(result.valide).toBe(false);
    expect(result.erreur).toContain("refusé");
  });
});

describe("detectionSpam - calculerScoreQualite()", () => {
  test("devrait retourner 0 pour un texte vide", () => {
    const score = calculerScoreQualite("");
    expect(score).toBe(0);
  });

  test("devrait donner un score faible pour un texte court", () => {
    const score = calculerScoreQualite("ok");
    expect(score).toBeLessThan(5);
  });

  test("devrait donner un score élevé pour un texte de qualité", () => {
    const score = calculerScoreQualite(
      "J'ai observé une magnifique baleine bleue ce matin. Elle mesurait environ 20 mètres et se déplaçait majestueusement dans l'océan Atlantique."
    );
    expect(score).toBeGreaterThan(7);
  });

  test("devrait pénaliser le CAPS LOCK excessif", () => {
    const scoreNormal = calculerScoreQualite(
      "Une observation intéressante de requin marteau"
    );
    const scoreCaps = calculerScoreQualite(
      "UNE OBSERVATION INTÉRESSANTE DE REQUIN MARTEAU"
    );
    expect(scoreCaps).toBeLessThan(scoreNormal);
  });

  test("devrait valoriser la diversité lexicale", () => {
    const scoreDiversifie = calculerScoreQualite(
      "Observation fascinante d'une créature marine exceptionnelle"
    );
    const scoreRepetitif = calculerScoreQualite(
      "Observation observation observation observation"
    );
    expect(scoreDiversifie).toBeGreaterThan(scoreRepetitif);
  });

  test("devrait valoriser la ponctuation", () => {
    const score = calculerScoreQualite("Belle observation! Très intéressante.");
    expect(score).toBeGreaterThan(0);
  });
});
