import axios from "axios";

// ✅ TOUT passe par l'API Gateway maintenant
const API = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Intercepteur pour ajouter le token automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
export const rejectObservation = (id) => API.post(`/observations/${id}/reject`);
export const softDeleteObservation = (id) =>
  API.patch(`/observations/${id}/soft-delete`);
export const restoreObservation = (id) =>
  API.patch(`/observations/${id}/restore`);
export const getObservationAiSuggestion = (id) =>
  API.get(`/observations/${id}/ai-suggestion`);

// ✅ REPUTATION (via API Gateway)
export const getUserReputation = (userId) => API.get(`/reputation/${userId}`);

// ✅ TAXONOMY (via API Gateway)
export const getTaxonomyStats = () => API.get("/taxonomy/stats");

// ✅ ADMIN (via API Gateway)
export const getAllUsers = () => API.get("/admin/users");
export const updateUserRole = (userId, role) =>
  API.patch(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => API.delete(`/admin/users/${userId}`);
