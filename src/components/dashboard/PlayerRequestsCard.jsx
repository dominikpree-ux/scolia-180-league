import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Check, X, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PlayerRequestsCard({ team }) {
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["player-requests", team.id],
    queryFn: () => base44.entities.PlayerRequest.filter({ team_id: team.id, status: "pending" }, "-created_date"),
    enabled: !!team?.id,
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.PlayerRequest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-requests"] });
      toast.success("Anfrage aktualisiert!");
    },
  });

  if (requests.length === 0) {
    return null;
  }

  return (
    <Card className="bg-[#111111] border-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Inbox className="w-4 h-4 text-red-500" />
          Spieler-Anfragen ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium text-sm">{request.player_name}</p>
                <p className="text-gray-500 text-xs">{request.player_email}</p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                Neu
              </Badge>
            </div>
            <p className="text-gray-400 text-sm mb-3">{request.message}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => updateRequestMutation.mutate({ id: request.id, status: "accepted" })}
                className="flex-1 bg-green-600 hover:bg-green-500 h-8 text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Annehmen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateRequestMutation.mutate({ id: request.id, status: "declined" })}
                className="flex-1 border-[#2a2a2a] text-gray-400 hover:text-white h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Ablehnen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = `mailto:${request.player_email}`}
                className="border-[#2a2a2a] text-gray-400 hover:text-white h-8 text-xs"
              >
                <Mail className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}