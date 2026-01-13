/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { FaTelegram } from "react-icons/fa";
import { FaBars } from "react-icons/fa6";
import { SlGlobe } from "react-icons/sl";

import { useLanguage } from "@/app/Context/LanguageContext";
import { useNetwork } from "@/app/Context/NetworkContext";
import { usePathname } from "next/navigation";

const Header = () => {
  const { publicKey } = useWallet();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);

  const { language, changeLanguage, translations } = useLanguage();
  const { currentNetwork, changeNetwork } = useNetwork();

  useEffect(() => {
    const handleResize = () => {
      // Tailwind lg breakpoint = 1024px
      if (window.innerWidth >= 1024) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleLangToggle = () => {
    setLangOpen((prev) => !prev);
    setNetworkOpen(false);
  };

  const handleNetworkToggle = () => {
    setNetworkOpen((prev) => !prev);
    setLangOpen(false);
  };

  const handleLangChange = (lang) => {
    changeLanguage(lang);
    setLangOpen(false);
  };

  const handleNetworkChange = (net) => {
    changeNetwork(net);
    setNetworkOpen(false);
  };

  return (
    <header className="bg-[#FCFCFD] border-b border-[#E6E8EC]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* ================= LEFT : LOGO ================= */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Mobile Menu */}
          <button
            onClick={handleMenuToggle}
            className="lg:hidden text-xl text-gray-700"
          >
            <FaBars />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img src="logo.png" className="w-7 h-7" alt="logo" />
            <h1 className="hidden sm:block text-2xl font-extrabold font-[Barlow_Condensed]">
              SOL&nbsp;Maker
            </h1>
          </Link>
        </div>

        {/* ================= CENTER : NAV LINKS ================= */}
        <nav className="hidden lg:flex gap-10 text-[16px] font-[Poppins]">
          {[
            { href: "/", label: translations[language].creator },
            { href: "/minting", label: translations[language].mint },
            { href: "/freezing", label: translations[language].freeze },
            { href: "/meta", label: translations[language].meta },
            { href: "/owner", label: translations[language].owner },
            { href: "/development", label: translations[language].development },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`p-2 border-[#E6E8EC] md:border-none md:p-0 border-b ${
                pathname === href ? "active" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ================= RIGHT : ACTIONS ================= */}
        <div className="flex items-center gap-4 md:gap-5">
          {/* Development / Telegram */}
          <Link
            href="https://t.me/mcret"
            className="text-gray-700 hover:text-[#02CCE6] transition"
            title="Development Support"
            target="_blank"
          >
            <FaTelegram size={22} />
          </Link>

          {/* Language Selector */}
          <div className="relative">
            <SlGlobe
              className="text-xl cursor-pointer hover:text-[#02CCE6]"
              onClick={handleLangToggle}
            />

            {langOpen && (
              <div className="absolute right-0 mt-3 w-40 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
                <button
                  onClick={() => handleLangChange("en")}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium"
                >
                  English
                </button>
                <button
                  onClick={() => handleLangChange("ko")}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium border-t"
                >
                  한국어
                </button>
              </div>
            )}
          </div>

          {/* Network Selector */}
          <div className="relative">
            <button
              onClick={handleNetworkToggle}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition
            ${
              currentNetwork.name === "devnet"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-red-50 text-red-700 border-red-300"
            }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
              {currentNetwork.label}
            </button>

            {networkOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border z-50">
                <button
                  onClick={() => handleNetworkChange("devnet")}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50"
                >
                  Devnet
                </button>
                <button
                  onClick={() => handleNetworkChange("mainnet")}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 border-t"
                >
                  Mainnet-Beta
                </button>
              </div>
            )}
          </div>

          {/* Wallet */}
          <WalletMultiButton
            style={{
              backgroundColor: "#02CCE6",
              color: "white",
              fontWeight: "600",
              padding: "0.4rem 1rem",
              borderRadius: "0.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              border: "none",
            }}
          >
            <span>
              {publicKey
                ? `${publicKey.toString().slice(0, 4)}...${publicKey
                    .toString()
                    .slice(-4)}`
                : translations[language].connectWallet}
            </span>
          </WalletMultiButton>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {menuOpen && (
        <div className="lg:hidden border-t bg-white">
          <nav className="flex flex-col text-center">
            {[
              { href: "/", label: translations[language].creator },
              { href: "/minting", label: translations[language].mint },
              { href: "/freezing", label: translations[language].freeze },
              { href: "/meta", label: translations[language].meta },
              { href: "/owner", label: translations[language].owner },
              {
                href: "/development",
                label: translations[language].development,
              },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="py-3 border-b hover:bg-gray-50"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
