import React from 'react';

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
    home: {
      stayUpdated: "Bleib auf dem Laufenden",
      joinGroup: "Tritt unserer Facebook-Gruppe bei für Updates, News und mehr",
      facebookBtn: "Facebook-Gruppe beitreten",
      standings: "Aktuelle Standings",
      tableLabel: "Tabelle",
      viewAll: "Alle sehen",
      matches: "Offene Spiele",
      scheduleLabel: "Spielplan"
    },
    rules: {
      title: "Regeln",
      subtitle: "Scolia 180 League Regelwerk"
    },
    dashboard: {
      loading: "Lade Dashboard...",
      playerTitle: "Spieler Dashboard",
      teamTitle: "Team Dashboard",
      notFound: "Kein Team gefunden",
      noTeam: "Du bist noch nicht als Kapitän eines Teams registriert.",
      points: "Punkte",
      wins: "Siege",
      matches: "Spiele",
      teamData: "Team-Daten",
      edit: "Bearbeiten",
      save: "Speichern",
      teamName: "Teamname",
      scoliaLocation: "Scolia Standort",
      teamLogo: "Team-Logo",
      upload: "Hochladen",
      change: "Ändern",
      uploading: "Lädt...",
      captain: "Kapitän",
      players: "Spieler",
      addPlayer: "Spieler hinzufügen",
      yourMatches: "Deine Spiele",
      lineupSet: "Aufstellung festgelegt",
      completed: "Abgeschlossen",
      waitingConfirm: "Wartet auf Bestätigung",
      selectLineup: "Aufstellung wählen",
      changeLineup: "Aufstellung ändern",
      submitResult: "Ergebnis eintragen",
      confirmResult: "Ergebnis bestätigen",
      updated: "Team aktualisiert!",
      logoUpdated: "Logo aktualisiert!",
      logoFailed: "Logo-Upload fehlgeschlagen",
      playerAdded: "Spieler hinzugefügt!",
      playerRemoved: "Spieler entfernt.",
      resultConfirmed: "Ergebnis bestätigt und Tabelle aktualisiert!",
      approved: "Freigegeben",
      pending: "Ausstehend",
      rejected: "Abgelehnt",
      viewPhoto: "📸 Foto ansehen"
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
    home: {
      stayUpdated: "Stay Updated",
      joinGroup: "Join our Facebook group for updates, news and more",
      facebookBtn: "Join Facebook Group",
      standings: "Current Standings",
      tableLabel: "Table",
      viewAll: "View All",
      matches: "Open Matches",
      scheduleLabel: "Schedule"
    },
    rules: {
      title: "Rules",
      subtitle: "Scolia 180 League Rulebook"
    },
    dashboard: {
      loading: "Loading Dashboard...",
      playerTitle: "Player Dashboard",
      teamTitle: "Team Dashboard",
      notFound: "No Team Found",
      noTeam: "You are not yet registered as a team captain.",
      points: "Points",
      wins: "Wins",
      matches: "Matches",
      teamData: "Team Data",
      edit: "Edit",
      save: "Save",
      teamName: "Team Name",
      scoliaLocation: "Scolia Location",
      teamLogo: "Team Logo",
      upload: "Upload",
      change: "Change",
      uploading: "Uploading...",
      captain: "Captain",
      players: "Players",
      addPlayer: "Add Player",
      yourMatches: "Your Matches",
      lineupSet: "Lineup Set",
      completed: "Completed",
      waitingConfirm: "Waiting for Confirmation",
      selectLineup: "Select Lineup",
      changeLineup: "Change Lineup",
      submitResult: "Submit Result",
      confirmResult: "Confirm Result",
      updated: "Team updated!",
      logoUpdated: "Logo updated!",
      logoFailed: "Logo upload failed",
      playerAdded: "Player added!",
      playerRemoved: "Player removed.",
      resultConfirmed: "Result confirmed and standings updated!",
      approved: "Approved",
      pending: "Pending",
      rejected: "Rejected",
      viewPhoto: "📸 View Photo"
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