import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UserPlus, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "../utils";
import { Link } from "react-router-dom";

export default function PlayerRegister() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    bio: "",
    looking_for_team: true,
    available_as_substitute: false,
    preferred_league: [],
  });

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        
        // Check if player already exists
        const existingPlayer = await base44.entities.Player.filter({ email: me.email });
        if (existingPlayer.length > 0) {
          setSubmitted(true);
        }
      }
    };
    checkAuth();
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      if (!user?.email) throw new Error("Not authenticated");
      
      // Check if already registered
      const existing = await base44.entities.Player.filter({ email: user.email });
      if (existing.length > 0) {
        throw new Error("Already registered");
      }

      return await base44.entities.Player.create({
        ...data,
        email: user.email,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Erfolgreich registriert!");
    },
    onError: (error) => {
      toast.error(error.message === "Already registered" 
        ? "Du bist bereits registriert" 
        : "Registrierung fehlgeschlagen");
    },
  });

  const toggleLeague = (league) => {
    const current = formData.preferred_league || [];
    const newLeagues = current.includes(league)
      ? current.filter((l) => l !== league)
      : [...current, league];
    setFormData({ ...formData, preferred_league: newLeagues });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Bitte Namen eingeben");
      return;
    }
    registerMutation.mutate(formData);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#111111] border-[#1a1a1a]">
          <CardHeader>
            <CardTitle className="text-white text-center">Login erforderlich</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-400 mb-4">
              Du musst angemeldet sein, um dich als Spieler zu registrieren.
            </p>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="bg-red-600 hover:bg-red-500 w-full"
            >
              Jetzt anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-[#111111] border-[#1a1a1a]">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <CardTitle className="text-white text-center">Erfolgreich registriert!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-400">
              Du bist jetzt auf der Spielersuche-Seite sichtbar und kannst von Teams kontaktiert werden.
            </p>
            <div className="space-y-2">
              <Link to={createPageUrl("FreeAgents")}>
                <Button className="w-full bg-red-600 hover:bg-red-500">
                  <Search className="w-4 h-4 mr-2" />
                  Zur Spielersuche
                </Button>
              </Link>
              <Link to={createPageUrl("Home")}>
                <Button variant="outline" className="w-full border-gray-700 text-gray-400 hover:text-white">
                  Zur Startseite
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Spieler-Registrierung</h1>
              <p className="text-gray-400 text-sm">Trage dich in die Spielersuche ein</p>
            </div>
          </div>
        </div>

        <Card className="bg-[#111111] border-[#1a1a1a]">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-400">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Dein vollständiger Name"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Nickname</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="Dein Spitzname (optional)"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Bio</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Erzähl etwas über dich, deine Erfahrung, Spielstil..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white min-h-[100px]"
                />
              </div>

              <div className="space-y-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="looking" className="text-gray-300 font-medium">
                      Suche Team
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Ich suche ein festes Team
                    </p>
                  </div>
                  <Switch
                    id="looking"
                    checked={formData.looking_for_team}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, looking_for_team: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="substitute" className="text-gray-300 font-medium">
                      Vertretung
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Ich bin als Ersatzspieler verfügbar
                    </p>
                  </div>
                  <Switch
                    id="substitute"
                    checked={formData.available_as_substitute}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, available_as_substitute: checked })
                    }
                  />
                </div>
              </div>

              {(formData.looking_for_team || formData.available_as_substitute) && (
                <div className="space-y-2">
                  <Label className="text-gray-400">Bevorzugte Ligen</Label>
                  <div className="flex gap-2">
                    {["A", "B", "C"].map((league) => (
                      <Button
                        key={league}
                        type="button"
                        size="lg"
                        variant={formData.preferred_league?.includes(league) ? "default" : "outline"}
                        onClick={() => toggleLeague(league)}
                        className={
                          formData.preferred_league?.includes(league)
                            ? "bg-red-600 hover:bg-red-500 flex-1"
                            : "border-[#2a2a2a] text-gray-400 hover:text-white flex-1"
                        }
                      >
                        Liga {league}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Wähle die Ligen, in denen du spielen möchtest
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-500 h-12 text-base"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Wird registriert..." : "Jetzt registrieren"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Bereits ein Team?{" "}
            <Link to={createPageUrl("Register")} className="text-red-400 hover:text-red-300">
              Team-Registrierung
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}