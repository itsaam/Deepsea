import { useState, useEffect } from "react";
import { getTaxonomyStats } from "../services/api";
import Navbar from "../components/Navbar";

export default function Taxonomy() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTaxonomyStats();
  }, []);

  const loadTaxonomyStats = async () => {
    try {
      const { data } = await getTaxonomyStats();
      setStats(data);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement");
      console.error("Erreur taxonomy:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto p-6">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          🔬 Taxonomie & Classification
        </h1>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Total Espèces</h3>
            <p className="text-3xl font-bold">{stats.summary.totalSpecies}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Total Observations</h3>
            <p className="text-3xl font-bold">
              {stats.summary.totalObservations}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm mb-2">Moyenne par Espèce</h3>
            <p className="text-3xl font-bold">
              {stats.summary.averageObservationsPerSpecies}
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold mb-4">🔑 Mots-clés récurrents</h2>
          <div className="flex flex-wrap gap-3">
            {stats.keywords.slice(0, 15).map((kw, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full"
              >
                {kw.keyword} ({kw.count})
              </span>
            ))}
          </div>
        </div>

        {/* Classification Hierarchy */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">
            📊 Classification Hiérarchique
          </h2>

          {stats.classification.map((family, idx) => (
            <div key={idx} className="mb-6 border-l-4 border-blue-500 pl-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">{family.family}</h3>
                <span className="text-gray-600">
                  {family.speciesCount} espèces · {family.totalObservations}{" "}
                  observations
                </span>
              </div>

              {/* Branches */}
              {family.branches && family.branches.length > 0 && (
                <div className="ml-4 mb-2">
                  {family.branches.map((branch, bIdx) => (
                    <div
                      key={bIdx}
                      className="mb-2 border-l-2 border-gray-300 pl-3"
                    >
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">
                          Branche: {branch.branch}
                        </span>
                        <span className="text-sm text-gray-500">
                          {branch.species?.length || 0} espèces
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Species in family */}
              {family.species && family.species.length > 0 && (
                <div className="ml-4">
                  <p className="text-sm text-gray-600 mb-1">Espèces:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {family.species.map((sp, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-sm bg-gray-50 p-2 rounded"
                      >
                        {sp.name} ({sp.observations} obs)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
