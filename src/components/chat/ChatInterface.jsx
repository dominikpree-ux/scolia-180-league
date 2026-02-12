import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChatInterface({ forcedUserType, forcedUserId, forcedUserName }) {
  const [user, setUser] = useState(null);
  const [team, setTeam] = useState(null);
  const [userType, setUserType] = useState(forcedUserType || null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const me = await base44.auth.me();
      setUser(me);

      if (!forcedUserType) {
        const teams = await base44.entities.Team.filter({
          captain_email: me?.email,
        });
        if (teams.length > 0) {
          setUserType("team");
          setTeam(teams[0]);
        } else {
          setUserType("player");
        }
      } else if (forcedUserType === "team" && forcedUserId) {
        const t = await base44.entities.Team.filter({ id: forcedUserId });
        if (t.length > 0) setTeam(t[0]);
      }
    };
    loadUser();
  }, [forcedUserType, forcedUserId]);

  const myId = forcedUserId || user?.id;
  const myName =
    forcedUserName ||
    (userType === "team" ? team?.name : user?.full_name) ||
    "Unknown";

  // Fetch all messages
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      if (!user?.id) return [];
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
      let key, name, otherId;

      if ("player_from_id" in msg) {
        if (msg.player_from_id === myId) {
          key = `player-${msg.player_to_id}`;
          name = msg.player_to_name;
          otherId = msg.player_to_id;
        } else if (msg.player_to_id === myId) {
          key = `player-${msg.player_from_id}`;
          name = msg.player_from_name;
          otherId = msg.player_from_id;
        }
      } else {
        if (msg.team_from_id === myId) {
          key = `team-${msg.team_to_id}`;
          name = msg.team_to_name;
          otherId = msg.team_to_id;
        } else if (msg.team_to_id === myId) {
          key = `team-${msg.team_from_id}`;
          name = msg.team_from_name;
          otherId = msg.team_from_id;
        }
      }

      if (key && !convMap.has(key)) {
        convMap.set(key, { key, name, otherId });
      }
    });

    return Array.from(convMap.values());
  })();

  // Get messages for selected conversation
  const conversationMessages = selectedConversation
    ? messages.filter((msg) => {
        const [, id] = selectedConversation.split("-");

        if ("player_from_id" in msg) {
          return (
            (msg.player_from_id === myId && msg.player_to_id === id) ||
            (msg.player_from_id === id && msg.player_to_id === myId)
          );
        } else {
          return (
            (msg.team_from_id === myId && msg.team_to_id === id) ||
            (msg.team_from_id === id && msg.team_to_id === myId)
          );
        }
      })
    : [];

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConversation || !myId) return;

      const [type, id] = selectedConversation.split("-");
      const conv = conversations.find((c) => c.key === selectedConversation);

      if (userType === "team") {
        await base44.entities.TeamMessage.create({
          team_from_id: myId,
          team_from_name: myName,
          team_to_id: id,
          team_to_name: conv?.name || "Unknown",
          message: messageText,
          status: "pending",
        });
      } else {
        await base44.entities.PlayerMessage.create({
          player_from_id: myId,
          player_from_name: myName,
          player_to_id: id,
          player_to_name: conv?.name || "Unknown",
          message: messageText,
        });
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  // Live updates
  useEffect(() => {
    const unsub1 = base44.entities.PlayerMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    });
    const unsub2 = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations */}
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
                  className={`w-full text-left px-4 py-3 rounded-lg ${
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

      {/* Chat area */}
      <Card className="lg:col-span-2 bg-[#1a1a1a] border-[#2a2a2a] flex flex-col">
        {selectedConversation ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversationMessages.map((msg, idx) => {
                const isSent =
                  "player_from_id" in msg
                    ? msg.player_from_id === myId
                    : msg.team_from_id === myId;

                return (
                  <div
                    key={idx}
                    className={`flex ${
                      isSent ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        isSent
                          ? "bg-red-600/30 text-white"
                          : "bg-[#2a2a2a] text-gray-200"
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-[#2a2a2a] p-4 flex gap-2">
              <Input
                placeholder="Nachricht eingeben..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
              />
              <Button
                onClick={() => sendMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Wähle einen Chat aus</p>
          </div>
        )}
      </Card>
    </div>
  );
}
