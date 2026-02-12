import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ChatInterface({ forcedUserType }) {
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

      const teams = await base44.entities.Team.filter({
        captain_email: me?.email,
      });

      if (teams.length > 0) {
        setUserType("team");
        setTeam(teams[0]);
      } else {
        setUserType("player");
      }
    };
    loadUser();
  }, [forcedUserType]);

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
        if (msg.player_from_id === user?.id) {
          key = `player-${msg.player_to_id}`;
          name = msg.player_to_name;
          otherId = msg.player_to_id;
        } else {
          key = `player-${msg.player_from_id}`;
          name = msg.player_from_name;
          otherId = msg.player_from_id;
        }
      } else {
        const myTeamId = team?.id;

        if (msg.team_from_id === myTeamId) {
          key = `team-${msg.team_to_id}`;
          name = msg.team_to_name;
          otherId = msg.team_to_id;
        } else if (msg.team_to_id === myTeamId) {
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
        if ("player_from_id" in msg) {
          if (selectedConversation.startsWith("player-")) {
            const playerId = selectedConversation.replace("player-", "");
            return (
              msg.player_from_id === playerId ||
              msg.player_to_id === playerId
            );
          }
        } else {
          if (selectedConversation.startsWith("team-")) {
            const teamId = selectedConversation.replace("team-", "");
            return (
              msg.team_to_id === teamId ||
              msg.team_from_id === teamId
            );
          }
        }
        return false;
      })
    : [];

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConversation || !user) return;

      const [type, id] = selectedConversation.split("-");

      if (userType === "team" && team) {
        await base44.entities.TeamMessage.create({
          team_from_id: team.id,
          team_from_name: team.name,
          team_to_id: id,
          team_to_name:
            conversations.find((c) => c.key === selectedConversation)?.name ||
            "Unknown",
          message: messageText,
          status: "pending",
        });
      } else {
        await base44.entities.PlayerMessage.create({
          player_from_id: user.id,
          player_from_name: user.full_name || "Unknown",
          player_to_id: id,
          player_to_name:
            conversations.find((c) => c.key === selectedConversation)?.name ||
            "Unknown",
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

  // Subscribe to updates
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
    <div className="grid grid-cols-1 gap-4">
      {/* Conversations */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] overflow-y-auto">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Chats</h2>
          {conversations.length === 0 ? (
            <p className="text-gray-500 text-sm">Keine Chats vorhanden</p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.key}
                  onClick={() => setSelectedConversation(conv.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
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

      {/* Chat window */}
      {selectedConversation && (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
            {conversationMessages.map((msg, idx) => {
              const isSent =
                "player_from_id" in msg
                  ? msg.player_from_id === user.id
                  : msg.team_from_id === team?.id;

              return (
                <div
                  key={idx}
                  className={`flex ${
                    isSent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg p-3 text-sm ${
                      isSent
                        ? "bg-red-600/30 text-white"
                        : "bg-[#2a2a2a] text-gray-200"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#2a2a2a] p-3 flex gap-2">
            <Input
              placeholder="Nachricht..."
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
        </Card>
      )}
    </div>
  );
}
