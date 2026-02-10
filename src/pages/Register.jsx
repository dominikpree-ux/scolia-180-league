import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Plus, X, CheckCircle, Target } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    captain_name: "",
    captain_email: "",
    scolia_location: "",
  });
  const [playerNames, setPlayerNames] = useState(["", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const addPlayer = () => setPlayerNames([...playerNames, ""]);
  const removePlayer = (i) => {
    if (playerNames.length > 3) {
      setPlayerNames(playerNames.filter((_, idx) => idx !== i));
    }
  };
  const updatePlayer = (i, val) => {
    const updated = [...playerNames];
    updated[i] = val;
    setPlayerNames(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validPlayers = playerNames.filter(n => n.trim());
    if (validPlayers.length < 3) {
      toast.error("Mindestens 3 weitere Spieler erforderlich (4 gesamt inkl. Kapitän)!");
      return;
    }
    
    setSubmitting(true);

    const team = await base44.entities.Team.create({
      ...form,
      status: "pending",
      points: 0, wins: 0, draws: 0, losses: 0,
      legs_won: 0, legs_lost: 0, sets_won: 0, sets_lost: 0,
    });

    // Create captain as player
    await base44.entities.Player.create({
      name: form.captain_name,
      email: form.captain_email,
      team_id: team.id,
      is_captain: true,
    });

    // Create additional players
    await base44.entities.Player.bulkCreate(
      validPlayers.map(name => ({
        name,
        team_id: team.id,
        is_captain: false,
      }))
    );

    setSubmitting(false);
    setDone(true);
    toast.success("Team erfolgreich registriert!");
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Team registriert!</h2>
          <p className="text-gray-500 text-sm max-w-sm">
            Dein Team wurde zur Überprüfung eingereicht. Du wirst benachrichtigt, sobald es freigeschaltet wird.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Team registrieren</h1>
            <p className="text-gray-500 text-sm mt-0.5">Erstelle dein Team für die Scolia 180 League</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6 sm:p-8 space-y-6">
          {/* Team Info */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" />
              Team-Informationen
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Teamname *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600"
                  placeholder="z.B. Dart Destroyers"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Scolia Standort / Board</Label>
                <Input
                  value={form.scolia_location}
                  onChange={(e) => setForm({ ...form, scolia_location: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600"
                  placeholder="z.B. Berlin, Wohnzimmer"
                />
              </div>
            </div>
          </div>

          {/* Captain */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-red-500" />
              Kapitän
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Scolia ID *</Label>
                <Input
                  required
                  value={form.captain_name}
                  onChange={(e) => setForm({ ...form, captain_name: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600"
                  placeholder="Scolia ID aus Profil-Einstellungen"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">E-Mail *</Label>
                <Input
                  required
                  type="email"
                  value={form.captain_email}
                  onChange={(e) => setForm({ ...form, captain_email: e.target.value })}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600"
                  placeholder="email@beispiel.de"
                />
              </div>
            </div>
          </div>

          {/* Players */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-500" />
                Weitere Spieler (mind. 3 erforderlich)
              </h3>
              <Button type="button" variant="ghost" size="sm" onClick={addPlayer}
                className="text-red-400 hover:text-red-300 hover:bg-red-600/10 border-0">
                <Plus className="w-4 h-4 mr-1" /> Spieler hinzufügen
              </Button>
            </div>
            <div className="space-y-3">
              {playerNames.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    required
                    value={name}
                    onChange={(e) => updatePlayer(i, e.target.value)}
                    className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600 focus:border-red-600"
                    placeholder={`Spieler ${i + 1} (Scolia ID aus Profil-Einstellungen) *`}
                  />
                  {playerNames.length > 3 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePlayer(i)}
                      className="text-gray-500 hover:text-red-400 hover:bg-red-600/10 border-0 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-600 hover:bg-red-500 text-white border-0 h-12 rounded-xl font-semibold text-sm"
          >
            {submitting ? "Registriere Team..." : "Team registrieren"}
          </Button>
        </form>
      </div>
    </div>
  );
}