const axios = require("axios");

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_URL || "http://localhost:11434";
    this.model = process.env.OLLAMA_MODEL || "llama3.2:3b";
  }

  /**
   * Génère une réponse depuis Ollama
   * @param {string} prompt - Le prompt à envoyer
   * @param {object} options - Options supplémentaires
   * @returns {Promise<string>} - La réponse de l'IA
   */
  async generate(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.baseURL}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
        },
      });

      return response.data.response;
    } catch (error) {
      console.error("Erreur API Ollama:", error.message);
      throw new Error("Échec de la génération de la réponse IA");
    }
  }

  /**
   * Parse une réponse JSON de l'IA (gère les erreurs de parsing)
   * @param {string} response - La réponse brute
   * @returns {object} - L'objet JSON parsé
   */
  parseJSON(response) {
    try {
      // Nettoie la réponse (enlève les backticks markdown si présents)
      const cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      // Protection contre les réponses trop grandes (max 10KB)
      if (cleaned.length > 10000) {
        console.error("Réponse trop volumineuse:", cleaned.length, "octets");
        throw new Error("Réponse IA trop volumineuse pour être traitée");
      }

      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Erreur parsing JSON:", error.message);
      console.error("Réponse brute:", response.substring(0, 200) + "...");
      throw new Error("Échec du parsing de la réponse IA en JSON");
    }
  }

  /**
   * Vérifie que Ollama est accessible
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      await axios.get(this.baseURL);
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new OllamaService();
