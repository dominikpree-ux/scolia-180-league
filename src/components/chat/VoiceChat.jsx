import React, { useState, useEffect } from "react";
import { Users, Phone, PhoneOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceChat({ selectedLeague, user }) {
  const [isJoined, setIsJoined] = useState(false);
  
  const roomName = `scolia-180-liga-${selectedLeague.toLowerCase()}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden" style={{ minHeight: "600px" }}>
      <div className="bg-amber-900/30 border-b border-amber-700/50 p-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-200">
          <strong>Demo-Version:</strong> Diese Voice-Chat-Einbettung ist nur für Demo-Zwecke vorgesehen und dient zu Testzwecken.
        </p>
      </div>
      {user ? (
        !isJoined ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ minHeight: "600px" }}>
            <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
              <Phone className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Voice-Chat</h2>
            <p className="text-gray-500 text-sm mb-6">Liga {selectedLeague} - Alle Spieler</p>
            <p className="text-gray-400 text-sm mb-6">
              Tritt dem Voice-Chat bei und sprich mit Spielern deiner Liga
            </p>
            <Button
              onClick={() => setIsJoined(true)}
              className="bg-red-600 hover:bg-red-500 text-white border-0 gap-2"
            >
              <Phone className="w-4 h-4" />
              Chat beitreten
            </Button>
          </div>
        ) : (
          <div style={{ minHeight: "600px" }}>
            <div className="p-4 border-b border-[#1a1a1a] flex justify-between items-center bg-[#0a0a0a]">
              <h2 className="text-white font-semibold">Voice-Chat - Liga {selectedLeague}</h2>
              <Button
                onClick={() => setIsJoined(false)}
                variant="outline"
                size="sm"
                className="border-red-600 text-red-600 hover:bg-red-600/10 gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                Beenden
              </Button>
            </div>
            <iframe
              src={jitsiUrl}
              style={{ 
                width: "100%", 
                height: "calc(100% - 60px)",
                minHeight: "540px",
                border: "none"
              }}
              allow="camera; microphone; display-capture"
            ></iframe>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center" style={{ minHeight: "600px" }}>
          <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
            <Phone className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Voice-Chat</h2>
          <p className="text-gray-500 text-sm mb-6">
            Du musst angemeldet sein, um Voice-Chat zu nutzen
          </p>
          <Button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 hover:bg-red-500 text-white border-0"
          >
            Anmelden
          </Button>
        </div>
      )}
    </div>
  );
}