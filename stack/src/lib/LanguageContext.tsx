import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import en from "./translations/en.json";
import es from "./translations/es.json";
import hi from "./translations/hi.json";
import pt from "./translations/pt.json";
import zh from "./translations/zh.json";
import fr from "./translations/fr.json";

const DICTIONARIES: Record<string, Record<string, string>> = { en, es, hi, pt, zh, fr };

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Español",
  hi: "हिन्दी",
  pt: "Português",
  zh: "中文",
  fr: "Français",
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState("en");

  // The ONLY source of truth for language is the logged-in user's saved
  // preference. No account = always English. This re-runs on every login/
  // logout/account-switch since it depends on `user`.
  useEffect(() => {
    setLanguageState(user?.language || "en");
  }, [user]);

  // Called only after a successful OTP-verified language switch on the backend.
  // Just reflects the already-confirmed change locally — no separate persistence
  // logic needed here since the account itself is the source of truth.
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return DICTIONARIES[language]?.[key] || DICTIONARIES.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);