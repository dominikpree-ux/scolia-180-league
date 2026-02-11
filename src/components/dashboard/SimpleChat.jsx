import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Trash2 } from "lucide-react";
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

export default function SimpleChat({ user, userType, team = null }) {
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ["all-messages", user.id, userType],
    queryFn: async () => {
      let messages = [];
      
      if (userType === "player") {
        const sent = await base44.entities.PlayerMessage.filter({ player_from_id: user.id });
        const received = await base44.entities.PlayerMessage.filter({ player_to_id: user.id });
        const requests = await base44.entities.PlayerRequest.filter({ player_id: user.id });
        messages = [...sent, ...received, ...requests];
      } else {
        const sent = await base44.entities.TeamMessage.filter({ team_from_id: user.id });
        const received = await base44.entities.TeamMessage.filter({ team_to_id: user.id });
        messages = [...sent, ...received];
      }
      
      return messages;
    },
  });

  // Subscribe to updates
  useEffect(() => {
    const unsubMsg = base44.entities.PlayerMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["all-messages", user.id, userType] });
    });
    const unsubTeamMsg = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["all-messages", user.id, userType] });
    });
    const unsubReq = base44.entities.PlayerRequest.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["all-messages", user.id, userType] });
    });
    return () => {
      unsubMsg();
      unsubTeamMsg();
      unsubReq();
    };
  }, [queryClient, user.id, userType]);

  // Build conversations
  const conversations = (() => {
    const convMap = new Map();

    allMessages.forEach((msg) => {
      let key, convId, convName, convType;

      if (userType === "player") {
        if (msg.team_id) {
          // PlayerRequest
          key = `team-${msg.team_id}`;
          convId = msg.team_id;
          convName = msg.team_name;
          convType = "team";
        } else if (msg.team_from_id) {
          // Team to player message
          key = `team-${msg.team_from_id}`;
          convId = msg.team_from_id;
          convName = msg.team_from_name;
          convType = "team";
        } else {
          // Player to player message
          const otherId = msg.player_from_id === user.id ? msg.player_to_id : msg.player_from_id;
          const otherName = msg.player_from_id === user.id ? msg.player_to_name : msg.player_from_name;
          key = `player-${otherId}`;
          convId = otherId;
          convName = otherName;
          convType = "player";
        }
      } else {
        // Team
        const otherId = msg.team_from_id === user.id ? msg.team_to_id : msg.team_from_id;
        const otherName = msg.team_from_id === user.id ? msg.team_to_name : msg.team_from_name;
        key = `team-${otherId}`;
        convId = otherId;
        convName = otherName;
        convType = "team";
      }

      if (!convMap.has(key)) {
        convMap.set(key, {
          id: convId,
          name: convName,
          type: convType,
        });
      }
    });

    return Array.from(convMap.values());
  })();

  // Get messages for selected conversation
  const conversationMessages = selectedConvId
    ? (() => {
        const [type, id] = selectedConvId.split("-");
        const convId = parseInt(id) || id;

        return allMessages.filter((msg) => {
          if (userType === "player") {
            if (type === "team") {
              return (
                msg.team_id === convId ||
                msg.team_from_id === convId ||
                (msg.team_from_id && msg.player_to_id === user.id && msg.team_from_id === convId)
              );
            } else {
              return (
                (msg.player_from_id === convId && msg.player_to_id === user.id) ||
                (msg.player_from_id === user.id && msg.player_to_id === convId)
              );
            }
          } else {
            return (
              (msg.team_from_id === convId && msg.team_to_id === user.id) ||
              (msg.team_from_id === user.id && msg.team_to_id === convId)
            );
          }
        });
      })()
    : [];

  const selectedConv = conversations.find((c) => `${c.type}-${c.id}` === selectedConvId);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConvId || !selectedConv) return;

      const [type, id] = selectedConvId.split("-");
      const convId = parseInt(id) || id;

      if (userType === "player") {
        if (type === "team") {
          // Check if updating existing request
          const existing = conversationMessages.find(
            (m) => m.player_id === user.id && m.team_id === convId && m.status === "pending"
          );

          if (existing) {
            await base44.entities.PlayerRequest.update(existing.id, {
              team_response: messageText,
              status: "accepted",
            });
          } else {
            await base44.entities.PlayerRequest.create({
              player_id: user.id,
              player_name: user.full_name || user.name,
              player_email: user.email,
              team_id: convId,
              team_name: selectedConv.name,
              message: messageText,
              status: "pending",
            });
          }
        } else {
          // Player to player
          const existing = conversationMessages.find(
            (m) => m.player_from_id === convId && m.player_to_id === user.id && m.status === "pending"
          );

          if (existing) {
            await base44.entities.PlayerMessage.update(existing.id, {
              response: messageText,
              status: "answered",
            });
          } else {
            await base44.entities.PlayerMessage.create({
              player_from_id: user.id,
              player_from_name: user.full_name || user.name,
              player_to_id: convId,
              player_to_name: selectedConv.name,
              message: messageText,
              status: "pending",
            });
          }
        }
      } else {
        // Team
        const existing = conversationMessages.find(
          (m) => m.team_from_id === convId && m.team_to_id === user.id && m.status === "pending"
        );

        if (existing) {
          await base44.entities.TeamMessage.update(existing.id, {
            response: messageText,
            status: "answered",
          });
        } else {
          await base44.entities.TeamMessage.create({
            team_from_id: user.id,
            team_from_name: team?.name || "Unknown",
            team_to_id: convId,
            team_to_name: selectedConv.name,
            message: messageText,
            status: "pending",
          });
        }
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-messages"] });
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async () => {
      for (const msg of conversationMessages) {
        if (msg.id) {
          if (msg.player_from_id || msg.player_to_id) {
            if (msg.team_id) {
              await base44.entities.PlayerRequest.delete(msg.id);
            } else {
              await base44.entities.PlayerMessage.delete(msg.id);
            }
          } else {
            await base44.entities.TeamMessage.delete(msg.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-messages"] });
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
                    <p className="text-xs text-gray-500 mt-1">{conv.type === "team" ? "Team" : "Spieler"}</p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteConfirm({ id: selectedConvId, name: conv.name })}
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
                    let isIncoming = false;
                    
                    if (userType === "player") {
                      if (msg.team_id) {
                        isIncoming = false; // Own request
                      } else if (msg.team_from_id) {
                        isIncoming = true; // Team to player
                      } else {
                        isIncoming = msg.player_from_id !== user.id; // Player to player
                      }
                    } else {
                      isIncoming = msg.team_from_id !== user.id; // Team to team
                    }

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
              Die Konversation wird gelöscht und kann nicht wiederhergestellt werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2a2a2a] text-gray-400">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversation.mutate()}
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