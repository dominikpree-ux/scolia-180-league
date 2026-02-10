import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Zap } from "lucide-react";
import PlayerStandingsTable from "../components/shared/PlayerStandingsTable";

export default function PlayerStandings() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);

  const { data: players = [] } = useQuery({
    queryKey: ["allPlayers"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["allTeams"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }),
  });

  const { data: initialStats = [] } = useQuery({
    queryKey: ["playerStats"],
    queryFn: () => base44.entities.PlayerStats.list(),
  });

  useEffect(() => {
    setPlayerStats(initialStats);
  }, [initialStats]);

  useEffect(() => {
    setAllPlayers(players);
  }, [players]);

  useEffect(() => {
    const unsubscribe = base44.entities.PlayerStats.subscribe((event) => {
      setPlayerStats((prev) => {
        if (event.type === "create") {
          return [...prev, event.data];
        } else if (event.type === "update") {
          return prev.map((p) => (p.id === event.id ? event.data : p));
        } else if (event.type === "delete") {
          return prev.filter((p) => p.id !== event.id);
        }
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = base44.entities.Player.subscribe((event) => {
      setAllPlayers((prev) => {
        if (event.type === "create") {
          return [...prev, event.data];
        } else if (event.type === "update") {
          return prev.map((p) => (p.id === event.id ? event.data : p));
        } else if (event.type === "delete") {
          return prev.filter((p) => p.id !== event.id);
        }
        return prev;
      });
    });
    return unsubscribe;
  }, []);

  // Kombiniere Spieler mit Stats
  const getPlayerDisplayData = () => {
    const playerMap = new Map();
    const teamMap = new Map(teams.map(t => [t.id, t]));

    // Alle Spieler mit ihren Teams hinzufügen
    allPlayers.forEach(player => {
      const team = teamMap.get(player.team_id);
      if (team) {
        const stat = playerStats.find(s => s.player_id === player.id);
        playerMap.set(player.id, {
          id: player.id,
          player_name: player.name,
          team_name: team.name,
          league_tier: team.league_tier,
          matches_played: stat?.matches_played || 0,
          matches_won: stat?.matches_won || 0,
          matches_lost: stat?.matches_lost || 0,
          leg_difference: stat?.leg_difference || 0,
          average: stat?.average || 0,
          high_finish: stat?.high_finish || 0,
          century_count: stat?.century_count || 0,
          short_game_count: stat?.short_game_count || 0,
          max_scores_count: stat?.max_scores_count || 0,
          stat_id: stat?.id,
        });
      }
    });

    return playerMap;
  };

  const playerDisplayMap = getPlayerDisplayData();

  // Gruppiere nach Liga
  const statsByLeague = {
    A: Array.from(playerDisplayMap.values()).filter(s => s.league_tier === "A").sort((a, b) => {
      const aWinRate = a.matches_played > 0 ? a.matches_won / a.matches_played : 0;
      const bWinRate = b.matches_played > 0 ? b.matches_won / b.matches_played : 0;
      if (bWinRate !== aWinRate) return bWinRate - aWinRate;
      return b.leg_difference - a.leg_difference;
    }),
    B: Array.from(playerDisplayMap.values()).filter(s => s.league_tier === "B").sort((a, b) => {
      const aWinRate = a.matches_played > 0 ? a.matches_won / a.matches_played : 0;
      const bWinRate = b.matches_played > 0 ? b.matches_won / b.matches_played : 0;
      if (bWinRate !== aWinRate) return bWinRate - aWinRate;
      return b.leg_difference - a.leg_difference;
    }),
    C: Array.from(playerDisplayMap.values()).filter(s => s.league_tier === "C").sort((a, b) => {
      const aWinRate = a.matches_played > 0 ? a.matches_won / a.matches_played : 0;
      const bWinRate = b.matches_played > 0 ? b.matches_won / b.matches_played : 0;
      if (bWinRate !== aWinRate) return bWinRate - aWinRate;
      return b.leg_difference - a.leg_difference;
    }),
  };

  const leagueBadges = {
    A: { color: "bg-red-600", label: "Liga A" },
    B: { color: "bg-orange-600", label: "Liga B" },
    C: { color: "bg-yellow-600", label: "Liga C" },
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Spieler-Tabelle</h1>
            <p className="text-gray-500 text-sm mt-0.5">Individuelle Spieler-Statistiken</p>
          </div>
        </div>

        {/* Alle Ligen */}
        {["A", "B", "C"].map((league) => (
          <div key={league} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className={`${leagueBadges[league].color} text-white`}>
                {leagueBadges[league].label}
              </Badge>
              <span className="text-gray-500 text-sm">({statsByLeague[league].length} Spieler)</span>
            </div>

            <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden">
              <PlayerStandingsTable 
                players={statsByLeague[league].map(stat => ({
                  id: stat.id,
                  name: stat.player_name,
                  team_name: stat.team_name,
                  stats: {
                    average: stat.average,
                    high_finish: stat.high_finish,
                    max_scores_count: stat.max_scores_count,
                    legs_won: stat.matches_won,
                    legs_lost: stat.matches_lost,
                  }
                }))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}