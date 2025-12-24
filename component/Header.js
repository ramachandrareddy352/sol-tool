/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useState } from "react";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

import { FaBars } from "react-icons/fa6";
import { CiWallet } from "react-icons/ci";
import { FaTelegram } from "react-icons/fa";
import { SlGlobe } from "react-icons/sl";

import { useLanguage } from "@/app/Context/LanguageContext";
import { usePathname } from "next/navigation";

const formatAddress = (address) => {
  if (!address) return "";
  const str = address.toString();
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
};

const Header = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, changeLanguage, translations } = useLanguage();

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev); // Toggle the mobile menu
  };

  const handleLangChange = (lang) => {
    changeLanguage(lang);
    setIsOpen(false);
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
        <Link href="/as">
          <FaTelegram className="text-[#25a2e0] text-xl" />
        </Link>
        <div className="relative">
          <SlGlobe className="text-xl cursor-pointer" onClick={handleToggle} />

          {isOpen && (
            <div className="absolute z-20 bg-white text-black shadow-md rounded mt-4 w-40">
              <ul>
                <li
                  onClick={() => handleLangChange("en")}
                  className="p-2 hover:bg-[#02CCE6] hover:text-white cursor-pointer"
                >
                  English
                </li>
                <li
                  onClick={() => handleLangChange("ko")}
                  className="p-2 hover:bg-[#02CCE6] hover:text-white cursor-pointer"
                >
                  한국어
                </li>
              </ul>
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
