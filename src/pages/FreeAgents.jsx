import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Search, Mail, TrendingUp, Target, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ContactDialog from "../components/chat/ContactDialog";

export default function FreeAgents() {
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [viewMode, setViewMode] = useState("players"); // "players" or "teams"
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
        
        const teams = await base44.entities.Team.filter({ captain_email: me.email });
        if (teams.length > 0) setMyTeam(teams[0]);
        
        const players = await base44.entities.Player.filter({ email: me.email });
        if (players.length > 0) setMyPlayer(players[0]);
      }
    };
    loadUser();
  }, []);

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: stats = [] } = useQuery({
    queryKey: ['playerStats'],
    queryFn: () => base44.entities.PlayerStats.list(),
  });

  // Filter free agents
  const freeAgents = players.filter(p => p.looking_for_team || p.available_as_substitute);
  const recruitingTeams = teams.filter(t => t.looking_for_players && t.status === 'approved');

  // Combine player with their stats
  const playersWithStats = freeAgents.map(player => {
    const playerStats = stats.find(s => s.player_id === player.id) || {};
    const team = teams.find(t => t.id === player.team_id);
    return { ...player, stats: playerStats, team };
  });

  // Filter by league
  const filteredPlayers = leagueFilter === "all" 
    ? playersWithStats 
    : playersWithStats.filter(p => 
        p.preferred_league?.includes(leagueFilter) || p.stats.league_tier === leagueFilter
      );

  const filteredTeams = leagueFilter === "all"
    ? recruitingTeams
    : recruitingTeams.filter(t => t.league_tier === leagueFilter);

  const leagueColors = {
    A: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    C: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Spielersuche</h1>
              <p className="text-gray-400 text-sm">Finde Spieler oder Teams</p>
            </div>
          </div>
        </div>

        {/* View Toggle and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === "players" ? "default" : "outline"}
              onClick={() => setViewMode("players")}
              className={viewMode === "players" ? "bg-red-600 hover:bg-red-500" : "border-gray-700 text-gray-400 hover:text-white"}
            >
              <Users className="w-4 h-4 mr-2" />
              Spieler suchen Team ({freeAgents.length})
            </Button>
            <Button
              variant={viewMode === "teams" ? "default" : "outline"}
              onClick={() => setViewMode("teams")}
              className={viewMode === "teams" ? "bg-red-600 hover:bg-red-500" : "border-gray-700 text-gray-400 hover:text-white"}
            >
              <Target className="w-4 h-4 mr-2" />
              Teams suchen Spieler ({recruitingTeams.length})
            </Button>
          </div>

          <Select value={leagueFilter} onValueChange={setLeagueFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-[#1a1a1a] border-gray-700 text-white">
              <SelectValue placeholder="Liga Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Ligen</SelectItem>
              <SelectItem value="A">Liga A</SelectItem>
              <SelectItem value="B">Liga B</SelectItem>
              <SelectItem value="C">Liga C</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Players View */}
        {viewMode === "players" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlayers.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Keine Spieler gefunden</p>
              </div>
            ) : (
              filteredPlayers.map((player) => (
                <Card key={player.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">
                          {player.nickname || player.name}
                        </CardTitle>
                        {player.team && (
                          <p className="text-sm text-gray-500 mt-1">{player.team.name}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {player.looking_for_team && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            Sucht Team
                          </Badge>
                        )}
                        {player.available_as_substitute && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Vertretung
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    {player.stats.matches_played > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-[#111] rounded-lg p-2">
                          <div className="text-xs text-gray-500">Matches</div>
                          <div className="text-white font-semibold">{player.stats.matches_played}</div>
                        </div>
                        <div className="bg-[#111] rounded-lg p-2">
                          <div className="text-xs text-gray-500">Average</div>
                          <div className="text-white font-semibold">{player.stats.average?.toFixed(1) || '0.0'}</div>
                        </div>
                        <div className="bg-[#111] rounded-lg p-2">
                          <div className="text-xs text-gray-500">Win %</div>
                          <div className="text-white font-semibold">
                            {player.stats.matches_played > 0 
                              ? ((player.stats.matches_won / player.stats.matches_played) * 100).toFixed(0)
                              : 0}%
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preferred League */}
                    {player.preferred_league?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Bevorzugte Liga</div>
                        <div className="flex gap-2 flex-wrap">
                          {player.preferred_league.map(league => (
                            <Badge key={league} className={leagueColors[league]}>
                              Liga {league}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bio */}
                    {player.bio && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Info</div>
                        <p className="text-sm text-gray-300">{player.bio}</p>
                      </div>
                    )}

                    {/* Contact Button */}
                    {myPlayer && player.id !== myPlayer?.id && user && (
                      <ContactDialog 
                        targetId={player.id}
                        targetName={player.nickname || player.name}
                        targetType="player"
                        currentUser={user}
                        currentUserType="player"
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Teams View */}
        {viewMode === "teams" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Keine Teams gefunden</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Card key={team.id} className="bg-[#1a1a1a] border-gray-800 hover:border-gray-700 transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      {team.logo_url && (
                        <img src={team.logo_url} alt={team.name} className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-white text-lg">{team.name}</CardTitle>
                        <Badge className={`${leagueColors[team.league_tier]} mt-1`}>
                          Liga {team.league_tier}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Positions needed */}
                    <div className="bg-[#111] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Gesucht</div>
                      <div className="text-white font-semibold">
                        {team.positions_needed} Spieler
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#111] rounded-lg p-2">
                        <div className="text-xs text-gray-500">Gewonnen</div>
                        <div className="text-green-400 font-semibold">{team.wins}</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-2">
                        <div className="text-xs text-gray-500">Unentschieden</div>
                        <div className="text-yellow-400 font-semibold">{team.draws}</div>
                      </div>
                      <div className="bg-[#111] rounded-lg p-2">
                        <div className="text-xs text-gray-500">Verloren</div>
                        <div className="text-red-400 font-semibold">{team.losses}</div>
                      </div>
                    </div>

                    {/* Recruitment Message */}
                    {team.recruitment_message && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Nachricht</div>
                        <p className="text-sm text-gray-300">{team.recruitment_message}</p>
                      </div>
                    )}

                    {/* Contact Button */}
                    {myTeam && myTeam.id !== team.id && user && (
                      <ContactDialog 
                        targetId={team.id}
                        targetName={team.name}
                        targetType="team"
                        currentUser={user}
                        currentUserType="team"
                        currentTeam={myTeam}
                      />
                    )}
                    {myPlayer && myPlayer.team_id !== team.id && user && (
                      <ContactDialog 
                        targetId={team.id}
                        targetName={team.name}
                        targetType="team"
                        currentUser={user}
                        currentUserType="player"
                      />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}


      </div>
    </div>
  );
}