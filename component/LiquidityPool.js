// import { FaMagnifyingGlass } from 'react-icons/fa6';
import { FaTelegram } from "react-icons/fa";
import { RiKakaoTalkFill } from "react-icons/ri";
import { useLanguage } from "@/app/Context/LanguageContext";
import Link from "next/link";

const LiquidityPool = () => {
  const { language } = useLanguage();

  const translations = {
    en: {
      createLiquidityPool: "Do you need project development?",
      createHere: "Click Here",
      connect: "Connect:",
      question: "Are you preparing a Solana project?",
      desc1:
        "Contact us for project development assistance. We are a top-tier Solana development team of five developers.",
      desc2:
        "We provide end-to-end services, from development to exchange listing.",
    },
    ko: {
      question: "솔라나 프로젝트를 준비 중이신가요?",
      desc1:
        "프로젝트 개발이 필요하시면 언제든지 문의하세요. 저희는 5명의 개발자로 구성된 최상급 솔라나 전문 개발팀입니다.",
      desc2:
        "개발부터 거래소 상장까지, 엔드 투 엔드(End-to-End) 서비스를 제공합니다.",
      createLiquidityPool: "프로젝트 개발이 필요하신가요?",
      createHere: "여기를 클릭하세요",
      connect: "연결:",
    },
  };

  return (
    <section className="max-w-4xl mx-auto p-6 font-[Poppins]">
      <div className="border-grad flex flex-col md:flex-row justify-center items-center gap-3 border-[#E6E8EC] border-2 p-3 text-center font-normal bg-[#ECFFFF]">
        <p>{translations[language].createLiquidityPool}</p>
        <Link
          href="https://t.me/mcret"
          className="text-[#02CCE6] cursor-pointer"
        >
          {translations[language].createHere}
        </Link>
      </div>

      <div className="my-5 flex gap-4 flex-col bg-[#ECFFFF] border-[#02CCE6] border-2 rounded p-5 md:py-14 md:px-20">
        <h1 className="text-xl font-semibold">
          {translations[language].question}
        </h1>

        <p>{translations[language].desc1}</p>
        <p>{translations[language].desc2}</p>

        <div>
          <h1 className="text-xl font-semibold">
            {translations[language].connect}
          </h1>
        </div>

        <div className="flex flex-col md:flex-row gap-5 justify-between items-center">
          {/* Telegram */}
          <a
            href="https://t.me/mcret"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <button className="w-full text-2xl text-center justify-center flex gap-3 cursor-pointer py-2 px-10 rounded text-white bg-[#37acd5] hover:opacity-90 transition">
              <FaTelegram color="#fff" />
              <span className="text-xl">Telegram</span>
            </button>
          </a>

          {/* KakaoTalk */}
          <a
            href="https://open.kakao.com/o/szTmHT6d"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full"
          >
            <button className="w-full text-2xl text-center justify-center flex gap-3 cursor-pointer py-2 px-10 rounded bg-[#ffe812] hover:opacity-90 transition">
              <RiKakaoTalkFill color="#000" />
              <span className="text-xl text-black">Kakao Talk</span>
            </button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default LiquidityPool;
