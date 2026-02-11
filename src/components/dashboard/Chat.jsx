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

export default function Chat({ userId, userType, team = null }) {
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [deleteConvId, setDeleteConvId] = useState(null);
  const queryClient = useQueryClient();

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ["chat-messages", userId, userType],
    queryFn: async () => {
      let result = [];
      
      if (userType === "player") {
        const sent = await base44.entities.PlayerRequest.filter({ player_id: userId });
        const received = await base44.entities.PlayerRequest.filter({ team_id: userId });
        result = [...sent, ...received];
      } else {
        const sent = await base44.entities.TeamMessage.filter({ team_from_id: userId });
        const received = await base44.entities.TeamMessage.filter({ team_to_id: userId });
        result = [...sent, ...received];
      }
      
      return result;
    },
  });

  // Real-time updates
  useEffect(() => {
    const unsub1 = base44.entities.PlayerRequest.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", userId, userType] });
    });
    const unsub2 = base44.entities.TeamMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", userId, userType] });
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, [queryClient, userId, userType]);

  // Build conversations list
  const conversations = (() => {
    const map = new Map();
    messages.forEach((msg) => {
      let key, name, type, otherId;
      
      if (userType === "player") {
        if (msg.team_id) {
          key = `team-${msg.team_id}`;
          name = msg.team_name;
          type = "team";
          otherId = msg.team_id;
        }
      } else {
        const id = msg.team_from_id === userId ? msg.team_to_id : msg.team_from_id;
        const n = msg.team_from_id === userId ? msg.team_to_name : msg.team_from_name;
        key = `team-${id}`;
        name = n;
        type = "team";
        otherId = id;
      }
      
      if (key && !map.has(key)) {
        map.set(key, { key, name, type, otherId });
      }
    });
    return Array.from(map.values());
  })();

  // Get messages for selected conversation
  const convMessages = selectedConvId
    ? messages.filter((m) => {
        if (userType === "player") {
          return selectedConvId === `team-${m.team_id}`;
        } else {
          const id = selectedConvId.replace("team-", "");
          return m.team_from_id === id || m.team_to_id === id;
        }
      })
    : [];

  // Send message
  const send = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedConvId) return;
      
      const id = selectedConvId.replace("team-", "");
      
      if (userType === "player") {
        const existing = convMessages.find((m) => m.player_id === userId && m.team_id === id && m.status === "pending");
        
        if (existing) {
          await base44.entities.PlayerRequest.update(existing.id, {
            team_response: messageText,
            status: "accepted",
          });
        } else {
          const conv = conversations.find((c) => c.otherId === parseInt(id) || c.otherId === id);
          await base44.entities.PlayerRequest.create({
            player_id: userId,
            player_name: (await base44.auth.me()).full_name,
            player_email: (await base44.auth.me()).email,
            team_id: id,
            team_name: conv?.name || "Unknown",
            message: messageText,
            status: "pending",
          });
        }
      } else {
        const existing = convMessages.find((m) => m.team_from_id === id && m.team_to_id === userId && m.status === "pending");
        
        if (existing) {
          await base44.entities.TeamMessage.update(existing.id, {
            response: messageText,
            status: "answered",
          });
        } else {
          const conv = conversations.find((c) => c.otherId === parseInt(id) || c.otherId === id);
          await base44.entities.TeamMessage.create({
            team_from_id: userId,
            team_from_name: team?.name || "Unknown",
            team_to_id: id,
            team_to_name: conv?.name || "Unknown",
            message: messageText,
            status: "pending",
          });
        }
      }
      
      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  // Delete conversation
  const deleteConv = useMutation({
    mutationFn: async () => {
      for (const msg of convMessages) {
        if (msg.id) {
          if (msg.team_id) {
            await base44.entities.PlayerRequest.delete(msg.id);
          } else {
            await base44.entities.TeamMessage.delete(msg.id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      setSelectedConvId(null);
      setDeleteConvId(null);
      toast.success("Gelöscht!");
    },
  });

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 h-96">
          {/* Conversations */}
          <div className="w-1/3 border-r border-gray-800 pr-4 overflow-y-auto space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.key}
                onClick={() => setSelectedConvId(conv.key)}
                className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between group ${
                  selectedConvId === conv.key
                    ? "bg-blue-600/20 border border-blue-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-white">{conv.name}</p>
                  <p className="text-xs text-gray-500">Team</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConvId(conv.key);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </button>
            ))}
          </div>

          {/* Messages */}
          {selectedConvId ? (
            <div className="w-2/3 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {convMessages.map((msg, i) => {
                  const isSent = userType === "player" ? true : msg.team_from_id === userId;
                  return (
                    <div key={i} className={`flex ${isSent ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs rounded-lg p-3 ${
                          isSent
                            ? "bg-blue-600/20"
                            : "bg-gray-800"
                        }`}
                      >
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
                  onKeyPress={(e) => e.key === "Enter" && send.mutate()}
                  placeholder="Nachricht..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
                />
                <Button
                  onClick={() => send.mutate()}
                  disabled={!messageText.trim() || send.isPending}
                  className="bg-blue-600 hover:bg-blue-500 border-0"
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-2/3 flex items-center justify-center text-gray-500 text-sm">
              Wähle eine Konversation
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteConvId} onOpenChange={(open) => !open && setDeleteConvId(null)}>
        <AlertDialogContent className="bg-[#111111] border-[#1a1a1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Die Konversation wird gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-[#2a2a2a] text-gray-400">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConv.mutate()}
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