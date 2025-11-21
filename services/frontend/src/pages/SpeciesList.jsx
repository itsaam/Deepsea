import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import {
  getAllSpecies,
  softDeleteSpecies,
  restoreSpecies,
} from "../services/api";
import Navbar from "../components/Navbar";
import { AuthContext } from "../context/AuthContext";

export default function SpeciesList() {
  const { user } = useContext(AuthContext);
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadSpecies();
  }, [sortBy]);

  useEffect(() => {
    filterSpecies();
  }, [species, searchTerm, filter]);

  const loadSpecies = async () => {
    try {
      const { data } = await getAllSpecies(sortBy);
      setSpecies(data);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterSpecies = () => {
    let filtered = species;

    // Filtrer par statut supprimé/actif
    if (filter === "deleted") {
      filtered = filtered.filter((s) => s.deleted);
    } else if (filter === "active") {
      filtered = filtered.filter((s) => !s.deleted);
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredSpecies(filtered);
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Supprimer cette espèce ? (suppression douce - restaurable)"))
      return;
    try {
      await softDeleteSpecies(id);
      alert("Espèce supprimée (soft delete)");
      loadSpecies();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  const handleRestore = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await restoreSpecies(id);
      alert("Espèce restaurée !");
      loadSpecies();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">
            Espèces ({filteredSpecies.length})
          </h1>

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="🔍 Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded w-64"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">Date (récent)</option>
              <option value="rarity">Rareté</option>
            </select>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">Toutes</option>
              <option value="active">Actives</option>
              <option value="deleted">Supprimées</option>
            </select>

            <Link
              to="/species/create"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              + Nouvelle espèce
            </Link>
          </div>
        </div>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredSpecies.map((s) => (
              <div
                key={s.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition relative"
              >
                <Link to={`/species/${s.id}`}>
                  <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                  <p className="text-gray-600 mb-2">
                    Rareté: {s.rarityScore.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s._count?.observations || 0} observation(s)
                  </p>
                </Link>

                {/* Delete button for EXPERT/ADMIN on non-deleted species */}
                {(user?.role === "EXPERT" || user?.role === "ADMIN") &&
                  !s.deleted && (
                    <button
                      onClick={(e) => handleDelete(s.id, e)}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 mt-3 text-sm"
                    >
                      🗑️ Supprimer
                    </button>
                  )}

                {/* Restore button for ADMIN on deleted species */}
                {user?.role === "ADMIN" && s.deleted && (
                  <button
                    onClick={(e) => handleRestore(s.id, e)}
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 mt-3 text-sm"
                  >
                    ♻️ Restaurer
                  </button>
                )}

                {/* Display deleted status */}
                {s.deleted && (
                  <p className="text-red-600 font-semibold mt-2">
                    ❌ Supprimée
                    {s.deletedAt &&
                      ` le ${new Date(s.deletedAt).toLocaleDateString()}`}
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
