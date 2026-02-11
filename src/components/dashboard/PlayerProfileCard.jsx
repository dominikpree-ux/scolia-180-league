import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { User, Save, Edit2, Search } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PlayerProfileCard({ player, teamCaptainEmail, userEmail }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: player?.nickname || "",
    looking_for_team: player?.looking_for_team || false,
    available_as_substitute: player?.available_as_substitute || false,
    preferred_league: player?.preferred_league || [],
    bio: player?.bio || "",
  });

  const queryClient = useQueryClient();
  const isCaptain = teamCaptainEmail === userEmail;

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(player.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-players"] });
      setEditing(false);
      toast.success("Profil aktualisiert!");
    },
  });

  const handleSave = () => {
    updatePlayerMutation.mutate(formData);
  };

  const toggleLeague = (league) => {
    const current = formData.preferred_league || [];
    const newLeagues = current.includes(league)
      ? current.filter((l) => l !== league)
      : [...current, league];
    setFormData({ ...formData, preferred_league: newLeagues });
  };

  if (!player) return null;

  // Show for: own player entry, standalone player, or captain's player
  const myPlayerEntry = player.email === userEmail || (isCaptain && !player.email) || !player.team_id;
  if (!myPlayerEntry && player.email !== userEmail) return null;

  return (
    <Card className="bg-[#111111] border-[#1a1a1a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-red-500" />
            Spielerprofil
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            className="text-gray-400 hover:text-white border-0"
          >
            {editing ? (
              <>
                <Save className="w-3 h-3 mr-1" /> Speichern
              </>
            ) : (
              <>
                <Edit2 className="w-3 h-3 mr-1" /> Bearbeiten
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs">Nickname</Label>
              <Input
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Dein Spitzname"
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-500 text-xs">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Erzähl etwas über dich..."
                className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm min-h-[60px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="looking-team" className="text-gray-400 text-sm">
                Suche Team
              </Label>
              <Switch
                id="looking-team"
                checked={formData.looking_for_team}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, looking_for_team: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="substitute" className="text-gray-400 text-sm">
                Verfügbar als Vertretung
              </Label>
              <Switch
                id="substitute"
                checked={formData.available_as_substitute}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available_as_substitute: checked })
                }
              />
            </div>

            {(formData.looking_for_team || formData.available_as_substitute) && (
              <div className="space-y-1.5">
                <Label className="text-gray-500 text-xs">Bevorzugte Ligen</Label>
                <div className="flex gap-2">
                  {["A", "B", "C"].map((league) => (
                    <Button
                      key={league}
                      type="button"
                      size="sm"
                      variant={formData.preferred_league?.includes(league) ? "default" : "outline"}
                      onClick={() => toggleLeague(league)}
                      className={
                        formData.preferred_league?.includes(league)
                          ? "bg-red-600 hover:bg-red-500"
                          : "border-[#2a2a2a] text-gray-400 hover:text-white"
                      }
                    >
                      Liga {league}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-500">Name</span>
              <p className="text-white text-sm">{player.name}</p>
            </div>

            {player.nickname && (
              <div>
                <span className="text-xs text-gray-500">Nickname</span>
                <p className="text-white text-sm">{player.nickname}</p>
              </div>
            )}

            {player.bio && (
              <div>
                <span className="text-xs text-gray-500">Bio</span>
                <p className="text-white text-sm">{player.bio}</p>
              </div>
            )}

            {(player.looking_for_team || player.available_as_substitute) && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex flex-col gap-2">
                  {player.looking_for_team && (
                    <div className="flex items-center gap-2 text-green-400 text-xs font-medium">
                      <Search className="w-3 h-3" />
                      Sucht Team
                    </div>
                  )}
                  {player.available_as_substitute && (
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-medium">
                      <User className="w-3 h-3" />
                      Verfügbar als Vertretung
                    </div>
                  )}
                  {player.preferred_league?.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                      {player.preferred_league.map((league) => (
                        <Badge
                          key={league}
                          className="bg-white/10 text-white text-xs"
                        >
                          Liga {league}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Du bist auf der Spielersuche-Seite sichtbar
                </p>
              </div>
            )}

            {!player.looking_for_team && !player.available_as_substitute && (
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <p className="text-gray-500 text-sm">
                  Du suchst derzeit kein Team
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}