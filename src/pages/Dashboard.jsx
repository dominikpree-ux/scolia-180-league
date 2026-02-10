import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Calendar, Edit2, Save, Plus, X, Trophy, Target, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import MatchResultForm from "../components/dashboard/MatchResultForm";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newPlayerName, setNewPlayerName] = useState("");
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: myTeams = [], isLoading } = useQuery({
    queryKey: ["my-teams", user?.email],
    queryFn: () => base44.entities.Team.filter({ captain_email: user?.email }),
    enabled: !!user?.email,
  });

  const team = myTeams[0];

  const { data: players = [] } = useQuery({
    queryKey: ["team-players", team?.id],
    queryFn: () => base44.entities.Player.filter({ team_id: team?.id }),
    enabled: !!team?.id,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["team-matches", team?.id],
    queryFn: async () => {
      const all = await base44.entities.Match.list("matchday");
      return all.filter(m => m.home_team_id === team?.id || m.away_team_id === team?.id);
    },
    enabled: !!team?.id,
  });

  const updateTeam = useMutation({
    mutationFn: (data) => base44.entities.Team.update(team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setEditing(false);
      toast.success("Team aktualisiert!");
    },
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Team.update(team.id, { logo_url: file_url });
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      toast.success("Logo aktualisiert!");
    } catch (error) {
      toast.error("Logo-Upload fehlgeschlagen");
    }
    setUploadingLogo(false);
  };

  const addPlayer = useMutation({
    mutationFn: (name) => base44.entities.Player.create({ name, team_id: team.id, is_captain: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-players"] });
      setNewPlayerName("");
      toast.success("Spieler hinzugefügt!");
    },
  });

  const removePlayer = useMutation({
    mutationFn: (id) => base44.entities.Player.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-players"] });
      toast.success("Spieler entfernt.");
    },
  });

  const confirmResult = useMutation({
    mutationFn: async (matchId) => {
      const match = matches.find(m => m.id === matchId);
      
      // Update match status
      await base44.entities.Match.update(matchId, {
        status: "completed",
        result_confirmed: true,
      });

      // Calculate results
      const homeWin = match.home_legs > match.away_legs;
      const awayWin = match.away_legs > match.home_legs;
      const draw = match.home_legs === match.away_legs;

      // Update home team stats
      const homeTeam = await base44.entities.Team.filter({ id: match.home_team_id });
      await base44.entities.Team.update(match.home_team_id, {
        points: (homeTeam[0].points || 0) + (homeWin ? 3 : draw ? 1 : 0),
        wins: (homeTeam[0].wins || 0) + (homeWin ? 1 : 0),
        draws: (homeTeam[0].draws || 0) + (draw ? 1 : 0),
        losses: (homeTeam[0].losses || 0) + (awayWin ? 1 : 0),
        legs_won: (homeTeam[0].legs_won || 0) + match.home_legs,
        legs_lost: (homeTeam[0].legs_lost || 0) + match.away_legs,
        sets_won: (homeTeam[0].sets_won || 0) + match.home_sets,
        sets_lost: (homeTeam[0].sets_lost || 0) + match.away_sets,
      });

      // Update away team stats
      const awayTeam = await base44.entities.Team.filter({ id: match.away_team_id });
      await base44.entities.Team.update(match.away_team_id, {
        points: (awayTeam[0].points || 0) + (awayWin ? 3 : draw ? 1 : 0),
        wins: (awayTeam[0].wins || 0) + (awayWin ? 1 : 0),
        draws: (awayTeam[0].draws || 0) + (draw ? 1 : 0),
        losses: (awayTeam[0].losses || 0) + (homeWin ? 1 : 0),
        legs_won: (awayTeam[0].legs_won || 0) + match.away_legs,
        legs_lost: (awayTeam[0].legs_lost || 0) + match.home_legs,
        sets_won: (awayTeam[0].sets_won || 0) + match.away_sets,
        sets_lost: (awayTeam[0].sets_lost || 0) + match.home_sets,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success("Ergebnis bestätigt und Tabelle aktualisiert!");
    },
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Lade Dashboard...</div>;
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Kein Team gefunden</h2>
          <p className="text-gray-500 text-sm">Du bist noch nicht als Kapitän eines Teams registriert.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Team Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">{team.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Stats */}
          {[
            { label: "Punkte", value: team.points || 0, icon: Trophy, color: "text-yellow-500" },
            { label: "Siege", value: team.wins || 0, icon: Target, color: "text-green-500" },
            { label: "Spiele", value: (team.wins || 0) + (team.draws || 0) + (team.losses || 0), icon: Calendar, color: "text-blue-500" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl bg-[#111111] border border-[#1a1a1a] p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Info */}
          <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Team-Daten</h3>
              <Button variant="ghost" size="sm" onClick={() => {
                if (editing) {
                  updateTeam.mutate(editForm);
                } else {
                  setEditForm({ name: team.name, scolia_location: team.scolia_location || "" });
                  setEditing(true);
                }
              }} className="text-gray-400 hover:text-white border-0">
                {editing ? <><Save className="w-3 h-3 mr-1" /> Speichern</> : <><Edit2 className="w-3 h-3 mr-1" /> Bearbeiten</>}
              </Button>
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-500 text-xs">Teamname</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 text-xs">Scolia Standort</Label>
                  <Input value={editForm.scolia_location} onChange={(e) => setEditForm({ ...editForm, scolia_location: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-500 text-xs">Team-Logo</Label>
                  <div className="flex items-center gap-3">
                    {team.logo_url ? (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-[#2a2a2a]">
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#2a2a2a] flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                      <Button type="button" size="sm" variant="outline" className="border-[#2a2a2a] text-gray-400 hover:text-white" asChild>
                        <span>
                          <Upload className="w-3 h-3 mr-1" />
                          {uploadingLogo ? "Lädt..." : team.logo_url ? "Ändern" : "Hochladen"}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
                <div><span className="text-xs text-gray-500">Teamname</span><p className="text-white text-sm">{team.name}</p></div>
                <div><span className="text-xs text-gray-500">Kapitän</span><p className="text-white text-sm">{team.captain_name}</p></div>
                <div><span className="text-xs text-gray-500">Standort</span><p className="text-white text-sm">{team.scolia_location || "—"}</p></div>
                <div><span className="text-xs text-gray-500">Status</span>
                  <p className={`text-sm font-medium ${team.status === "approved" ? "text-green-400" : team.status === "pending" ? "text-yellow-400" : "text-red-400"}`}>
                    {team.status === "approved" ? "Freigegeben" : team.status === "pending" ? "Ausstehend" : "Abgelehnt"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Players */}
          <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" /> Spieler ({players.length})
            </h3>
            <div className="space-y-2 mb-4">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#0a0a0a]">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-600/10 flex items-center justify-center text-xs font-bold text-red-400">
                      {p.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="text-sm text-white">{p.name}</span>
                    {p.is_captain && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded font-medium">Kapitän</span>}
                  </div>
                  {!p.is_captain && (
                    <Button variant="ghost" size="icon" className="w-7 h-7 text-gray-600 hover:text-red-400 border-0"
                      onClick={() => removePlayer.mutate(p.id)}>
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Spieler hinzufügen"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm placeholder:text-gray-600"
              />
              <Button
                onClick={() => newPlayerName.trim() && addPlayer.mutate(newPlayerName.trim())}
                className="bg-red-600 hover:bg-red-500 text-white border-0 shrink-0"
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Matches */}
        {matches.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" /> Deine Spiele
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {matches.map((match) => {
                const isHome = match.home_team_id === team.id;
                const needsConfirmation = match.status === "result_submitted" && match.needs_confirmation_from === team.id;
                const waitingForConfirmation = match.status === "result_submitted" && match.submitted_by_team_id === team.id;
                const canSubmit = match.status === "scheduled";

                return (
                  <div key={match.id}>
                    {editingMatchId === match.id ? (
                      <MatchResultForm
                        match={match}
                        myTeamId={team.id}
                        onSuccess={() => {
                          setEditingMatchId(null);
                          queryClient.invalidateQueries({ queryKey: ["team-matches"] });
                        }}
                        onCancel={() => setEditingMatchId(null)}
                      />
                    ) : (
                      <div className="rounded-xl border bg-[#111111] border-[#1a1a1a] p-4 hover:border-red-600/20 transition-colors">
                        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {match.date ? format(new Date(match.date), "dd. MMM yyyy", { locale: de }) : "TBD"}
                          <span className="ml-auto">Spieltag {match.matchday}</span>
                        </div>

                        <div className="flex items-center gap-3 mb-3">
                          <span className={`flex-1 text-right text-sm font-semibold ${match.status === "completed" && match.home_legs > match.away_legs ? "text-white" : "text-gray-400"}`}>
                            {match.home_team_name}
                          </span>
                          <div className="px-3 py-1.5 rounded-lg bg-[#0a0a0a] min-w-[80px] text-center">
                            {match.status === "completed" || match.status === "result_submitted" ? (
                              <span className="text-lg font-black text-white">{match.home_legs} : {match.away_legs}</span>
                            ) : (
                              <span className="text-sm text-gray-600">vs</span>
                            )}
                          </div>
                          <span className={`flex-1 text-sm font-semibold ${match.status === "completed" && match.away_legs > match.home_legs ? "text-white" : "text-gray-400"}`}>
                            {match.away_team_name}
                          </span>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {match.status === "completed" && (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" /> Abgeschlossen
                            </Badge>
                          )}
                          {waitingForConfirmation && (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> Wartet auf Bestätigung
                            </Badge>
                          )}
                          {needsConfirmation && match.result_photo_url && (
                            <a href={match.result_photo_url} target="_blank" rel="noopener noreferrer">
                              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs cursor-pointer hover:bg-blue-500/20">
                                📸 Foto ansehen
                              </Badge>
                            </a>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {canSubmit && (
                            <Button
                              size="sm"
                              onClick={() => setEditingMatchId(match.id)}
                              className="bg-red-600 hover:bg-red-500 text-white border-0 text-xs h-8"
                            >
                              <Upload className="w-3 h-3 mr-1" /> Ergebnis eintragen
                            </Button>
                          )}
                          {needsConfirmation && (
                            <Button
                              size="sm"
                              onClick={() => confirmResult.mutate(match.id)}
                              className="bg-green-600 hover:bg-green-500 text-white border-0 text-xs h-8"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" /> Ergebnis bestätigen
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}