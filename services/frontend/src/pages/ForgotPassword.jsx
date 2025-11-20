import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const { data } = await forgotPassword(email);
      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          🌊 DeepSea Archives
        </h1>
        <h2 className="text-xl mb-4">Mot de passe oublié</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Entrez votre email et nous vous enverrons un lien pour réinitialiser
          votre mot de passe.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-blue-500 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
