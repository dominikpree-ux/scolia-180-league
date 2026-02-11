import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ContactTeamToTeamDialog({ team, myTeam }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!message.trim()) return;
      
      await base44.entities.TeamMessage.create({
        team_from_id: myTeam.id,
        team_from_name: myTeam.name,
        team_to_id: team.id,
        team_to_name: team.name,
        message: message,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-messages"] });
      setMessage("");
      setOpen(false);
      toast.success("Nachricht gesendet!");
    },
    onError: (error) => {
      toast.error("Fehler beim Senden der Nachricht");
    },
  });

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0"
      >
        <Mail className="w-4 h-4 mr-2" />
        Kontaktieren
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {team.name} kontaktieren
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Deine Nachricht..."
              className="bg-[#0a0a0a] border-gray-700 text-white"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-gray-700 text-gray-400 hover:text-white"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => sendMessage.mutate()}
              disabled={!message.trim() || sendMessage.isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
            >
              {sendMessage.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                "Senden"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}