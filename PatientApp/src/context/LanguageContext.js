import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // We keep 'en' as the default and only language state
  const [language, setLanguage] = useState('en'); 

  // 1. Define Combined Translations here
  const translations = {
    en: {
      // --- General ---
     
      // --- Book Appointment Screen ---
    
      // --- Report Screen ---
     

      
      
    }
  };

  // Helper function (keeps compatibility but doesn't strictly switch modes anymore)
  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    // We always pass translations.en so both languages show at once
    <LanguageContext.Provider value={{ language, changeLanguage, texts: translations.en }}>
      {children}
    </LanguageContext.Provider>
  );
};