const translations = {
  de: {
    nav: {
      home: "Startseite",
      standings: "Team-Tabelle",
      playerStandings: "Spieler-Tabelle",
      h2h: "H2H Vergleich",
      schedule: "Spielplan",
      teams: "Teams",
      players: "Spielersuche",
      chat: "Chat",
      rules: "Regeln",
      contact: "Kontakt",
      admin: "Admin",
      dashboard: "Dashboard",
      login: "Login",
      logout: "Logout",
      becomeplayer: "Spieler werden",
      registerteam: "Team registrieren"
    },
    footer: {
      description: "Die Online-Dartsliga für ambitionierte Spieler. Precision. Competition. 180.",
      navigation: "Navigation",
      league: "Liga",
      impressum: "Impressum",
      copyright: "© 2026 Scolia 180 League. Alle Rechte vorbehalten."
    },
    chat: {
      title: "Voice-Chat",
      subtitle: "Alle Spieler",
      description: "Tritt dem Voice-Chat bei und sprich mit Spielern deiner Liga",
      openBtn: "Chat öffnen",
      login: "Anmelden",
      league: "Liga"
    },
    common: {
      loading: "Lädt...",
      error: "Fehler",
      success: "Erfolgreich",
      save: "Speichern",
      cancel: "Abbrechen",
      delete: "Löschen",
      edit: "Bearbeiten",
      back: "Zurück",
      next: "Weiter",
      send: "Senden",
      submit: "Absenden"
    },
    language: "Sprache"
  },
  en: {
    nav: {
      home: "Home",
      standings: "Team Standings",
      playerStandings: "Player Standings",
      h2h: "H2H Comparison",
      schedule: "Schedule",
      teams: "Teams",
      players: "Find Players",
      chat: "Chat",
      rules: "Rules",
      contact: "Contact",
      admin: "Admin",
      dashboard: "Dashboard",
      login: "Login",
      logout: "Logout",
      becomeplayer: "Become a Player",
      registerteam: "Register Team"
    },
    footer: {
      description: "The online darts league for ambitious players. Precision. Competition. 180.",
      navigation: "Navigation",
      league: "League",
      impressum: "Legal",
      copyright: "© 2026 Scolia 180 League. All rights reserved."
    },
    chat: {
      title: "Voice Chat",
      subtitle: "All Players",
      description: "Join the voice chat and talk with players in your league",
      openBtn: "Open Chat",
      login: "Sign In",
      league: "League"
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      send: "Send",
      submit: "Submit"
    },
    language: "Language"
  }
};

export const useLanguage = () => {
  const [lang, setLang] = React.useState(() => localStorage.getItem('language') || 'de');

  const switchLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  const t = (path) => {
    return path.split('.').reduce((obj, key) => obj?.[key], translations[lang]) || path;
  };

  return { lang, switchLanguage, t, translations: translations[lang] };
};