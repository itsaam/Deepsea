const axios = require("axios");

/**
 * Fonction utilitaire pour faire un proxy vers un microservice
 * @param {string} serviceUrl - URL du service destination
 * @param {object} req - Request object Express
 * @param {object} res - Response object Express
 */
const proxyRequest = async (serviceUrl, req, res) => {
  try {
    // Construire l'URL complète
    // /api/auth/login → /auth/login
    // /api/observations/123 → /observations/123
    const path = req.originalUrl.replace(/^\/api/, "");
    const targetUrl = `${serviceUrl}${path}`;

    // Préparer les headers (enlever le host pour éviter les conflits)
    const headers = { ...req.headers };
    delete headers.host;
    delete headers["content-length"];

    const config = {
      method: req.method,
      url: targetUrl,
      headers,
      params: req.query,
      timeout: 30000, // 30 secondes de timeout
    };

    // Ajouter le body pour POST, PUT, PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method.toUpperCase())) {
      config.data = req.body;
    }

    // Envoyer la requête au microservice
    const response = await axios(config);

    // Retourner la réponse
    res.status(response.status).json(response.data);
  } catch (error) {
    // Log l'erreur pour le debug
    console.error(
      `[Gateway Error] ${req.method} ${req.originalUrl}:`,
      error.message
    );

    // Gérer les erreurs de réponse du service
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    // Gérer les timeouts
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        error: "Timeout",
        message: "Le service a mis trop de temps à répondre",
      });
    }

    // Gérer les erreurs de connexion
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({
        error: "Service indisponible",
        message: "Le service demandé est temporairement indisponible",
      });
    }

    // Erreur générique
    return res.status(500).json({
      error: "Erreur interne",
      message: "Une erreur est survenue lors du traitement de votre requête",
    });
  }
};

module.exports = { proxyRequest };
