/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { FaBars } from "react-icons/fa6";
import { FaTelegram } from "react-icons/fa";
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
    <header className="max-w-6xl py-3 px-2 mx-auto bg-[#FCFCFD] flex justify-between items-center">
      <Link href="/" className="flex items-center gap-2">
        <div className="lg:hidden flex">
          <button onClick={handleMenuToggle} className="text-[18px]">
            <FaBars />
          </button>
        </div>
        <img src="logo.png" className="w-6" alt="logo" />
        <h1 className="hidden md:block text-2xl font-extrabold font-[Barlow_Condensed]">
          Sol - Tool
        </h1>
      </Link>

      <nav
        className={`lg:flex lg:gap-9 text-[16px] font-[Poppins] ${
          menuOpen
            ? "flex flex-col text-center gap-2 absolute z-30 top-24 left-0 w-full bg-[#FCFCFD]"
            : "hidden"
        }`}
      >
        {[
          { href: "/", label: translations[language].creator },
          { href: "/minting", label: translations[language].mint },
          { href: "/freezing", label: translations[language].freeze },
          { href: "/meta", label: translations[language].meta },
          { href: "/owner", label: translations[language].owner },
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

      <div className="flex gap-3 md:gap-5 items-center">
        <div className="relative">
          <SlGlobe
            className="text-xl cursor-pointer"
            onClick={handleLangToggle}
          />

          {langOpen && (
            <div className="absolute left-0 mt-4 w-44 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <button
                onClick={() => handleLangChange("en")}
                className="w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-[#02CCE6] transition font-medium"
              >
                English
              </button>
              <button
                onClick={() => handleLangChange("ko")}
                className="w-full text-left px-6 py-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-[#02CCE6] transition font-medium border-t border-gray-100"
              >
                한국어
              </button>
            </div>
          )}
        </div>

        {/* Network Dropdown */}
        <div className="relative">
          <button
            onClick={handleNetworkToggle}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2.5 border-2 transition-all
                ${
                  currentNetwork.name === "devnet"
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-300 hover:from-blue-100 hover:to-cyan-100"
                    : "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-300 hover:from-red-100 hover:to-pink-100"
                }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
            {currentNetwork.label}
          </button>

          {networkOpen && (
            <div className="absolute right-0 mt-2 w-50 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <button
                onClick={() => handleNetworkChange("devnet")}
                className="w-full text-left px-3 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition flex items-center gap-4"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"></span>
                <div>
                  <div className="font-bold text-gray-800">Devnet</div>
                </div>
              </button>
              <div className="border-t border-gray-200"></div>
              <button
                onClick={() => handleNetworkChange("mainnet")}
                className="w-full text-left px-3 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition flex items-center gap-4"
              >
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 to-pink-500"></span>
                <div>
                  <div className="font-bold text-gray-800">Mainnet-Beta</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <WalletMultiButton
          style={{
            backgroundColor: "#02CCE6",
            color: "white",
            fontWeight: "600",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            border: "none", // Optional: Remove any default borders
            cursor: "pointer", // Ensure clickable feel
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
    </header>
  );
};

export default Header;
