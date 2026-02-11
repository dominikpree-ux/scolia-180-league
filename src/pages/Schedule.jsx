import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MatchCard from "../components/shared/MatchCard";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Schedule() {
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("matchday"),
  });

  const leagueFilteredMatches = selectedLeague === "all"
    ? matches
    : matches.filter(m => m.league_tier === selectedLeague);

  const matchdays = [...new Set(leagueFilteredMatches.map(m => m.matchday))].sort((a, b) => a - b);
  const [selectedDay, setSelectedDay] = useState(null);

  const filteredMatches = selectedDay
    ? leagueFilteredMatches.filter(m => m.matchday === selectedDay)
    : leagueFilteredMatches;

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const seasonStart = new Date("2026-02-27T00:00:00");
      const now = new Date();
      const diff = seasonStart - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeRemaining({ days, hours, minutes, seconds });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, []);

  const showCountdown = timeRemaining.days > 0 || timeRemaining.hours > 0 || timeRemaining.minutes > 0 || timeRemaining.seconds > 0;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Spielplan</h1>
            <p className="text-gray-500 text-sm mt-0.5">Alle Spieltage und Begegnungen</p>
          </div>
        </div>

        {/* Countdown */}
        {showCountdown && (
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-white">Saisonstart in:</h2>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {timeRemaining.days}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Tage</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {timeRemaining.hours}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Stunden</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {timeRemaining.minutes}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Minuten</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {timeRemaining.seconds}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide">Sekunden</div>
              </div>
            </div>
            <div className="text-center mt-4 text-sm text-gray-400">
              Start: 27. Februar 2026
            </div>
          </div>
        )}

        {/* League filter */}
        <div className="flex gap-2 mb-4 flex-wrap">
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

        {/* Matchday filter */}
        {matchdays.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={selectedDay === null ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedDay(null)}
              className={selectedDay === null
                ? "bg-red-600 hover:bg-red-500 text-white border-0"
                : "text-gray-400 hover:text-white hover:bg-white/5 border-0"
              }
            >
              Alle
            </Button>
            {matchdays.map((day) => (
              <Button
                key={day}
                variant={selectedDay === day ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedDay(day)}
                className={selectedDay === day
                  ? "bg-red-600 hover:bg-red-500 text-white border-0"
                  : "text-gray-400 hover:text-white hover:bg-white/5 border-0"
                }
              >
                Spieltag {day}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="py-20 text-center text-gray-500 text-sm">Lade Spielplan...</div>
        ) : filteredMatches.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-sm">
            Noch keine Spiele geplant.
          </div>
        ) : (
          <div>
            {selectedDay ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            ) : (
              matchdays.map((day) => (
                <div key={day} className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-red-600" />
                    Spieltag {day}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {leagueFilteredMatches.filter(m => m.matchday === day).map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}