import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSpecies } from "../services/api";
import Navbar from "../components/Navbar";

export default function CreateSpecies() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createSpecies({ name });
      navigate("/species");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Créer une nouvelle espèce</h1>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 font-bold">Nom de l'espèce</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? "Création..." : "Créer"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/species")}
                className="bg-gray-300 px-6 py-2 rounded hover:bg-gray-400"
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
