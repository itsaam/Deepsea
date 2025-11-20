import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole, deleteUser } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== "ADMIN") {
      navigate("/species");
      return;
    }
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      const { data } = await getAllUsers();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur lors du changement de rôle");
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?"))
      return;

    try {
      await deleteUser(userId);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">
          Panel Admin - Gestion des Utilisateurs
        </h1>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Réputation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="border rounded px-2 py-1"
                        disabled={u.id === user.id}
                      >
                        <option value="USER">USER</option>
                        <option value="EXPERT">EXPERT</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 rounded">
                        {u.reputation} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
