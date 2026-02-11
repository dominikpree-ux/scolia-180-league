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
      
      {/* Facebook Group CTA */}
       <section className="py-12 px-4 sm:px-6 border-y border-[#1a1a1a]">
         <div className="max-w-4xl mx-auto text-center">
           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <div className="flex-1 text-left sm:text-center">
               <h3 className="text-lg font-semibold text-white mb-1">Bleib auf dem Laufenden</h3>
               <p className="text-sm text-gray-400">Tritt unserer Facebook-Gruppe bei für Updates, News und mehr</p>
             </div>
             <a 
               href="https://www.facebook.com/groups/1445467807088189/" 
               target="_blank" 
               rel="noopener noreferrer"
               className="shrink-0"
             >
               <Button className="bg-[#1877F2] hover:bg-[#1664D9] text-white rounded-xl px-6 h-11 text-sm font-semibold border-0 shadow-lg">
                 <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                 </svg>
                 Facebook-Gruppe beitreten
               </Button>
             </a>
           </div>
         </div>
       </section>

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