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
      console.error("Erreur reputation:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/species" className="text-2xl font-bold">
          🌊 DeepSea Archives
        </Link>

        <div className="flex items-center gap-6">
          <Link to="/species" className="hover:underline">
            Espèces
          </Link>
          <Link to="/observations" className="hover:underline">
            Observations
          </Link>
          <Link to="/species/create" className="hover:underline">
            Créer
          </Link>
          <Link to="/statistics" className="hover:underline">
            Statistiques
          </Link>
          {user?.role === "ADMIN" && (
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>
          )}

          {reputation && (
            <div className="bg-blue-700 px-4 py-2 rounded">
              Score: {reputation.score} |
              {reputation.isExpert ? " 🏆 Expert" : " Utilisateur"}
            </div>
          )}

          <div className="text-sm">{user?.username}</div>

          <button
            onClick={handleLogout}
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}
