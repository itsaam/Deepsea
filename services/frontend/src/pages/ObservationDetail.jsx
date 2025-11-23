import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import VoteButtons from "../components/VoteButtons";
import ReplySection from "../components/ReplySection";

export default function ObservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [observation, setObservation] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadObservation();
  }, [id]);

  const loadObservation = async () => {
    try {
      const token =
        sessionStorage.getItem("token") || localStorage.getItem("token");

      // Charger l'observation
      const obsRes = await axios.get(
        `http://localhost:3000/api/observations/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setObservation(obsRes.data);

      // Charger la suggestion IA
      try {
        const aiRes = await axios.get(
          `http://localhost:3000/api/observations/${id}/ai-suggestion`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (aiRes.data.aiSuggestion) {
          setAiSuggestion(aiRes.data.aiSuggestion);
        }
      } catch (err) {
        // Pas de suggestion IA
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Observation non trouvée");
      navigate("/observations");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!observation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <p className="text-center text-red-600">Observation non trouvée</p>
        </div>
      </div>
    );
  }

  const obs = observation;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour
        </button>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {/* En-tête avec image */}
          <div className="flex items-start gap-4 mb-4">
            {obs.imageUrl && (
              <img
                src={obs.imageUrl}
                alt={obs.species?.name}
                className="w-64 h-64 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {obs.species?.name || "Espèce inconnue"}
              </h1>
              <p className="text-gray-600 mb-2">
                par{" "}
                <span className="font-semibold text-blue-600">
                  {obs.author?.username || "Inconnu"}
                </span>
              </p>
              {obs.location && (
                <p className="text-gray-600 mb-2">📍 {obs.location}</p>
              )}
              <p className="text-sm text-gray-500">
                {new Date(obs.createdAt).toLocaleDateString("fr-FR")}
              </p>

              {/* Status Badge */}
              <span
                className={`inline-block mt-3 px-4 py-2 rounded-full font-semibold ${
                  obs.status === "VALIDATED"
                    ? "bg-green-100 text-green-800"
                    : obs.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {obs.status === "VALIDATED"
                  ? "✓ Validé"
                  : obs.status === "REJECTED"
                  ? "✗ Rejeté"
                  : "⏳ En attente"}
              </span>

              {obs.deleted && (
                <span className="inline-block mt-3 ml-2 px-4 py-2 rounded-full font-semibold bg-gray-200 text-gray-700">
                  🗑️ Supprimé
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {obs.description && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {obs.description}
              </p>
            </div>
          )}

          {/* Votes - Only for validated observations */}
          {obs.status === "VALIDATED" && !obs.deleted && (
            <div className="mb-4">
              <VoteButtons
                observationId={obs.id}
                authorId={obs.authorId}
                currentUserId={user?.id}
              />
            </div>
          )}

          {/* Raison du rejet */}
          {obs.status === "REJECTED" && obs.rejectionReason && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="font-semibold text-red-800">Raison du rejet :</p>
              <p className="text-red-700">{obs.rejectionReason}</p>
              {obs.validatorUsername && (
                <p className="text-sm text-red-600 mt-1">
                  Rejeté par :{" "}
                  <span className="font-semibold">{obs.validatorUsername}</span>
                </p>
              )}
            </div>
          )}

          {/* Info validation */}
          {obs.status === "VALIDATED" && obs.validatorUsername && (
            <div className="mb-4 text-sm text-gray-600">
              Validé par :{" "}
              <span className="font-semibold">{obs.validatorUsername}</span>
            </div>
          )}

          {/* Analyse IA */}
          {aiSuggestion && (
            <div
              className={`mb-4 p-4 rounded-lg border-2 ${
                aiSuggestion.recommendation === "REJECT"
                  ? "bg-red-50 border-red-300"
                  : aiSuggestion.recommendation === "VALIDATE"
                  ? "bg-green-50 border-green-300"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-2xl">
                  {aiSuggestion.recommendation === "REJECT"
                    ? "🚫"
                    : aiSuggestion.recommendation === "VALIDATE"
                    ? "✅"
                    : "⚠️"}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-lg mb-1">
                    Analyse IA : {aiSuggestion.recommendation}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    {aiSuggestion.reason}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span className="font-semibold">
                      Confiance: {aiSuggestion.confidence}%
                    </span>
                    <span className="font-semibold">
                      Qualité: {aiSuggestion.qualityScore}/10
                    </span>
                  </div>
                  {aiSuggestion.detectedIssues?.length > 0 && (
                    <div className="mt-2">
                      <p className="font-semibold text-red-600">
                        Problèmes détectés:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-700">
                        {aiSuggestion.detectedIssues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reply Section */}
        {obs.status === "VALIDATED" && !obs.deleted && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <ReplySection observationId={obs.id} />
          </div>
        )}
      </div>
    </div>
  );
}
