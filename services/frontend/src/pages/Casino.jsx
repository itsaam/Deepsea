import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import axios from "axios";

const BET_TYPES = {
  STRAIGHT: {
    type: "straight",
    label: "Numéro",
    payout: "35:1",
    color: "purple",
  },
  RED: { type: "red", label: "Rouge", payout: "1:1", color: "red" },
  BLACK: { type: "black", label: "Noir", payout: "1:1", color: "black" },
  EVEN: { type: "even", label: "Pair", payout: "1:1", color: "blue" },
  ODD: { type: "odd", label: "Impair", payout: "1:1", color: "blue" },
  LOW: { type: "low", label: "1-18", payout: "1:1", color: "green" },
  HIGH: { type: "high", label: "19-36", payout: "1:1", color: "green" },
  DOZEN1: { type: "dozen1", label: "1-12", payout: "2:1", color: "orange" },
  DOZEN2: { type: "dozen2", label: "13-24", payout: "2:1", color: "orange" },
  DOZEN3: { type: "dozen3", label: "25-36", payout: "2:1", color: "orange" },
};

export default function Casino() {
  const { user } = useAuth();
  const [bets, setBets] = useState([]);
  const [currentBet, setCurrentBet] = useState({
    type: "red",
    amount: 10,
    value: null,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [spinning, setSpinning] = useState(false);

  // Vérifier si l'utilisateur est admin
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">🚫 Accès Refusé</h1>
          <p className="text-gray-400">
            Ce casino est réservé aux administrateurs !
          </p>
        </div>
      </div>
    );
  }

  const addBet = () => {
    if (
      currentBet.type === "straight" &&
      (currentBet.value < 0 || currentBet.value > 36)
    ) {
      alert("Le numéro doit être entre 0 et 36");
      return;
    }
    if (currentBet.amount <= 0) {
      alert("Le montant doit être supérieur à 0");
      return;
    }

    setBets([...bets, { ...currentBet, id: Date.now() }]);
    setCurrentBet({ type: "red", amount: 10, value: null });
  };

  const removeBet = (id) => {
    setBets(bets.filter((b) => b.id !== id));
  };

  const playRoulette = async () => {
    if (bets.length === 0) {
      alert("Ajoutez au moins un pari !");
      return;
    }

    setLoading(true);
    setSpinning(true);
    setResult(null);

    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        "http://localhost:3001/admin/casino/roulette",
        {
          bets: bets.map(({ id, ...bet }) => bet),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Animation de la roulette
      setTimeout(() => {
        setResult(data);
        setHistory([data.result, ...history].slice(0, 10));
        setSpinning(false);
        setBets([]);
      }, 3000);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du jeu");
      setSpinning(false);
    } finally {
      setLoading(false);
    }
  };

  const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2 text-gray-800">
            🎰 Casino DeepSea 🎰
          </h1>
          <p className="text-gray-600 text-lg">Réservé aux Administrateurs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panneau de paris */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg border-2 border-green-500">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              💰 Placer vos paris
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Type de pari
                </label>
                <select
                  value={currentBet.type}
                  onChange={(e) =>
                    setCurrentBet({ ...currentBet, type: e.target.value })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none text-gray-800"
                >
                  {Object.values(BET_TYPES).map((bet) => (
                    <option key={bet.type} value={bet.type}>
                      {bet.label} ({bet.payout})
                    </option>
                  ))}
                </select>
              </div>

              {currentBet.type === "straight" && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Numéro (0-36)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="36"
                    value={currentBet.value || ""}
                    onChange={(e) =>
                      setCurrentBet({
                        ...currentBet,
                        value: parseInt(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none text-gray-800"
                    placeholder="Ex: 7"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Montant
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentBet.amount}
                  onChange={(e) =>
                    setCurrentBet({
                      ...currentBet,
                      amount: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-3 bg-gray-50 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none text-gray-800"
                />
              </div>

              <button
                onClick={addBet}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-md text-white"
              >
                ➕ Ajouter le pari
              </button>
            </div>

            {/* Liste des paris */}
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 text-gray-800">
                Paris actifs ({bets.length})
              </h3>
              {bets.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Aucun pari pour le moment
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {bets.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-gray-100 p-3 rounded-lg flex justify-between items-center border border-gray-300"
                    >
                      <div className="text-sm text-gray-800">
                        <span className="font-semibold">
                          {BET_TYPES[bet.type.toUpperCase()]?.label || bet.type}
                        </span>
                        {bet.type === "straight" && ` (${bet.value})`}
                        <span className="text-gray-600"> - ${bet.amount}</span>
                      </div>
                      <button
                        onClick={() => removeBet(bet.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {bets.length > 0 && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300">
                  <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Total misé:</span>
                    <span className="text-emerald-600">${totalBet}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={playRoulette}
              disabled={loading || bets.length === 0}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-green-600 py-4 rounded-xl font-bold text-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {loading ? "🎡 Roulette en cours..." : "🎰 LANCER LA ROULETTE !"}
            </button>
          </div>

          {/* Zone de jeu */}
          <div className="lg:col-span-2 space-y-6">
            {/* Roulette visuelle */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 text-center">
              <h2 className="text-3xl font-bold mb-8 text-gray-800">
                🎡 La Roulette
              </h2>

              <div
                className={`relative inline-block ${
                  spinning ? "animate-spin" : ""
                }`}
              >
                <div className="w-72 h-72 rounded-full bg-gradient-to-br from-emerald-600 via-green-700 to-emerald-800 flex items-center justify-center border-[12px] border-white shadow-2xl">
                  <div className="w-56 h-56 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-7xl font-bold shadow-inner">
                    {result ? (
                      <span
                        className={
                          result.result.color === "red"
                            ? "text-red-400"
                            : result.result.color === "black"
                            ? "text-white"
                            : "text-emerald-400"
                        }
                      >
                        {result.result.number}
                      </span>
                    ) : (
                      <span className="text-gray-400">?</span>
                    )}
                  </div>
                </div>
              </div>

              {result && !spinning && (
                <div className="mt-8 space-y-4">
                  <div className="text-2xl font-bold text-gray-800">
                    {result.message}
                  </div>
                  <div className="text-5xl">{result.emoji}</div>
                  <div className="text-xl font-semibold text-gray-700 bg-gray-50 py-3 px-6 rounded-xl inline-block">
                    {result.funMessage}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 shadow-sm">
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                        Mise totale
                      </div>
                      <div className="text-3xl font-bold text-gray-800">
                        ${result.totalBet}
                      </div>
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-2xl border-2 border-emerald-300 shadow-sm">
                      <div className="text-xs font-semibold text-emerald-600 uppercase mb-1">
                        Gains
                      </div>
                      <div className="text-3xl font-bold text-emerald-600">
                        ${result.totalWinnings}
                      </div>
                    </div>
                    <div
                      className={`p-6 rounded-2xl border-2 shadow-sm ${
                        result.netProfit > 0
                          ? "bg-green-50 border-green-300"
                          : result.netProfit < 0
                          ? "bg-red-50 border-red-300"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div
                        className={`text-xs font-semibold uppercase mb-1 ${
                          result.netProfit > 0
                            ? "text-green-600"
                            : result.netProfit < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        Profit net
                      </div>
                      <div
                        className={`text-3xl font-bold ${
                          result.netProfit > 0
                            ? "text-green-600"
                            : result.netProfit < 0
                            ? "text-red-600"
                            : "text-gray-800"
                        }`}
                      >
                        ${result.netProfit > 0 ? "+" : ""}
                        {result.netProfit}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Historique */}
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-purple-400/30">
              <h3 className="text-xl font-bold mb-4">
                📊 Historique (10 derniers)
              </h3>
              {history.length === 0 ? (
                <p className="text-gray-400">Aucun historique</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {history.map((h, idx) => (
                    <div
                      key={idx}
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${
                        h.color === "red"
                          ? "bg-red-600 border-red-400"
                          : h.color === "black"
                          ? "bg-gray-900 border-gray-600"
                          : "bg-green-600 border-green-400"
                      }`}
                    >
                      {h.number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
