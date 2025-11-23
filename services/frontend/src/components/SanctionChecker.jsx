import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const SanctionChecker = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Vérifier les sanctions toutes les 30 secondes
    const checkSanctions = async () => {
      try {
        const token =
          sessionStorage.getItem("token") || localStorage.getItem("token");
        if (!token) return;

        await axios.get("http://localhost:3000/api/check-sanction", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        if (error.response?.status === 403) {
          const data = error.response.data;
          if (
            data.error === "ACCOUNT_BANNED" ||
            data.error === "ACCOUNT_SUSPENDED"
          ) {
            localStorage.setItem("sanctionInfo", JSON.stringify(data));
            logout();
            navigate("/sanction");
          }
        }
      }
    };

    // Vérifier immédiatement
    checkSanctions();

    // Puis toutes les 30 secondes
    const interval = setInterval(checkSanctions, 30000);

    return () => clearInterval(interval);
  }, [user, logout, navigate]);

  return null;
};

export default SanctionChecker;
