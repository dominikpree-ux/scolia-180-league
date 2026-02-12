import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function ContactPlayerDialog({ player, open, onOpenChange, team = null }) {
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const contactMutation = useMutation({
    mutationFn: async (msg) => {
      const currentUser = await base44.auth.me();
      if (!currentUser) throw new Error("Not authenticated");

      const messageData = {
        player_to_id: player.id,
        player_to_name: player.name,
        message: msg,
        status: "pending",
      };

      if (team) {
        messageData.team_from_id = team.id;
        messageData.team_from_name = team.name;
      } else {
        messageData.player_from_id = currentUser.id;
        messageData.player_from_name = currentUser.full_name;
      }

      return base44.entities.PlayerMessage.create(messageData);
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["player-messages"] });
       queryClient.invalidateQueries({ queryKey: ["player-requests"] });
       setMessage("");
       onOpenChange(false);
       toast.success("Nachricht gesendet!");
     },
    onError: () => {
      toast.error("Fehler beim Senden der Nachricht");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111111] border-[#1a1a1a]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Nachricht an {player?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
            <p className="text-xs text-gray-500 mb-1">Spieler</p>
            <p className="text-sm text-white font-medium">{player?.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-500">Deine Nachricht</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Schreibe eine Nachricht..."
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#2a2a2a] text-gray-400 hover:text-white"
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => {
              if (!message.trim()) {
                toast.error("Bitte schreibe eine Nachricht");
                return;
              }
              contactMutation.mutate(message);
            }}
            disabled={contactMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
          >
            {contactMutation.isPending ? "Sendet..." : "Senden"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}