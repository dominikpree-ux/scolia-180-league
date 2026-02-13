import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Users, Calendar, Trophy, Clock, UserSearch, Upload } from "lucide-react";
import TeamManagement from "../components/admin/TeamManagement";
import ScheduleGenerator from "../components/admin/ScheduleGenerator";
import ResultsManager from "../components/admin/ResultsManager";
import SeasonManager from "../components/admin/SeasonManager";
import PlayerRequestManager from "../components/admin/PlayerRequestManager";
import { TeamImporter } from "../components/admin/TeamImporter";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin();
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    };
    check();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">Lade...</div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Zugriff verweigert</h2>
          <p className="text-gray-500 text-sm">Du benötigst Admin-Rechte für diesen Bereich.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">Liga-Verwaltung</p>
          </div>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="bg-[#111111] border border-[#1a1a1a] p-1 rounded-xl">
            <TabsTrigger value="teams" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Teams
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Spielplan
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <Trophy className="w-3.5 h-3.5 mr-1.5" /> Ergebnisse
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <UserSearch className="w-3.5 h-3.5 mr-1.5" /> Spielersuchen
            </TabsTrigger>
            <TabsTrigger value="seasons" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 mr-1.5" /> Saisons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teams">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Team-Verwaltung</h3>
              <TeamManagement />
            </div>
          </TabsContent>

          <TabsContent value="import">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Teams importieren</h3>
              <TeamImporter />
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Spielplan generieren</h3>
              <ScheduleGenerator />
            </div>
          </TabsContent>

          <TabsContent value="results">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Ergebnisse verwalten</h3>
              <ResultsManager />
            </div>
          </TabsContent>

          <TabsContent value="requests">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Spielersuchen verwalten</h3>
              <PlayerRequestManager />
            </div>
          </TabsContent>

          <TabsContent value="seasons">
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Saison-Verwaltung</h3>
              <SeasonManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}