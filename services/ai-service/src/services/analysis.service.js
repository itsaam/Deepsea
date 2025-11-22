const ollamaService = require("./ollama.service");

class AnalysisService {
  /**
   * Analyse la qualité et validité d'une observation
   * @param {string} description - Description de l'observation
   * @param {string} speciesName - Nom de l'espèce
   * @returns {Promise<object>} - Analyse complète
   */
  async analyzeObservation(description, speciesName = "") {
    // 🛡️ DÉTECTION SPAM AVANT ANALYSE BIOLOGIQUE
    const cleanDesc = description.trim().toLowerCase();

    // Patterns de spam évidents
    const spamPatterns = [
      /^(.)\1{5,}$/, // aaaaaa, zzzzzz
      /^[a-z]{20,}$/, // azeazeazeazeaze (lettres sans sens)
      /^(test|lol|mdr|xd)+$/i, // test, lol, mdr
      /^[0-9]+$/, // que des chiffres
      /^[^a-z0-9]{10,}$/i, // que des symboles
      /^(.{2,5})\1{3,}$/, // motifs répétés (azeazeaze)
    ];

    const isSpamDetected = spamPatterns.some((pattern) =>
      pattern.test(cleanDesc)
    );

    if (isSpamDetected || cleanDesc.length < 10) {
      return {
        isValid: false,
        confidence: 95,
        reason: "Contenu invalide : spam, test ou description trop courte",
        isSpam: true,
        qualityScore: 0,
        recommendation: "REJECT",
        detectedIssues: ["spam ou contenu non pertinent"],
      };
    }

    // 🧬 ANALYSE BIOLOGIQUE si pas spam
    const prompt = `Tu es un biologiste marin expert qui évalue des observations avec bon sens et bienveillance.
Analyse cette observation et détermine si elle est crédible pour l'espèce mentionnée.

Espèce : ${speciesName || "Non spécifiée"}
Description : "${description}"

Réponds UNIQUEMENT avec ce format JSON (sans texte avant ou après) :
{
  "isValid": true ou false,
  "confidence": nombre entre 0 et 100,
  "reason": "explication en 1-2 phrases",
  "isSpam": false,
  "qualityScore": nombre entre 0 et 10,
  "recommendation": "VALIDATE" ou "REJECT" ou "REVIEW",
  "detectedIssues": ["liste des problèmes détectés, vide si aucun"]
}

RÈGLES D'ÉVALUATION (applique ton bon sens de biologiste) :

✅ ACCEPTE (VALIDATE) si :
- Description plausible avec des détails observables réalistes (couleur normale, taille cohérente, comportement typique)
- Observation courte mais crédible (ex: "Tortue avec carapace abîmée noire")
- Mention d'une anomalie possible mais biologiquement réaliste (albinisme, mélanisme, blessure, etc.)
- Localisation + comportement observé de façon sincère
- Question légitime sur une variante de l'espèce

⚠️ REVIEW (pour validation humaine) si :
- Description BIZARRE mais pas impossible (ex: couleur inhabituelle, taille limite haute/basse, comportement étrange)
- Manque de détails importants mais observation potentiellement vraie
- Doute raisonnable qui nécessite l'avis d'un expert humain
- Caractéristiques à la limite du plausible

❌ REJETTE (REJECT) si :
- **Incohérence biologique FLAGRANTE** (ex: requin de 20m, couleurs impossibles comme "rose bleu rouge", créature de science-fiction)
- Dimensions TOTALEMENT irréalistes pour l'espèce (queue de 20m pour un requin-marteau = MAX 6m dans la réalité)
- Mélange de caractéristiques INCOMPATIBLES (ex: poisson avec des plumes, mammifère avec des écailles)

EXEMPLES DE JUGEMENT :
- "Tortue carapace abîmée noire" → VALIDATE (plausible, mélanisme possible)
- "Requin rose bleu avec queue de 20m" → REJECT (couleurs impossibles + taille irréaliste)
- "Méduse bioluminescente très grande" → REVIEW (à vérifier, taille non précisée)
- "Poisson clown albinos" → VALIDATE (mutation connue)
- "Baleine volante avec ailes" → REJECT (impossible biologiquement)

Utilise tes connaissances en biologie marine pour juger avec intelligence.`;

    const response = await ollamaService.generate(prompt, { temperature: 0.3 });
    return ollamaService.parseJSON(response);
  }

