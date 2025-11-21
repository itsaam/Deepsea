import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSpecies } from "../services/api";
import Navbar from "../components/Navbar";

export default function CreateSpecies() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [asciiArt, setAsciiArt] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await createSpecies({ name });

      // Afficher l'ASCII art et le message de succès
      setAsciiArt(data);
      setShowSuccess(true);

      // Rediriger après 5 secondes
      setTimeout(() => {
        navigate("/species");
      }, 5000);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
      setLoading(false);
    }
  };

  if (showSuccess && asciiArt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center text-white">
        <div className="text-center max-w-4xl mx-auto p-8">
          <div className="mb-8 animate-bounce">
            <h1 className="text-5xl font-bold mb-4">
              🎉 Nouvelle espèce créée ! 🎉
            </h1>
            <p className="text-2xl text-blue-300">
              Bienvenue à{" "}
              <span className="text-yellow-400">{asciiArt.name}</span>
            </p>
          </div>

          <div className="bg-black/50 backdrop-blur-md p-8 rounded-2xl border-4 border-blue-400 shadow-2xl mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-300">
              {asciiArt.asciiName || "Créature Marine"}
            </h2>
            <pre className="text-left text-lg font-mono leading-tight whitespace-pre text-blue-200">
              {asciiArt.asciiArt}
            </pre>
          </div>

          <div className="space-y-3 text-lg">
            <p className="text-green-400 font-semibold">
              ✨ Une nouvelle horreur des profondeurs voit le jour !
            </p>
            <p className="text-gray-300">
              Redirection vers la liste des espèces dans quelques secondes...
            </p>
          </div>

          <button
            onClick={() => navigate("/species")}
            className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
          >
            Voir toutes les espèces →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">
            🐠 Créer une nouvelle espèce marine
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Astuce:</strong> Seules les espèces aquatiques sont
              acceptées ! Les animaux terrestres et aériens sont automatiquement
              rejetés.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-bold text-gray-700">
                Nom de l'espèce
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Ex: Calamar Géant Lumineux"
                required
              />
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-lg">
                <p className="text-red-600">❌ {error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 font-semibold shadow-lg transition-all"
              >
                {loading ? "Création..." : "🌊 Créer l'espèce"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/species")}
                className="bg-gray-300 px-6 py-3 rounded-lg hover:bg-gray-400 font-semibold transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
