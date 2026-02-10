import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function SeasonManager() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", status: "upcoming", rules: "" });

  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons-admin"],
    queryFn: () => base44.entities.Season.list("-created_date"),
  });

  const createSeason = useMutation({
    mutationFn: (data) => base44.entities.Season.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons-admin"] });
      setShowForm(false);
      setForm({ name: "", start_date: "", end_date: "", status: "upcoming", rules: "" });
      toast.success("Saison erstellt!");
    },
  });

  const deleteSeason = useMutation({
    mutationFn: (id) => base44.entities.Season.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons-admin"] });
      toast.success("Saison gelöscht.");
    },
  });

  const updateSeason = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Season.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons-admin"] });
      toast.success("Saison aktualisiert!");
    },
  });

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-400",
    active: "bg-green-500/10 text-green-400",
    completed: "bg-gray-500/10 text-gray-400",
  };

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowForm(!showForm)} className="bg-red-600 hover:bg-red-500 text-white border-0" size="sm">
        <Plus className="w-4 h-4 mr-1" /> Neue Saison
      </Button>

      {showForm && (
        <div className="rounded-xl bg-[#0a0a0a] border border-[#2a2a2a] p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-gray-400 text-xs">Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-[#111111] border-[#2a2a2a] text-white text-sm" placeholder="z.B. Saison 1 - 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">Start</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="bg-[#111111] border-[#2a2a2a] text-white text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-400 text-xs">Ende</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="bg-[#111111] border-[#2a2a2a] text-white text-sm" />
            </div>
          </div>
          <Button onClick={() => createSeason.mutate(form)} className="bg-red-600 hover:bg-red-500 text-white border-0" size="sm">
            <Save className="w-3 h-3 mr-1" /> Erstellen
          </Button>
        </div>
      )}

      {seasons.map((season) => (
        <div key={season.id} className="rounded-xl bg-[#111111] border border-[#1a1a1a] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{season.name}</span>
              <Badge className={statusColors[season.status]}>{season.status}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Select defaultValue={season.status}
                onValueChange={(val) => updateSeason.mutate({ id: season.id, data: { status: val } })}>
                <SelectTrigger className="w-28 h-7 bg-[#0a0a0a] border-[#2a2a2a] text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="upcoming" className="text-white text-xs">Upcoming</SelectItem>
                  <SelectItem value="active" className="text-white text-xs">Active</SelectItem>
                  <SelectItem value="completed" className="text-white text-xs">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Button size="icon" variant="ghost"
                className="w-7 h-7 text-gray-600 hover:text-red-400 border-0"
                onClick={() => deleteSeason.mutate(season.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}