import React from "react";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceChat({ selectedLeague, user }) {
  const roomName = `scolia-180-liga-${selectedLeague.toLowerCase()}`;
  const jitsiUrl = `https://your-jitsi-server.com/${roomName}`;

  if (!user) {
    return (
      <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden p-6" style={{ minHeight: "600px" }}>
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Voice-Chat</h2>
          <p className="text-gray-500 text-sm mb-6">Du musst angemeldet sein, um Voice-Chat zu nutzen</p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 hover:bg-red-500 text-white border-0"
          >
            Anmelden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden p-6" style={{ minHeight: "600px" }}>
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
          <Phone className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Voice-Chat</h2>
        <p className="text-gray-500 text-sm mb-6">Liga {selectedLeague} - Alle Spieler</p>
        <p className="text-gray-400 text-sm mb-6">
          Tritt dem Voice-Chat bei und sprich mit Spielern deiner Liga
        </p>
        <a href={jitsiUrl} target="_blank" rel="noopener noreferrer">
          <Button className="bg-red-600 hover:bg-red-500 text-white border-0 gap-2">
            <Phone className="w-4 h-4" />
            Chat öffnen
          </Button>
        </a>
      </div>
    </div>
  );
}