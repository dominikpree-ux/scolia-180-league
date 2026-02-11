import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConversationManager({ userId, userType = "player", team = null }) {
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ["messages", userId, userType],
    queryFn: async () => {
      if (userType === "player") {
        const sent = await base44.entities.PlayerMessage.filter({ player_from_id: userId });
        const received = await base44.entities.PlayerMessage.filter({ player_to_id: userId });
        const fromTeam = team ? await base44.entities.PlayerMessage.filter({ team_from_id: team.id }) : [];
        return [...sent, ...received, ...fromTeam];
      } else {
        const sent = await base44.entities.TeamMessage.filter({ team_from_id: userId });
        const received = await base44.entities.TeamMessage.filter({ team_to_id: userId });
        return [...sent, ...received];
      }
    },
  });

  // Fetch requests
  const { data: allRequests = [] } = useQuery({
    queryKey: ["requests", userId, userType],
    queryFn: async () => {
      if (userType === "player") {
        const sent = await base44.entities.PlayerRequest.filter({ player_id: userId });
        const received = team ? await base44.entities.PlayerRequest.filter({ team_id: team.id }) : [];
        return [...sent, ...received];
      }
      return [];
    },
  });

  // Real-time subscriptions
  useEffect(() => {
    const unsubMsg = base44.entities.PlayerMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });
    const unsubReq = base44.entities.PlayerRequest.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    });
    const unsubTeamMsg = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });
    return () => {
      unsubMsg();
      unsubReq();
      unsubTeamMsg();
    };
  }, [queryClient]);

  // Build conversations list
  const conversations = (() => {
    const convMap = new Map();
    
    allMessages.forEach((msg) => {
      if (userType === "player") {
        if (msg.team_from_id) {
          const key = `team-${msg.team_from_id}`;
          convMap.set(key, {
            id: msg.team_from_id,
            name: msg.team_from_name,
            type: "team",
            lastMessage: msg.message,
            hasUnread: msg.player_to_id === userId && msg.status === "pending",
          });
        } else {
          const otherId = msg.player_from_id === userId ? msg.player_to_id : msg.player_from_id;
          const otherName = msg.player_from_id === userId ? msg.player_to_name : msg.player_from_name;
          const key = `player-${otherId}`;
          convMap.set(key, {
            id: otherId,
            name: otherName,
            type: "player",
            lastMessage: msg.message,
            hasUnread: msg.player_to_id === userId && msg.status === "pending",
          });
        }
      } else {
        const otherId = msg.team_from_id === userId ? msg.team_to_id : msg.team_from_id;
        const otherName = msg.team_from_id === userId ? msg.team_to_name : msg.team_from_name;
        const key = `team-${otherId}`;
        convMap.set(key, {
          id: otherId,
          name: otherName,
          type: "team",
          lastMessage: msg.message,
          hasUnread: msg.team_to_id === userId && msg.status === "pending",
        });
      }
    });

    allRequests.forEach((req) => {
      const key = `request-${req.player_id}-${req.team_id}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          id: userType === "player" ? req.team_id : req.player_id,
          name: userType === "player" ? req.team_name : req.player_name,
          type: userType === "player" ? "team" : "player",
          lastMessage: req.message,
          hasUnread: userType === "player" ? req.status === "pending" : req.status === "pending",
        });
      }
    });

    return Array.from(convMap.values());
  })();

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (!selectedConvId && conversations.length > 0) {
      setSelectedConvId(`${conversations[0].type}-${conversations[0].id}`);
    }
  }, [conversations.length, selectedConvId]);

  // Get messages for selected conversation
  const conversationMessages = selectedConvId
    ? (() => {
        const msgs = userType === "player"
          ? allMessages.filter((m) => {
              if (typeof selectedConvId === "string" && selectedConvId.startsWith("team-")) {
                return m.team_from_id === selectedConvId.replace("team-", "");
              }
              const otherId = selectedConvId.replace("player-", "");
              return (m.player_from_id === otherId || m.player_to_id === otherId) && !m.team_from_id;
            })
          : allMessages.filter((m) => {
              const otherId = selectedConvId.replace("team-", "");
              return m.team_from_id === otherId || m.team_to_id === otherId;
            });
        
        return [...msgs, ...allRequests].filter((item) => {
          if (userType === "player" && item.team_id) {
            return item.team_id === selectedConvId.replace("team-", "");
          }
          return true;
        });
      })()
    : [];

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConvId) return;

      if (userType === "player") {
        if (selectedConvId.startsWith("team-")) {
          const teamId = selectedConvId.replace("team-", "");
          const existingReq = conversationMessages.find(
            (r) => r.player_id === userId && r.team_id === teamId && r.status === "pending"
          );

          if (existingReq) {
            await base44.entities.PlayerRequest.update(existingReq.id, {
              team_response: messageText,
              status: "accepted",
            });
          } else {
            const player = await base44.auth.me();
            await base44.entities.PlayerRequest.create({
              player_id: userId,
              player_name: player.full_name,
              player_email: player.email,
              team_id: teamId,
              team_name: conversationMessages[0]?.team_name || "Unknown",
              message: messageText,
              status: "pending",
            });
          }
        } else {
        const playerId = selectedConvId.replace("player-", "");
        const existingMsg = conversationMessages.find(
          (m) => m.player_from_id === playerId && m.player_to_id === userId && m.status === "pending"
        );

        if (existingMsg) {
          await base44.entities.PlayerMessage.update(existingMsg.id, {
            response: messageText,
            status: "answered",
          });
        } else {
          const player = await base44.auth.me();
          const otherPlayer = conversationMessages[0];
          const otherName = otherPlayer?.player_from_id === userId ? otherPlayer?.player_to_name : otherPlayer?.player_from_name;
          await base44.entities.PlayerMessage.create({
            player_from_id: userId,
            player_from_name: player.full_name,
            player_to_id: playerId,
            player_to_name: otherName || "Unknown",
            message: messageText,
            status: "pending",
          });
        }
        }
      } else {
        const teamId = selectedConvId.replace("team-", "");
        const existingMsg = conversationMessages.find(
          (m) => m.team_from_id === teamId && m.team_to_id === userId && m.status === "pending"
        );

        if (existingMsg) {
          await base44.entities.TeamMessage.update(existingMsg.id, {
            response: messageText,
            status: "answered",
          });
        } else {
          await base44.entities.TeamMessage.create({
            team_from_id: userId,
            team_from_name: conversationMessages[0]?.team_from_name || "Unknown",
            team_to_id: teamId,
            team_to_name: conversationMessages[0]?.team_to_name || "Unknown",
            message: messageText,
            status: "pending",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", userId, userType] });
      queryClient.invalidateQueries({ queryKey: ["requests", userId, userType] });
      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (convId) => {
      const toDelete = conversationMessages;
      for (const msg of toDelete) {
        if (msg.id && (msg.player_from_id || msg.team_from_id)) {
          if (msg.player_from_id) {
            await base44.entities.PlayerMessage.delete(msg.id);
          } else if (msg.team_from_id) {
            await base44.entities.TeamMessage.delete(msg.id);
          }
        } else if (msg.id) {
          await base44.entities.PlayerRequest.delete(msg.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setSelectedConvId(null);
      setDeleteConfirm(null);
      toast.success("Konversation gelöscht!");
    },
  });

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 h-96">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-800 pr-4 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Konversationen</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={`${conv.type}-${conv.id}`}
                  className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition-colors group cursor-pointer ${
                    selectedConvId === `${conv.type}-${conv.id}`
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedConvId(`${conv.type}-${conv.id}`);
                      setMessageText("");
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-white">{conv.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {conv.type === "team" ? "Team" : "Spieler"} {conv.hasUnread && "• neu"}
                    </p>
                  </button>
                  {conv.hasUnread && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteConfirm({ id: `${conv.type}-${conv.id}`, name: conv.name })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Chat Area */}
          {selectedConvId ? (
            <div className="w-2/3 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Nachrichten</p>
                ) : (
                  conversationMessages.map((msg, idx) => {
                    const isIncoming = userType === "player"
                      ? msg.team_from_id || msg.player_from_id !== userId
                      : msg.team_from_id !== userId;

                    return (
                      <div key={msg.id || idx} className="space-y-2">
                        {isIncoming && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              {msg.team_from_name || msg.player_from_name || msg.team_name}
                            </p>
                            <p className="text-sm text-white">{msg.message}</p>
                            {(msg.response || msg.team_response) && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-400 mb-1">Antwort:</p>
                                <p className="text-sm text-white">{msg.response || msg.team_response}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {!isIncoming && (
                          <div className="bg-blue-600/20 rounded-lg p-3 ml-auto max-w-xs">
                            <p className="text-xs text-blue-400 mb-1">Du</p>
                            <p className="text-sm text-white">{msg.message}</p>
                            {(msg.response || msg.team_response) && (
                              <div className="mt-2 pt-2 border-t border-blue-500/30">
                                <p className="text-xs text-blue-300 mb-1">Antwort:</p>
                                <p className="text-sm text-white">{msg.response || msg.team_response}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage.mutate()}
                  placeholder="Nachricht schreiben..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
                />
                <Button
                  onClick={() => sendMessage.mutate()}
                  disabled={!messageText.trim() || sendMessage.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white border-0"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-2/3 flex items-center justify-center text-gray-500">
              <p className="text-sm">{conversations.length === 0 ? "Keine Konversationen" : "Wähle eine Konversation"}</p>
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#111111] border-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Konversation löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Die Konversation mit {deleteConfirm?.name} wird gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2a2a2a] text-gray-400">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversation.mutate(deleteConfirm.id)}
              disabled={deleteConversation.isPending}
              className="bg-red-600 hover:bg-red-500"
            >
              Löschen
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}