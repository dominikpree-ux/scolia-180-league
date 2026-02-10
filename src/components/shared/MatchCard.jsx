import React from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";

export default function MatchCard({ match }) {
  const isCompleted = match.status === "completed";

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isCompleted ? "bg-[#111111] border-[#1a1a1a]" : "bg-[#111111] border-[#1a1a1a] hover:border-red-600/20"
    }`}>
      <div className="p-4">
        {/* Date header */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          {match.date ? format(new Date(match.date), "dd. MMM yyyy", { locale: de }) : "TBD"}
          {match.time && (
            <>
              <span className="text-gray-700">·</span>
              <Clock className="w-3 h-3" />
              {match.time}
            </>
          )}
          {isCompleted && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-medium uppercase tracking-wider">
              Beendet
            </span>
          )}
          {match.status === "scheduled" && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-medium uppercase tracking-wider">
              Geplant
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-right">
            <span className={`text-sm font-semibold ${isCompleted && match.home_legs > match.away_legs ? "text-white" : "text-gray-400"}`}>
              {match.home_team_name || "Team A"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] min-w-[80px] justify-center">
            {isCompleted ? (
              <>
                <span className={`text-lg font-black ${match.home_legs > match.away_legs ? "text-white" : "text-gray-500"}`}>
                  {match.home_legs}
                </span>
                <span className="text-gray-600 text-xs">:</span>
                <span className={`text-lg font-black ${match.away_legs > match.home_legs ? "text-white" : "text-gray-500"}`}>
                  {match.away_legs}
                </span>
              </>
            ) : (
              <span className="text-gray-600 text-sm font-medium">vs</span>
            )}
          </div>

          <div className="flex-1 text-left">
            <span className={`text-sm font-semibold ${isCompleted && match.away_legs > match.home_legs ? "text-white" : "text-gray-400"}`}>
              {match.away_team_name || "Team B"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}