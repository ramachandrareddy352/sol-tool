import Banner from "@/component/Banner";
import Footer from "@/component/Footer";
import Header from "@/component/Header";
import Headline from "@/component/Headline";
import MetaForm from "@/component/MetaForm";

const page = () => {
  const translations = {
    en: {
      priorityFees: "Priority Fees",
      heading: "Meta",
      description:
        "Easily Create your own Solana SPL Token in just 7+1 steps without Coding.",
    },
    ko: {
      priorityFees: "우선 요금",
      heading: "메타",
      description:
        "코딩 없이 7+1단계 만으로 손쉽게 Solana SPL 토큰을 만들어보세요.",
    },
  };
  return (
    <>
      <Header />
      <Banner />
      <Headline translations={translations} />
      <MetaForm />
      <Footer />
    </>
  );
};

export default page;
