import { createContext, useContext, useState, useEffect } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
} from "../services/api";

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Vérifier d'abord sessionStorage, puis localStorage
    let token =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      try {
        const { data } = await getMe();
        setUser(data);
        // Marquer la session comme active
        sessionStorage.setItem("sessionActive", "true");
      } catch (error) {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (identifier, password, rememberMe = false) => {
    const { data } = await apiLogin({ identifier, password });

    // Si A2F est requis, retourner les données sans sauvegarder le token
    if (data.requiresTwoFactor) {
      return data;
    }

    // Sinon, connexion normale (au cas où A2F est désactivé)
    // Stocker selon la préférence rememberMe
    if (rememberMe) {
      localStorage.setItem("token", data.token);
    } else {
      sessionStorage.setItem("token", data.token);
    }
    sessionStorage.setItem("sessionActive", "true");
    setUser(data.user);
    return data;
  };

  const register = async (email, username, password) => {
    const { data } = await apiRegister({ email, username, password });
    return data;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("sessionActive");
    localStorage.removeItem("token");
    setUser(null);
  };

  const setUserData = (userData) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, setUserData }}
    >
      {children}
    </AuthContext.Provider>
  );
};
