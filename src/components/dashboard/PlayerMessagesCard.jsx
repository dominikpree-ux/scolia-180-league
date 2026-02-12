import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCircle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function PlayerMessagesCard({ playerId }) {
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState("");
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["player-messages", playerId],
    queryFn: () =>
      base44.entities.PlayerMessage.filter({
        player_to_id: playerId,
      }),
    enabled: !!playerId,
  });

  const respondMutation = useMutation({
    mutationFn: ({ messageId, response, status }) =>
      base44.entities.PlayerMessage.update(messageId, {
        response,
        status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-messages", playerId] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      setRespondingTo(null);
      setResponse("");
      toast.success("Antwort gesendet!");
    },
  });

  const pendingMessages = messages.filter((m) => m.status === "pending");

  if (pendingMessages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-500" />
          Nachrichten ({pendingMessages.length})
        </h3>

        <div className="space-y-3">
          {pendingMessages.map((msg) => (
            <div
              key={msg.id}
              className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-white">
                    {msg.player_from_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(msg.created_date).toLocaleDateString("de-DE")}
                  </p>
                </div>
                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                  Ausstehend
                </Badge>
              </div>

              <p className="text-sm text-gray-300 mb-3">
                {msg.message}
              </p>

              <Button
                size="sm"
                onClick={() => setRespondingTo(msg)}
                className="bg-blue-600 hover:bg-blue-500 text-white border-0 text-xs h-8"
              >
                <Send className="w-3 h-3 mr-1" />
                Antwort geben
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog
        open={!!respondingTo}
        onOpenChange={(open) => !open && setRespondingTo(null)}
      >
        <DialogContent className="bg-[#111111] border-[#1a1a1a]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Antwort an {respondingTo?.player_from_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
              <p className="text-xs text-gray-500 mb-1">
                Ursprüngliche Nachricht:
              </p>
              <p className="text-sm text-gray-300">
                {respondingTo?.message}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-gray-500">
                Deine Antwort
              </label>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Schreibe deine Antwort..."
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                respondMutation.mutate({
                  messageId: respondingTo.id,
                  response,
                  status: "declined",
                })
              }
              className="border-[#2a2a2a] text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3 mr-1" />
              Ablehnen
            </Button>

            <Button
              onClick={() => {
                if (!response.trim()) {
                  toast.error("Bitte schreibe eine Antwort");
                  return;
                }
                respondMutation.mutate({
                  messageId: respondingTo.id,
                  response,
                  status: "answered",
                });
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
