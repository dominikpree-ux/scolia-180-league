import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import VoiceChat from "@/components/chat/VoiceChat";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState("A");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const teams = await base44.entities.Team.filter({ captain_email: me.email });
        if (teams.length > 0) {
          setMyTeam(teams[0]);
          setSelectedLeague(teams[0].league_tier);
        }
      } catch (error) {
        // User not logged in
      }
    };
    loadUser();
  }, []);

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedLeague],
    queryFn: () => base44.entities.Message.filter({ league_tier: selectedLeague }, "-created_date", 100),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const sendMessage = useMutation({
    mutationFn: async (messageText) => {
      const message = await base44.entities.Message.create({
        league_tier: selectedLeague,
        sender_name: user?.full_name || "Unbekannt",
        sender_email: user?.email,
        team_name: myTeam?.name || "",
        message: messageText,
      });

      // Sende Email an alle Spieler wenn Admin schreibt
      if (user?.role === "admin") {
        const teams = await base44.entities.Team.filter({ league_tier: selectedLeague, status: "approved" });
        const playerEmails = new Set();

        for (const team of teams) {
          const players = await base44.entities.Player.filter({ team_id: team.id });
          players.forEach(p => {
            if (p.email) playerEmails.add(p.email);
          });
        }

        // Sende Email an jeden Spieler
        for (const email of playerEmails) {
          await base44.integrations.Core.SendEmail({
            to: email,
            subject: `Neue Ankündigung in Liga ${selectedLeague}`,
            body: `Hallo,\n\nEs gibt eine neue Nachricht im Liga-Chat von ${user.full_name}:\n\n"${messageText}"\n\nBitte prüfe den Chat für mehr Informationen.\n\nScolia 180 League`,
            from_name: "Scolia 180 League",
          });
        }
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setNewMessage("");
      if (user?.role === "admin") {
        toast.success("Nachricht gesendet und Emails versendet");
      }
    },
    onError: () => {
      toast.error("Nachricht konnte nicht gesendet werden");
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!user) {
      toast.error("Du musst angemeldet sein, um Nachrichten zu senden!");
      return;
    }
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const leagueBadges = {
    A: { color: "bg-red-600", label: "Liga A" },
    B: { color: "bg-orange-600", label: "Liga B" },
    C: { color: "bg-yellow-600", label: "Liga C" },
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Liga-Chat</h1>
            <p className="text-gray-500 text-sm mt-0.5">Austausch mit Spielern deiner Liga</p>
          </div>
        </div>

        {/* League selector */}
        <div className="flex gap-2 mb-6">
          {["A", "B", "C"].map((league) => (
            <Button
              key={league}
              onClick={() => setSelectedLeague(league)}
              variant={selectedLeague === league ? "default" : "outline"}
              className={
                selectedLeague === league
                  ? `${leagueBadges[league].color} hover:opacity-90 text-white border-0`
                  : "border-[#2a2a2a] text-gray-400 hover:text-white hover:bg-white/5"
              }
            >
              {leagueBadges[league].label}
            </Button>
          ))}
        </div>

        {/* Voice Chat Section */}
        <div className="mb-8">
          <VoiceChat selectedLeague={selectedLeague} user={user} />
        </div>

        {/* Chat container */}
        <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Users className="w-12 h-12 text-gray-600 mb-3" />
                <p className="text-gray-500 text-sm">Noch keine Nachrichten in {leagueBadges[selectedLeague].label}</p>
                <p className="text-gray-600 text-xs mt-1">Sei der Erste, der eine Nachricht schreibt!</p>
              </div>
            ) : (
              <>
                {messages.slice().reverse().map((msg) => {
                  const isMyMessage = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${isMyMessage ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-xs font-medium text-gray-400">
                            {msg.sender_name}
                          </span>
                          {msg.team_name && (
                            <span className="text-[10px] text-gray-600">• {msg.team_name}</span>
                          )}
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isMyMessage
                              ? "bg-red-600 text-white"
                              : "bg-[#1a1a1a] text-gray-200"
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-gray-600 px-1">
                          {format(new Date(msg.created_date), "dd.MM.yyyy • HH:mm", { locale: de })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-[#1a1a1a] p-4">
            {user ? (
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Nachricht schreiben..."
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-gray-600"
                  disabled={sendMessage.isPending}
                />
                <Button
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  className="bg-red-600 hover:bg-red-500 text-white border-0 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-3">
                <p className="text-gray-500 text-sm">
                  Du musst angemeldet sein, um Nachrichten zu senden.
                </p>
                <Button
                  onClick={() => base44.auth.redirectToLogin()}
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 text-white border-0 mt-2"
                >
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}