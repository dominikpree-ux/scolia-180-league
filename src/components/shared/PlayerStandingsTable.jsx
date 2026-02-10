import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Target, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PlayerStandingsTable({ players }) {
  const leagueColorMap = {
    A: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    B: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    C: "bg-green-500/10 text-green-400 border-green-500/20",
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Trophy className="w-3 h-3 text-yellow-500" /></div>;
    if (rank === 2) return <div className="w-6 h-6 rounded-full bg-gray-400/20 flex items-center justify-center text-xs font-bold text-gray-400">2</div>;
    if (rank === 3) return <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">3</div>;
    return <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-gray-500">{rank}</div>;
  };

  if (players.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Noch keine Spieler in dieser Liga.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#1a1a1a] hover:bg-transparent">
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider w-12">#</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Spieler</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Team</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">Ø</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">High</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">180er</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">Legs</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">Quote</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">H2H</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player, i) => (
            <TableRow key={player.id} className="border-[#1a1a1a] hover:bg-white/[0.02] transition-colors">
              <TableCell>{getRankBadge(i + 1)}</TableCell>
              <TableCell>
                <span className="font-medium text-white text-sm">{player.name}</span>
              </TableCell>
              <TableCell className="text-gray-400 text-sm">{player.team_name || "—"}</TableCell>
              <TableCell className="text-center text-white text-sm font-semibold">{player.stats?.average?.toFixed(1) || "—"}</TableCell>
              <TableCell className="text-center text-white text-sm">{player.stats?.high_finish || "—"}</TableCell>
              <TableCell className="text-center text-white text-sm">{player.stats?.max_scores_count || "—"}</TableCell>
              <TableCell className="text-center text-gray-400 text-sm">
                <span className="text-gray-300">{player.stats?.legs_won || 0}</span>
                <span className="text-gray-500 mx-0.5">:</span>
                <span className="text-gray-300">{player.stats?.legs_lost || 0}</span>
              </TableCell>
              <TableCell className="text-center text-white text-sm font-medium">
                {player.stats?.legs_won && player.stats?.legs_lost ? 
                  ((player.stats.legs_won / (player.stats.legs_won + player.stats.legs_lost)) * 100).toFixed(0) + "%" : "—"}
              </TableCell>
              <TableCell className="text-center">
                <Link to={createPageUrl(`PlayerComparison?p1=${player.id}`)}>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400 hover:bg-red-600/10 border-0">
                    <Zap className="w-3 h-3" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}