import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getSpeciesById, createObservation } from "../services/api";
import Navbar from "../components/Navbar";

export default function SpeciesDetail() {
  const { id } = useParams();
  const [species, setSpecies] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSpecies();
  }, [id]);

  const loadSpecies = async () => {
    try {
      const { data } = await getSpeciesById(id);
      setSpecies(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitObservation = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await createObservation({ speciesId: parseInt(id), description });
      setSuccess("Observation créée avec succès !");
      setDescription("");
      loadSpecies();
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = errorData?.error || "Erreur lors de la création";

      // Afficher les détails de l'IA si disponibles
      if (errorData?.details) {
        errorMessage += `\n\n${errorData.details}`;
      }
      if (errorData?.detectedIssues?.length > 0) {
        errorMessage += `\n\nProblèmes détectés:\n• ${errorData.detectedIssues.join(
          "\n• "
        )}`;
      }

      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!species) return <div>Espèce non trouvée</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <h1 className="text-3xl font-bold mb-4">{species.name}</h1>
          <p className="text-gray-600 mb-2">
            Rareté: {species.rarityScore.toFixed(2)}
          </p>
        </div>

        {/* Formulaire observation */}
        <div className="bg-white p-8 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">Créer une observation</h2>

          <form onSubmit={handleSubmitObservation}>
            <div className="mb-4">
              <label className="block mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded"
                rows="4"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded p-4 mb-4">
                <p className="text-red-700 font-bold mb-2">❌ Erreur</p>
                <p className="text-red-600 whitespace-pre-line">{error}</p>
              </div>
            )}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {submitting ? "Envoi..." : "Soumettre"}
            </button>
          </form>
        </div>

        {/* Liste des observations */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">
            Observations ({species.observations?.length || 0})
          </h2>

          <div className="space-y-4">
            {species.observations?.map((obs) => (
              <div key={obs.id} className="border p-4 rounded">
                <p className="mb-2">{obs.description}</p>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Statut: {obs.status}</span>
                  <span>{new Date(obs.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
