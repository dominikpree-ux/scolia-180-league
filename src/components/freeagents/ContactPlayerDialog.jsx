import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Send } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function ContactPlayerDialog({ player, team }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const sendRequestMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.PlayerRequest.create(data);
    },
    onSuccess: () => {
      toast.success("Anfrage gesendet!");
      setOpen(false);
      setMessage("");
    },
    onError: () => {
      toast.error("Fehler beim Senden");
    },
  });

  const handleSend = () => {
    if (!message.trim()) {
      toast.error("Bitte Nachricht eingeben");
      return;
    }

    sendRequestMutation.mutate({
      player_id: player.id,
      player_name: player.nickname || player.name,
      player_email: player.email || player.team?.captain_email,
      team_id: team.id,
      team_name: team.name,
      message: message.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-red-600 hover:bg-red-500">
          <Mail className="w-4 h-4 mr-2" />
          Spieler kontaktieren
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-[#1a1a1a] text-white">
        <DialogHeader>
          <DialogTitle>Anfrage an {player.nickname || player.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">
              Schreibe eine Nachricht an den Spieler. Er/sie sieht dein Team-Profil und kann antworten.
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hallo, wir suchen Verstärkung für unser Team..."
              className="bg-[#0a0a0a] border-[#2a2a2a] text-white min-h-[120px]"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sendRequestMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-500"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendRequestMutation.isPending ? "Wird gesendet..." : "Anfrage senden"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}