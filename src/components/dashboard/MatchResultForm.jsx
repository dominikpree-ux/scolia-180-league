import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, Save, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MatchResultForm({ match, myTeamId, onSuccess, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(match.result_photo_url || "");
  const [form, setForm] = useState({
    home_legs: match.home_legs || 0,
    away_legs: match.away_legs || 0,
    home_sets: match.home_sets || 0,
    away_sets: match.away_sets || 0,
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(result.file_url);
      toast.success("Foto hochgeladen!");
    } catch (error) {
      toast.error("Fehler beim Hochladen");
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!photoUrl) {
      toast.error("Bitte lade ein Foto als Beweis hoch!");
      return;
    }

    setSubmitting(true);
    try {
      const opponentTeamId = match.home_team_id === myTeamId ? match.away_team_id : match.home_team_id;
      
      await base44.entities.Match.update(match.id, {
        ...form,
        result_photo_url: photoUrl,
        status: "result_submitted",
        submitted_by_team_id: myTeamId,
        needs_confirmation_from: opponentTeamId,
      });

      toast.success("Ergebnis eingereicht! Wartet auf Bestätigung des Gegners.");
      onSuccess();
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
    setSubmitting(false);
  };

  return (
    <Card className="bg-[#0a0a0a] border-[#2a2a2a] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Ergebnis eintragen</h4>
        <Button variant="ghost" size="icon" onClick={onCancel} className="w-7 h-7 text-gray-500 hover:text-white border-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Score input */}
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 items-center">
          <span className="text-xs text-gray-400 text-right">{match.home_team_name}</span>
          <div className="flex items-center gap-1 justify-center">
            <Input
              type="number"
              min="0"
              value={form.home_legs}
              onChange={(e) => setForm({ ...form, home_legs: parseInt(e.target.value) || 0 })}
              className="w-16 h-9 bg-[#111111] border-[#2a2a2a] text-white text-center text-sm"
            />
            <span className="text-gray-600 text-xs">:</span>
            <Input
              type="number"
              min="0"
              value={form.away_legs}
              onChange={(e) => setForm({ ...form, away_legs: parseInt(e.target.value) || 0 })}
              className="w-16 h-9 bg-[#111111] border-[#2a2a2a] text-white text-center text-sm"
            />
          </div>
          <span className="text-xs text-gray-400">{match.away_team_name}</span>
        </div>

        <div className="text-center">
          <Label className="text-xs text-gray-500">Sets (optional)</Label>
          <div className="flex items-center gap-1 justify-center mt-1">
            <Input
              type="number"
              min="0"
              value={form.home_sets}
              onChange={(e) => setForm({ ...form, home_sets: parseInt(e.target.value) || 0 })}
              className="w-16 h-9 bg-[#111111] border-[#2a2a2a] text-white text-center text-sm"
            />
            <span className="text-gray-600 text-xs">:</span>
            <Input
              type="number"
              min="0"
              value={form.away_sets}
              onChange={(e) => setForm({ ...form, away_sets: parseInt(e.target.value) || 0 })}
              className="w-16 h-9 bg-[#111111] border-[#2a2a2a] text-white text-center text-sm"
            />
          </div>
        </div>
      </div>

      {/* Photo upload */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-400">Foto-Beweis *</Label>
        {photoUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-[#2a2a2a]">
            <img src={photoUrl} alt="Result proof" className="w-full h-32 object-cover" />
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white border-0"
              onClick={() => setPhotoUrl("")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#2a2a2a] rounded-lg cursor-pointer hover:border-red-600/30 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            {uploading ? (
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500">Foto hochladen</span>
              </>
            )}
          </label>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !photoUrl}
        className="w-full bg-red-600 hover:bg-red-500 text-white border-0 h-10"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sende...</>
        ) : (
          <><Save className="w-4 h-4 mr-2" /> Ergebnis einreichen</>
        )}
      </Button>
      <p className="text-xs text-gray-500 text-center">
        Das Ergebnis muss vom Gegner bestätigt werden.
      </p>
    </Card>
  );
}