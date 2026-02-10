import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Trophy, Users } from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export default function HeroSection() {
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.filter({ status: "approved" }),
  });

  const { data: allMatches = [] } = useQuery({
    queryKey: ["matches-recent"],
    queryFn: () => base44.entities.Match.list(),
  });

  const openMatches = allMatches.filter(m => m.status !== "completed" && m.status !== "cancelled");
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#0a0a0a] to-[#0a0a0a]" />
        {/* Dartboard rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.03]">
          <div className="absolute inset-0 rounded-full border-2 border-red-500" />
          <div className="absolute inset-[15%] rounded-full border border-white/50" />
          <div className="absolute inset-[30%] rounded-full border border-red-500/50" />
          <div className="absolute inset-[45%] rounded-full border border-white/30" />
          <div className="absolute inset-[48%] rounded-full bg-red-600/20" />
        </div>
        {/* Red glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[120px]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698ae2909b02ce9f29cfad93/8fbc0d794_180logowei.png" 
            alt="Scolia 180 League" 
            className="h-40 w-auto mx-auto mb-8"
          />

          <p className="text-lg sm:text-xl text-gray-400 font-light tracking-wide max-w-xl mx-auto mb-10">
            Precision. Competition. <span className="text-red-500 font-medium">180.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to={createPageUrl("Register")}>
              <Button size="lg" className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-8 h-12 text-sm font-semibold border-0 shadow-lg shadow-red-600/20 transition-all hover:shadow-red-500/30">
                Team registrieren
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to={createPageUrl("Standings")}>
              <Button variant="outline" size="lg" className="bg-transparent border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-white/5 rounded-xl px-8 h-12 text-sm font-medium">
                Tabelle ansehen
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { icon: Users, label: "Teams", value: teams.length || "—" },
            { icon: Target, label: "Matches", value: openMatches.length || "—" },
            { icon: Trophy, label: "Saisons", value: "1" },
          ].map((stat, i) => (
            <div key={i} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <stat.icon className="w-4 h-4 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
    </section>
  );
}