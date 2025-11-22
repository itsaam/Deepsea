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
  const [rateLimitUntil, setRateLimitUntil] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canForceReview, setCanForceReview] = useState(false);
  const [forceReviewMessage, setForceReviewMessage] = useState("");
  const [rejectedData, setRejectedData] = useState(null);

  // 🔄 Charger le rate limit depuis localStorage au montage
  useEffect(() => {
    const storageKey = `rateLimit_species_${id}`;
    const savedLimit = localStorage.getItem(storageKey);

    if (savedLimit) {
      const limitTime = parseInt(savedLimit, 10);
      const now = Date.now();

      // Si le délai n'est pas encore écoulé
      if (limitTime > now) {
        setRateLimitUntil(limitTime);
        const minutes = Math.ceil((limitTime - now) / 60000);
        setError(
          `⏱️ Rate limit actif\n\nVeuillez attendre avant de soumettre une nouvelle observation pour cette espèce.\n\nTemps restant affiché dans le bouton ci-dessous.`
        );
      } else {
        // Nettoyer si expiré
        localStorage.removeItem(storageKey);
      }
    }
  }, [id]);

  useEffect(() => {
    loadSpecies();
  }, [id]);

  // Timer pour le rate limit
  useEffect(() => {
    if (!rateLimitUntil) {
      setRemainingTime(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = rateLimitUntil - now;

      if (diff <= 0) {
        setRateLimitUntil(null);
        setRemainingTime(0);
        setError("");

        // 🗑️ Nettoyer localStorage quand le délai est écoulé
        const storageKey = `rateLimit_species_${id}`;
        localStorage.removeItem(storageKey);
      } else {
        setRemainingTime(Math.ceil(diff / 1000)); // en secondes
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rateLimitUntil]);

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

  const handleSubmitObservation = async (e, forceReview = false) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setCanForceReview(false);

    // Validation côté client
    if (description.trim().length < 10) {
      setError(
        "La description doit contenir au moins 10 caractères pour être analysée par notre système de validation."
      );
      return;
    }

    setSubmitting(true);

    try {
      await createObservation({
        speciesId: parseInt(id),
        description,
        forceReview,
      });
      setSuccess("Observation créée avec succès !");
      setDescription("");
      setRejectedData(null);
      loadSpecies();
    } catch (err) {
      const errorData = err.response?.data;

      // Gestion spéciale du rate limit (429)
      if (err.response?.status === 429) {
        const waitTime = errorData?.waitTime || 5;
        const minutes = Math.ceil(waitTime);

        // Définir le temps d'attente (en millisecondes)
        const waitUntil = Date.now() + waitTime * 60 * 1000;
        setRateLimitUntil(waitUntil);

        // 💾 Sauvegarder dans localStorage pour persister après refresh
        const storageKey = `rateLimit_species_${id}`;
        localStorage.setItem(storageKey, waitUntil.toString());

        setError(
          `⏱️ Rate limit atteint\n\nVous avez déjà soumis une observation pour cette espèce récemment.\n\nVeuillez attendre ${minutes} minute${
            minutes > 1 ? "s" : ""
          } avant de soumettre une nouvelle observation pour "${species.name}".`
        );
        return;
      }

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

      // Vérifier si Force Review est disponible
      if (errorData?.canForceReview) {
        setCanForceReview(true);
        setForceReviewMessage(errorData.forceReviewMessage || "");
        setRejectedData({ speciesId: parseInt(id), description });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceReview = async () => {
    if (!rejectedData) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createObservation({
        speciesId: rejectedData.speciesId,
        description: rejectedData.description,
        forceReview: true,
      });
      setSuccess("Observation créée avec succès via Force Review !");
      setDescription("");
      setRejectedData(null);
      setCanForceReview(false);
      loadSpecies();
    } catch (err) {
      const errorData = err.response?.data;
      setError(
        errorData?.error || errorData?.reason || "Erreur lors de la création"
      );
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

                {canForceReview && (
                  <div className="mt-4 pt-4 border-t border-red-200">
                    <p className="text-sm text-gray-700 mb-3">
                      ⚠️ {forceReviewMessage}
                    </p>
                    <button
                      type="button"
                      onClick={handleForceReview}
                      disabled={submitting}
                      className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                    >
                      🚀 Forcer la revue manuelle
                    </button>
                  </div>
                )}
              </div>
            )}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            <button
              type="submit"
              disabled={submitting || rateLimitUntil !== null}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {submitting
                ? "Envoi..."
                : rateLimitUntil
                ? `Veuillez attendre (${Math.floor(
                    remainingTime / 60
                  )}:${String(remainingTime % 60).padStart(2, "0")})`
                : "Soumettre"}
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
