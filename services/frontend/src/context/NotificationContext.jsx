import { createContext, useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);

      // Compter les non lues
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  // Fonction pour récupérer uniquement le count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const { data } = await api.get("/notifications/unread-count");
      const newCount = data.count;

      // Si le count a augmenté, il y a de nouvelles notifs
      if (newCount > unreadCount) {
        // Récupérer les nouvelles notifs pour afficher le toast
        await fetchNotifications();

        // Afficher un toast pour chaque nouvelle notif (max 3 pour pas spam)
        const newNotifs = notifications.slice(0, newCount - unreadCount);
        newNotifs.slice(0, 3).forEach((notif) => {
          if (notif.type === "OBSERVATION_VALIDATED") {
            toast.success(notif.message, {
              duration: 5000,
              icon: "✅",
            });
          } else if (notif.type === "OBSERVATION_REJECTED") {
            toast.error(notif.message, {
              duration: 5000,
              icon: "❌",
            });
          } else {
            toast(notif.message, {
              duration: 5000,
              icon: "🔔",
            });
          }
        });
      }

      setUnreadCount(newCount);
    } catch (error) {
      console.error("Erreur lors du comptage des notifications:", error);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erreur lors du marquage comme lu:", error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Erreur lors du marquage global:", error);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      const notif = notifications.find((n) => n.id === notificationId);
      if (!notif?.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  // Polling toutes les 10 secondes (uniquement si connecté)
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Premier fetch au montage
    fetchNotifications();

    // Polling toutes les 10 secondes
    const interval = setInterval(() => {
      // Optimisation: ne fetch que si l'onglet est actif
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
      {children}
    </NotificationContext.Provider>
  );
};
