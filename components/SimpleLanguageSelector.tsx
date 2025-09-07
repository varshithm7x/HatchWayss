"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export default function SimpleLanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(languages[0]);

  const handleLanguageChange = (language: typeof languages[0]) => {
    setCurrentLanguage(language);
    setIsOpen(false);
    // For now, just store in localStorage - will implement full i18n later
    localStorage.setItem('preferred-language', language.code);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-gray-300 hover:text-white"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-dark-200 border border-gray-600 rounded-lg shadow-lg z-50">
            <div className="py-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language)}
                  className={`w-full px-4 py-2 text-left hover:bg-dark-100 transition-colors flex items-center gap-3 ${
                    currentLanguage.code === language.code 
                      ? 'bg-primary-600/20 text-primary-400' 
                      : 'text-gray-300'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLanguage.code === language.code && (
                    <span className="ml-auto text-primary-400">✓</span>
                  )}
                </button>
              ))}
            </div>
            
            <div className="border-t border-gray-600 px-4 py-2">
              <p className="text-xs text-gray-500">
                Full i18n support coming soon
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
