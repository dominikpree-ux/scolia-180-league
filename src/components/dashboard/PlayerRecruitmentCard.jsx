import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Save, Users, Edit2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function PlayerRecruitmentCard({ team }) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    looking_for_players: team?.looking_for_players || false,
    positions_needed: team?.positions_needed || 0,
    recruitment_message: team?.recruitment_message || "",
  });

  const queryClient = useQueryClient();

  const updateTeamMutation = useMutation({
    mutationFn: (data) => base44.entities.Team.update(team.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-teams"] });
      setEditing(false);
      toast.success("Spielersuche aktualisiert!");
    },
  });

  const handleSave = () => {
    updateTeamMutation.mutate(formData);
  };

  return (
    <Card className="bg-[#111111] border-[#1a1a1a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-red-500" />
            Spielersuche
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
            <div className="flex items-center justify-between">
              <Label htmlFor="looking" className="text-gray-400 text-sm">
                Team sucht Spieler
              </Label>
              <Switch
                id="looking"
                checked={formData.looking_for_players}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, looking_for_players: checked })
                }
              />
            </div>

            {formData.looking_for_players && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-gray-500 text-xs">Anzahl benötigter Spieler</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.positions_needed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        positions_needed: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-gray-500 text-xs">Recruiting-Nachricht</Label>
                  <Textarea
                    value={formData.recruitment_message}
                    onChange={(e) =>
                      setFormData({ ...formData, recruitment_message: e.target.value })
                    }
                    placeholder="Z.B. Wir suchen motivierte Spieler für Liga B..."
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm min-h-[80px]"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {team?.looking_for_players ? (
              <>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1">
                    <Users className="w-4 h-4" />
                    Team sucht {team.positions_needed} Spieler
                  </div>
                  {team.recruitment_message && (
                    <p className="text-gray-400 text-xs mt-2">{team.recruitment_message}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Dein Team ist auf der Spielersuche-Seite sichtbar
                </p>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <p className="text-gray-500 text-sm">
                  Team sucht derzeit keine Spieler
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}