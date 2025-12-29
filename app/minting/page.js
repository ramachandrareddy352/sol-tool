import Banner from "@/component/Banner";
import Footer from "@/component/Footer";
import Header from "@/component/Header";
import Headline from "@/component/Headline";
import MinForm from "@/component/MinForm";

const page = () => {
  const translations = {
    en: {
      priorityFees: "Priority Fees",
      heading: "Minting/Burn",
      description:
        "Easily Create your own Solana SPL Token in just 7+1 steps without Coding.",
    },
    ko: {
      priorityFees: "우선 요금",
      heading: "민트/번",
      description:
        "코딩 없이 7+1단계 만으로 손쉽게 Solana SPL 토큰을 만들어보세요.",
    },
  };

  return (
    <>
      <Header />
      <Banner />
      <Headline translations={translations} />
      <MinForm />
      <Footer />
    </>
  );
};

export default page;
