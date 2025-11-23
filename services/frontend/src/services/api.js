import axios from "axios";

// ✅ TOUT passe par l'API Gateway maintenant
const API = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Intercepteur pour ajouter le token automatiquement
API.interceptors.request.use((config) => {
  // Vérifier sessionStorage en premier, puis localStorage
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les sanctions
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const data = error.response.data;

      // Vérifier si c'est une sanction (ban ou suspension)
      if (
        data.error === "ACCOUNT_BANNED" ||
        data.error === "ACCOUNT_SUSPENDED"
      ) {
        // Sauvegarder les infos de la sanction
        localStorage.setItem("sanctionInfo", JSON.stringify(data));

        // Déconnecter l'utilisateur
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Rediriger vers la page de sanction
        window.location.href = "/sanction";
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Export de l'instance API pour le NotificationContext
export const api = API;

// ✅ AUTH SERVICE (via API Gateway)
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);
export const verify2FA = (userId, code) =>
  API.post("/auth/verify-2fa", { userId, code });
export const forgotPassword = (email) =>
  API.post("/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) =>
  API.post("/auth/reset-password", { token, newPassword });
export const getMe = () => API.get("/auth/me");

// ✅ SPECIES (via API Gateway)
export const getAllSpecies = (sortBy) =>
  API.get("/species", { params: { sortBy } });
export const getSpeciesById = (id) => API.get(`/species/${id}`);
export const createSpecies = (data) => API.post("/species", data);
export const softDeleteSpecies = (id) =>
  API.patch(`/species/${id}/soft-delete`);
export const restoreSpecies = (id) => API.patch(`/species/${id}/restore`);

// ✅ OBSERVATIONS (via API Gateway)
export const getAllObservations = () => API.get("/observations");
export const getObservationsBySpecies = (speciesId) =>
  API.get(`/observations/species/${speciesId}/observations`);
export const createObservation = (data) => API.post("/observations", data);
export const validateObservation = (id) =>
  API.post(`/observations/${id}/validate`);
export const rejectObservation = (id, reason = null) =>
  API.post(`/observations/${id}/reject`, { reason });
export const softDeleteObservation = (id) =>
  API.patch(`/observations/${id}/soft-delete`);
export const restoreObservation = (id) =>
  API.patch(`/observations/${id}/restore`);
export const getObservationAiSuggestion = (id) =>
  API.get(`/observations/${id}/ai-suggestion`);

// ✅ REPLIES (via API Gateway)
export const getRepliesByObservation = (observationId, page = 1, limit = 20) =>
  API.get(`/observations/${observationId}/replies`, {
    params: { page, limit },
  });
export const createReply = (observationId, content) =>
  API.post(`/observations/${observationId}/replies`, { content });
export const updateReply = (replyId, content) =>
  API.put(`/replies/${replyId}`, { content });
export const deleteReply = (replyId) => API.delete(`/replies/${replyId}`);

// ✅ VOTES (via API Gateway)
export const voteObservation = (observationId, value) =>
  API.post(`/observations/${observationId}/vote`, { value });
export const removeVote = (observationId) =>
  API.delete(`/observations/${observationId}/vote`);
export const getVoteStats = (observationId) =>
  API.get(`/observations/${observationId}/vote/stats`);
export const getTopObservations = (page = 1, limit = 10) =>
  API.get(`/observations/top`, { params: { page, limit } });

// ✅ REPUTATION (via API Gateway)
export const getUserReputation = (userId) => API.get(`/reputation/${userId}`);

// ✅ TAXONOMY (via API Gateway)
export const getTaxonomyStats = () => API.get("/taxonomy/stats");

// ✅ ADMIN (via API Gateway)
export const getAllUsers = () => API.get("/admin/users");
export const updateUserRole = (userId, role) =>
  API.patch(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);

// ✅ MESSAGERIE CRYPTÉE E2E
export const getConversations = () => API.get("/messages/conversations");
export const getConversation = (otherUserId) =>
  API.get(`/messages/conversation/${otherUserId}`);
export const saveUserKeys = (publicKey, encryptedPrivateKey) =>
  API.post("/messages/keys", { publicKey, encryptedPrivateKey });
export const getUserKeys = () => API.get("/messages/keys");
export const getUserPublicKey = (userId) =>
  API.get(`/messages/public-key/${userId}`);
export const getMessagingUsers = () => API.get("/messages/users");
