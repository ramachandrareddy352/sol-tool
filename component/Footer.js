"use client";

import { useLanguage } from "@/app/Context/LanguageContext";

const Footer = () => {
  const { language } = useLanguage();

  const translations = {
    en: {
      copyright: "© 2025 SOL Maker | ALL RIGHTS RESERVED",
      company: "Company: Chain Systems",
      address:
        "Address: 3F, 6-5 Jangteo 4-gil, Yangsan-si, Gyeongsangnam-do, South Korea",
    },
    ko: {
      copyright: "© 2025 SOL Maker | 모든 권리 보유",
      company: "상호 : 체인시스템즈",
      address: "주소 : 경남 양산시 장터 4길 6-5 3층",
    },
  };

  return (
    <footer className="text-sm text-center py-6 font-medium text-gray-600 border-t border-gray-200">
      <p>{translations[language].copyright}</p>
      <p className="mt-2">{translations[language].company}</p>
      <p className="mt-1">{translations[language].address}</p>
    </footer>
  );
};

export default Footer;
