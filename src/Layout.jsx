import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await base44.auth.isAuthenticated();
      setIsAuthenticated(authed);
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
      }
    };
    checkAuth();
  }, []);

  const navLinks = [
    { name: "Startseite", page: "Home" },
    { name: "Team-Tabelle", page: "Standings" },
    { name: "Spieler-Tabelle", page: "PlayerStandings" },
    { name: "Spielplan", page: "Schedule" },
    { name: "Teams", page: "Teams" },
    { name: "Chat", page: "Chat" },
    { name: "Regeln", page: "Rules" },
    { name: "Kontakt", page: "Contact" },
  ];

  const isActive = (page) => currentPageName === page;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        :root {
          --bg-primary: #0a0a0a;
          --bg-secondary: #111111;
          --bg-card: #1a1a1a;
          --bg-card-hover: #222222;
          --accent: #dc2626;
          --accent-hover: #ef4444;
          --text-primary: #ffffff;
          --text-secondary: #a0a0a0;
          --border: #2a2a2a;
        }
        body { background: #0a0a0a; }
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0a; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698ae2909b02ce9f29cfad93/8fbc0d794_180logowei.png" 
                alt="Scolia 180 League" 
                className="h-10 w-auto group-hover:opacity-80 transition-opacity"
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive(link.page)
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-2">
                  {user?.role === "admin" && (
                    <Link to={createPageUrl("Admin")}>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
                        <Shield className="w-4 h-4 mr-1.5" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link to={createPageUrl("Dashboard")}>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">
                      <LayoutDashboard className="w-4 h-4 mr-1.5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/5"
                    onClick={() => base44.auth.logout()}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white"
                    onClick={() => base44.auth.redirectToLogin()}
                  >
                    Login
                  </Button>
                  <Link to={createPageUrl("Register")}>
                    <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white border-0 rounded-lg">
                      Team registrieren
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.page}
                  to={createPageUrl(link.page)}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.page)
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="border-t border-[#1a1a1a] pt-3 mt-3 space-y-1">
                {isAuthenticated ? (
                  <>
                    {user?.role === "admin" && (
                      <Link to={createPageUrl("Admin")} onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5">
                        Admin Panel
                      </Link>
                    )}
                    <Link to={createPageUrl("Dashboard")} onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5">
                      Dashboard
                    </Link>
                    <button onClick={() => { base44.auth.logout(); setMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5">
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => { base44.auth.redirectToLogin(); setMenuOpen(false); }}
                      className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5">
                      Login
                    </button>
                    <Link to={createPageUrl("Register")} onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-red-600 text-white text-center">
                      Team registrieren
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="mb-4">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698ae2909b02ce9f29cfad93/8fbc0d794_180logowei.png" 
                  alt="Scolia 180 League" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Die Online-Dartsliga für ambitionierte Spieler. Precision. Competition. 180.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Navigation</h4>
              <div className="space-y-2">
                {navLinks.slice(0, 4).map((link) => (
                  <Link key={link.page} to={createPageUrl(link.page)}
                    className="block text-sm text-gray-500 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Liga</h4>
              <div className="space-y-2">
                <Link to={createPageUrl("Register")} className="block text-sm text-gray-500 hover:text-white transition-colors">Team registrieren</Link>
                <Link to={createPageUrl("Rules")} className="block text-sm text-gray-500 hover:text-white transition-colors">Regeln</Link>
                <Link to={createPageUrl("Contact")} className="block text-sm text-gray-500 hover:text-white transition-colors">Kontakt</Link>
                <Link to={createPageUrl("Impressum")} className="block text-sm text-gray-500 hover:text-white transition-colors">Impressum</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#1a1a1a] mt-8 pt-8 text-center">
            <p className="text-gray-600 text-xs">© 2026 Scolia 180 League. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}