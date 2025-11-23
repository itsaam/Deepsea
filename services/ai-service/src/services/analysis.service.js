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

⚠️ ATTENTION PRIORITAIRE : Vérifie d'abord si la description correspond bien à l'espèce indiquée !

Espèce demandée : ${speciesName || "Non spécifiée"}
Description fournie : "${description}"

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

🚨 RÈGLE ABSOLUE #1 - VÉRIFICATION DE COHÉRENCE D'ESPÈCE :
- Lis attentivement l'ESPÈCE DEMANDÉE et la DESCRIPTION
- Si la description parle clairement d'une AUTRE ESPÈCE → REJETTE immédiatement
- Exemple FLAGRANT à rejeter : Espèce "Raie manta" + Description parlant de "tortue", "carapace", "écailles préfrontales"
- Ne te laisse PAS tromper par des descriptions détaillées : si c'est la mauvaise espèce, c'est REJECT !

RÈGLES D'ÉVALUATION (applique ton bon sens de biologiste) :

❌ REJETTE (REJECT) IMMÉDIATEMENT si :
1. **CONFUSION D'ESPÈCE** : la description décrit CLAIREMENT une autre espèce que celle demandée
   - Ex: Espèce "Raie manta" mais description mentionne "carapace", "tortue", "écailles" → REJECT
   - Ex: Espèce "Requin" mais description parle de "nageoires de baleine", "souffle" → REJECT
2. **Incohérence biologique FLAGRANTE** : dimensions impossibles, couleurs inexistantes, anatomie science-fiction
3. **Mélange de caractéristiques INCOMPATIBLES** : poisson avec plumes, mammifère avec écailles

✅ ACCEPTE (VALIDATE) si :
- Description correspond BIEN à l'espèce demandée
- Détails plausibles et cohérents (couleur normale, taille cohérente, comportement typique)
- Observation courte mais crédible
- Mention d'anomalie biologiquement réaliste (albinisme, mélanisme, blessure)

⚠️ REVIEW (pour validation humaine) si :
- Bonne espèce MAIS caractéristiques inhabituelles mais pas impossibles
- Manque de détails importants mais observation potentiellement vraie
- Doute raisonnable nécessitant l'avis d'un expert

EXEMPLES DE JUGEMENT :
- Espèce "Tortue verte" + "carapace ovale vert-olive, plastron jaunâtre" → VALIDATE ✅
- Espèce "Raie manta" + "carapace ovale, tortue, écailles préfrontales" → REJECT ❌ (c'est une tortue!)
- Espèce "Requin-marteau" + "requin avec queue de 20m" → REJECT ❌ (taille impossible)
- Espèce "Méduse" + "méduse bioluminescente géante" → REVIEW ⚠️ (vérifier taille)

Utilise tes connaissances en biologie marine pour juger avec intelligence ET vigilance.`;

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

  /**
   * Chat avec le bot DeepSea
   * @param {string} message - Message de l'utilisateur
   * @param {string} systemPrompt - Prompt système optionnel
   * @returns {Promise<string>}
   */
  async chat(message, systemPrompt = null) {
    // 🛡️ FILTRAGE PRÉ-IA : Détecter les questions hors-sujet AVANT de demander à l'IA
    const lowerMessage = message.toLowerCase().trim();

    const offTopicKeywords = [
      "recette",
      "pizza",
      "cuisine",
      "cuisinier",
      "plat",
      "restaurant",
      "manger",
      "nourriture",
      "politique",
      "président",
      "élection",
      "gouvernement",
      "ministre",
      "football",
      "match",
      "sport",
      "équipe",
      "joueur",
      "film",
      "série",
      "acteur",
      "célébrité",
      "musique",
      "chanson",
      "santé",
      "médicament",
      "maladie",
      "médecin",
      "hôpital",
      "argent",
      "crypto",
      "bitcoin",
      "bourse",
      "investir",
      "hack",
      "scam",
      "phishing",
      "mot de passe",
    ];

    const isOffTopic = offTopicKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );

    if (isOffTopic) {
      return "🌊 Je suis spécialisé en biologie marine ! Pose-moi une question sur les océans, les espèces marines ou la plateforme DeepSea.";
    }

    // ✅ Question acceptée, on demande à l'IA
    const defaultPrompt = `Tu es un bot expert en biologie marine. Réponds en MAXIMUM 2 phrases courtes. Commence par un emoji marin.`;

    const finalPrompt = systemPrompt || defaultPrompt;

    const fullPrompt = `${finalPrompt}

${message}

Réponse (2 phrases max) :`;

    return await ollamaService.generate(fullPrompt, {
      temperature: 0.4,
      max_tokens: 80,
    });
  }
}

module.exports = new AnalysisService();
