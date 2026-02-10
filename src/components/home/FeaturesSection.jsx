import React from "react";
import { Trophy, Calendar, Users, BarChart3, Target, Zap } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Users, title: "Team-Management", desc: "Erstelle und verwalte dein Team mit bis zu 6 Spielern." },
  { icon: Calendar, title: "Automatischer Spielplan", desc: "Der Spielplan wird automatisch generiert." },
  { icon: Trophy, title: "Live-Tabelle", desc: "Verfolge die aktuelle Tabelle in Echtzeit." },
  { icon: BarChart3, title: "Statistiken", desc: "Legs, Sets und Punkte auf einen Blick." },
  { icon: Target, title: "Scolia Integration", desc: "Spiele auf deinem Scolia Board von zuhause." },
  { icon: Zap, title: "Schnelle Ergebnisse", desc: "Ergebnisse eintragen und sofort sehen." },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-red-500 uppercase tracking-widest">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 tracking-tight">
            Alles für deine Liga
          </h2>
          <p className="text-gray-500 mt-3 max-w-md mx-auto text-sm">
            Professionelle Liga-Verwaltung für Online-Darts.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group p-6 rounded-2xl bg-[#111111] border border-[#1a1a1a] hover:border-red-600/20 transition-all duration-300 hover:bg-[#141414]"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
                <f.icon className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}