import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function SimpleMatchResultForm({ match, onCancel, onSuccess, allPlayers }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [playerStats, setPlayerStats] = useState({});

  // Initialize player stats for all team players
  React.useEffect(() => {
    const stats = {};
    allPlayers.forEach(p => {
      stats[p.id] = {
        name: p.name,
        legs_won: 0,
        legs_lost: 0,
        average: 0,
        high_finish: 0,
        centuries: 0,
        won_match: false
      };
    });
    setPlayerStats(stats);
  }, [allPlayers]);

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

  const updatePlayerStat = (playerId, field, value) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: field === 'won_match' ? !prev[playerId][field] : (field.includes('legs') || field === 'high_finish' || field === 'centuries' ? parseInt(value) || 0 : parseFloat(value) || 0)
      }
    }));
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error("Bitte lade ein Foto hoch");
      return;
    }

    try {
      const isHome = match.home_team_id === (await base44.auth.me()).user?.team_id;
      
      // Update match status
      await base44.entities.Match.update(match.id, {
        status: "result_submitted",
        result_photo_url: photoUrl,
        submitted_by_team_id: isHome ? match.home_team_id : match.away_team_id,
        needs_confirmation_from: isHome ? match.away_team_id : match.home_team_id,
      });

      // Update player stats for each player
      for (const playerId in playerStats) {
        const stat = playerStats[playerId];
        const existingStats = await base44.entities.PlayerStats.filter({ player_id: playerId });

        if (existingStats.length > 0) {
          const current = existingStats[0];
          const newHighFinish = Math.max(current.high_finish || 0, stat.high_finish);
          
          await base44.entities.PlayerStats.update(current.id, {
            matches_played: current.matches_played + 1,
            matches_won: current.matches_won + (stat.won_match ? 1 : 0),
            matches_lost: current.matches_lost + (stat.won_match ? 0 : 1),
            legs_won: current.legs_won + stat.legs_won,
            legs_lost: current.legs_lost + stat.legs_lost,
            leg_difference: (current.legs_won + stat.legs_won) - (current.legs_lost + stat.legs_lost),
            average: stat.average || current.average,
            high_finish: newHighFinish,
            century_count: (current.century_count || 0) + stat.centuries,
          });
        } else {
          const player = allPlayers.find(p => p.id === playerId);
          const myTeam = await base44.entities.Team.filter({ id: isHome ? match.home_team_id : match.away_team_id });
          
          await base44.entities.PlayerStats.create({
            player_id: playerId,
            player_name: stat.name,
            team_id: isHome ? match.home_team_id : match.away_team_id,
            team_name: isHome ? match.home_team_name : match.away_team_name,
            league_tier: match.league_tier,
            matches_played: 1,
            matches_won: stat.won_match ? 1 : 0,
            matches_lost: stat.won_match ? 0 : 1,
            legs_won: stat.legs_won,
            legs_lost: stat.legs_lost,
            leg_difference: stat.legs_won - stat.legs_lost,
            average: stat.average || 0,
            high_finish: stat.high_finish || 0,
            century_count: stat.centuries || 0,
          });
        }
      }

      toast.success("Ergebnis eingetragen!");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Fehler beim Speichern");
    }
  };

  return (
    <Card className="bg-[#111111] border-[#1a1a1a] text-white">
      <CardHeader>
        <CardTitle className="text-lg">Match-Ergebnis einreichen</CardTitle>
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

        {/* Player stats */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          <Label className="text-gray-400 text-sm">Spieler-Statistiken</Label>
          {allPlayers.map((player) => (
            <Card key={player.id} className="bg-[#0a0a0a] border-[#2a2a2a]">
              <CardContent className="p-4">
                <div className="mb-3">
                  <p className="text-sm font-medium text-white">{player.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500">Beine gewonnen</Label>
                    <Input
                      type="number"
                      min="0"
                      value={playerStats[player.id]?.legs_won || 0}
                      onChange={(e) => updatePlayerStat(player.id, "legs_won", e.target.value)}
                      className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Beine verloren</Label>
                    <Input
                      type="number"
                      min="0"
                      value={playerStats[player.id]?.legs_lost || 0}
                      onChange={(e) => updatePlayerStat(player.id, "legs_lost", e.target.value)}
                      className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Durchschnitt (AVG)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={playerStats[player.id]?.average || 0}
                      onChange={(e) => updatePlayerStat(player.id, "average", e.target.value)}
                      className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">High Finish</Label>
                    <Input
                      type="number"
                      value={playerStats[player.id]?.high_finish || 0}
                      onChange={(e) => updatePlayerStat(player.id, "high_finish", e.target.value)}
                      className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">100+ Scores</Label>
                    <Input
                      type="number"
                      min="0"
                      value={playerStats[player.id]?.centuries || 0}
                      onChange={(e) => updatePlayerStat(player.id, "centuries", e.target.value)}
                      className="w-full text-xs h-7 bg-[#111111] border-[#2a2a2a]"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant={playerStats[player.id]?.won_match ? "default" : "outline"}
                      onClick={() => updatePlayerStat(player.id, "won_match", null)}
                      className={`w-full text-xs h-7 ${playerStats[player.id]?.won_match ? "bg-green-600 hover:bg-green-500" : "border-[#2a2a2a] text-gray-400"}`}
                    >
                      {playerStats[player.id]?.won_match ? "✓ Gewonnen" : "Gewonnen"}
                    </Button>
                  </div>
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