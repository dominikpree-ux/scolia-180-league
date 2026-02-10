import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { BookOpen } from "lucide-react";

const defaultRules = `
## Allgemeine Regeln

### 1. Teilnahme & Ligen
- Jedes Team besteht aus mindestens 4 und maximal 6 Spielern.
- Ein Spieler darf nur für ein Team registriert sein.
- Bei der Registrierung muss die Scolia ID (zu finden in den Profil-Einstellungen) angegeben werden.
- Der Teamkapitän ist verantwortlich für die Koordination.
- **Wichtig**: Der Teamkapitän muss sich mit der gleichen E-Mail-Adresse anmelden, die bei der Teamregistrierung angegeben wurde, um Zugriff auf das Team-Dashboard zu erhalten.

**Liga-Einteilung:**
- Teams werden basierend auf ihrer Average-Gruppe aus Scolia automatisch in Ligen eingeteilt
- **Liga A** (Average-Gruppe A): Double Out
- **Liga B** (Average-Gruppe B): Master Out  
- **Liga C** (Average-Gruppe C): Open Out
- Teams spielen nur gegen andere Teams ihrer eigenen Liga

### 2. Spielformat
- Gespielt wird **First to 3, Double Out**.
- Das erste Team, das 3 Legs gewinnt, gewinnt das Match.
- Alle Spiele werden über Scolia Boards ausgetragen.

### 3. Spielplan
- Der Spielplan wird automatisch erstellt.
- Jedes Team spielt gegen jedes andere Team.
- Die Spieltage werden im Voraus festgelegt.

### 4. Ergebnisse & Foto-Beweis
- **Jedes Spiel benötigt einen Foto-Beweis**: Nach dem Match muss ein Team das Ergebnis mit einem Foto (z.B. vom Scolia Board Display) einreichen.
- Das Ergebnis wird über das Team-Dashboard eingetragen.
- Der Gegner muss das eingereichte Ergebnis bestätigen, bevor es offiziell wird.
- Ergebnisse müssen innerhalb von 24 Stunden nach dem Spiel eingetragen werden.
- Beide Teams sind dafür verantwortlich, das Ergebnis zeitnah zu bestätigen.
- Bei Unstimmigkeiten oder fehlender Bestätigung entscheidet die Ligaleitung.
- **Wichtig zur Ergebniseintragung**: Alle gewonnenen und verlorenen Legs werden zusammengezählt und als Gesamtsumme eingetragen. Beispiel: Bei 4x2 Legs (= 8 Legs insgesamt) und ein Team gewinnt alle Legs, muss das Ergebnis als 8:0 eingetragen werden.

### 5. Punktevergabe
- Sieg: 3 Punkte
- Unentschieden: 1 Punkt
- Niederlage: 0 Punkte

### 6. Fair Play
- Respektvoller Umgang miteinander ist Pflicht.
- Manipulation oder Betrug führt zum sofortigen Ausschluss.
- Die Ligaleitung behält sich das Recht vor, Entscheidungen zu treffen.

### 7. Kontakt
Bei Fragen oder Problemen kontaktiere uns über die Kontaktseite.
`;

export default function Rules() {
  const { data: seasons = [] } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => base44.entities.Season.filter({ status: "active" }),
  });

  const activeSeason = seasons[0];
  const rulesContent = activeSeason?.rules || defaultRules;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Regeln</h1>
            <p className="text-gray-500 text-sm mt-0.5">Scolia 180 League Regelwerk</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111111] border border-[#1a1a1a] p-6 sm:p-8">
          <ReactMarkdown
            className="prose prose-invert prose-sm max-w-none
              prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-[#1a1a1a] prose-h2:pb-3
              prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-gray-400 prose-p:leading-relaxed
              prose-li:text-gray-400
              prose-strong:text-white
              prose-ul:my-2
            "
          >
            {rulesContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}