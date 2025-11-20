import { useState, useEffect } from "react";
import { getAllSpecies, getAllObservations } from "../services/api";
import Navbar from "../components/Navbar";

export default function Statistics() {
  const [stats, setStats] = useState({
    totalSpecies: 0,
    totalObservations: 0,
    pendingObservations: 0,
    validatedObservations: 0,
    topSpecies: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const [speciesRes, observationsRes] = await Promise.all([
        getAllSpecies(),
        getAllObservations(),
      ]);

      const species = speciesRes.data;
      const observations = observationsRes.data;

      // Calculer les stats
      const speciesWithCounts = species.map((s) => ({
        ...s,
        observationCount: observations.filter((o) => o.speciesId === s.id)
          .length,
      }));

      const topSpecies = speciesWithCounts
        .sort((a, b) => b.observationCount - a.observationCount)
        .slice(0, 5);

      setStats({
        totalSpecies: species.length,
        totalObservations: observations.length,
        pendingObservations: observations.filter((o) => o.status === "PENDING")
          .length,
        validatedObservations: observations.filter(
          (o) => o.status === "VALIDATED"
        ).length,
        topSpecies,
      });
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Statistiques</h1>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm mb-2">Total Espèces</h3>
                <p className="text-3xl font-bold">{stats.totalSpecies}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm mb-2">
                  Total Observations
                </h3>
                <p className="text-3xl font-bold">{stats.totalObservations}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm mb-2">En attente</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {stats.pendingObservations}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-gray-500 text-sm mb-2">Validées</h3>
                <p className="text-3xl font-bold text-green-600">
                  {stats.validatedObservations}
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-bold mb-4">
                Top 5 Espèces les plus observées
              </h2>
              <div className="space-y-4">
                {stats.topSpecies.map((species, index) => (
                  <div
                    key={species.id}
                    className="flex items-center justify-between p-4 border rounded"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <div>
                        <h3 className="font-bold">{species.name}</h3>
                        <p className="text-sm text-gray-500">
                          Rareté: {species.rarityScore.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-blue-600">
                      {species.observationCount} observations
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
