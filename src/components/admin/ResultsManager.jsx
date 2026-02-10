import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ResultsManager() {
  const queryClient = useQueryClient();
  const [editingMatch, setEditingMatch] = useState(null);
  const [resultForm, setResultForm] = useState({});
  const [filterDay, setFilterDay] = useState("all");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["admin-matches"],
    queryFn: () => base44.entities.Match.list("matchday"),
  });

  const updateMatch = useMutation({
    mutationFn: async ({ id, data, match }) => {
      // Update match
      await base44.entities.Match.update(id, data);

      // Update team statistics
      const homeTeam = await base44.entities.Team.filter({ id: match.home_team_id });
      const awayTeam = await base44.entities.Team.filter({ id: match.away_team_id });

      if (homeTeam[0] && awayTeam[0]) {
        const homeWins = data.home_legs > data.away_legs ? 1 : 0;
        const awayWins = data.away_legs > data.home_legs ? 1 : 0;
        const draws = data.home_legs === data.away_legs ? 1 : 0;

        await base44.entities.Team.update(homeTeam[0].id, {
          points: homeTeam[0].points + (homeWins ? 3 : draws ? 1 : 0),
          wins: homeTeam[0].wins + homeWins,
          draws: homeTeam[0].draws + draws,
          losses: homeTeam[0].losses + (awayWins ? 1 : 0),
          legs_won: homeTeam[0].legs_won + data.home_legs,
          legs_lost: homeTeam[0].legs_lost + data.away_legs,
          sets_won: homeTeam[0].sets_won + data.home_sets,
          sets_lost: homeTeam[0].sets_lost + data.away_sets,
        });

        await base44.entities.Team.update(awayTeam[0].id, {
          points: awayTeam[0].points + (awayWins ? 3 : draws ? 1 : 0),
          wins: awayTeam[0].wins + awayWins,
          draws: awayTeam[0].draws + draws,
          losses: awayTeam[0].losses + (homeWins ? 1 : 0),
          legs_won: awayTeam[0].legs_won + data.away_legs,
          legs_lost: awayTeam[0].legs_lost + data.home_legs,
          sets_won: awayTeam[0].sets_won + data.away_sets,
          sets_lost: awayTeam[0].sets_lost + data.home_sets,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["matches-recent"] });
      setEditingMatch(null);
      toast.success("Ergebnis gespeichert und Tabelle aktualisiert!");
    },
  });

  const deleteMatch = useMutation({
    mutationFn: (id) => base44.entities.Match.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-matches"] });
      queryClient.invalidateQueries({ queryKey: ["matches-recent"] });
      toast.success("Spiel gelöscht!");
    },
  });

  const matchdays = [...new Set(matches.map(m => m.matchday))].sort((a, b) => a - b);
  const filtered = filterDay === "all" ? matches : matches.filter(m => m.matchday === parseInt(filterDay));

  const startEdit = (match) => {
    setEditingMatch(match.id);
    setResultForm({
      home_legs: match.home_legs || 0,
      away_legs: match.away_legs || 0,
      home_sets: match.home_sets || 0,
      away_sets: match.away_sets || 0,
    });
  };

  const saveResult = (matchId) => {
    const match = matches.find(m => m.id === matchId);
    updateMatch.mutate({
      id: matchId,
      match,
      data: {
        ...resultForm,
        status: "completed",
        result_confirmed: true,
      },
    });
  };

  return (
    <div className="space-y-4">
      {matchdays.length > 0 && (
        <Select value={filterDay} onValueChange={setFilterDay}>
          <SelectTrigger className="w-48 bg-[#0a0a0a] border-[#2a2a2a] text-white">
            <SelectValue placeholder="Spieltag wählen" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <SelectItem value="all" className="text-white">Alle Spieltage</SelectItem>
            {matchdays.map(d => (
              <SelectItem key={d} value={String(d)} className="text-white">Spieltag {d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Lade Spiele...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-gray-500 text-sm">Keine Spiele vorhanden.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((match) => (
            <div key={match.id} className="rounded-xl bg-[#111111] border border-[#1a1a1a] p-4">
              <div className="flex items-center justify-between gap-2 mb-2 text-xs text-gray-500">
                <span>Spieltag {match.matchday}</span>
                {match.date && <span>{format(new Date(match.date), "dd.MM.yyyy")}</span>}
                {match.status === "completed" && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="w-3 h-3" /> Beendet
                  </span>
                )}
              </div>

              {editingMatch === match.id ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white flex-1 text-right truncate">{match.home_team_name}</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min="0" value={resultForm.home_legs}
                        onChange={(e) => setResultForm({ ...resultForm, home_legs: parseInt(e.target.value) || 0 })}
                        className="w-14 bg-[#0a0a0a] border-[#2a2a2a] text-white text-center text-sm h-8"
                      />
                      <span className="text-gray-600">:</span>
                      <Input
                        type="number" min="0" value={resultForm.away_legs}
                        onChange={(e) => setResultForm({ ...resultForm, away_legs: parseInt(e.target.value) || 0 })}
                        className="w-14 bg-[#0a0a0a] border-[#2a2a2a] text-white text-center text-sm h-8"
                      />
                    </div>
                    <span className="text-sm text-white flex-1 truncate">{match.away_team_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex-1 text-right">Sets:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number" min="0" value={resultForm.home_sets}
                        onChange={(e) => setResultForm({ ...resultForm, home_sets: parseInt(e.target.value) || 0 })}
                        className="w-14 bg-[#0a0a0a] border-[#2a2a2a] text-white text-center text-sm h-8"
                      />
                      <span className="text-gray-600">:</span>
                      <Input
                        type="number" min="0" value={resultForm.away_sets}
                        onChange={(e) => setResultForm({ ...resultForm, away_sets: parseInt(e.target.value) || 0 })}
                        className="w-14 bg-[#0a0a0a] border-[#2a2a2a] text-white text-center text-sm h-8"
                      />
                    </div>
                    <span className="text-xs text-gray-500 flex-1"></span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingMatch(null)}
                      className="text-gray-400 border-0">Abbrechen</Button>
                    <Button size="sm" onClick={() => saveResult(match.id)}
                      className="bg-red-600 hover:bg-red-500 text-white border-0">
                      <Save className="w-3 h-3 mr-1" /> Speichern
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => startEdit(match)}>
                    <span className="text-sm text-white flex-1 text-right truncate">{match.home_team_name}</span>
                    <div className="px-3 py-1 rounded-lg bg-[#0a0a0a] min-w-[60px] text-center">
                      {match.status === "completed" ? (
                        <span className="text-sm font-bold text-white">{match.home_legs} : {match.away_legs}</span>
                      ) : (
                        <span className="text-sm text-gray-600">vs</span>
                      )}
                    </div>
                    <span className="text-sm text-white flex-1 truncate">{match.away_team_name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMatch.mutate(match.id)}
                    className="text-gray-500 hover:text-red-400 hover:bg-red-600/10 border-0 shrink-0 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}