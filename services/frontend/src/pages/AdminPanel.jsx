import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

// Helper function for severity colors
const getSeverityColor = (severity) => {
  switch (severity) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800";
    case "HIGH":
      return "bg-orange-100 text-orange-800";
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);

  // User management
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Warnings & Sanctions
  const [warnings, setWarnings] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [warningForm, setWarningForm] = useState({
    userId: "",
    reason: "",
    severity: "LOW",
    expiresAt: "",
  });
  const [sanctionForm, setSanctionForm] = useState({
    userId: "",
    type: "TEMPORARY_SUSPENSION",
    reason: "",
    expiresAt: "",
  });

  // Comments moderation
  const [recentComments, setRecentComments] = useState([]);
  const [deleteReason, setDeleteReason] = useState("");
  const [commentToDelete, setCommentToDelete] = useState(null);

  // Axios instance with auth headers
  const api = axios.create({
    baseURL: "http://localhost:3000/api",
  });

  api.interceptors.request.use((config) => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      alert("Accès refusé. Admin requis.");
      navigate("/");
      return;
    }

    loadDashboard();
  }, [user]);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "warnings") {
      loadWarnings();
      loadUsers(); // Charger la liste des users pour le dropdown
    }
    if (activeTab === "sanctions") {
      loadSanctions();
      loadUsers(); // Charger la liste des users pour le dropdown
    }
    if (activeTab === "comments") loadRecentComments();
  }, [activeTab]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && selectedUser) {
        setSelectedUser(null);
        setUserStats(null);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [selectedUser]);

  // ==================== DASHBOARD ====================
  const loadDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setDashboardData(res.data);
    } catch (error) {
      console.error("Erreur dashboard:", error);
    }
  };

  // ==================== USERS ====================
  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Erreur users:", error);
    }
  };

  const loadUserStats = async (userId) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/statistics`);
      setUserStats(res.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error("Erreur stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const promoteUser = async (userId, newRole) => {
    if (!confirm(`Promouvoir cet utilisateur à ${newRole} ?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      alert("Rôle mis à jour!");
      loadUsers();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  const banUser = async (userId) => {
    const reason = prompt("Raison du bannissement:");
    if (!reason) return;
    try {
      await api.post("/admin/sanctions", {
        userId,
        type: "PERMANENT_BAN",
        reason,
      });
      alert("Utilisateur banni!");
      loadUsers();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  const suspendUser = async (userId) => {
    const days = prompt("Suspendre pour combien de jours?");
    if (!days) return;
    const reason = prompt("Raison de la suspension:");
    if (!reason) return;

    try {
      await api.post("/admin/sanctions", {
        userId,
        type: "TEMPORARY_SUSPENSION",
        reason,
        expiresInDays: parseInt(days),
      });
      alert(`Utilisateur suspendu pour ${days} jours!`);
      loadUsers();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  // ==================== WARNINGS ====================
  const loadWarnings = async () => {
    try {
      const res = await api.get("/admin/warnings");
      setWarnings(res.data.warnings || []);
    } catch (error) {
      console.error("Erreur warnings:", error);
    }
  };

  const createWarning = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/warnings", {
        userId: parseInt(warningForm.userId),
        reason: warningForm.reason,
        severity: warningForm.severity,
        expiresInDays: 30,
      });
      alert("Avertissement créé!");
      setWarningForm({
        userId: "",
        reason: "",
        severity: "LOW",
        expiresAt: "",
      });
      loadWarnings();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  const revokeWarning = async (warningId) => {
    if (!confirm("Révoquer cet avertissement ?")) return;
    try {
      await api.patch(`/admin/warnings/${warningId}/revoke`);
      alert("Avertissement révoqué!");
      loadWarnings();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  // ==================== SANCTIONS ====================
  const loadSanctions = async () => {
    try {
      const res = await api.get("/admin/sanctions");
      setSanctions(res.data.sanctions || []);
    } catch (error) {
      console.error("Erreur sanctions:", error);
    }
  };

  const createSanction = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/sanctions", {
        userId: parseInt(sanctionForm.userId),
        type: sanctionForm.type,
        reason: sanctionForm.reason,
        durationDays: 7,
      });
      alert("Sanction créée!");
      setSanctionForm({
        userId: "",
        type: "TEMPORARY_SUSPENSION",
        reason: "",
        expiresAt: "",
      });
      loadSanctions();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  const revokeSanction = async (sanctionId) => {
    if (!confirm("Révoquer cette sanction ?")) return;
    try {
      await api.patch(`/admin/sanctions/${sanctionId}/revoke`);
      alert("Sanction révoquée!");
      loadSanctions();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  // ==================== COMMENTS ====================
  const loadRecentComments = async () => {
    try {
      const res = await api.get("/admin/comments/recent?limit=50");
      setRecentComments(res.data.comments || []);
    } catch (error) {
      console.error("Erreur comments:", error);
    }
  };

  const deleteComment = async () => {
    if (!deleteReason.trim()) {
      alert("Veuillez entrer une raison");
      return;
    }
    try {
      await api.delete(`/admin/comments/${commentToDelete}`, {
        data: { reason: deleteReason },
      });
      alert("Commentaire supprimé!");
      setCommentToDelete(null);
      setDeleteReason("");
      loadRecentComments();
    } catch (error) {
      alert("Erreur: " + error.response?.data?.error);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getSanctionColor = (type) => {
    if (type === "PERMANENT_BAN") return "bg-red-100 text-red-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">⚙️ Panel Administrateur</h1>
          <p className="text-purple-100">
            Gestion complète de la plateforme DeepSea
          </p>
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { id: "dashboard", label: "📊 Dashboard" },
            { id: "users", label: "👥 Utilisateurs" },
            { id: "warnings", label: "⚠️ Avertissements" },
            { id: "sanctions", label: "🚫 Sanctions" },
            { id: "comments", label: "💬 Commentaires" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "dashboard" && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-purple-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Observations
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboardData.statistics.totalObservations}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {dashboardData.statistics.pendingObservations} en attente
                      de validation
                    </p>
                  </div>
                  <div className="text-4xl">🔬</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Commentaires
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboardData.statistics.totalReplies}
                    </p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-yellow-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Avertissements
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboardData.statistics.activeWarnings}
                    </p>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-red-500 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Sanctions
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {dashboardData.statistics.activeSanctions}
                    </p>
                  </div>
                  <div className="text-4xl">🚫</div>
                </div>
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Observations récentes */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h2 className="text-xl font-bold text-gray-800">
                    🐟 Observations Récentes
                  </h2>
                  <span className="text-sm text-gray-500">
                    {dashboardData.recentObservations?.length || 0} total
                  </span>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {dashboardData.recentObservations?.slice(0, 10).map((obs) => (
                    <div
                      key={obs.id}
                      onClick={() =>
                        window.open(`/observation/${obs.id}`, "_blank")
                      }
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {obs.species?.name || "Espèce inconnue"}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            par{" "}
                            <span className="font-medium text-purple-600">
                              {obs.author?.username || "Inconnu"}
                            </span>
                          </p>
                          {obs.location && (
                            <p className="text-xs text-gray-500 mt-1">
                              📍 {obs.location}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            obs.status === "VALIDATED"
                              ? "bg-green-100 text-green-700 border border-green-300"
                              : obs.status === "REJECTED"
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                          }`}
                        >
                          {obs.status === "VALIDATED"
                            ? "✓ Validé"
                            : obs.status === "REJECTED"
                            ? "✗ Rejeté"
                            : "⏳ En attente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activité récente */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <h2 className="text-xl font-bold text-gray-800">
                    📝 Activité Récente
                  </h2>
                  <span className="text-sm text-gray-500">
                    {dashboardData.recentActivity?.length || 0} actions
                  </span>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {dashboardData.recentActivity?.length > 0 ? (
                    dashboardData.recentActivity.slice(0, 15).map((log) => (
                      <div
                        key={log.id}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {log.action.replace(/_/g, " ")}
                            </p>
                            {log.targetType && (
                              <p className="text-sm text-gray-600 mt-1">
                                {log.targetType} #{log.targetId}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 text-right ml-4">
                            {new Date(log.createdAt).toLocaleDateString(
                              "fr-FR"
                            )}
                            <br />
                            {new Date(log.createdAt).toLocaleTimeString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📭</div>
                      <p className="text-gray-400 font-medium">
                        Aucune activité récente
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <input
                type="text"
                placeholder="🔍 Rechercher un utilisateur par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6 pb-3 border-b">
                <h2 className="text-2xl font-bold text-gray-800">
                  👥 Utilisateurs
                </h2>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {filteredUsers.length} utilisateurs
                </span>
              </div>
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-black font-bold text-xl shadow-lg border-2 border-gray-300">
                          {user.username?.[0]?.toUpperCase() || "?"}
                        </div>

                        {/* User Info */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-gray-900">
                              {user.username}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                user.role === "ADMIN"
                                  ? "bg-red-100 text-red-700 border border-red-300"
                                  : user.role === "EXPERT"
                                  ? "bg-purple-100 text-purple-700 border border-purple-300"
                                  : "bg-blue-100 text-blue-700 border border-blue-300"
                              }`}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              ⭐{" "}
                              <span className="font-semibold">
                                {user.reputation || 0}
                              </span>{" "}
                              réputation
                            </span>
                            <span className="text-gray-400">•</span>
                            <span>ID: {user.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadUserStats(user.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-lg"
                        >
                          📊 Stats
                        </button>

                        {user.role === "USER" && (
                          <button
                            onClick={() => promoteUser(user.id, "EXPERT")}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-lg"
                          >
                            ⬆️ Expert
                          </button>
                        )}

                        <button
                          onClick={() => suspendUser(user.id)}
                          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-semibold shadow-md hover:shadow-lg"
                        >
                          ⏸️ Suspendre
                        </button>

                        <button
                          onClick={() => banUser(user.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg"
                        >
                          🚫 Ban
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedUser && userStats && (
              <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-black font-bold text-2xl shadow-lg border-2 border-gray-300">
                        {userStats.user.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                          {userStats.user.username}
                        </h2>
                        <p className="text-gray-600">Statistiques détaillées</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setUserStats(null);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition text-3xl font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                      <div className="text-3xl font-bold text-blue-700">
                        {userStats.statistics?.observations?.created || 0}
                      </div>
                      <div className="text-sm font-medium text-blue-600 mt-1">
                        🔬 Observations créées
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200 shadow-sm">
                      <div className="text-3xl font-bold text-green-700">
                        {userStats.statistics?.observations?.validated || 0}
                      </div>
                      <div className="text-sm font-medium text-green-600 mt-1">
                        ✓ Validées
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border-2 border-red-200 shadow-sm">
                      <div className="text-3xl font-bold text-red-700">
                        {userStats.statistics?.observations?.rejected || 0}
                      </div>
                      <div className="text-sm font-medium text-red-600 mt-1">
                        ✗ Rejetées
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                      <div className="text-3xl font-bold text-purple-700">
                        {userStats.statistics?.replies || 0}
                      </div>
                      <div className="text-sm font-medium text-purple-600 mt-1">
                        💬 Commentaires
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-xl border-2 border-yellow-200 shadow-sm">
                      <div className="text-3xl font-bold text-yellow-700">
                        {userStats.statistics?.species || 0}
                      </div>
                      <div className="text-sm font-medium text-yellow-600 mt-1">
                        🐟 Espèces créées
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-xl border-2 border-indigo-200 shadow-sm">
                      <div className="text-3xl font-bold text-indigo-700">
                        {userStats.statistics?.votes || 0}
                      </div>
                      <div className="text-sm font-medium text-indigo-600 mt-1">
                        👍 Votes donnés
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border-2 border-orange-200 shadow-sm">
                      <div className="text-3xl font-bold text-orange-700">
                        {userStats.moderation?.warnings?.length || 0}
                      </div>
                      <div className="text-sm font-medium text-orange-600 mt-1">
                        ⚠️ Avertissements
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl border-2 border-red-200 shadow-sm">
                      <div className="text-3xl font-bold text-red-700">
                        {userStats.moderation?.sanctions?.length || 0}
                      </div>
                      <div className="text-sm font-medium text-red-600 mt-1">
                        🚫 Sanctions
                      </div>
                    </div>
                  </div>

                  {userStats.recentComments.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-4">
                        💬 Commentaires Récents
                      </h3>
                      <div className="space-y-3">
                        {userStats.recentComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500 shadow-sm"
                          >
                            <div className="text-sm font-medium text-gray-900 mb-2">
                              {comment.content}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-2">
                              <span className="font-semibold">
                                📍 Observation #{comment.observation?.id}
                              </span>
                              {comment.observation?.species?.name && (
                                <>
                                  <span>•</span>
                                  <span className="text-purple-600 font-medium">
                                    🐟 {comment.observation.species.name}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              🕒 {new Date(comment.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "warnings" && (
          <div className="space-y-6">
            {/* Escalation Rules Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Règles d'Escalation Automatique
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🔴</span>
                    <span className="font-bold text-red-700">CRITICAL</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>1+</strong> avertissement
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    → Ban permanent instantané
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🟠</span>
                    <span className="font-bold text-orange-700">HIGH</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>1+</strong> avertissement
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    → Suspension 3 jours
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🟡</span>
                    <span className="font-bold text-yellow-700">MEDIUM</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>2+</strong> avertissements
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    → Restriction contenu 14 jours
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🟢</span>
                    <span className="font-bold text-green-700">LOW</span>
                  </div>
                  <div className="text-sm text-gray-700">
                    <strong>3+</strong> avertissements
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    → Restriction commentaires 7 jours
                  </div>
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-800 bg-blue-100 rounded-lg p-3">
                <strong>ℹ️ Note :</strong> Les sanctions sont créées
                automatiquement lors de la prochaine action de l'utilisateur
                (création observation/espèce/commentaire). Les avertissements
                actifs sont cumulatifs.
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">
                ⚠️ Créer un Avertissement
              </h2>
              <form onSubmit={createWarning} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Utilisateur
                  </label>
                  <select
                    value={warningForm.userId}
                    onChange={(e) =>
                      setWarningForm({ ...warningForm, userId: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">-- Sélectionner un utilisateur --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        ID: {user.id} - {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Raison
                  </label>
                  <select
                    value={warningForm.reason}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "custom") {
                        setWarningForm({ ...warningForm, reason: "" });
                      } else {
                        setWarningForm({ ...warningForm, reason: value });
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg mb-2"
                  >
                    <option value="">-- Sélectionner une raison --</option>
                    <option value="Langage inapproprié">
                      Langage inapproprié
                    </option>
                    <option value="Spam ou contenu indésirable">
                      Spam ou contenu indésirable
                    </option>
                    <option value="Harcèlement ou comportement toxique">
                      Harcèlement ou comportement toxique
                    </option>
                    <option value="Informations incorrectes répétées">
                      Informations incorrectes répétées
                    </option>
                    <option value="custom">Autre (personnalisé)</option>
                  </select>
                  {(!warningForm.reason ||
                    ![
                      "Langage inapproprié",
                      "Spam ou contenu indésirable",
                      "Harcèlement ou comportement toxique",
                      "Informations incorrectes répétées",
                    ].includes(warningForm.reason)) && (
                    <textarea
                      placeholder="Raison personnalisée..."
                      value={warningForm.reason}
                      onChange={(e) =>
                        setWarningForm({
                          ...warningForm,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      rows="3"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Sévérité
                  </label>
                  <select
                    value={warningForm.severity}
                    onChange={(e) =>
                      setWarningForm({
                        ...warningForm,
                        severity: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="LOW">🟢 Faible</option>
                    <option value="MEDIUM">🟡 Moyen</option>
                    <option value="HIGH">🟠 Élevé</option>
                    <option value="CRITICAL">🔴 Critique</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700"
                >
                  Créer l'Avertissement
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">
                Liste des Avertissements ({warnings.length})
              </h2>
              <div className="space-y-3">
                {warnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                            warning.severity
                          )}`}
                        >
                          {warning.severity}
                        </span>
                        {warning.active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✓ Actif
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            ✗ Révoqué
                          </span>
                        )}
                      </div>
                      <div className="text-sm mb-1">
                        <strong>
                          {warning.user?.username || `User #${warning.userId}`}
                        </strong>{" "}
                        • par{" "}
                        <strong>
                          {warning.issuer?.username ||
                            `Admin #${warning.issuedBy}`}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-700">
                        {warning.reason}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(warning.createdAt).toLocaleString()}
                        {warning.expiresAt &&
                          ` • Expire: ${new Date(
                            warning.expiresAt
                          ).toLocaleString()}`}
                      </div>
                    </div>
                    {warning.active && (
                      <button
                        onClick={() => revokeWarning(warning.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Révoquer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "sanctions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">🚫 Créer une Sanction</h2>
              <form onSubmit={createSanction} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Utilisateur
                  </label>
                  <select
                    value={sanctionForm.userId}
                    onChange={(e) =>
                      setSanctionForm({
                        ...sanctionForm,
                        userId: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="">-- Sélectionner un utilisateur --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        ID: {user.id} - {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Type de sanction
                  </label>
                  <select
                    value={sanctionForm.type}
                    onChange={(e) =>
                      setSanctionForm({ ...sanctionForm, type: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="TEMPORARY_SUSPENSION">
                      ⏸️ Suspension Temporaire
                    </option>
                    <option value="PERMANENT_BAN">
                      🚫 Bannissement Permanent
                    </option>
                    <option value="CONTENT_RESTRICTION">
                      📝 Restriction Contenu
                    </option>
                    <option value="COMMENT_RESTRICTION">
                      💬 Restriction Commentaires
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Raison
                  </label>
                  <select
                    value={sanctionForm.reason}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "custom") {
                        setSanctionForm({ ...sanctionForm, reason: "" });
                      } else {
                        setSanctionForm({ ...sanctionForm, reason: value });
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg mb-2"
                  >
                    <option value="">-- Sélectionner une raison --</option>
                    <option value="Violations répétées des règles">
                      Violations répétées des règles
                    </option>
                    <option value="Harcèlement sévère">
                      Harcèlement sévère
                    </option>
                    <option value="Contenu illégal ou dangereux">
                      Contenu illégal ou dangereux
                    </option>
                    <option value="Fraude ou manipulation">
                      Fraude ou manipulation
                    </option>
                    <option value="custom">Autre (personnalisé)</option>
                  </select>
                  {(!sanctionForm.reason ||
                    ![
                      "Violations répétées des règles",
                      "Harcèlement sévère",
                      "Contenu illégal ou dangereux",
                      "Fraude ou manipulation",
                    ].includes(sanctionForm.reason)) && (
                    <textarea
                      placeholder="Raison personnalisée..."
                      value={sanctionForm.reason}
                      onChange={(e) =>
                        setSanctionForm({
                          ...sanctionForm,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                      rows="3"
                      required
                    />
                  )}
                </div>
                {sanctionForm.type !== "PERMANENT_BAN" && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Durée (jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Nombre de jours"
                      value={sanctionForm.expiresAt}
                      onChange={(e) =>
                        setSanctionForm({
                          ...sanctionForm,
                          expiresAt: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700"
                >
                  Créer la Sanction
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-4">
                Liste des Sanctions ({sanctions.length})
              </h2>
              <div className="space-y-3">
                {sanctions.map((sanction) => (
                  <div
                    key={sanction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getSanctionColor(
                            sanction.type
                          )}`}
                        >
                          {sanction.type.replace(/_/g, " ")}
                        </span>
                        {sanction.active ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            ✓ Actif
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                            ✗ Révoqué
                          </span>
                        )}
                      </div>
                      <div className="text-sm mb-1">
                        <strong>
                          {sanction.user?.username ||
                            `User #${sanction.userId}`}
                        </strong>{" "}
                        • par{" "}
                        <strong>
                          {sanction.issuer?.username ||
                            `Admin #${sanction.issuedBy}`}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-700">
                        {sanction.reason}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(sanction.createdAt).toLocaleString()}
                        {sanction.expiresAt &&
                          ` • Expire: ${new Date(
                            sanction.expiresAt
                          ).toLocaleString()}`}
                      </div>
                    </div>
                    {sanction.active && (
                      <button
                        onClick={() => revokeSanction(sanction.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        Révoquer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              💬 Modération Commentaires ({recentComments.length})
            </h2>
            <div className="space-y-3">
              {recentComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg ${
                    comment.deleted ? "bg-red-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm mb-2">
                        <strong>
                          {comment.user?.username ||
                            `User #${comment.authorId}`}
                        </strong>{" "}
                        sur{" "}
                        <span className="text-blue-600">
                          {comment.observation?.species?.name ||
                            "Espèce inconnue"}
                        </span>
                        {comment.observation?.description && (
                          <span className="text-gray-600 text-xs block mt-1">
                            "{comment.observation.description.substring(0, 50)}
                            {comment.observation.description.length > 50
                              ? "..."
                              : ""}
                            "
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-2">
                        {comment.content}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                      {comment.deleted && (
                        <div className="text-xs text-red-600 mt-2">
                          ❌ Supprimé: {comment.deletionReason}
                        </div>
                      )}
                    </div>
                    {!comment.deleted && (
                      <button
                        onClick={() => setCommentToDelete(comment.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        🗑️ Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {commentToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                  <h3 className="text-xl font-bold mb-4">
                    Supprimer le commentaire
                  </h3>
                  <textarea
                    placeholder="Raison de la suppression..."
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg mb-4"
                    rows="4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={deleteComment}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => {
                        setCommentToDelete(null);
                        setDeleteReason("");
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
