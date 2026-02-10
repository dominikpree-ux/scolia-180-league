import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function PlayerLineupSelector({ match, myTeamId, players, onSuccess, onCancel }) {
  const isHome = match.home_team_id === myTeamId;
  const existingLineup = isHome ? match.home_active_players || [] : match.away_active_players || [];
  const [selectedPlayers, setSelectedPlayers] = useState(existingLineup);
  const [submitting, setSubmitting] = useState(false);

  const togglePlayer = (playerId) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      if (selectedPlayers.length < 4) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      } else {
        toast.error("Du kannst maximal 4 Spieler auswählen!");
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length !== 4) {
      toast.error("Bitte wähle genau 4 Spieler aus!");
      return;
    }

    setSubmitting(true);
    try {
      const updateData = isHome 
        ? { home_active_players: selectedPlayers }
        : { away_active_players: selectedPlayers };

      await base44.entities.Match.update(match.id, updateData);
      toast.success("Aufstellung gespeichert!");
      onSuccess();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
    setSubmitting(false);
  };

  return (
    <Card className="bg-[#0a0a0a] border-[#2a2a2a] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-red-500" />
          Aufstellung auswählen ({selectedPlayers.length}/4)
        </h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="w-7 h-7 text-gray-500 hover:text-white border-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const isSelected = selectedPlayers.includes(player.id);
          return (
            <div
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                isSelected ? "bg-red-600/20 border border-red-600/40" : "bg-[#111111] border border-[#1a1a1a] hover:border-[#2a2a2a]"
              }`}
            >
              <Checkbox checked={isSelected} className="pointer-events-none" />
              <div className="flex items-center gap-2 flex-1">
                <div className="w-7 h-7 rounded-full bg-red-600/10 flex items-center justify-center text-xs font-bold text-red-400">
                  {player.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-sm text-white">{player.name}</span>
                {player.is_captain && (
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-medium">
                    Kapitän
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || selectedPlayers.length !== 4}
        className="w-full bg-red-600 hover:bg-red-500 text-white border-0 h-10"
      >
        {submitting ? "Speichere..." : <><Save className="w-4 h-4 mr-2" /> Aufstellung speichern</>}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Wähle die 4 aktiven Spieler für dieses Match. Die restlichen 2 sind auf der Ersatzbank.
      </p>
    </Card>
  );
}