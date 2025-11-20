import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllSpecies } from "../services/api";
import Navbar from "../components/Navbar";

export default function SpeciesList() {
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadSpecies();
  }, [sortBy]);

  useEffect(() => {
    filterSpecies();
  }, [species, searchTerm]);

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
    if (!searchTerm) {
      setFilteredSpecies(species);
      return;
    }
    const filtered = species.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSpecies(filtered);
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
              <Link
                key={s.id}
                to={`/species/${s.id}`}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold mb-2">{s.name}</h3>
                <p className="text-gray-600 mb-2">
                  Rareté: {s.rarityScore.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">
                  {s._count?.observations || 0} observation(s)
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