  /**
   * Détecte si une observation est du spam
   * @param {string} description - Description à analyser
   * @returns {Promise<object>}
   */
  async detectSpam(description) {
    const prompt = `Détermine si ce texte est du spam, une blague, ou une vraie contribution scientifique.

Texte : "${description}"

Réponds UNIQUEMENT avec ce format JSON :
{
  "isSpam": true ou false,
  "confidence": nombre entre 0 et 100,
  "spamType": "none" ou "joke" ou "nonsense" ou "advertising" ou "low_effort",
  "reason": "explication courte"
}`;

    const response = await ollamaService.generate(prompt, { temperature: 0.2 });
    return ollamaService.parseJSON(response);
  }

  /**
   * Extrait les caractéristiques d'une créature depuis sa description
   * @param {string} description - Description de la créature
   * @returns {Promise<object>}
   */
  async extractFeatures(description) {
    const prompt = `Extrait les caractéristiques biologiques de cette créature abyssale.

Description : "${description}"

Réponds UNIQUEMENT avec ce format JSON :
{
  "size": "tiny" ou "small" ou "medium" ou "large" ou "giant" ou "unknown",
  "bioluminescence": true ou false ou null,
  "dangerLevel": nombre entre 1 et 5 ou null,
  "estimatedDepth": "shallow" ou "medium" ou "deep" ou "abyssal" ou "unknown",
  "physicalTraits": ["liste des caractéristiques physiques"],
  "behavioralTraits": ["liste des comportements observés"],
  "suggestedFamily": "nom de la famille taxonomique probable ou unknown"
}`;

    const response = await ollamaService.generate(prompt, { temperature: 0.4 });
    return ollamaService.parseJSON(response);
  }

  /**
   * Suggère une classification taxonomique
   * @param {string} description - Description de la créature
   * @param {string} speciesName - Nom de l'espèce
   * @returns {Promise<object>}
   */
  async suggestTaxonomy(description, speciesName) {
    const prompt = `En tant que taxonomiste marin, propose une classification pour cette créature.

Nom : ${speciesName}
Description : "${description}"

Réponds UNIQUEMENT avec ce format JSON :
{
  "family": "nom de la famille proposée",
  "order": "nom de l'ordre proposé",
  "confidence": nombre entre 0 et 100,
  "reasoning": "explication de la classification",
  "similarSpecies": ["liste de 2-3 espèces similaires connues"]
}`;

    const response = await ollamaService.generate(prompt, { temperature: 0.5 });
    return ollamaService.parseJSON(response);
  }

  /**
   * Compare deux observations pour détecter les duplicatas
   * @param {string} description1 - Première description
   * @param {string} description2 - Deuxième description
   * @returns {Promise<object>}
   */
  async compareSimilarity(description1, description2) {
    const prompt = `Compare ces deux observations et détermine si elles décrivent la même créature.

Observation 1 : "${description1}"
Observation 2 : "${description2}"

Réponds UNIQUEMENT avec ce format JSON :
{
  "areSimilar": true ou false,
  "similarityScore": nombre entre 0 et 100,
  "reasoning": "explication de la comparaison",
  "commonFeatures": ["caractéristiques communes"],
  "differences": ["différences notables"]
}`;

    const response = await ollamaService.generate(prompt, { temperature: 0.3 });
    return ollamaService.parseJSON(response);
  }

  /**
   * Génère un résumé d'une observation longue
   * @param {string} description - Description longue
   * @returns {Promise<string>}
   */
  async summarize(description) {
    const prompt = `Résume cette observation en 2-3 phrases courtes, en gardant les informations scientifiques essentielles.

Description : "${description}"

Réponds UNIQUEMENT avec le résumé en texte brut (pas de JSON).`;

    return await ollamaService.generate(prompt, { temperature: 0.5 });
  }
}

module.exports = new AnalysisService();
