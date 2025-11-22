import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useState, useEffect, useRef } from "react";
import { getUserReputation } from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [reputation, setReputation] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadReputation();
    }
  }, [user]);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadReputation = async () => {
    try {
      const { data } = await getUserReputation(user.id);
      setReputation(data);
    } catch (error) {
      // Route reputation pas encore implémentée - ignorer silencieusement
      setReputation(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markAsRead(notif.id);
    }
    setShowNotifications(false);

    // Rediriger vers l'observation si relatedId existe
    if (notif.relatedId) {
      navigate(`/observations`);
    }
  };

  return (
    <nav className="bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link
          to="/species"
          className="text-2xl font-bold bg-gradient-to-r from-[#f296d4] to-blue-500 bg-clip-text text-transparent hover:from-blue-500 hover:to-[#f296d4] transition-all"
        >
          🐠 DeepSea
        </Link>

        <div className="flex items-center gap-6">
          <Link
            to="/species"
            className="text-gray-700 hover:text-[#f296d4] font-semibold transition-colors"
          >
            🐟 Espèces
          </Link>
          <Link
            to="/observations"
            className="text-gray-700 hover:text-blue-500 font-semibold transition-colors"
          >
            👁️ Observations
          </Link>
          <Link
            to="/species/create"
            className="text-gray-700 hover:text-[#f296d4] font-semibold transition-colors"
          >
            ➕ Créer
          </Link>
          <Link
            to="/statistics"
            className="text-gray-700 hover:text-blue-500 font-semibold transition-colors"
          >
            📊 Statistiques
          </Link>
          <Link
            to="/taxonomy"
            className="text-gray-700 hover:text-[#f296d4] font-semibold transition-colors"
          >
            🔬 Taxonomie
          </Link>
          {user?.role === "ADMIN" && (
            <>
              <Link
                to="/admin"
                className="text-gray-700 hover:text-blue-500 font-semibold transition-colors"
              >
                ⚙️ Admin
              </Link>
              <Link
                to="/casino"
                className="text-gray-700 hover:text-red-500 font-semibold transition-colors"
              >
                🎰 Casino
              </Link>
            </>
          )}

          {/* 🔔 Badge Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-700 hover:text-blue-500 transition-colors"
            >
              <span className="text-2xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notifications */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-[500px] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-4 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-500 hover:text-blue-700 font-semibold"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-4xl mb-2">📭</p>
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notif.read ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleNotificationClick(notif)}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">
                                {notif.type === "OBSERVATION_VALIDATED" && "✅"}
                                {notif.type === "OBSERVATION_REJECTED" && "❌"}
                                {notif.type === "REPUTATION_UPDATE" && "💎"}
                                {notif.type === "PROMOTION_EXPERT" && "🏆"}
                              </span>
                              <p className="font-semibold text-gray-800 text-sm">
                                {notif.title}
                              </p>
                              {!notif.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {notif.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="text-gray-400 hover:text-red-500 text-lg"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {reputation && (
            <div className="bg-gradient-to-r from-[#f296d4] to-pink-400 px-4 py-2 rounded-xl text-white font-semibold shadow-md">
              💎 {reputation.score} pts
              {reputation.isExpert && " 🏆"}
            </div>
          )}

          <div className="text-sm font-semibold text-gray-700">
            👤 {user?.username}
          </div>

          <button
            onClick={handleLogout}
            className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
