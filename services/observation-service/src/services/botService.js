const axios = require("axios");

class BotService {
  /**
   * Générer une réponse du bot en utilisant l'AI service
   */
  async generateBotResponse(userMessage) {
    try {
      // Appeler l'AI service pour générer une réponse
      const response = await axios.post("http://localhost:3003/api/chat", {
        message: userMessage,
        systemPrompt: `Tu es DeepSea Bot, l'assistant virtuel de DeepSea Archives, une plateforme de classification d'espèces marines.
Tu es expert en biologie marine, océanographie et taxonomie.
Réponds de manière amicale, précise et éducative.
Tu peux aider les utilisateurs à identifier des espèces, donner des informations sur la vie marine, et expliquer comment utiliser la plateforme.
Réponds en français de manière naturelle et conversationnelle.
Si on te demande quelque chose hors de ton domaine, redirige gentiment vers les sujets marins.`,
      });

      console.log("🤖 Réponse de l'AI service:", response.data);
      return (
        response.data.data?.response ||
        response.data.response ||
        "Je n'ai pas pu générer de réponse pour le moment. Réessaie !"
      );
    } catch (error) {
      console.error(
        "❌ Erreur lors de la génération de la réponse du bot:",
        error.message
      );

      // Réponses de fallback si l'AI service ne répond pas
      const fallbackResponses = [
        "🌊 Bonjour ! Je suis le DeepSea Bot. Comment puis-je t'aider avec les espèces marines aujourd'hui ?",
        "🐠 Désolé, je rencontre un petit problème technique. Réessaie dans quelques instants !",
        "🦈 Je suis là pour t'aider avec tout ce qui concerne la biologie marine. Pose-moi une question !",
        "🐙 Hmm, je réfléchis... Reformule ta question pour que je puisse mieux t'aider !",
      ];

      return fallbackResponses[
        Math.floor(Math.random() * fallbackResponses.length)
      ];
    }
  }

  /**
   * Vérifier si un message devrait déclencher une réponse automatique
   */
  shouldAutoRespond(message) {
    // Le bot répond toujours
    return true;
  }

  /**
   * Obtenir l'ID du bot
   */
  getBotUserId() {
    return 12; // ID du DeepSeaBot créé plus tôt
  }
}

module.exports = new BotService();
