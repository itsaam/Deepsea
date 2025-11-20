import axios from "axios";

const authAPI = axios.create({
  baseURL: "http://localhost:3001",
});

const observationAPI = axios.create({
  baseURL: "http://localhost:3002",
});

// Intercepteur pour ajouter le token automatiquement
const addAuthInterceptor = (api) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

addAuthInterceptor(authAPI);
addAuthInterceptor(observationAPI);

// AUTH SERVICE
export const register = (data) => authAPI.post("/auth/register", data);
export const login = (data) => authAPI.post("/auth/login", data);
export const verify2FA = (userId, code) =>
  authAPI.post("/auth/verify-2fa", { userId, code });
export const forgotPassword = (email) =>
  authAPI.post("/auth/forgot-password", { email });
export const resetPassword = (token, newPassword) =>
  authAPI.post("/auth/reset-password", { token, newPassword });
export const getMe = () => authAPI.get("/auth/me");

// SPECIES
export const getAllSpecies = (sortBy) =>
  observationAPI.get("/species", { params: { sortBy } });
export const getSpeciesById = (id) => observationAPI.get(`/species/${id}`);
export const createSpecies = (data) => observationAPI.post("/species", data);

// OBSERVATIONS
export const getAllObservations = () => observationAPI.get("/observations");
export const getObservationsBySpecies = (speciesId) =>
  observationAPI.get(`/observations/species/${speciesId}/observations`);
export const createObservation = (data) =>
  observationAPI.post("/observations", data);
export const validateObservation = (id) =>
  observationAPI.post(`/observations/${id}/validate`);
export const rejectObservation = (id) =>
  observationAPI.post(`/observations/${id}/reject`);

// REPUTATION
export const getUserReputation = (userId) =>
  observationAPI.get(`/reputation/${userId}`);

// ADMIN
export const getAllUsers = () => authAPI.get("/admin/users");
export const updateUserRole = (userId, role) =>
  authAPI.patch(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => authAPI.delete(`/admin/users/${userId}`);
