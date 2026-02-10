import React from "react";
import { FileText } from "lucide-react";

export default function Impressum() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8 text-red-500" />
          <h1 className="text-4xl font-black text-white">Impressum</h1>
        </div>

        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-8 space-y-6 text-gray-300">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">Angaben gemäß § 5 TMG</h2>
            <p className="text-gray-400">
              Dominik Pree<br />
              Hauptstraße 290<br />
              3871 Alt-Nagelberg
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Kontakt</h2>
            <p className="text-gray-400">
              E-Mail: dominikpree@gmail.com
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Verantwortlich für den Inhalt</h2>
            <p className="text-gray-400">
              Dominik Pree<br />
              Hauptstraße 290<br />
              3871 Alt-Nagelberg
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">Haftungsausschluss</h2>
            
            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Haftung für Inhalte</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Haftung für Links</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
              Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            </p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">Urheberrecht</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
              dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art 
              der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung 
              des jeweiligen Autors bzw. Erstellers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}