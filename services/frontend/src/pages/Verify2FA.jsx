import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verify2FA } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Verify2FA() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  // Récupérer le userId depuis localStorage
  const userId = localStorage.getItem("pending2FA");

  // Rediriger si pas de userId en attente de 2FA
  useEffect(() => {
    if (!userId) {
      navigate("/login");
    }
  }, [userId, navigate]);

  if (!userId) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await verify2FA(userId, code);

      // Stocker le token selon la préférence rememberMe
      const rememberMe = localStorage.getItem("rememberMe") === "true";
      if (rememberMe) {
        localStorage.setItem("token", data.token);
      } else {
        sessionStorage.setItem("token", data.token);
      }

      sessionStorage.setItem("sessionActive", "true");
      localStorage.removeItem("pending2FA");
      localStorage.removeItem("rememberMe");
      setUserData(data.user);

      // Attendre que React mette à jour le contexte avant de naviguer
      setTimeout(() => {
        navigate("/species");
      }, 100);
    } catch (err) {
      setError(err.response?.data?.error || "Code invalide");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            🌊 Vérification A2F
          </h1>
          <p className="text-gray-600 mt-2">
            Entrez le code à 6 chiffres envoyé à votre email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Code à 6 chiffres"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest"
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? "Vérification..." : "Vérifier"}
          </button>

          <p className="text-sm text-gray-600 text-center">
            Le code expire dans 10 minutes
          </p>
        </form>
      </div>
    </div>
  );
}
