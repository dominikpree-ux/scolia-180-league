import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Trash2, Plus, Users } from "lucide-react";
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

export default function NewChat({ userId, userType, team = null }) {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [deleteChatId, setDeleteChatId] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all players and teams (like in FreeAgents)
  const { data: allPlayers = [] } = useQuery({
    queryKey: ["free-players"],
    queryFn: async () => {
      const players = await base44.entities.Player.list();
      return players.filter(p => p.looking_for_team || p.available_as_substitute);
    },
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ["recruiting-teams"],
    queryFn: async () => {
      const teams = await base44.entities.Team.list();
      return teams.filter(t => t.looking_for_players && t.status === "approved");
    },
  });

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["chats", userId, userType],
    queryFn: async () => {
      if (userType === "player") {
        const sent = await base44.entities.PlayerRequest.filter({ player_id: userId });
        const received = await base44.entities.PlayerRequest.filter({ player_to_id: userId });
        return [...sent, ...received];
      } else {
        const sent = await base44.entities.TeamMessage.filter({ team_from_id: userId });
        const received = await base44.entities.TeamMessage.filter({ team_to_id: userId });
        return [...sent, ...received];
      }
    },
  });

  // Real-time updates
  useEffect(() => {
    const unsub1 = base44.entities.PlayerRequest.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["free-players"] });
    });
    const unsub2 = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      queryClient.invalidateQueries({ queryKey: ["recruiting-teams"] });
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [queryClient, userId, userType]);

  // Build unique conversations
  const uniqueChats = (() => {
    const map = new Map();
    conversations.forEach((msg) => {
      let key, name, otherId, otherTeam;

      if (userType === "player") {
        if (msg.team_id) {
          key = `team-${msg.team_id}`;
          name = msg.team_name;
          otherId = msg.team_id;
          otherTeam = null;
        }
      } else {
        if (msg.player_id) {
          key = `player-${msg.player_id}`;
          name = msg.player_name;
          otherId = msg.player_id;
          otherTeam = null;
        } else {
          const id = msg.team_from_id === userId ? msg.team_to_id : msg.team_from_id;
          const n = msg.team_from_id === userId ? msg.team_to_name : msg.team_from_name;
          key = `team-${id}`;
          name = n;
          otherId = id;
          otherTeam = null;
        }
      }

      if (key && !map.has(key)) {
        map.set(key, { key, name, otherId, otherTeam });
      }
    });
    return Array.from(map.values());
  })();

  // Get messages for selected chat
  const chatMessages = selectedChatId
    ? conversations.filter((m) => {
        if (userType === "player") {
          if (selectedChatId.startsWith("team-")) {
            const teamId = selectedChatId.replace("team-", "");
            return m.team_id === teamId;
          }
        } else {
          if (selectedChatId.startsWith("player-")) {
            const playerId = selectedChatId.replace("player-", "");
            return m.player_id === playerId;
          } else {
            const id = selectedChatId.replace("team-", "");
            return m.team_from_id === id || m.team_to_id === id;
          }
        }
        return false;
      })
    : [];

  // Send message
  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedChatId) return;

      if (userType === "player") {
        if (selectedChatId.startsWith("team-")) {
          const teamId = selectedChatId.replace("team-", "");
          const existingMsg = chatMessages.find(m => m.player_id === userId && m.team_id === teamId);

          if (existingMsg) {
            await base44.entities.PlayerRequest.update(existingMsg.id, {
              team_response: messageText,
              status: "accepted",
            });
          } else {
            const chat = uniqueChats.find(c => c.otherId === teamId);
            await base44.entities.PlayerRequest.create({
              player_id: userId,
              player_name: user?.full_name,
              player_email: user?.email,
              team_id: teamId,
              team_name: chat?.name || "Unknown",
              message: messageText,
              status: "pending",
            });
          }
        }
      } else {
        if (selectedChatId.startsWith("player-")) {
          const playerId = selectedChatId.replace("player-", "");
          await base44.entities.PlayerRequest.create({
            player_id: playerId,
            player_name: uniqueChats.find(c => c.otherId === playerId)?.name || "Unknown",
            team_from_id: userId,
            team_from_name: team?.name || "Unknown",
            message: messageText,
            status: "pending",
          });
        } else {
          const teamId = selectedChatId.replace("team-", "");
          const existingMsg = chatMessages.find(m => m.team_from_id === teamId && m.team_to_id === userId);

          if (existingMsg) {
            await base44.entities.TeamMessage.update(existingMsg.id, {
              response: messageText,
              status: "answered",
            });
          } else {
            const chat = uniqueChats.find(c => c.otherId === teamId);
            await base44.entities.TeamMessage.create({
              team_from_id: userId,
              team_from_name: team?.name || "Unknown",
              team_to_id: teamId,
              team_to_name: chat?.name || "Unknown",
              message: messageText,
              status: "pending",
            });
          }
        }
      }

      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  // Delete chat
  const deleteMutation = useMutation({
    mutationFn: async () => {
      for (const msg of chatMessages) {
        if (msg.id) {
          if (msg.player_id) {
            await base44.entities.PlayerRequest.delete(msg.id);
          } else {
            await base44.entities.TeamMessage.delete(msg.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setSelectedChatId(null);
      setDeleteChatId(null);
      toast.success("Chat gelöscht!");
    },
  });

  // Start new chat
  const startNewChat = (target, type) => {
    if (userType === "player") {
      setSelectedChatId(`team-${target.id}`);
    } else {
      if (type === "player") {
        setSelectedChatId(`player-${target.id}`);
      } else {
        setSelectedChatId(`team-${target.id}`);
      }
    }
    setShowNewChat(false);
  };

  const availableTargets = userType === "player" ? allTeams : [...allPlayers, ...allTeams];

  return (
    <Card className="bg-[#111111] border-gray-800 h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowNewChat(!showNewChat)}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 text-xs h-7"
          >
            <Plus className="w-3 h-3 mr-1" />
            Neu
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex gap-4 overflow-hidden">
        {/* Conversations / New Chat */}
        <div className="w-1/3 border-r border-gray-800 pr-4 overflow-y-auto space-y-2">
          {showNewChat ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-semibold">Neuer Chat mit:</p>
              {availableTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => startNewChat(target, target.team_id ? "player" : "team")}
                  className="w-full text-left p-3 rounded-lg hover:bg-white/5 border border-transparent transition-colors group"
                >
                  <p className="text-sm font-medium text-white">{target.name || target.nickname}</p>
                  <p className="text-xs text-gray-500">{target.team_id ? "Spieler" : target.captain_name ? "Team" : "Spieler"}</p>
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 font-semibold px-1">Chats</p>
              {uniqueChats.length === 0 ? (
                <p className="text-xs text-gray-600 px-1">Keine Chats</p>
              ) : (
                uniqueChats.map((chat) => (
                  <button
                    key={chat.key}
                    onClick={() => setSelectedChatId(chat.key)}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between group ${
                      selectedChatId === chat.key
                        ? "bg-blue-600/20 border border-blue-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{chat.name}</p>
                      <p className="text-xs text-gray-500">{chat.key.includes("team") ? "Team" : "Spieler"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteChatId(chat.key);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </button>
                ))
              )}
            </>
          )}
        </div>

        {/* Messages */}
        {selectedChatId && !showNewChat ? (
          <div className="w-2/3 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {chatMessages.map((msg, i) => {
                const isSent = userType === "player" ? true : msg.team_from_id === userId;
                const sender = isSent ? (team?.name || user?.full_name || "Du") : msg.player_name || msg.team_from_name;

                return (
                  <div key={i} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs rounded-lg p-3 ${
                        isSent ? "bg-blue-600/20" : "bg-gray-800"
                      }`}
                    >
                      <p className="text-xs text-gray-400 mb-1">{sender}</p>
                      <p className="text-sm text-white">{msg.message}</p>
                      {(msg.team_response || msg.response) && (
                        <div className="mt-2 pt-2 border-t border-gray-600">
                          <p className="text-xs text-gray-300 mb-1">Antwort:</p>
                          <p className="text-sm text-white">{msg.team_response || msg.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMutation.mutate()}
                placeholder="Nachricht..."
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
              />
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={!messageText.trim() || sendMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 border-0"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : !showNewChat ? (
          <div className="w-2/3 flex items-center justify-center text-gray-500 text-sm">
            Wähle einen Chat
          </div>
        ) : null}
      </CardContent>

      <AlertDialog open={!!deleteChatId} onOpenChange={(open) => !open && setDeleteChatId(null)}>
        <AlertDialogContent className="bg-[#111111] border-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Chat löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2a2a2a] text-gray-400">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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