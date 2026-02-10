import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StandingsTable from "../components/shared/StandingsTable";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Standings() {
  const [selectedLeague, setSelectedLeague] = useState("all");

  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-points"),
  });

  const filteredTeams = selectedLeague === "all"
    ? teams
    : teams.filter(t => t.league_tier === selectedLeague);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Liga-Tabelle</h1>
            <p className="text-gray-500 text-sm mt-0.5">Aktuelle Saison 2026</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={selectedLeague === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLeague("all")}
            className={selectedLeague === "all" ? "bg-red-600 hover:bg-red-500 text-white" : "text-gray-400 hover:text-white border-[#2a2a2a]"}
          >
            Alle Ligen
          </Button>
          <Button
            variant={selectedLeague === "A" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLeague("A")}
            className={selectedLeague === "A" ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "text-gray-400 hover:text-white border-[#2a2a2a]"}
          >
            Liga A
          </Button>
          <Button
            variant={selectedLeague === "B" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLeague("B")}
            className={selectedLeague === "B" ? "bg-blue-600 hover:bg-blue-500 text-white" : "text-gray-400 hover:text-white border-[#2a2a2a]"}
          >
            Liga B
          </Button>
          <Button
            variant={selectedLeague === "C" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedLeague("C")}
            className={selectedLeague === "C" ? "bg-green-600 hover:bg-green-500 text-white" : "text-gray-400 hover:text-white border-[#2a2a2a]"}
          >
            Liga C
          </Button>
        </div>

        <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Lade Tabelle...</div>
          ) : (
            <StandingsTable teams={filteredTeams} />
          )}
        </div>
      </div>
    </div>
  );
}