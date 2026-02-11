import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle, XCircle, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function MyPlayerRequestsCard({ player }) {
  const { data: requests = [] } = useQuery({
    queryKey: ["my-player-requests", player?.id],
    queryFn: () => base44.entities.PlayerRequest.filter({ player_id: player.id }, "-created_date"),
    enabled: !!player?.id,
  });

  if (requests.length === 0) {
    return null;
  }

  const getStatusBadge = (status) => {
    if (status === "accepted") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Angenommen</Badge>;
    }
    if (status === "declined") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><XCircle className="w-3 h-3 mr-1" />Abgelehnt</Badge>;
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Ausstehend</Badge>;
  };

  return (
    <Card className="bg-[#111111] border-[#1a1a1a]">
      <CardHeader>
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Send className="w-4 h-4 text-red-500" />
          Meine Anfragen ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <div key={request.id} className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-white font-medium text-sm">{request.team_name}</p>
                <p className="text-gray-500 text-xs">
                  {new Date(request.created_date).toLocaleDateString('de-DE')}
                </p>
              </div>
              {getStatusBadge(request.status)}
            </div>
            <div className="mb-2">
              <p className="text-gray-500 text-xs mb-1">Deine Nachricht:</p>
              <p className="text-gray-400 text-sm">{request.message}</p>
            </div>
            {request.team_response && (
              <div className="mt-3 p-2 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
                <p className="text-gray-500 text-xs mb-1">Antwort vom Team:</p>
                <p className="text-white text-sm">{request.team_response}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}