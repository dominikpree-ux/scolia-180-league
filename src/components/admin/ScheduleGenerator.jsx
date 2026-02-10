import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ScheduleGenerator() {
  const [startDate, setStartDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ["admin-teams-approved"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }),
  });

  const generateRoundRobin = (teamList) => {
    const n = teamList.length;
    if (n < 2) return [];
    
    const teams = [...teamList];
    // If odd number, add a bye
    if (n % 2 !== 0) teams.push(null);
    
    const totalRounds = teams.length - 1;
    const matchesPerRound = teams.length / 2;
    const schedule = [];

    for (let round = 0; round < totalRounds; round++) {
      const roundMatches = [];
      for (let match = 0; match < matchesPerRound; match++) {
        const home = teams[match];
        const away = teams[teams.length - 1 - match];
        if (home && away) {
          roundMatches.push({ home, away });
        }
      }
      schedule.push(roundMatches);
      // Rotate teams (keep first in place)
      teams.splice(1, 0, teams.pop());
    }
    return schedule;
  };

  const handleGenerate = async () => {
    if (teams.length < 2) {
      toast.error("Mindestens 2 freigegebene Teams nötig!");
      return;
    }

    setGenerating(true);
    const firstLeg = generateRoundRobin(teams);
    const start = startDate ? new Date(startDate) : new Date();

    const allMatches = [];
    let matchdayCounter = 1;

    // Hinrunde
    firstLeg.forEach((round, roundIdx) => {
      const matchDate = new Date(start);
      matchDate.setDate(matchDate.getDate() + (roundIdx * 7));
      
      round.forEach((match) => {
        allMatches.push({
          matchday: matchdayCounter,
          home_team_id: match.home.id,
          away_team_id: match.away.id,
          home_team_name: match.home.name,
          away_team_name: match.away.name,
          date: matchDate.toISOString().split("T")[0],
          status: "scheduled",
        });
      });
      matchdayCounter++;
    });

    // Rückrunde (Heim/Auswärts getauscht)
    firstLeg.forEach((round, roundIdx) => {
      const matchDate = new Date(start);
      matchDate.setDate(matchDate.getDate() + ((firstLeg.length + roundIdx) * 7));
      
      round.forEach((match) => {
        allMatches.push({
          matchday: matchdayCounter,
          home_team_id: match.away.id, // Getauscht
          away_team_id: match.home.id, // Getauscht
          home_team_name: match.away.name, // Getauscht
          away_team_name: match.home.name, // Getauscht
          date: matchDate.toISOString().split("T")[0],
          status: "scheduled",
        });
      });
      matchdayCounter++;
    });

    if (allMatches.length > 0) {
      await base44.entities.Match.bulkCreate(allMatches);
    }

    queryClient.invalidateQueries({ queryKey: ["matches"] });
    setGenerating(false);
    toast.success(`${allMatches.length} Spiele erstellt!`);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Erstellt automatisch einen Doppel-Round-Robin Spielplan für alle {teams.length} freigegebenen Teams (Hin- und Rückrunde).
      </p>

      <div className="space-y-2">
        <Label className="text-gray-400 text-sm">Start-Datum</Label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="bg-[#0a0a0a] border-[#2a2a2a] text-white max-w-xs"
        />
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating || teams.length < 2}
        className="bg-red-600 hover:bg-red-500 text-white border-0"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generiere...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Spielplan generieren</>
        )}
      </Button>

      {teams.length < 2 && (
        <p className="text-xs text-yellow-400">Mindestens 2 freigegebene Teams werden benötigt.</p>
      )}
    </div>
  );
}