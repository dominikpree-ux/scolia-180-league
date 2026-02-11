import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function PlayerChat({ player, team = null }) {
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null); // 'player' or 'team'
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  // Fetch all messages for this player
  const { data: playerMessages = [] } = useQuery({
    queryKey: ["player-messages", player.id],
    queryFn: async () => {
      const sent = await base44.entities.PlayerMessage.filter({ player_from_id: player.id });
      const received = await base44.entities.PlayerMessage.filter({ player_to_id: player.id });
      return [...sent, ...received];
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
          (msg.player_from_id === player.id && msg.player_to_id === selectedId) ||
          (msg.player_from_id === selectedId && msg.player_to_id === player.id)
      )
    : selectedType === 'team' && selectedId
    ? playerRequests.filter(
        (req) =>
          (req.player_id === player.id && req.team_id === selectedId) ||
          (req.team_id === team?.id && req.player_id === selectedId)
      )
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
              conversations.map((conv) => (
                <button
                  key={`${conv.id}-${conv.type}`}
                  onClick={() => {
                    setSelectedId(conv.id);
                    setSelectedType(conv.type);
                    setMessageText("");
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    selectedId === conv.id && selectedType === conv.type
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{conv.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{conv.type === 'team' ? 'Team' : 'Spieler'}</p>
                </button>
              ))
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
                      : msg.player_id !== player.id;

                    return (
                      <div key={msg.id} className="space-y-2">
                        {isIncoming && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">
                              {selectedType === 'player' ? msg.player_from_name : msg.team_name}
                            </p>
                            <p className="text-sm text-white">
                              {selectedType === 'player' ? msg.message : msg.message}
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
                              {selectedType === 'player' ? msg.message : msg.message}
                            </p>
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
    </Card>
  );
}