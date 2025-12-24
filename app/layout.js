import { LanguageProvider } from "./Context/LanguageContext";
import SolanaWalletProvider from "../utils/WalletProvider";
import "./globals.css";

export const metadata = {
  title: "Sol tool",
  description: "Developed by Zakki",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SolanaWalletProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
