import { useState, useEffect, useRef } from "react";
import { FaComments, FaTimes, FaLock, FaPaperPlane } from "react-icons/fa";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import {
  getConversations,
  getConversation,
  getUserPublicKey,
  getUserKeys,
  getMessagingUsers,
  saveUserKeys,
} from "../services/api";
import { encryptMessage, decryptMessage } from "../utils/crypto";

export default function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userKeys, setUserKeys] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [contextMenu, setContextMenu] = useState(null); // { messageId, x, y }
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [editingMessage, setEditingMessage] = useState(null); // Message being edited
  const messagesEndRef = useRef(null);

  // Initialiser Socket.IO
  useEffect(() => {
    if (!user) return;

    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) return;

    const newSocket = io("http://localhost:3002", {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to messaging");
    });

    newSocket.on("new_message", (message) => {
      if (selectedConversation?.id === message.conversationId) {
        decryptAndAddMessage(message);
      }
      loadConversations();
    });

    newSocket.on(
      "message_edited",
      async ({ messageId, encryptedContent, isEdited }) => {
        if (!selectedConversation) return;

        try {
          const { decryptMessage } = await import("../utils/crypto");
          const otherUser = allUsers.find(
            (u) => u.id === selectedConversation.otherUserId
          );
          if (!otherUser) return;

          const recipientPublicKey = await getUserPublicKey(otherUser.id);
          const decrypted = await decryptMessage(
            encryptedContent,
            recipientPublicKey.data.publicKey,
            userKeys.secretKey
          );

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, content: decrypted, isEdited: true }
                : msg
            )
          );
        } catch (err) {
          console.error("Échec du déchiffrement du message modifié:", err);
        }
      }
    );

    newSocket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    newSocket.on("user_typing", ({ userId, username }) => {
      setTypingUsers((prev) => new Set(prev).add(username));
      setTimeout(() => {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      }, 3000);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [user, selectedConversation]);

  // Charger les clés de l'utilisateur
  useEffect(() => {
    if (!user) return;
    loadUserKeys();
  }, [user]);

  // Charger utilisateurs puis conversations au démarrage
  useEffect(() => {
    if (isOpen && user) {
      loadAllUsers();
    }
  }, [isOpen, user]);

  // Recharger conversations quand allUsers change
  useEffect(() => {
    if (isOpen && user && allUsers.length > 0) {
      loadConversations();
    }
  }, [allUsers]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadUserKeys = async () => {
    try {
      const keys = await getUserKeys();
      setUserKeys(keys.data);
    } catch (error) {
      // Si l'utilisateur n'a pas de clés (404), les générer automatiquement
      if (error.response?.status === 404) {
        console.log(
          "🔑 Génération des clés de chiffrement pour la première utilisation..."
        );
        await generateAndSaveKeys();
      } else {
        console.error("Échec du chargement des clés:", error);
      }
    }
  };

  const generateAndSaveKeys = async () => {
    try {
      const { generateKeyPair } = await import("../utils/crypto");
      const keyPair = generateKeyPair();

      // Sauvegarder dans la DB
      await saveUserKeys(keyPair.publicKey, keyPair.secretKey);

      // Sauvegarder localement
      setUserKeys({
        publicKey: keyPair.publicKey,
        encryptedPrivateKey: keyPair.secretKey,
      });

      console.log("✅ Clés de chiffrement générées et sauvegardées !");
    } catch (error) {
      console.error("Échec de la génération des clés:", error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      // Enrichir les conversations avec les usernames depuis allUsers
      const enriched = response.data.map((conv) => {
        const otherUser = allUsers.find((u) => u.id === conv.otherUserId);
        return {
          ...conv,
          otherUsername: otherUser?.username || `User #${conv.otherUserId}`,
        };
      });
      setConversations(enriched);
    } catch (error) {
      console.error("Échec du chargement des conversations:", error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await getMessagingUsers();
      console.log("📋 Utilisateurs chargés:", response.data);
      setAllUsers(response.data);
    } catch (error) {
      console.error("❌ Échec du chargement des utilisateurs:", error);
      console.error("Détails de l'erreur:", error.response?.data);
    }
  };

  const openConversation = async (conv) => {
    setLoading(true);
    try {
      const response = await getConversation(conv.otherUserId);
      const data = response.data;
      setSelectedConversation({ ...data, otherUserId: conv.otherUserId });

      // Déchiffrer tous les messages
      const decryptedMessages = [];
      for (const msg of data.messages) {
        const decrypted = await decryptAndAddMessage(msg, false);
        if (decrypted) decryptedMessages.push(decrypted);
      }

      // Enrichir les messages avec les données de réponse
      const enrichedMessages = decryptedMessages.map((msg) => {
        if (msg.replyToId) {
          const replyToMsg = decryptedMessages.find(
            (m) => m.id === msg.replyToId
          );
          return { ...msg, replyTo: replyToMsg || null };
        }
        return msg;
      });

      setMessages(enrichedMessages.reverse());

      // Marquer comme lu
      if (socket) {
        socket.emit("mark_read", { conversationId: data.id });

        // Mettre à jour le unreadCount localement
        setConversations((prev) =>
          prev.map((c) => (c.id === data.id ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const decryptAndAddMessage = async (message, addToList = true) => {
    try {
      if (!userKeys) return null;

      const isOwnMessage = message.senderId === user.id;
      const otherUserId = isOwnMessage ? message.recipientId : message.senderId;

      // Vérifier si c'est le bot (messages en clair)
      const isBotMessage =
        otherUserId === 12 ||
        allUsers.find((u) => u.id === otherUserId)?.username === "DeepSeaBot";

      let decryptedContent;
      if (isBotMessage) {
        // Message en clair du/pour le bot
        decryptedContent = message.encryptedContent;
      } else {
        // Récupérer la clé publique de l'autre utilisateur
        const response = await getUserPublicKey(otherUserId);
        const otherPublicKey = response.data.publicKey;

        decryptedContent = decryptMessage(
          message.encryptedContent,
          otherPublicKey,
          userKeys.encryptedPrivateKey
        );
      }

      const decryptedMessage = {
        ...message,
        content: decryptedContent,
        isOwn: isOwnMessage,
      };

      if (addToList) {
        setMessages((prev) => [...prev, decryptedMessage]);
      }

      return decryptedMessage;
    } catch (error) {
      console.error("Échec du déchiffrement:", error);
      return null;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !socket || !userKeys)
      return;

    try {
      // Mode édition
      if (editingMessage) {
        // Vérifier si c'est le bot
        const isBot =
          selectedConversation.otherUserId === 12 ||
          allUsers.find((u) => u.id === selectedConversation.otherUserId)
            ?.username === "DeepSeaBot";

        let encryptedContent;
        if (isBot) {
          // Message en clair pour le bot
          encryptedContent = newMessage;
        } else {
          // Récupérer la clé publique du destinataire
          const response = await getUserPublicKey(
            selectedConversation.otherUserId
          );
          const recipientPublicKey = response.data.publicKey;

          // Chiffrer le nouveau contenu
          encryptedContent = encryptMessage(
            newMessage,
            recipientPublicKey,
            userKeys.encryptedPrivateKey
          );
        }

        socket.emit("edit_message", {
          messageId: editingMessage.id,
          encryptedContent,
        });

        // Update local
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, content: newMessage, isEdited: true }
              : m
          )
        );

        setEditingMessage(null);
        setNewMessage("");
        return;
      }

      // Si c'est le bot, pas de chiffrement
      const isBot =
        selectedConversation.otherUserId === 12 ||
        allUsers.find((u) => u.id === selectedConversation.otherUserId)
          ?.username === "DeepSeaBot";

      let encryptedContent;
      if (isBot) {
        // Message en clair pour le bot
        encryptedContent = newMessage;
      } else {
        // Récupérer la clé publique du destinataire
        const response = await getUserPublicKey(
          selectedConversation.otherUserId
        );
        const recipientPublicKey = response.data.publicKey;

        // Chiffrer le message
        encryptedContent = encryptMessage(
          newMessage,
          recipientPublicKey,
          userKeys.encryptedPrivateKey
        );
      }

      // Envoyer via WebSocket
      socket.emit("send_message", {
        recipientId: selectedConversation.otherUserId,
        encryptedContent,
        isBot,
        conversationId: selectedConversation.id,
        replyToId: replyingTo?.id, // Ajouter l'ID du message auquel on répond
      });

      // Ajouter localement (optimistic update)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          content: newMessage,
          senderId: user.id,
          isOwn: true,
          createdAt: new Date().toISOString(),
          replyTo: replyingTo,
        },
      ]);

      setNewMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Échec de l'envoi du message:", error);
    }
  };

  const handleTyping = () => {
    if (socket && selectedConversation) {
      socket.emit("typing", { recipientId: selectedConversation.otherUserId });
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Bouton Flottant */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 flex items-center gap-2"
        >
          <FaComments size={24} />
          {conversations.some((c) => c.unreadCount > 0) && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
            </span>
          )}
        </button>
      )}

      {/* Fenêtre de Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FaLock size={16} />
              <h3 className="font-bold">
                {selectedConversation ? "Conversation Chiffrée" : "Messages"}
              </h3>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                setSelectedConversation(null);
              }}
              className="hover:bg-blue-700 p-1 rounded"
            >
              <FaTimes />
            </button>
          </div>

          {/* Liste des conversations et utilisateurs */}
          {!selectedConversation && (
            <div className="flex-1 overflow-y-auto">
              {/* Bouton DeepSea Bot */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-cyan-500">
                <button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      const botUser = allUsers.find(
                        (u) => u.username === "DeepSeaBot"
                      );
                      if (botUser) {
                        const response = await getConversation(botUser.id);
                        const data = response.data;
                        setSelectedConversation({
                          ...data,
                          otherUserId: botUser.id,
                          otherUsername: "DeepSea Bot 🤖",
                        });

                        const decryptedMessages = [];
                        for (const msg of data.messages) {
                          const decrypted = await decryptAndAddMessage(
                            msg,
                            false
                          );
                          if (decrypted) decryptedMessages.push(decrypted);
                        }
                        setMessages(decryptedMessages.reverse());
                      }
                    } catch (error) {
                      console.error("Échec d'ouverture du bot:", error);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-blue-50 flex items-center gap-3 shadow-lg"
                >
                  <span className="text-2xl">🤖</span>
                  <div className="text-left flex-1">
                    <p className="font-bold">Parler au DeepSea Bot</p>
                    <p className="text-xs text-gray-600">
                      Assistant virtuel disponible 24/7
                    </p>
                  </div>
                </button>
              </div>

              {/* Conversations existantes */}
              {conversations.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 px-4 py-2">
                    CONVERSATIONS
                  </h3>
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv)}
                      className="w-full p-4 border-b hover:bg-gray-50 text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {(conv.otherUsername || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold">
                            {conv.otherUsername || `User #${conv.otherUserId}`}
                          </p>
                          {conv.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          <FaLock size={10} className="inline mr-1" />
                          Message chiffré
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tous les utilisateurs */}
              {allUsers.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 px-4 py-2">
                    TOUS LES UTILISATEURS
                  </h3>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={async () => {
                        // Créer ou ouvrir la conversation avec cet utilisateur
                        setLoading(true);
                        try {
                          const response = await getConversation(u.id);
                          const data = response.data;
                          setSelectedConversation({
                            ...data,
                            otherUserId: u.id,
                          });

                          // Déchiffrer tous les messages
                          const decryptedMessages = [];
                          for (const msg of data.messages) {
                            const decrypted = await decryptAndAddMessage(
                              msg,
                              false
                            );
                            if (decrypted) decryptedMessages.push(decrypted);
                          }
                          setMessages(decryptedMessages.reverse());

                          // Marquer comme lu
                          if (socket) {
                            socket.emit("mark_read", {
                              conversationId: data.id,
                            });

                            // Mettre à jour le unreadCount localement
                            setConversations((prev) =>
                              prev.map((c) =>
                                c.id === data.id ? { ...c, unreadCount: 0 } : c
                              )
                            );
                          }
                        } catch (error) {
                          console.error("Failed to open conversation:", error);
                        }
                        setLoading(false);
                      }}
                      className="w-full p-4 border-b hover:bg-gray-50 text-left flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{u.username}</p>
                        <p className="text-sm text-gray-500">Disponible</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {conversations.length === 0 && allUsers.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  <FaComments size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Aucun utilisateur disponible</p>
                </div>
              )}
            </div>
          )}

          {/* Conversation */}
          {selectedConversation && (
            <>
              {/* Back button */}
              <button
                onClick={() => {
                  setSelectedConversation(null);
                  setMessages([]);
                }}
                className="p-2 text-blue-600 hover:bg-gray-100 text-left"
              >
                ← Retour
              </button>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loading ? (
                  <div className="text-center text-gray-500">Chargement...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-10">
                    <FaLock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Conversation cryptée de bout en bout
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.isOwn ? "justify-end" : "justify-start"
                      } relative`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          messageId: msg.id,
                          x: e.clientX,
                          y: e.clientY,
                          msg,
                        });
                      }}
                      onTouchStart={(e) => {
                        const touch = e.touches[0];
                        const longPressTimer = setTimeout(() => {
                          setContextMenu({
                            messageId: msg.id,
                            x: touch.clientX,
                            y: touch.clientY,
                            msg,
                          });
                        }, 500);
                        e.target.dataset.longPressTimer = longPressTimer;
                      }}
                      onTouchEnd={(e) => {
                        if (e.target.dataset.longPressTimer) {
                          clearTimeout(
                            parseInt(e.target.dataset.longPressTimer)
                          );
                        }
                      }}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          msg.isOwn
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800"
                        } ${msg.isEdited ? "opacity-90" : ""}`}
                      >
                        {msg.replyTo && (
                          <div className="text-xs opacity-70 mb-2 p-2 bg-black bg-opacity-10 rounded">
                            Réponse à: {msg.replyTo.content?.substring(0, 50)}
                            ...
                          </div>
                        )}
                        <p className="break-words">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1 flex items-center gap-1">
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {msg.isEdited && <span>(modifié)</span>}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="px-4 text-sm text-gray-500 italic">
                  {Array.from(typingUsers).join(", ")} est en train d'écrire...
                </div>
              )}

              {/* Reply/Edit preview */}
              {(replyingTo || editingMessage) && (
                <div className="px-4 py-2 bg-gray-100 border-t flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 font-semibold">
                      {editingMessage
                        ? "✏️ Modifier le message"
                        : "↩️ Répondre à"}
                    </p>
                    <p className="text-sm text-gray-700 truncate">
                      {(editingMessage || replyingTo)?.content}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setReplyingTo(null);
                      setEditingMessage(null);
                      setNewMessage("");
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              {/* Input */}
              <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleTyping}
                  placeholder="Message chiffré E2E..."
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
            style={{
              left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
              top: `${Math.min(contextMenu.y, window.innerHeight - 200)}px`,
            }}
          >
            <button
              onClick={() => {
                setReplyingTo(contextMenu.msg);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
            >
              <span>↩️</span>
              <span>Répondre</span>
            </button>

            {contextMenu.msg.isOwn && (
              <>
                <button
                  onClick={() => {
                    setEditingMessage(contextMenu.msg);
                    setNewMessage(contextMenu.msg.content);
                    setContextMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span>Modifier</span>
                </button>

                <button
                  onClick={async () => {
                    if (confirm("Supprimer ce message?")) {
                      try {
                        socket.emit("delete_message", {
                          messageId: contextMenu.messageId,
                        });
                        setMessages((prev) =>
                          prev.filter((m) => m.id !== contextMenu.messageId)
                        );
                        setContextMenu(null);
                      } catch (error) {
                        console.error("Échec de la suppression:", error);
                      }
                    }
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <span>🗑️</span>
                  <span>Supprimer</span>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
