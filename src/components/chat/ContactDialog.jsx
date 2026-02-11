import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Mail, Send, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ContactDialog({ 
  targetId, 
  targetName, 
  targetType, // "player" or "team"
  currentUser,
  currentUserType, // "player" or "team"
  currentTeam,
  buttonText = "Kontaktieren",
  buttonVariant = "default"
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!message.trim()) throw new Error("Nachricht ist leer");

      if (currentUserType === "player") {
        if (targetType === "player") {
          // Player to Player
          await base44.entities.PlayerMessage.create({
            player_from_id: currentUser.id,
            player_from_name: currentUser.full_name,
            player_to_id: targetId,
            player_to_name: targetName,
            message: message.trim(),
            status: "pending",
          });
        } else {
          // Player to Team
          await base44.entities.PlayerRequest.create({
            player_id: currentUser.id,
            player_name: currentUser.full_name,
            player_email: currentUser.email,
            team_id: targetId,
            team_name: targetName,
            message: message.trim(),
            status: "pending",
          });
        }
      } else {
        // Team to Team or Team to Player
        if (targetType === "team") {
          await base44.entities.TeamMessage.create({
            team_from_id: currentTeam.id,
            team_from_name: currentTeam.name,
            team_to_id: targetId,
            team_to_name: targetName,
            message: message.trim(),
            status: "pending",
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["requests"], exact: false });
      setMessage("");
      setOpen(false);
      toast.success("Nachricht gesendet!");
      navigate(createPageUrl("Dashboard"));
    },
    onError: () => {
      toast.error("Fehler beim Senden");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className={buttonVariant === "outline" ? "w-full border-gray-700 text-gray-400 hover:text-white" : "w-full bg-blue-600 hover:bg-blue-500 text-white border-0"}
          variant={buttonVariant === "outline" ? "outline" : "default"}
        >
          <Mail className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111111] border-[#1a1a1a]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            {targetName} kontaktieren
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
            <p className="text-xs text-gray-500 mb-1">{targetType === "team" ? "Team" : "Spieler"}</p>
            <p className="text-sm text-white font-medium">{targetName}</p>
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
            onClick={() => setOpen(false)}
            className="border-[#2a2a2a] text-gray-400 hover:text-white"
          >
            Abbrechen
          </Button>
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!message.trim() || sendMutation.isPending}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0"
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Senden
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}