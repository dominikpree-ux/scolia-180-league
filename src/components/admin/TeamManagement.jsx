import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Trash2, Users, MapPin, Mail, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

export default function TeamManagement() {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const queryClient = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["admin-teams"],
    queryFn: () => base44.entities.Team.list("-created_date"),
  });

  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Team aktualisiert!");
    },
  });

  const deleteTeam = useMutation({
    mutationFn: (id) => base44.entities.Team.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teams"] });
      toast.success("Team gelöscht.");
    },
  });

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  if (isLoading) return <div className="py-12 text-center text-gray-500 text-sm">Lade Teams...</div>;

  return (
    <div className="space-y-3">
      {teams.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">Keine Teams vorhanden.</div>
      ) : (
        teams.map((team) => (
          <div key={team.id} className="rounded-xl bg-[#111111] border border-[#1a1a1a] p-4">
            {editingId === team.id ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-gray-400 text-xs">Teamname</Label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Kapitän</Label>
                  <Input
                    value={editForm.captain_name}
                    onChange={(e) => setEditForm({ ...editForm, captain_name: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-gray-400 text-xs">Scolia Standort</Label>
                  <Input
                    value={editForm.scolia_location}
                    onChange={(e) => setEditForm({ ...editForm, scolia_location: e.target.value })}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white text-sm mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#2a2a2a] text-gray-400 hover:text-white h-8"
                    onClick={() => setEditingId(null)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-500 text-white border-0 h-8"
                    onClick={() => {
                      updateTeam.mutate({ id: team.id, data: editForm });
                      setEditingId(null);
                    }}
                  >
                    Speichern
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm truncate">{team.name}</h3>
                      <Badge className={`text-[10px] border ${statusColors[team.status]}`}>
                        {team.status === "pending" ? "Ausstehend" : team.status === "approved" ? "Freigegeben" : "Abgelehnt"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {team.captain_name}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {team.captain_email}</span>
                      {team.scolia_location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {team.scolia_location}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="icon" variant="ghost"
                      className="w-8 h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 border-0"
                      onClick={() => {
                        setEditingId(team.id);
                        setEditForm({ name: team.name, captain_name: team.captain_name, scolia_location: team.scolia_location });
                      }}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    {team.status === "pending" && (
                      <>
                        <Button size="icon" variant="ghost"
                          className="w-8 h-8 text-green-400 hover:text-green-300 hover:bg-green-500/10 border-0"
                          onClick={() => updateTeam.mutate({ id: team.id, data: { status: "approved" } })}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost"
                          className="w-8 h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-0"
                          onClick={() => updateTeam.mutate({ id: team.id, data: { status: "rejected" } })}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button size="icon" variant="ghost"
                      className="w-8 h-8 text-gray-600 hover:text-red-400 hover:bg-red-500/10 border-0"
                      onClick={() => deleteTeam.mutate(team.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}