import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Users, MapPin, Crown, Image } from "lucide-react";
import { motion } from "framer-motion";

export default function Teams() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => base44.entities.Player.list(),
  });

  const getTeamPlayers = (teamId) => players.filter(p => p.team_id === teamId);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Teams</h1>
            <p className="text-gray-500 text-sm mt-0.5">{teams.length} registrierte Teams</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-gray-500 text-sm">Lade Teams...</div>
        ) : teams.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-sm">
            Noch keine Teams registriert.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team, i) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="group rounded-2xl bg-[#111111] border border-[#1a1a1a] hover:border-red-600/20 p-6 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  {team.logo_url ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-[#2a2a2a]">
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-red-600/10 flex items-center justify-center text-red-500 font-black text-lg">
                      {team.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-gray-600 font-medium">
                    {(team.wins || 0) + (team.draws || 0) + (team.losses || 0)} Spiele
                  </span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{team.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  {team.captain_name}
                </div>
                {team.scolia_location && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {team.scolia_location}
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {getTeamPlayers(team.id).length} Spieler
                    </span>
                    <span className="text-sm font-bold text-white">{team.points || 0} Pkt</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}