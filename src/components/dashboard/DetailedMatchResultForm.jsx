import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DetailedMatchResultForm({ match, onCancel, onSuccess, homePlayers, awayPlayers }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [individualMatches, setIndividualMatches] = useState([]);
  const [playerStats, setPlayerStats] = useState({});

  // Initialize 16 individual matches (4 home players x 4 away players)
  React.useEffect(() => {
    if (homePlayers.length === 4 && awayPlayers.length === 4) {
      const matches = [];
      const stats = {};
      homePlayers.forEach((homePlayer) => {
        awayPlayers.forEach((awayPlayer) => {
          matches.push({
            player1_id: homePlayer.id,
            player1_name: homePlayer.name,
            player2_id: awayPlayer.id,
            player2_name: awayPlayer.name,
            player1_legs: 0,
            player2_legs: 0,
            winner_id: "",
            player1_average: 0,
            player1_high: 0,
            player1_centuries: 0,
            player2_average: 0,
            player2_high: 0,
            player2_centuries: 0,
          });
        });
        stats[homePlayer.id] = { average: 0, high: 0, centuries: 0 };
      });
      awayPlayers.forEach((awayPlayer) => {
        stats[awayPlayer.id] = { average: 0, high: 0, centuries: 0 };
      });
      setIndividualMatches(matches);
      setPlayerStats(stats);
    }
  }, [homePlayers, awayPlayers]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(result.file_url);
      toast.success("Foto hochgeladen");
    } catch (error) {
      toast.error("Fehler beim Hochladen");
    } finally {
      setUploading(false);
    }
  };

  const updateMatch = (index, field, value) => {
    const updated = [...individualMatches];
    updated[index][field] = field.includes("legs") ? parseInt(value) || 0 : parseInt(value) || 0;
    
    // Auto-determine winner based on legs
    const player1Legs = field === "player1_legs" ? parseInt(value) || 0 : updated[index].player1_legs;
    const player2Legs = field === "player2_legs" ? parseInt(value) || 0 : updated[index].player2_legs;
    
    if (player1Legs >= 3) {
      updated[index].winner_id = updated[index].player1_id;
    } else if (player2Legs >= 3) {
      updated[index].winner_id = updated[index].player2_id;
    }
    
    setIndividualMatches(updated);
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error("Bitte lade ein Foto hoch");
      return;
    }

    // Validate all matches have winners
    const incomplete = individualMatches.filter(m => !m.winner_id);
    if (incomplete.length > 0) {
      toast.error(`Bitte trage alle ${incomplete.length} Ergebnisse ein`);
      return;
    }

    // Calculate total legs
    const homeLegsTotal = individualMatches.reduce((sum, m) => 
      sum + (m.winner_id === m.player1_id ? m.player1_legs : 0) + 
      (m.winner_id === m.player2_id ? 0 : m.player1_legs), 0);
    const awayLegsTotal = individualMatches.reduce((sum, m) => 
      sum + (m.winner_id === m.player2_id ? m.player2_legs : 0) + 
      (m.winner_id === m.player1_id ? 0 : m.player2_legs), 0);

    try {
      // Update match with total legs
      await base44.entities.Match.update(match.id, {
        home_legs: homeLegsTotal,
        away_legs: awayLegsTotal,
        status: "result_submitted",
        result_photo_url: photoUrl,
        submitted_by_team_id: match.home_team_id,
        needs_confirmation_from: match.away_team_id,
      });

      // Save individual match results
      for (const individualMatch of individualMatches) {
        await base44.entities.PlayerMatch.create({
          match_id: match.id,
          player1_id: individualMatch.player1_id,
          player1_name: individualMatch.player1_name,
          player2_id: individualMatch.player2_id,
          player2_name: individualMatch.player2_name,
          player1_legs: individualMatch.player1_legs,
          player2_legs: individualMatch.player2_legs,
          winner_id: individualMatch.winner_id,
          league_tier: match.league_tier,
        });

        // Update player stats
        await updatePlayerStats(individualMatch.player1_id, individualMatch.player1_name, 
          match.home_team_id, match.home_team_name, match.league_tier,
          individualMatch.winner_id === individualMatch.player1_id ? 1 : 0,
          individualMatch.player1_legs, individualMatch.player2_legs,
          individualMatch.player1_average, individualMatch.player1_high, individualMatch.player1_centuries);

        await updatePlayerStats(individualMatch.player2_id, individualMatch.player2_name,
          match.away_team_id, match.away_team_name, match.league_tier,
          individualMatch.winner_id === individualMatch.player2_id ? 1 : 0,
          individualMatch.player2_legs, individualMatch.player1_legs,
          individualMatch.player2_average, individualMatch.player2_high, individualMatch.player2_centuries);
      }

      toast.success("Ergebnis eingetragen!");
      onSuccess();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
  };

  const updatePlayerStats = async (playerId, playerName, teamId, teamName, leagueTier, won, legsWon, legsLost, average, highFinish, centuries) => {
    const existingStats = await base44.entities.PlayerStats.filter({ player_id: playerId });
    
    if (existingStats.length > 0) {
      const stat = existingStats[0];
      const newHighFinish = Math.max(stat.high_finish, highFinish);
      await base44.entities.PlayerStats.update(stat.id, {
        matches_played: stat.matches_played + 1,
        matches_won: stat.matches_won + won,
        matches_lost: stat.matches_lost + (won ? 0 : 1),
        legs_won: stat.legs_won + legsWon,
        legs_lost: stat.legs_lost + legsLost,
        leg_difference: (stat.legs_won + legsWon) - (stat.legs_lost + legsLost),
        average: average || stat.average,
        high_finish: newHighFinish,
        century_count: stat.century_count + centuries,
      });
    } else {
      await base44.entities.PlayerStats.create({
        player_id: playerId,
        player_name: playerName,
        team_id: teamId,
        team_name: teamName,
        league_tier: leagueTier,
        matches_played: 1,
        matches_won: won,
        matches_lost: won ? 0 : 1,
        legs_won: legsWon,
        legs_lost: legsLost,
        leg_difference: legsWon - legsLost,
        average: average || 0,
        high_finish: highFinish || 0,
        century_count: centuries || 0,
      });
    }
  };

  return (
    <Card className="bg-[#111111] border-[#1a1a1a] text-white">
      <CardHeader>
        <CardTitle className="text-lg">Einzelergebnisse eintragen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo upload */}
        <div>
          <Label className="text-gray-400 mb-2 block">Foto-Beweis *</Label>
          {photoUrl ? (
            <div className="relative">
              <img src={photoUrl} alt="Result" className="w-full h-48 object-cover rounded-lg" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setPhotoUrl("")}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#2a2a2a] rounded-lg cursor-pointer hover:border-red-600/50 transition-colors">
              <Camera className="w-8 h-8 text-gray-500 mb-2" />
              <span className="text-sm text-gray-500">
                {uploading ? "Lädt hoch..." : "Klicken zum Hochladen"}
              </span>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Individual matches grid */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {individualMatches.map((im, index) => (
            <Card key={index} className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{im.player1_name}</p>
                    <p className="text-xs text-gray-500">{match.home_team_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      value={im.player1_legs}
                      onChange={(e) => updateMatch(index, "player1_legs", e.target.value)}
                      className="w-16 text-center bg-[#111111] border-[#2a2a2a]"
                    />
                    <span className="text-gray-600">:</span>
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      value={im.player2_legs}
                      onChange={(e) => updateMatch(index, "player2_legs", e.target.value)}
                      className="w-16 text-center bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-medium text-white">{im.player2_name}</p>
                    <p className="text-xs text-gray-500">{match.away_team_name}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-[#2a2a2a] space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-500 mb-1">{im.player1_name}</p>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="AVG"
                          value={im.player1_average}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player1_average = parseFloat(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                        <Input
                          type="number"
                          placeholder="High Finish"
                          value={im.player1_high}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player1_high = parseInt(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                        <Input
                          type="number"
                          placeholder="100+ Scores"
                          value={im.player1_centuries}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player1_centuries = parseInt(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-1">{im.player2_name}</p>
                      <div className="space-y-1">
                        <Input
                          type="number"
                          placeholder="AVG"
                          value={im.player2_average}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player2_average = parseFloat(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                        <Input
                          type="number"
                          placeholder="High Finish"
                          value={im.player2_high}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player2_high = parseInt(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                        <Input
                          type="number"
                          placeholder="100+ Scores"
                          value={im.player2_centuries}
                          onChange={(e) => {
                            const updated = [...individualMatches];
                            updated[index].player2_centuries = parseInt(e.target.value) || 0;
                            setIndividualMatches(updated);
                          }}
                          className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                        />
                      </div>
                    </div>
                  </div>
                  {im.winner_id && (
                    <p className="text-green-500 text-center">
                      ✓ Gewinner: {im.winner_id === im.player1_id ? im.player1_name : im.player2_name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 border-[#2a2a2a] text-gray-400">
            Abbrechen
          </Button>
          <Button onClick={handleSubmit} className="flex-1 bg-red-600 hover:bg-red-500">
            Ergebnis einreichen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}