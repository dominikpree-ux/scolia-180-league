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

export default function TeamChat({ team }) {
  const [selectedId, setSelectedId] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const queryClient = useQueryClient();

  // Fetch all team messages
  const { data: teamMessages = [] } = useQuery({
    queryKey: ["team-messages", team.id],
    queryFn: async () => {
      const sent = await base44.entities.TeamMessage.filter({ team_from_id: team.id });
      const received = await base44.entities.TeamMessage.filter({ team_to_id: team.id });
      return [...sent, ...received];
    },
  });

  // Get unique conversations from team messages
  const conversations = Array.from(
    new Map(
      teamMessages.map((msg) => {
        const otherId = msg.team_from_id === team.id ? msg.team_to_id : msg.team_from_id;
        const otherName = msg.team_from_id === team.id ? msg.team_to_name : msg.team_from_name;
        return [otherId, { id: otherId, name: otherName }];
      })
    ).values()
  );

  // Get messages for selected conversation
  const conversationMessages = selectedId
    ? teamMessages.filter(
        (msg) =>
          (msg.team_from_id === team.id && msg.team_to_id === selectedId) ||
          (msg.team_from_id === selectedId && msg.team_to_id === team.id)
      )
    : [];

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!messageText.trim() || !selectedId) return;

      // Check if there's a pending message from the other team waiting for response
      const pendingFromOtherTeam = conversationMessages.find(
        (m) => m.team_from_id === selectedId && m.team_to_id === team.id && m.status === "pending"
      );

      if (pendingFromOtherTeam) {
        // Respond to their message
        await base44.entities.TeamMessage.update(pendingFromOtherTeam.id, {
          response: messageText,
          status: "answered",
        });
      } else {
        // Send new message
        await base44.entities.TeamMessage.create({
          team_from_id: team.id,
          team_from_name: team.name,
          team_to_id: selectedId,
          team_to_name: selectedConversation.name,
          message: messageText,
          status: "pending",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["team-messages"] });
      setMessageText("");
      toast.success("Nachricht gesendet!");
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async ({ convId }) => {
      const messagesToDelete = teamMessages.filter(
        (msg) =>
          (msg.team_from_id === convId && msg.team_to_id === team.id) ||
          (msg.team_from_id === team.id && msg.team_to_id === convId)
      );
      for (const msg of messagesToDelete) {
        await base44.entities.TeamMessage.delete(msg.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-messages"] });
      setSelectedId(null);
      setDeleteConfirm(null);
      toast.success("Konversation gelöscht!");
    },
  });

  return (
    <Card className="bg-[#111111] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Team-Chat
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
                // Check if conversation has unread messages
                const unreadMessages = teamMessages.filter(
                  msg => 
                    (msg.team_from_id === conv.id && msg.team_to_id === team.id && msg.status === "pending") ||
                    (msg.team_from_id === conv.id && msg.team_to_id === team.id && !msg.response)
                );
                const hasUnread = unreadMessages.length > 0;

                return (
                <div
                  key={conv.id}
                  className={`flex items-center gap-2 p-3 rounded-lg mb-2 transition-colors group ${
                    selectedId === conv.id
                      ? "bg-blue-600/20 border border-blue-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedId(conv.id);
                      setMessageText("");
                    }}
                    className="flex-1 text-left"
                  >
                    <p className={`text-sm font-medium ${hasUnread ? "text-white font-semibold" : "text-white"}`}>{conv.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Team {hasUnread && "• neue Nachricht"}</p>
                  </button>
                  {hasUnread && (
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteConfirm({ id: conv.id, name: conv.name })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
              })
            )}
          </div>

          {/* Chat Area */}
          {selectedId ? (
            <div className="w-2/3 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Nachrichten</p>
                ) : (
                  conversationMessages.map((msg) => {
                    const isIncoming = msg.team_from_id === selectedId;

                    return (
                      <div key={msg.id} className="space-y-2">
                        {isIncoming && (
                          <div className="bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 mb-1">{msg.team_from_name}</p>
                            <p className="text-sm text-white">{msg.message}</p>
                            {msg.response && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-400 mb-1">Antwort:</p>
                                <p className="text-sm text-white">{msg.response}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {!isIncoming && (
                          <div className="bg-blue-600/20 rounded-lg p-3 ml-auto max-w-xs">
                            <p className="text-xs text-blue-400 mb-1">Du</p>
                            <p className="text-sm text-white">{msg.message}</p>
                            {msg.response && (
                              <div className="mt-2 pt-2 border-t border-blue-500/30">
                                <p className="text-xs text-blue-300 mb-1">Antwort:</p>
                                <p className="text-sm text-white">{msg.response}</p>
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
              <p className="text-sm">
                {conversations.length === 0 ? "Keine Konversationen" : "Wähle eine Konversation"}
              </p>
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
              onClick={() => deleteConversation.mutate({ convId: deleteConfirm.id })}
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