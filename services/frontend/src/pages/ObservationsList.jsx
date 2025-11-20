import { useState, useEffect } from "react";
import {
  getAllObservations,
  validateObservation,
  rejectObservation,
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

  const filteredObs = observations.filter((obs) => {
    if (filter === "all") return true;
    return obs.status === filter.toUpperCase();
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
