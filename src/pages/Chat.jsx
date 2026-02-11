import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
    };
    loadUser();
  }, []);

  // Fetch all messages
  const { data: messages = [] } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Fetch both player and team messages
      const playerMsgs = await base44.entities.PlayerMessage.filter({});
      const teamMsgs = await base44.entities.TeamMessage.filter({});
      
      return [...playerMsgs, ...teamMsgs];
    },
    enabled: !!user?.id,
  });

  // Build conversations
  const conversations = (() => {
    const convMap = new Map();
    
    messages.forEach((msg) => {
      let key, name;
      
      if ("player_from_id" in msg) {
        // PlayerMessage
        if (msg.player_from_id === user?.id) {
          key = `team-${msg.team_to_id}`;
          name = msg.team_to_name;
        } else {
          key = `player-${msg.player_from_id}`;
          name = msg.player_from_name;
        }
      } else {
        // TeamMessage
        if (msg.team_from_id === user?.id) {
          key = `team-${msg.team_to_id}`;
          name = msg.team_to_name;
        } else {
          key = `team-${msg.team_from_id}`;
          name = msg.team_from_name;
        }
      }
      
      if (key && !convMap.has(key)) {
        convMap.set(key, { key, name });
      }
    });
    
    return Array.from(convMap.values());
  })();

  // Get messages for selected conversation
  const conversationMessages = selectedConversation
    ? messages.filter((msg) => {
        if ("player_from_id" in msg) {
          if (selectedConversation.startsWith("team-")) {
            const teamId = selectedConversation.replace("team-", "");
            return msg.team_to_id === teamId || msg.team_from_id === teamId;
          } else {
            const playerId = selectedConversation.replace("player-", "");
            return msg.player_from_id === playerId || msg.player_to_id === playerId;
          }
        } else {
          const teamId = selectedConversation.replace("team-", "");
          return msg.team_to_id === teamId || msg.team_from_id === teamId;
        }
      })
    : [];

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConversation || !user) return;

      const [type, id] = selectedConversation.split("-");
      
      if (type === "team") {
        await base44.entities.TeamMessage.create({
          team_from_id: user.id,
          team_from_name: user.full_name || "Unknown",
          team_to_id: id,
          team_to_name: conversations.find(c => c.key === selectedConversation)?.name || "Unknown",
          message: messageText,
          status: "pending",
        });
      } else {
        await base44.entities.PlayerMessage.create({
          player_from_id: user.id,
          player_from_name: user.full_name || "Unknown",
          player_to_id: id,
          player_to_name: conversations.find(c => c.key === selectedConversation)?.name || "Unknown",
          message: messageText,
        });
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  // Subscribe to updates
  useEffect(() => {
    const unsub1 = base44.entities.PlayerMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });
    const unsub2 = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [queryClient]);

  if (!user) {
    return <div className="p-6 text-center text-gray-400">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">Chat</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-white mb-4">Chats</h2>
              {conversations.length === 0 ? (
                <p className="text-gray-500 text-sm">Keine Chats vorhanden</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.key}
                      onClick={() => setSelectedConversation(conv.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedConversation === conv.key
                          ? "bg-red-600 text-white"
                          : "text-gray-400 hover:bg-[#222222]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {conv.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 bg-[#1a1a1a] border-[#2a2a2a] flex flex-col">
            {selectedConversation ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversationMessages.length === 0 ? (
                    <p className="text-gray-500 text-sm">Noch keine Nachrichten</p>
                  ) : (
                    conversationMessages.map((msg, idx) => {
                      const isSent = ("player_from_id" in msg)
                        ? msg.player_from_id === user.id
                        : msg.team_from_id === user.id;

                      return (
                        <div key={idx} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-xs rounded-lg p-3 ${
                              isSent
                                ? "bg-red-600/30 text-white"
                                : "bg-[#2a2a2a] text-gray-200"
                            }`}
                          >
                            <p className="text-xs text-gray-400 mb-1">
                              {isSent ? "Du" : ("player_from_name" in msg ? msg.player_from_name : msg.team_from_name)}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-[#2a2a2a] p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nachricht eingeben..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMutation.mutate();
                        }
                      }}
                      className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    />
                    <Button
                      onClick={() => sendMutation.mutate()}
                      disabled={!messageText.trim() || sendMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Wähle einen Chat aus</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}