"use client";
import { useLanguage } from "@/app/Context/LanguageContext";

const DevHeadline = ({ translations }) => {
  const { language } = useLanguage();

  return (
    <section className="font-[Poppins] max-w-6xl py-10 px-2 mx-auto">
      <div className="text-center">
        <h1 className="gradient-text mt-3 mb-8 md:mt-0 text-3xl md:text-6xl font-bold font-[DM_Sans]">
          {translations[language].heading}
        </h1>
        <h5 className="text-2xl font-medium">
          {translations[language].subhead}
        </h5>
        <p className="px-6 md:w-200 mx-auto mt-2 md:px-0">
          {translations[language].description}
        </p>
      </div>
    </section>
  );
};

export default DevHeadline;
