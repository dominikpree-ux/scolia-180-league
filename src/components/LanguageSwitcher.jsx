import React, { useState } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher({ onLanguageChange }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'de');

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    if (onLanguageChange) onLanguageChange(lang);
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-white/5 gap-1.5"
        >
          <Globe className="w-4 h-4" />
          {language.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#111111] border-[#1a1a1a]">
        <DropdownMenuItem
          onClick={() => changeLanguage('de')}
          className="text-gray-300 cursor-pointer hover:bg-[#1a1a1a]"
        >
          <span className="flex items-center gap-2">
            Deutsch
            {language === 'de' && <Check className="w-4 h-4 text-red-500" />}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => changeLanguage('en')}
          className="text-gray-300 cursor-pointer hover:bg-[#1a1a1a]"
        >
          <span className="flex items-center gap-2">
            English
            {language === 'en' && <Check className="w-4 h-4 text-red-500" />}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}