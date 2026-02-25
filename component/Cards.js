"use client";

import Image from "next/image";
import { useLanguage } from "@/app/Context/LanguageContext";

const Cards = () => {
  const services = [
    {
      title: "Solana ICO Website",
      description:
        "We provide an ICO platform that supports effective fund raising for Solana-based projects.",
      title_ko: "솔라나 ICO 웹사이트",
      description_ko:
        "우리는 Solana 기반 프로젝트를 위한 효과적인 자금 조달을 지원하는 ICO 플랫폼을 제공합니다.",
      image: "/1.ico.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Solana MLM Website",
      description:
        "We develop MLM websites with a stable and transparent structure on the Solana network.",
      title_ko: "솔라나 MLM 웹사이트",
      description_ko:
        "우리는 Solana 네트워크에서 안정적이고 투명한 구조를 가진 MLM 웹사이트를 개발합니다.",
      image: "/2.Solana MLM Website.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Solana Token Airdrop Website",
      description:
        "We offer a platform with a user-friendly interface for distributing Solana tokens.",
      title_ko: "솔라나 토큰 에어드랍 웹사이트",
      description_ko:
        "우리는 Solana 토큰을 배포하기 위한 사용자 친화적인 인터페이스를 갖춘 플랫폼을 제공합니다.",
      image: "/3.Solana Token Airdrop Website.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Solana Staking Website",
      description:
        "We design staking solutions to maximize rewards on the Solana network.",
      title_ko: "솔라나 스테이킹 웹사이트",
      description_ko:
        "우리는 Solana 네트워크에서 보상을 극대화할 수 있는 스테이킹 솔루션을 설계합니다.",
      image: "/4.Solana Staking Website.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Custom DApps",
      description:
        "We develop customized DApps optimized for your business needs using Solana blockchain technology.",
      title_ko: "맞춤형 DApps",
      description_ko:
        "우리는 Solana 블록체인 기술을 사용하여 비즈니스 요구에 최적화된 맞춤형 DApps를 개발합니다.",
      image: "/5.Solana Staking Website.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Solana Token Transaction Generation Service",
      description:
        "We provide solutions to automate token transactions on the Solana blockchain.",
      title_ko: "솔라나 토큰 거래 생성 서비스",
      description_ko:
        "우리는 Solana 블록체인에서 토큰 거래를 자동화하는 솔루션을 제공합니다.",
      image: "/6.Solana Token Transaction.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Solana Token Holder Growth Service",
      description:
        "We offer bot services to automatically increase token holders.",
      title_ko: "솔라나 토큰 보유자 성장 서비스",
      description_ko:
        "우리는 자동으로 토큰 보유자를 증가시키는 봇 서비스를 제공합니다.",
      image: "/7.Solana Token Transaction.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Exchange MM Market Making Bot",
      description:
        "We develop market-making bots to create an initial market environment on centralized exchanges.",
      title_ko: "거래소 MM 마켓 메이킹 봇",
      description_ko:
        "우리는 중앙 집중식 거래소에서 초기 시장 환경을 조성하기 위한 마켓 메이킹 봇을 개발합니다.",
      image: "/8.Exchange MM Market Making Bot.jpg",
      link: "https://t.me/mcret",
    },
    {
      title: "Exchange Listing",
      description:
        "We assist with listings on various exchanges such as BingX, MEXC, LBank, LTX, XT, P2B, Coinstore, Indodax, and Coin Market Cap.",
      title_ko: "거래소 상장",
      description_ko:
        "우리는 BingX, MEXC, LBank, LTX, XT, P2B, Coinstore, Indodax, Coin Market Cap 등의 거래소 상장을 지원합니다.",
      image: "/9.Exchange Listing.jpg",
      link: "https://t.me/mcret",
    },
  ];

  const { language } = useLanguage();

  return (
    <div className="max-w-4xl font-[Poppins] mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-4 flex flex-col gap-3 md:gap-4 rounded-xl hover:shadow-xl transition-all"
          >
            {/* Image */}
            <a href={service.link} target="_blank" rel="noopener noreferrer">
              <Image
                src={service.image}
                alt={service.title}
                width={300}
                height={160}
                className="h-40 w-full md:w-60 object-cover rounded-lg shadow-lg"
                priority={index === 0}
              />
            </a>

            {/* Title */}
            <h3 className="text-lg font-bold">
              {language === "ko" ? service.title_ko : service.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-700">
              {language === "ko" ? service.description_ko : service.description}
            </p>

            {/* CTA */}
            <a
              href={service.link}
              target="_blank"
              rel="noopener noreferrer"
              className="gradient-text2 font-semibold"
            >
              {language === "ko" ? "지금 문의하세요!" : "Contact us now!"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cards;
