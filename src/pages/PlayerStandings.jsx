import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Zap } from "lucide-react";

export default function PlayerStandings() {
  const navigate = useNavigate();
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
        const legsWon = stat?.legs_won || 0;
        const legsLost = stat?.legs_lost || 0;
        const totalLegs = legsWon + legsLost;

        // Quote = Win Percentage (Siege / Spiele * 100)
        const matchesPlayed = stat?.matches_played || 0;
        const matchesWon = stat?.matches_won || 0;
        const quote = matchesPlayed > 0 ? ((matchesWon / matchesPlayed) * 100) : 0;

        playerMap.set(player.id, {
          id: player.id,
          player_name: player.name,
          team_name: team.name,
          league_tier: team.league_tier,
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          matches_lost: stat?.matches_lost || 0,
          legs_won: legsWon,
          legs_lost: legsLost,
          leg_difference: legsWon - legsLost,
          average: stat?.average || 0,
          high_finish: stat?.high_finish || 0,
          century_count: stat?.century_count || 0,
          short_game_count: stat?.short_game_count || 0,
          max_scores_count: stat?.max_scores_count || 0,
          quote: quote,
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                       <TableHead className="text-gray-400 font-semibold">Rang</TableHead>
                       <TableHead className="text-gray-400 font-semibold">Spieler</TableHead>
                       <TableHead className="text-gray-400 font-semibold">Team</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Spiele</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Siege</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Niederlagen</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Legs +/-</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">AVG</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">100+</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">140+</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">180's</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">High Finish</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Short Game</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">Quote %</TableHead>
                       <TableHead className="text-center text-gray-400 font-semibold">H2H</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsByLeague[league].map((stat, index) => {
                       return (
                         <TableRow key={stat.stat_id || stat.id} className="border-[#1a1a1a] hover:bg-white/5">
                           <TableCell className="font-medium">
                             {index === 0 && (
                               <div className="flex items-center gap-1.5">
                                 <Trophy className="w-4 h-4 text-yellow-500" />
                                 <span className="text-white">1</span>
                               </div>
                             )}
                             {index === 1 && (
                               <div className="flex items-center gap-1.5">
                                 <Trophy className="w-4 h-4 text-gray-400" />
                                 <span className="text-white">2</span>
                               </div>
                             )}
                             {index === 2 && (
                               <div className="flex items-center gap-1.5">
                                 <Trophy className="w-4 h-4 text-amber-600" />
                                 <span className="text-white">3</span>
                               </div>
                             )}
                             {index > 2 && <span className="text-gray-400">{index + 1}</span>}
                           </TableCell>
                           <TableCell className="font-medium text-white">{stat.player_name}</TableCell>
                           <TableCell className="text-gray-400">{stat.team_name}</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.matches_played}</TableCell>
                           <TableCell className="text-center text-green-500">{stat.matches_won}</TableCell>
                           <TableCell className="text-center text-red-500">{stat.matches_lost}</TableCell>
                           <TableCell className="text-center">
                             <span className={stat.leg_difference > 0 ? "text-green-500" : stat.leg_difference < 0 ? "text-red-500" : "text-gray-400"}>
                               {stat.leg_difference > 0 ? "+" : ""}{stat.leg_difference}
                             </span>
                           </TableCell>
                           <TableCell className="text-center text-gray-300">{stat.average > 0 ? stat.average.toFixed(2) : "-"}</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.century_count > 0 ? stat.century_count : "-"}</TableCell>
                           <TableCell className="text-center text-gray-300">—</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.max_scores_count > 0 ? stat.max_scores_count : "-"}</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.high_finish > 0 ? stat.high_finish : "-"}</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.short_game_count > 0 ? stat.short_game_count : "-"}</TableCell>
                           <TableCell className="text-center text-gray-300">{stat.quote.toFixed(1)}%</TableCell>
                           <TableCell className="text-center">
                             <Button variant="ghost" size="sm" onClick={() => navigate(`/PlayerComparison?p1=${stat.id}`)}
                               className="text-gray-400 hover:text-red-400 hover:bg-red-600/10 border-0">
                               <Zap className="w-3 h-3" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       );
                     })}
                    {statsByLeague[league].length === 0 && (
                        <TableRow>
                          <TableCell colSpan={15} className="text-center py-12 text-gray-500">
                            Noch keine Spieler in dieser Liga
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}