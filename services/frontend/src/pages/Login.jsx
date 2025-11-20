import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(identifier, password);

      // Si A2F est requis, rediriger vers la page de vérification
      if (result.requiresTwoFactor) {
        // Stocker temporairement le userId dans localStorage
        localStorage.setItem("pending2FA", result.userId);
        navigate("/verify-2fa");
      } else {
        // Connexion réussie sans A2F
        navigate("/species");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          DeepSea Archives
        </h1>
        <h2 className="text-xl mb-4">Connexion</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Email ou Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>

        <p className="mt-4 text-center">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-500 hover:underline">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
