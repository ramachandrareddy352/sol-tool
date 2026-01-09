"use client";

import { useState } from "react";
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import { useLanguage } from "@/app/Context/LanguageContext";

const Faq = () => {
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "How to use Solana Token Creator",
      faqTitle: "Frequently Asked Questions",
      steps: [
        "Connect your Solana wallet",
        "Write the name you want for your Token",
        "Indicate the symbol (max 8 characters)",
        "Select the decimals quantity (6 for utility token)",
        "Write the description you want for your SPL Token",
        "Upload the image for your token (PNG)",
        "Put the Supply of your Token",
        "Click on create, accept the transaction and wait until your token is ready",
      ],
      faqs: [
        {
          question: "What is an SPL token?",
          answer:
            "An SPL token is a token built on the Solana blockchain, similar to ERC-20 tokens on Ethereum.",
        },
        {
          question: "How do I connect my Solana wallet?",
          answer:
            "You can connect your wallet using a browser extension like Phantom or Solflare.",
        },
        {
          question: "What is the maximum symbol length for a token?",
          answer: "The token symbol can have a maximum of 8 characters.",
        },
      ],
    },
    ko: {
      title: "Solana 토큰 생성기 사용 방법",
      faqTitle: "자주 묻는 질문",
      steps: [
        "Solana 지갑을 연결하세요",
        "원하는 토큰 이름을 입력하세요",
        "토큰 심볼을 입력하세요 (최대 8자)",
        "소수점 자릿수를 선택하세요 (유틸리티 토큰은 6)",
        "SPL 토큰에 대한 설명을 작성하세요",
        "토큰의 이미지를 업로드하세요 (PNG)",
        "토큰 공급량을 입력하세요",
        "생성 버튼을 클릭하고 트랜잭션을 승인한 후 토큰이 생성될 때까지 기다리세요",
      ],
      faqs: [
        {
          question: "SPL 토큰이란?",
          answer:
            "SPL 토큰은 Solana 블록체인에서 만들어진 토큰으로, Ethereum의 ERC-20 토큰과 유사합니다.",
        },
        {
          question: "Solana 지갑을 어떻게 연결하나요?",
          answer:
            "Phantom 또는 Solflare 같은 브라우저 확장 프로그램을 사용하여 지갑을 연결할 수 있습니다.",
        },
        {
          question: "토큰 심볼의 최대 길이는 얼마인가요?",
          answer: "토큰 심볼은 최대 8자까지 입력할 수 있습니다.",
        },
      ],
    },
  };

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-[Poppins]">
      <h2 className="text-2xl font-bold mb-4">
        {translations[language].title}
      </h2>
      <ol className="list-decimal ml-2 list-inside space-y-2">
        {translations[language].steps.map((step, index) => (
          <li key={index} className="text-gray-700">
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-10">
        <h1 className="gradient-text2 font-[DM_Sans] text-center my-5 text-4xl font-bold">
          {translations[language].faqTitle}
        </h1>

        {translations[language].faqs.map((faq, index) => (
          <div
            key={index}
            className="my-5 border-t p-2 md:p-4 border-[#E6E8EC] font-[Poppins] cursor-pointer"
            onClick={() => toggleFAQ(index)}
          >
            <div className="flex justify-between">
              <h3
                className={`md:text-xl ${
                  openIndex === index ? "text-[#02CCE6]" : ""
                }`}
              >
                {faq.question}
              </h3>
              <span
                className={`text-xl ${
                  openIndex === index ? "text-[#02CCE6]" : ""
                }`}
              >
                {openIndex === index ? <FaChevronUp /> : <FaChevronDown />}
              </span>
            </div>
            {openIndex === index && <p className="mt-2">{faq.answer}</p>}
          </div>
        ))}
      </div>
      <div>
        <div className="mt-6 rounded-2xl overflow-hidden border shadow-sm">
          <iframe
            className="w-full aspect-video"
            src="https://www.youtube-nocookie.com/embed/4hlYjUWQUo8?controls=1"
            title="YouTube video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            width={90}
          />
        </div>

        <div className="flex justify-end mt-3">
          <a
            href="https://www.youtube.com/watch?v=Ziz_Gn_8jZI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            Open on YouTube →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Faq;
