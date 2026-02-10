import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StandingsTable from "../components/shared/StandingsTable";
import { Trophy } from "lucide-react";

export default function Standings() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list("-points"),
  });

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

        <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-gray-500 text-sm">Lade Tabelle...</div>
          ) : (
            <StandingsTable teams={teams} />
          )}
        </div>
      </div>
    </div>
  );
}