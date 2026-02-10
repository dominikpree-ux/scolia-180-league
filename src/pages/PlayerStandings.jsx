import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, TrendingUp } from "lucide-react";

export default function PlayerStandings() {
  const [selectedLeague, setSelectedLeague] = useState("all");

  const { data: playerStats = [] } = useQuery({
    queryKey: ["playerStats"],
    queryFn: () => base44.entities.PlayerStats.list(),
  });

  const filteredStats = selectedLeague === "all"
    ? playerStats
    : playerStats.filter((stat) => stat.league_tier === selectedLeague);

  const sortedStats = [...filteredStats].sort((a, b) => {
    if (b.matches_won !== a.matches_won) return b.matches_won - a.matches_won;
    return b.leg_difference - a.leg_difference;
  });

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

        {/* League filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setSelectedLeague("all")}
            variant={selectedLeague === "all" ? "default" : "outline"}
            className={
              selectedLeague === "all"
                ? "bg-red-600 hover:bg-red-500 text-white border-0"
                : "border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-white/5"
            }
          >
            Alle Ligen
          </Button>
          {["A", "B", "C"].map((league) => (
            <Button
              key={league}
              onClick={() => setSelectedLeague(league)}
              variant={selectedLeague === league ? "default" : "outline"}
              className={
                selectedLeague === league
                  ? `${leagueBadges[league].color} hover:opacity-90 text-white border-0`
                  : "border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-white/5"
              }
            >
              {leagueBadges[league].label}
            </Button>
          ))}
        </div>

        {/* Player stats table */}
        <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1a1a1a] hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">Rang</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Spieler</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Team</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Liga</TableHead>
                  <TableHead className="text-center text-gray-400 font-semibold">Spiele</TableHead>
                  <TableHead className="text-center text-gray-400 font-semibold">Siege</TableHead>
                  <TableHead className="text-center text-gray-400 font-semibold">Niederlagen</TableHead>
                  <TableHead className="text-center text-gray-400 font-semibold">Legs +/-</TableHead>
                  <TableHead className="text-center text-gray-400 font-semibold">Quote %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStats.map((stat, index) => {
                  const winPercentage = stat.matches_played > 0
                    ? ((stat.matches_won / stat.matches_played) * 100).toFixed(1)
                    : 0;
                  return (
                    <TableRow key={stat.id} className="border-[#1a1a1a] hover:bg-white/5">
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
                      <TableCell>
                        <Badge className={`${leagueBadges[stat.league_tier].color} text-white text-xs`}>
                          {stat.league_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-gray-300">{stat.matches_played}</TableCell>
                      <TableCell className="text-center text-green-500">{stat.matches_won}</TableCell>
                      <TableCell className="text-center text-red-500">{stat.matches_lost}</TableCell>
                      <TableCell className="text-center">
                        <span className={stat.leg_difference > 0 ? "text-green-500" : stat.leg_difference < 0 ? "text-red-500" : "text-gray-400"}>
                          {stat.leg_difference > 0 ? "+" : ""}{stat.leg_difference}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-300">{winPercentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {sortedStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                      Noch keine Spieler-Statistiken verfügbar
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}