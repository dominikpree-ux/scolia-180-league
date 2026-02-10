import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Minus, TrendingUp, TrendingDown } from "lucide-react";

export default function StandingsTable({ teams, compact = false }) {
  const sorted = [...teams]
    .filter(t => t.status === "approved")
    .sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      const aDiff = (a.legs_won || 0) - (a.legs_lost || 0);
      const bDiff = (b.legs_won || 0) - (b.legs_lost || 0);
      return bDiff - aDiff;
    });

  const getRankBadge = (rank) => {
    if (rank === 1) return <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center"><Trophy className="w-3 h-3 text-yellow-500" /></div>;
    if (rank === 2) return <div className="w-6 h-6 rounded-full bg-gray-400/20 flex items-center justify-center text-xs font-bold text-gray-400">2</div>;
    if (rank === 3) return <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-500">3</div>;
    return <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs font-medium text-gray-500">{rank}</div>;
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        Noch keine Teams in der Tabelle.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-[#1a1a1a] hover:bg-transparent">
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider w-12">#</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Team</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">Sp</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">S</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">U</TableHead>
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">N</TableHead>
            {!compact && (
              <>
                <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center hidden sm:table-cell">Legs</TableHead>
                <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center hidden sm:table-cell">Sets</TableHead>
              </>
            )}
            <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-center">Pkt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((team, i) => (
            <TableRow key={team.id} className="border-[#1a1a1a] hover:bg-white/[0.02] transition-colors">
              <TableCell>{getRankBadge(i + 1)}</TableCell>
              <TableCell>
                <span className="font-medium text-white text-sm">{team.name}</span>
              </TableCell>
              <TableCell className="text-center text-gray-400 text-sm">{(team.wins || 0) + (team.draws || 0) + (team.losses || 0)}</TableCell>
              <TableCell className="text-center text-green-400 text-sm font-medium">{team.wins || 0}</TableCell>
              <TableCell className="text-center text-gray-400 text-sm">{team.draws || 0}</TableCell>
              <TableCell className="text-center text-red-400 text-sm">{team.losses || 0}</TableCell>
              {!compact && (
                <>
                  <TableCell className="text-center text-gray-400 text-sm hidden sm:table-cell">
                    {team.legs_won || 0}:{team.legs_lost || 0}
                  </TableCell>
                  <TableCell className="text-center text-gray-400 text-sm hidden sm:table-cell">
                    {team.sets_won || 0}:{team.sets_lost || 0}
                  </TableCell>
                </>
              )}
              <TableCell className="text-center">
                <span className="font-bold text-white text-sm bg-white/5 px-2.5 py-1 rounded-lg">
                  {team.points || 0}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}