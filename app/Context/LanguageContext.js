"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [priority, setPriority] = useState("turbo"); // default

  // Load from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    const savedPriority = localStorage.getItem("priority");

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedPriority) setPriority(savedPriority);
  }, []);

  const translations = {
    en: {
      creator: "Creator",
      mint: "Minting/Burn",
      freeze: "Freezing",
      meta: "Meta",
      owner: "Ownership",
      connectWallet: "Connect Wallet",
      development: "Development",
    },
    ko: {
      creator: "창작자",
      mint: "발행/소각",
      freeze: "동결",
      meta: "메타",
      owner: "소유권",
      connectWallet: "지갑 연결",
      development: "개발 모드",
    },
  };

  const changePriority = (newPriority) => {
    localStorage.setItem("priority", newPriority);
    setPriority(newPriority);
  };

  const changeLanguage = (lang) => {
    localStorage.setItem("language", lang);
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        translations,
        priority,
        changePriority,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
