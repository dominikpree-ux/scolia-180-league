import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function PlayerComparison() {
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p1 = params.get("p1");
    if (p1) setPlayer1Id(p1);
  }, []);

  const { data: allPlayers = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: playerMatches = [] } = useQuery({
    queryKey: ["player-matches"],
    queryFn: () => base44.entities.PlayerMatch.list(),
  });

  const { data: playerStats = [] } = useQuery({
    queryKey: ["player-stats"],
    queryFn: () => base44.entities.PlayerStats.list(),
  });

  const filteredPlayers1 = allPlayers.filter(p =>
    p.name.toLowerCase().includes(search1.toLowerCase())
  );

  const filteredPlayers2 = allPlayers.filter(p =>
    p.name.toLowerCase().includes(search2.toLowerCase())
  );

  const comparison = useMemo(() => {
    if (!player1Id || !player2Id) return null;

    const p1 = allPlayers.find(p => p.id === player1Id);
    const p2 = allPlayers.find(p => p.id === player2Id);
    const p1Stats = playerStats.find(s => s.player_id === player1Id);
    const p2Stats = playerStats.find(s => s.player_id === player2Id);

    // Head-to-Head matches
    const h2hMatches = playerMatches.filter(m =>
      (m.player1_id === player1Id && m.player2_id === player2Id) ||
      (m.player1_id === player2Id && m.player2_id === player1Id)
    );

    const p1Wins = h2hMatches.filter(m =>
      (m.player1_id === player1Id && m.winner_id === player1Id) ||
      (m.player2_id === player1Id && m.winner_id === player1Id)
    ).length;

    const p2Wins = h2hMatches.length - p1Wins;

    return {
      p1: { ...p1, stats: p1Stats, wins: p1Wins },
      p2: { ...p2, stats: p2Stats, wins: p2Wins },
      h2hMatches,
      total: h2hMatches.length,
    };
  }, [player1Id, player2Id, allPlayers, playerStats, playerMatches]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Head-to-Head</h1>
            <p className="text-gray-500 text-sm mt-0.5">Direkte Spielervergleiche</p>
          </div>
        </div>

        {/* Player Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Player 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Spieler 1</label>
            <div className="relative">
              <Input
                placeholder="Spieler suchen..."
                value={search1}
                onChange={(e) => setSearch1(e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-2"
              />
              {search1 && (
                <div className="absolute top-10 left-0 right-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-h-48 overflow-y-auto z-10">
                  {filteredPlayers1.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPlayer1Id(p.id);
                        setSearch1("");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#222222] text-gray-300 hover:text-white text-sm"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {player1Id && (
                <div className="px-3 py-2 bg-red-600/10 border border-red-600/20 rounded-lg text-sm text-white">
                  {allPlayers.find(p => p.id === player1Id)?.name}
                </div>
              )}
            </div>
          </div>

          {/* Player 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Spieler 2</label>
            <div className="relative">
              <Input
                placeholder="Spieler suchen..."
                value={search2}
                onChange={(e) => setSearch2(e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white mb-2"
              />
              {search2 && (
                <div className="absolute top-10 left-0 right-0 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-h-48 overflow-y-auto z-10">
                  {filteredPlayers2.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPlayer2Id(p.id);
                        setSearch2("");
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#222222] text-gray-300 hover:text-white text-sm"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {player2Id && (
                <div className="px-3 py-2 bg-blue-600/10 border border-blue-600/20 rounded-lg text-sm text-white">
                  {allPlayers.find(p => p.id === player2Id)?.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {comparison && (
          <>
            {/* H2H Summary */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">{comparison.p1.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-red-500">{comparison.p1.wins}</div>
                  <p className="text-xs text-gray-500 mt-1">Siege</p>
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Spiele insgesamt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-white">{comparison.total}</div>
                  <p className="text-xs text-gray-500 mt-1">H2H Matches</p>
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">{comparison.p2.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-500">{comparison.p2.wins}</div>
                  <p className="text-xs text-gray-500 mt-1">Siege</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Stats */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Player 1 Stats */}
              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-lg">{comparison.p1.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">Durchschnitt</span>
                    <span className="text-white font-semibold">{comparison.p1.stats?.average?.toFixed(1) || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">High Finish</span>
                    <span className="text-white font-semibold">{comparison.p1.stats?.high_finish || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">180er</span>
                    <span className="text-white font-semibold">{comparison.p1.stats?.max_scores_count || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">100+ Scores</span>
                    <span className="text-white font-semibold">{comparison.p1.stats?.century_count || "—"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Player 2 Stats */}
              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-lg">{comparison.p2.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">Durchschnitt</span>
                    <span className="text-white font-semibold">{comparison.p2.stats?.average?.toFixed(1) || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">High Finish</span>
                    <span className="text-white font-semibold">{comparison.p2.stats?.high_finish || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-[#1a1a1a]">
                    <span className="text-gray-400">180er</span>
                    <span className="text-white font-semibold">{comparison.p2.stats?.max_scores_count || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">100+ Scores</span>
                    <span className="text-white font-semibold">{comparison.p2.stats?.century_count || "—"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Match History Chart */}
            {comparison.h2hMatches.length > 0 && (
              <Card className="bg-[#111111] border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Sieges-Historie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={[
                        {
                          name: "Bilanz",
                          [comparison.p1.name]: comparison.p1.wins,
                          [comparison.p2.name]: comparison.p2.wins,
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Bar dataKey={comparison.p1.name} fill="#dc2626" />
                      <Bar dataKey={comparison.p2.name} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!comparison && (
          <div className="text-center py-20 text-gray-500">
            <p>Wähle zwei Spieler um sie zu vergleichen</p>
          </div>
        )}
      </div>
    </div>
  );
}