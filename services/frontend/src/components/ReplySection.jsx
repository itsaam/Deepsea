import { useState, useEffect } from "react";
import {
  getRepliesByObservation,
  createReply,
  updateReply,
  deleteReply,
} from "../services/api";
import { FaReply, FaEdit, FaTrash, FaPaperPlane } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ReplySection = ({ observationId, currentUserId, currentUserRole }) => {
  const [replies, setReplies] = useState([]);
  const [newReplyContent, setNewReplyContent] = useState("");
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchReplies();
  }, [observationId, pagination.page]);

  const fetchReplies = async () => {
    try {
      const response = await getRepliesByObservation(
        observationId,
        pagination.page,
        pagination.limit
      );
      setReplies(response.data.replies);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
    }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!newReplyContent.trim()) return;

    if (newReplyContent.length > 1000) {
      alert("Le commentaire ne peut pas dépasser 1000 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await createReply(observationId, newReplyContent.trim());
      setNewReplyContent("");
      await fetchReplies();
    } catch (error) {
      console.error("Erreur lors de la création du commentaire:", error);
      alert(
        error.response?.data?.error || "Erreur lors de l'ajout du commentaire"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReply = async (replyId) => {
    if (!editContent.trim()) return;

    if (editContent.length > 1000) {
      alert("Le commentaire ne peut pas dépasser 1000 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await updateReply(replyId, editContent.trim());
      setEditingReplyId(null);
      setEditContent("");
      await fetchReplies();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert(error.response?.data?.error || "Erreur lors de la modification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

    setIsLoading(true);
    try {
      await deleteReply(replyId);
      await fetchReplies();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(error.response?.data?.error || "Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (reply) => {
    setEditingReplyId(reply.id);
    setEditContent(reply.content);
  };

  const cancelEditing = () => {
    setEditingReplyId(null);
    setEditContent("");
  };

  return (
    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <FaReply className="text-blue-600" />
        Commentaires ({pagination.total})
      </h3>

      {/* Formulaire d'ajout de commentaire */}
      <form onSubmit={handleCreateReply} className="mb-6">
        <div className="flex flex-col gap-2">
          <textarea
            value={newReplyContent}
            onChange={(e) => setNewReplyContent(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="3"
            maxLength="1000"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {newReplyContent.length}/1000 caractères
            </span>
            <button
              type="submit"
              disabled={isLoading || !newReplyContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaPaperPlane />
              Publier
            </button>
          </div>
        </div>
      </form>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {replies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </p>
        ) : (
          replies.map((reply) => (
            <div
              key={reply.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              {editingReplyId === reply.id ? (
                // Mode édition
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows="3"
                    maxLength="1000"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {editContent.length}/1000 caractères
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleUpdateReply(reply.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Mode affichage
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">
                        {reply.authorUsername ||
                          `Utilisateur #${reply.authorId}`}
                      </span>
                      {reply.authorRole && (
                        <span
                          className={`text-xs ml-2 px-2 py-0.5 rounded ${
                            reply.authorRole === "ADMIN"
                              ? "bg-red-100 text-red-700"
                              : reply.authorRole === "EXPERT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {reply.authorRole}
                        </span>
                      )}
                      <span className="text-gray-500 text-sm ml-2">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                      {reply.createdAt !== reply.updatedAt && (
                        <span className="text-gray-400 text-xs ml-1">
                          (modifié)
                        </span>
                      )}
                    </div>

                    {/* Boutons d'action (seulement pour l'auteur ou admin) */}
                    {(reply.authorId === currentUserId ||
                      currentUserRole === "ADMIN") && (
                      <div className="flex gap-2">
                        {reply.authorId === currentUserId && (
                          <button
                            onClick={() => startEditing(reply)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Modifier"
                          >
                            <FaEdit />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReply(reply.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Supprimer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page - 1 })
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPagination({ ...pagination, page: pagination.page + 1 })
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};

export default ReplySection;
