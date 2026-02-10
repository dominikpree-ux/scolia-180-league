import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import StandingsTable from "../components/shared/StandingsTable";
import MatchCard from "../components/shared/MatchCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }, "-points", 10),
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ["matches-recent"],
    queryFn: () => base44.entities.Match.list("matchday"),
  });

  const openMatches = allMatches.filter(m => m.status !== "completed" && m.status !== "cancelled");

  return (
    <div>
      <HeroSection />
      <FeaturesSection />

      {/* Standings Preview */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-semibold text-red-500 uppercase tracking-widest">Tabelle</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">Aktuelle Standings</h2>
            </div>
            <Link to={createPageUrl("Standings")}>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                Alle sehen <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden">
            <StandingsTable teams={teams} compact />
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      {openMatches.length > 0 && (
        <section className="pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-semibold text-red-500 uppercase tracking-widest">Spielplan</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">Offene Spiele</h2>
              </div>
              <Link to={createPageUrl("Schedule")}>
                <Button variant="ghost" className="text-gray-400 hover:text-white">
                  Alle sehen <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {openMatches.slice(0, 6).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}