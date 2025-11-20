import { createContext, useContext, useState, useEffect } from "react";
import {
  login as apiLogin,
  register as apiRegister,
  getMe,
} from "../services/api";

const AuthContext = createContext();

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
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const { data } = await getMe();
        setUser(data);
      } catch (error) {
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  };

  const login = async (identifier, password) => {
    const { data } = await apiLogin({ identifier, password });

    // Si A2F est requis, retourner les données sans sauvegarder le token
    if (data.requiresTwoFactor) {
      return data;
    }

    // Sinon, connexion normale (au cas où A2F est désactivé)
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async (email, username, password) => {
    const { data } = await apiRegister({ email, username, password });
    return data;
  };

  const logout = () => {
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
