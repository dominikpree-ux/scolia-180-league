import React, { useState, useEffect } from "react";
import { Users, Phone, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceChat({ selectedLeague, user }) {
  const [isJoined, setIsJoined] = useState(false);
  
  const roomName = `scolia-180-liga-${selectedLeague.toLowerCase()}`;
  const jitsiUrl = `https://meet.jit.si/${roomName}`;

  const handleJoinCall = () => {
    setIsJoined(true);
    window.open(jitsiUrl, "jitsi_window", "width=800,height=600");
  };

  const handleLeaveCall = () => {
    setIsJoined(false);
  };

  return (
    <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6 text-center" style={{ minHeight: "500px" }}>
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center mb-4">
          <Phone className="w-8 h-8 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Voice-Chat</h2>
        <p className="text-gray-500 text-sm mb-6">Liga {selectedLeague} - Alle Spieler</p>

        {user ? (
          <div className="space-y-4">
            {!isJoined ? (
              <>
                <p className="text-gray-400 text-sm mb-4">
                  Tritt dem Voice-Chat bei und sprich mit Spielern deiner Liga
                </p>
                <Button
                  onClick={handleJoinCall}
                  className="bg-red-600 hover:bg-red-500 text-white border-0 gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Chat beitreten
                </Button>
              </>
            ) : (
              <>
                <p className="text-green-400 text-sm mb-4">
                  Du bist im Voice-Chat
                </p>
                <Button
                  onClick={handleLeaveCall}
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-600/10 gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  Chat beenden
                </Button>
              </>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-sm mb-4">
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
    </div>
  );
}