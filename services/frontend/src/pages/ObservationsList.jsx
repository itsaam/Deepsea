import { useState, useEffect } from "react";
import {
  getAllObservations,
  validateObservation,
  rejectObservation,
  softDeleteObservation,
  restoreObservation,
  getObservationAiSuggestion,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function ObservationsList() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [aiSuggestions, setAiSuggestions] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    try {
      const { data } = await getAllObservations();
      setObservations(data);

      // Charger les suggestions IA pour chaque observation
      const suggestions = {};
      for (const obs of data) {
        try {
          const aiRes = await getObservationAiSuggestion(obs.id);
          if (aiRes.data.aiSuggestion) {
            suggestions[obs.id] = aiRes.data.aiSuggestion;
          }
        } catch (err) {
          // Pas de suggestion IA pour cette observation
        }
      }
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await validateObservation(id);
      loadObservations();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Raison du rejet (optionnel) :");
    if (reason === null) return; // Annulé

    try {
      // Envoyer la raison même si vide, le backend accepte null ou string
      await rejectObservation(id, reason.trim() || null);
      loadObservations();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Supprimer cette observation ? (suppression douce - restaurable)"
      )
    )
      return;
    try {
      await softDeleteObservation(id);
      alert("Observation supprimée (soft delete)");
      loadObservations();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreObservation(id);
      alert("Observation restaurée !");
      loadObservations();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  const filteredObs = observations.filter((obs) => {
    if (filter === "all") return true;
    if (filter === "deleted") return obs.deleted;
    return obs.status === filter.toUpperCase() && !obs.deleted;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Observations</h1>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">Toutes</option>
            <option value="pending">En attente</option>
            <option value="validated">Validées</option>
            <option value="rejected">Rejetées</option>
            <option value="deleted">Supprimées</option>
          </select>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="space-y-4">
            {filteredObs.map((obs) => (
              <div key={obs.id} className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{obs.species?.name}</h3>
                    <p className="text-gray-600 mt-2">{obs.description}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      obs.status === "PENDING"
                        ? "bg-yellow-200"
                        : obs.status === "VALIDATED"
                        ? "bg-green-200"
                        : "bg-red-200"
                    }`}
                  >
                    {obs.status}
                  </span>
                </div>

                {/* 📋 Raison du rejet */}
                {obs.status === "REJECTED" && obs.rejectionReason && (
                  <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                    <p className="font-semibold text-red-800">
                      Raison du rejet :
                    </p>
                    <p className="text-red-700">{obs.rejectionReason}</p>
                    {obs.validatedBy && (
                      <p className="text-sm text-red-600 mt-1">
                        Rejeté par l'utilisateur ID: {obs.validatedBy}
                      </p>
                    )}
                  </div>
                )}

                {/* ✅ Info validation */}
                {obs.status === "VALIDATED" && obs.validatedBy && (
                  <div className="mb-4 text-sm text-gray-600">
                    Validé par l'utilisateur ID: {obs.validatedBy}
                  </div>
                )}

                {/* 🤖 Analyse IA */}
                {aiSuggestions[obs.id] && (
                  <div
                    className={`mb-4 p-4 rounded-lg border-2 ${
                      aiSuggestions[obs.id].recommendation === "REJECT"
                        ? "bg-red-50 border-red-300"
                        : aiSuggestions[obs.id].recommendation === "VALIDATE"
                        ? "bg-green-50 border-green-300"
                        : "bg-yellow-50 border-yellow-300"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl">
                        {aiSuggestions[obs.id].recommendation === "REJECT"
                          ? "🚫"
                          : aiSuggestions[obs.id].recommendation === "VALIDATE"
                          ? "✅"
                          : "⚠️"}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-lg mb-1">
                          Analyse IA : {aiSuggestions[obs.id].recommendation}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          {aiSuggestions[obs.id].reason}
                        </p>
                        <div className="flex gap-4 text-sm">
                          <span className="font-semibold">
                            Confiance: {aiSuggestions[obs.id].confidence}%
                          </span>
                          <span className="font-semibold">
                            Qualité: {aiSuggestions[obs.id].qualityScore}/10
                          </span>
                        </div>
                        {aiSuggestions[obs.id].detectedIssues?.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold text-red-600">
                              Problèmes détectés:
                            </p>
                            <ul className="list-disc list-inside text-sm text-red-700">
                              {aiSuggestions[obs.id].detectedIssues.map(
                                (issue, i) => (
                                  <li key={i}>{issue}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {obs.status === "PENDING" && obs.authorId !== user?.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidate(obs.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => handleReject(obs.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Rejeter
                    </button>
                  </div>
                )}

                {/* Delete button for EXPERT/ADMIN on validated/rejected observations only */}
                {(user?.role === "EXPERT" || user?.role === "ADMIN") &&
                  !obs.deleted &&
                  (obs.status === "VALIDATED" || obs.status === "REJECTED") && (
                    <button
                      onClick={() => handleDelete(obs.id)}
                      className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mt-2"
                    >
                      🗑️ Supprimer
                    </button>
                  )}

                {/* Restore button for ADMIN on deleted observations */}
                {user?.role === "ADMIN" && obs.deleted && (
                  <button
                    onClick={() => handleRestore(obs.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
                  >
                    ♻️ Restaurer
                  </button>
                )}

                {/* Display deleted status */}
                {obs.deleted && (
                  <p className="text-red-600 font-semibold mt-2">
                    ❌ Supprimée
                    {obs.deletedAt &&
                      ` le ${new Date(obs.deletedAt).toLocaleDateString()}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
