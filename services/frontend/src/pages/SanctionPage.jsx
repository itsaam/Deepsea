import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SanctionPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [sanctionInfo, setSanctionInfo] = useState(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("sanctionInfo") || "{}");
    if (!info.sanctionType) {
      navigate("/");
      return;
    }
    setSanctionInfo(info);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sanctionInfo");
    logout();
    navigate("/login");
  };

  if (!sanctionInfo) return null;

  const isPermanentBan = sanctionInfo.sanctionType === "PERMANENT_BAN";
  const isSuspension = sanctionInfo.sanctionType === "TEMPORARY_SUSPENSION";

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeRemaining = () => {
    if (!sanctionInfo.expiresAt) return "";
    const now = new Date();
    const expiresAt = new Date(sanctionInfo.expiresAt);
    const diff = expiresAt - now;

    if (diff <= 0) return "Expiré";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} jour${days > 1 ? "s" : ""} et ${hours}h`;
    if (hours > 0) return `${hours}h et ${minutes}min`;
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className={`p-8 ${
              isPermanentBan
                ? "bg-gradient-to-r from-red-600 to-red-700"
                : "bg-gradient-to-r from-orange-500 to-orange-600"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                <span className="text-5xl">{isPermanentBan ? "🚫" : "⏸️"}</span>
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">
                  {isPermanentBan ? "Compte Banni" : "Compte Suspendu"}
                </h1>
                <p className="text-white/90 mt-1">
                  {isPermanentBan
                    ? "Votre accès a été révoqué définitivement"
                    : "Votre accès est temporairement restreint"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Raison */}
            <div className="bg-gray-50 rounded-xl p-6 border-l-4 border-red-500">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>📋</span>
                Raison de la sanction
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                {sanctionInfo.reason}
              </p>
            </div>

            {/* Durée (pour suspension) */}
            {isSuspension && sanctionInfo.expiresAt && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-l-4 border-orange-500">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⏱️</span>
                  Temps restant
                </h2>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-orange-600">
                    {getTimeRemaining()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Se termine le {formatDate(sanctionInfo.expiresAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Informations */}
            <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-500">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>ℹ️</span>
                Informations
              </h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <strong>Date de la sanction :</strong>{" "}
                  {formatDate(sanctionInfo.issuedAt)}
                </p>
                <p>
                  <strong>Type :</strong>{" "}
                  {isPermanentBan
                    ? "Bannissement permanent"
                    : "Suspension temporaire"}
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="bg-purple-50 rounded-xl p-6 border-l-4 border-purple-500">
              <p className="text-gray-700 leading-relaxed">
                {isPermanentBan ? (
                  <>
                    <strong>Votre compte a été banni définitivement.</strong>{" "}
                    Cette décision a été prise en raison d'une violation grave
                    de nos conditions d'utilisation. Si vous pensez qu'il s'agit
                    d'une erreur, veuillez contacter l'équipe de modération.
                  </>
                ) : (
                  <>
                    <strong>Votre compte est temporairement suspendu.</strong>{" "}
                    Vous pourrez vous reconnecter une fois la période de
                    suspension terminée. Nous vous invitons à consulter nos
                    règles de conduite pour éviter de futures sanctions.
                  </>
                )}
              </p>
            </div>

            {/* Bouton */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLogout}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition shadow-lg hover:shadow-xl"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>DeepSea - Plateforme d'observations marines</p>
        </div>
      </div>
    </div>
  );
};

export default SanctionPage;
