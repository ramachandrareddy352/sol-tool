"use client";

import Header from "@/component/Header";
import Banner from "../component/Banner";
import TokenForm from "@/component/TokenForm";
import LiquidityPool from "@/component/LiquidityPool";
import Faq from "@/component/Faq";
import Footer from "@/component/Footer";
import Headline from "@/component/Headline";
import { useState } from "react";

export default function Home() {
  const [openModal, setOpenModal] = useState(false);

  const translations = {
    en: {
      priorityFees: "Priority Fees",
      heading: "Solana Token Creator",
      description:
        "Easily Create your own Solana SPL Token in just 7+1 steps without Coding.",
    },
    ko: {
      priorityFees: "우선 요금",
      heading: "Solana 토큰 생성기",
      description:
        "코딩 없이 7+1 단계만으로 Solana SPL 토큰을 쉽게 생성하세요.",
    },
  };

  return (
    <>
      <Header setOpenModal={setOpenModal} />
      <Banner />
      <Headline translations={translations} />
      <TokenForm />
      <LiquidityPool />
      <Faq />
      <Footer />
    </>
  );
}
