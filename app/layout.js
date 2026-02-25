import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./Context/LanguageContext";
import { NetworkProvider } from "./Context/NetworkContext";
import SolanaWalletProvider from "../utils/WalletProvider";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.sol-maker.com"),

  title: {
    default: "솔 메이커 | 솔라나 토큰 생성기",
    template: "%s | 솔 메이커",
  },

  description:
    "솔 메이커는 솔라나(Solana)에서 토큰을 빠르게 생성하고 관리할 수 있는 웹 도구입니다. 토큰 발행, 메타데이터 설정, 권한(Authority) 관리 등을 지원합니다.",

  keywords: [
    "솔라나 토큰 생성기",
    "SPL 토큰 생성",
    "Solana Token Generator",
    "SPL Token Creator",
    "Solana",
    "토큰 발행",
    "Authority 관리",
    "메타데이터 설정",
  ],

  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      en: "/en",
      "x-default": "/",
    },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },

  openGraph: {
    type: "website",
    url: "https://www.sol-maker.com/",
    siteName: "솔 메이커",
    title: "솔 메이커 | 솔라나 토큰 생성기",
    description:
      "솔라나(Solana) 토큰 생성 및 관리를 위한 웹 도구. 빠른 발행, 메타데이터 설정, 권한 관리 지원.",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    images: [
      {
        url: "https://www.sol-maker.com/home.png",
        width: 1200,
        height: 630,
        alt: "솔 메이커 - 솔라나 토큰 생성기",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "솔 메이커 | 솔라나 토큰 생성기",
    description:
      "솔라나(Solana) 토큰 생성 및 관리를 위한 웹 도구. 빠른 발행과 권한 관리 지원.",
    images: ["https://www.sol-maker.com/home.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <SolanaWalletProvider>
          <NetworkProvider>
            <LanguageProvider>
              {children}
              <Toaster position="top-right" />
            </LanguageProvider>
          </NetworkProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
