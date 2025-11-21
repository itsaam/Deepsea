import { useState, useEffect } from "react";
import {
  getAllObservations,
  validateObservation,
  rejectObservation,
  softDeleteObservation,
  restoreObservation,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function ObservationsList() {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    try {
      const { data } = await getAllObservations();
      setObservations(data);
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
    try {
      await rejectObservation(id);
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
