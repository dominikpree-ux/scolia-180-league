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

  const { data: allTeams = [] } = useQuery({
    queryKey: ["admin-teams-approved"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }),
  });

  const teamsByTier = {
    A: allTeams.filter(t => t.league_tier === "A"),
    B: allTeams.filter(t => t.league_tier === "B"),
    C: allTeams.filter(t => t.league_tier === "C"),
  };

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
    setGenerating(true);
    const start = startDate ? new Date(startDate) : new Date();
    const allMatches = [];

    // Generate for each league tier separately
    for (const [tier, teams] of Object.entries(teamsByTier)) {
      if (teams.length < 2) continue;

      const firstLeg = generateRoundRobin(teams);
      let matchdayCounter = 1;

      // Hinrunde
      firstLeg.forEach((round, roundIdx) => {
        const matchDate = new Date(start);
        matchDate.setDate(matchDate.getDate() + (roundIdx * 7));
        
        round.forEach((match) => {
          allMatches.push({
            matchday: matchdayCounter,
            league_tier: tier,
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

      // Rückrunde
      firstLeg.forEach((round, roundIdx) => {
        const matchDate = new Date(start);
        matchDate.setDate(matchDate.getDate() + ((firstLeg.length + roundIdx) * 7));
        
        round.forEach((match) => {
          allMatches.push({
            matchday: matchdayCounter,
            league_tier: tier,
            home_team_id: match.away.id,
            away_team_id: match.home.id,
            home_team_name: match.away.name,
            away_team_name: match.home.name,
            date: matchDate.toISOString().split("T")[0],
            status: "scheduled",
          });
        });
        matchdayCounter++;
      });
    }

    if (allMatches.length === 0) {
      toast.error("Keine Spiele generiert. Mindestens 2 Teams pro Liga erforderlich.");
      setGenerating(false);
      return;
    }

    await base44.entities.Match.bulkCreate(allMatches);
    queryClient.invalidateQueries({ queryKey: ["matches"] });
    setGenerating(false);
    toast.success(`${allMatches.length} Spiele für alle Ligen erstellt!`);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500 space-y-1">
        <p className="font-semibold">Teams pro Liga:</p>
        <p>• Liga A: {teamsByTier.A.length} Teams (Double Out)</p>
        <p>• Liga B: {teamsByTier.B.length} Teams (Master Out)</p>
        <p>• Liga C: {teamsByTier.C.length} Teams (Open Out)</p>
        <p className="mt-2 text-xs">Generiert separate Spielpläne für jede Liga.</p>
      </div>

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
        disabled={generating}
        className="bg-red-600 hover:bg-red-500 text-white border-0"
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generiere...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Spielplan generieren</>
        )}
      </Button>
    </div>
  );
}