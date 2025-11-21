import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { getUserReputation } from "../services/api";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reputation, setReputation] = useState(null);

  useEffect(() => {
    if (user) {
      loadReputation();
    }
  }, [user]);

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
