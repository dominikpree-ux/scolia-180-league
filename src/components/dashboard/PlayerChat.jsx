import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function PlayerChat({ player }) {
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  // Fetch all messages for this player
  const { data: allMessages = [] } = useQuery({
    queryKey: ["player-chat", player.id],
    queryFn: async () => {
      const sent = await base44.entities.PlayerMessage.filter({ player_from_id: player.id });
      const received = await base44.entities.PlayerMessage.filter({ player_to_id: player.id });
      return [...sent, ...received];
    },
  });

  // Get unique conversations
  const conversations = Array.from(
    new Map(
      allMessages.map((msg) => {
        const otherId = msg.player_from_id === player.id ? msg.player_to_id : msg.player_from_id;
        const otherName = msg.player_from_id === player.id ? msg.player_to_name : msg.player_from_name;
        return [otherId, { id: otherId, name: otherName }];
      })
    ).values()
  );

  // Get messages for selected conversation
  const conversationMessages = selectedPlayerId
    ? allMessages.filter(
        (msg) =>
          (msg.player_from_id === player.id && msg.player_to_id === selectedPlayerId) ||
          (msg.player_from_id === selectedPlayerId && msg.player_to_id === player.id)
      )
    : [];

  const selectedConversation = conversations.find((c) => c.id === selectedPlayerId);

  // Send or respond to message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedPlayerId) return;

      const existingMsg = conversationMessages.find(
        (m) => m.player_from_id === selectedPlayerId && m.player_to_id === player.id && m.status === "pending"
      );

      if (existingMsg) {
        // Respond to existing message
        await base44.entities.PlayerMessage.update(existingMsg.id, {
          response: messageText,
          status: "answered",
        });
      } else {
        // Send new message
        await base44.entities.PlayerMessage.create({
          player_from_id: player.id,
          player_from_name: player.name,
          player_to_id: selectedPlayerId,
          player_to_name: selectedConversation.name,
          message: messageText,
          status: "pending",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["player-chat"] });
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
                  key={conv.id}
                  onClick={() => {
                    setSelectedPlayerId(conv.id);
                    setMessageText("");
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    selectedPlayerId === conv.id
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <p className="text-sm font-medium text-white">{conv.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Klicken zum Öffnen</p>
                </button>
              ))
            )}
          </div>

          {/* Chat Area */}
          {selectedPlayerId ? (
            <div className="w-2/3 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Nachrichten</p>
                ) : (
                  conversationMessages.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* Incoming message */}
                      {msg.player_from_id === selectedPlayerId && (
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-xs text-gray-400 mb-1">{msg.player_from_name}</p>
                          <p className="text-sm text-white">{msg.message}</p>
                          {msg.response && (
                            <div className="mt-2 pt-2 border-t border-gray-700">
                              <p className="text-xs text-gray-400 mb-1">Antwort:</p>
                              <p className="text-sm text-white">{msg.response}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Outgoing message */}
                      {msg.player_from_id === player.id && (
                        <div className="bg-blue-600/20 rounded-lg p-3 ml-auto max-w-xs">
                          <p className="text-xs text-blue-400 mb-1">Du</p>
                          <p className="text-sm text-white">{msg.message}</p>
                        </div>
                      )}
                    </div>
                  ))
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
              <p className="text-sm">Wähle eine Konversation</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}