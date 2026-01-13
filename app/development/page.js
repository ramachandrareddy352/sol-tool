import Cards from "@/component/Cards";
import DevHeadline from "@/component/DevHeadline";
import Footer from "@/component/Footer";
import Header from "@/component/Header";

const page = () => {
  const translations = {
    en: {
      heading: "Development",
      subhead: "Have you issued a token using SOL Maker?",
      description:
        "Congratulations. You have taken your first step into the world of blockchain. Now contact us to develop additional dApps and expand your project. In addition to the development services below, we will implement your imagination.",
    },
    ko: {
      heading: "개발",
      subhead: "SOL Maker을 사용하여 토큰을 발급하셨나요?",
      description:
        "축하합니다. 블록체인 세계로 첫 발을 내디뎠습니다. 지금 연락하여 추가 dApp을 개발하고 프로젝트를 확장하세요. 아래의 개발 서비스 외에도 귀하의 상상력을 구현해 드리겠습니다.",
    },
  };

  return (
    <>
      <Header />
      <DevHeadline translations={translations} />
      <Cards />
      <Footer />
    </>
  );
};

export default page;
