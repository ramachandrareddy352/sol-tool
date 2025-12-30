"use client";

import { useState } from "react";
import { useLanguage } from "@/app/Context/LanguageContext";
import { FaTelegramPlane } from "react-icons/fa";

const FeeModal = () => {
  const { language } = useLanguage();

  const texts = {
    en: {
      title: "Use Priority Fees",
      description:
        "Modify the fees you pay within SOL TOOL in order to avoid transaction errors due to Solana congestion.",
      priorityLevel: "Priority Level",
      fast: "Fast 1x",
      turbo: "Turbo 2x",
      ultra: "Ultra 3x",
      note: "Priority fees help transactions reach the network faster, but effectiveness depends on current network conditions.",
    },
    ko: {
      title: "우선 요금 사용",
      description:
        "Solana 네트워크 혼잡으로 인한 거래 오류를 방지하기 위해 SOL TOOL에서 지불하는 수수료를 조정할 수 있습니다.",
      priorityLevel: "우선 순위 수준",
      fast: "빠름 1x",
      turbo: "터보 2x",
      ultra: "초고속 3x",
      note: "우선 요금은 거래 처리를 빠르게 도와주지만, 실제 효과는 네트워크 상태에 따라 달라질 수 있습니다.",
    },
  };

  const t = texts[language];

  // priority state
  const [priority, setPriority] = useState("turbo"); // default selected

  const Option = ({ id, label }) => {
    const active = priority === id;

    return (
      <button
        type="button"
        onClick={() => setPriority(id)}
        className={`
          px-4 py-1.5 rounded-xl text-sm font-semibold transition
          ${
            active
              ? "bg-white border-grad2 text-black"
              : "text-gray-500 hover:text-black"
          }
        `}
      >
        {label}
      </button>
    );
  };

  return (
    <section className="flex flex-col gap-3 bg-[#fcfcfd] md:w-[400px] rounded border border-[#E6E8EC] p-4 absolute right-0 top-10 z-10">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <p className="text-sm text-gray-600">{t.description}</p>

      <div className="flex items-center gap-2">
        <h2 className="font-semibold">{t.priorityLevel}</h2>
        <FaTelegramPlane className="text-[#02CCE6]" />
      </div>

      {/* Priority Switch */}
      <div className="flex justify-between items-center py-2 px-3 border border-[#A3F7FE] bg-[#ECFFFF] rounded-xl">
        <Option id="fast" label={t.fast} />
        <Option id="turbo" label={t.turbo} />
        <Option id="ultra" label={t.ultra} />
      </div>

      <p className="text-sm text-gray-500">{t.note}</p>
    </section>
  );
};

export default FeeModal;
