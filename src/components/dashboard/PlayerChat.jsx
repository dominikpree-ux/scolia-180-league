import React, { useState } from "react";
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

export default function PlayerChat({ player, team = null }) {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'player' or 'team'
  const [messageText, setMessageText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all messages for this player
  const { data: playerMessages = [] } = useQuery({
   queryKey: ["player-messages", player.id],
   queryFn: async () => {
     const sent = await base44.entities.PlayerMessage.filter({ player_from_id: player.id });
     const received = await base44.entities.PlayerMessage.filter({ player_to_id: player.id });
     const fromTeam = team ? await base44.entities.PlayerMessage.filter({ team_from_id: team.id }) : [];
     return [...sent, ...received, ...fromTeam];
   },
  });

  // Fetch all requests for this player
  const { data: playerRequests = [] } = useQuery({
    queryKey: ["player-requests", player.id],
    queryFn: async () => {
      const sent = await base44.entities.PlayerRequest.filter({ player_id: player.id });
      const received = team ? await base44.entities.PlayerRequest.filter({ team_id: team.id }) : [];
      return [...sent, ...received];
    },
  });

  // Get unique conversations from player messages
  const playerConversations = Array.from(
    new Map(
      playerMessages.map((msg) => {
        // Team to player messages
        if (msg.team_from_id) {
          return [msg.team_from_id + '-team', { id: msg.team_from_id, name: msg.team_from_name, type: 'team' }];
        }
        // Player to player messages
        const otherId = msg.player_from_id === player.id ? msg.player_to_id : msg.player_from_id;
        const otherName = msg.player_from_id === player.id ? msg.player_to_name : msg.player_from_name;
        return [otherId, { id: otherId, name: otherName, type: 'player' }];
      })
    ).values()
  );

  // Get unique conversations from player requests
  const requestConversations = Array.from(
    new Map(
      playerRequests.map((req) => {
        const otherId = req.player_id === player.id ? req.team_id : req.player_id;
        const otherName = req.player_id === player.id ? req.team_name : req.player_name;
        const type = req.player_id === player.id ? 'team' : 'player';
        return [otherId + '-' + type, { id: otherId, name: otherName, type }];
      })
    ).values()
  );

  const conversations = [...playerConversations, ...requestConversations];

  // Get messages for selected conversation
  const conversationMessages = selectedType === 'player' && selectedId
    ? playerMessages.filter(
        (msg) =>
          (msg.player_from_id === player.id && msg.player_to_id === selectedId && !msg.team_from_id) ||
          (msg.player_from_id === selectedId && msg.player_to_id === player.id && !msg.team_from_id)
      )
    : selectedType === 'team' && selectedId
    ? [
        ...playerMessages.filter((msg) => msg.team_from_id === selectedId && msg.player_to_id === player.id),
        ...playerRequests.filter((req) => req.player_id === player.id && req.team_id === selectedId),
        ...playerRequests.filter((req) => req.team_id === team?.id && req.player_id === selectedId),
      ]
    : [];

  const selectedConversation = conversations.find((c) => c.id === selectedId && c.type === selectedType);

  // Send or respond to message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedId || !selectedType) return;

      if (selectedType === 'player') {
        const existingMsg = conversationMessages.find(
          (m) => m.player_from_id === selectedId && m.player_to_id === player.id && m.status === "pending"
        );

        if (existingMsg) {
          await base44.entities.PlayerMessage.update(existingMsg.id, {
            response: messageText,
            status: "answered",
          });
        } else {
          await base44.entities.PlayerMessage.create({
            player_from_id: player.id,
            player_from_name: player.name,
            player_to_id: selectedId,
            player_to_name: selectedConversation.name,
            message: messageText,
            status: "pending",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["player-messages"] });
      } else if (selectedType === 'team') {
        const existingReq = conversationMessages.find(
          (r) => r.player_id === player.id && r.team_id === selectedId && r.status === "pending"
        );

        if (existingReq) {
          await base44.entities.PlayerRequest.update(existingReq.id, {
            team_response: messageText,
            status: "accepted",
          });
        } else {
          await base44.entities.PlayerRequest.create({
            player_id: player.id,
            player_name: player.name,
            player_email: player.email,
            team_id: selectedId,
            team_name: selectedConversation.name,
            message: messageText,
            status: "pending",
          });
        }
        queryClient.invalidateQueries({ queryKey: ["player-requests"] });
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async ({ convId, convType }) => {
      if (convType === 'player') {
        const messagesToDelete = playerMessages.filter(
          (msg) =>
            (msg.player_from_id === convId && msg.player_to_id === player.id && !msg.team_from_id) ||
            (msg.player_from_id === player.id && msg.player_to_id === convId && !msg.team_from_id)
        );
        for (const msg of messagesToDelete) {
          await base44.entities.PlayerMessage.delete(msg.id);
        }
      } else if (convType === 'team') {
        const messagesToDelete = playerMessages.filter(
          (msg) => msg.team_from_id === convId && msg.player_to_id === player.id
        );
        for (const msg of messagesToDelete) {
          await base44.entities.PlayerMessage.delete(msg.id);
        }
        const requestsToDelete = playerRequests.filter(
          (req) => req.player_id === player.id && req.team_id === convId
        );
        for (const req of requestsToDelete) {
          await base44.entities.PlayerRequest.delete(req.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-messages"] });
      queryClient.invalidateQueries({ queryKey: ["player-requests"] });
      setSelectedId(null);
      setSelectedType(null);
      setDeleteConfirm(null);
      toast.success("Konversation gelöscht!");
    },
  });

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Spieler-Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 h-96">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-800 pr-4 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-sm">Keine Konversationen</p>
            ) : (
              conversations.map((conv) => {
                // Check for unread messages
                let hasUnread = false;
                
                if (conv.type === 'player') {
                  hasUnread = playerMessages.some(
                    msg => msg.player_from_id === conv.id && msg.player_to_id === player.id && msg.status === "pending"
                  );
                } else if (conv.type === 'team') {
                  hasUnread = playerMessages.some(
                    msg => msg.team_from_id === conv.id && msg.player_to_id === player.id && msg.status === "pending"
                  ) || playerRequests.some(
                    req => req.team_id === conv.id && req.player_id === player.id && req.status === "pending"
                  );
                }

                return (
                <div
                  key={`${conv.id}-${conv.type}`}
                  className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition-colors group ${
                    selectedId === conv.id && selectedType === conv.type
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedId(conv.id);
                      setSelectedType(conv.type);
                      setMessageText("");
                    }}
                    className="flex-1 text-left"
                  >
                    <p className={`text-sm font-medium ${hasUnread ? "text-white font-semibold" : "text-white"}`}>{conv.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{conv.type === 'team' ? 'Team' : 'Spieler'} {hasUnread && "• neue Nachricht"}</p>
                  </button>
                  {hasUnread && (
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteConfirm({ id: conv.id, type: conv.type, name: conv.name })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
              })
            )}
          </div>

          {/* Chat Area */}
          {selectedId && selectedType ? (
            <div className="w-2/3 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Nachrichten</p>
                ) : (
                  conversationMessages.map((msg) => {
                    const isIncoming = selectedType === 'player' 
                      ? msg.player_from_id === selectedId
                      : msg.team_from_id === selectedId || msg.player_id !== player.id;

                    return (
                      <div key={msg.id} className="space-y-2">
                        {isIncoming && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              {msg.team_from_name || msg.player_from_name || msg.team_name}
                            </p>
                            <p className="text-sm text-white">
                              {msg.message}
                            </p>
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
                            <p className="text-sm text-white">
                              {msg.message}
                            </p>
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

              {/* Input Area */}
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
              <p className="text-sm">{conversations.length === 0 ? 'Keine Konversationen' : 'Wähle eine Konversation'}</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#111111] border-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Konversation löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Die Konversation mit <span className="font-semibold text-white">{deleteConfirm?.name}</span> wird gelöscht und kann nicht wiederhergestellt werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-white/5">
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConversation.mutate({ convId: deleteConfirm.id, convType: deleteConfirm.type })}
              disabled={deleteConversation.isPending}
              className="bg-red-600 hover:bg-red-500 text-white border-0"
            >
              {deleteConversation.isPending ? "Löscht..." : "Löschen"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}