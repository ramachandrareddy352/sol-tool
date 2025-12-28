import { Toaster } from "react-hot-toast";
import { LanguageProvider } from "./Context/LanguageContext";
import { NetworkProvider } from "./Context/NetworkContext";
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
          <NetworkProvider>
            <LanguageProvider>
              {children}
              <Toaster
                position="top-right"
                // toastOptions={{
                //   duration: 4000,
                //   style: {
                //     background:
                //       "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", // Subtle gradient for depth
                //     color: "#e5e7eb",
                //     border: "1px solid #02CCE6",
                //     borderRadius: "16px", // Slightly larger radius for modern feel
                //     padding: "16px 20px", // More breathing room
                //     fontSize: "14px",
                //     fontWeight: "500",
                //     boxShadow:
                //       "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(2, 204, 230, 0.05)", // Multi-layered shadow for professionalism
                //     backdropFilter: "blur(10px)", // Subtle blur for glassmorphism effect
                //   },
                //   className: "custom-toast", // Add class for potential CSS overrides
                //   progressClassName: "custom-progress", // Class for progress bar styling (add CSS: .custom-progress { height: 3px; background: linear-gradient(90deg, #02CCE6, #00b4cd); border-radius: 0 0 16px 16px; } ),
                //   success: {
                //     style: {
                //       borderColor: "#22c55e",
                //       background:
                //         "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                //     },
                //     iconTheme: {
                //       primary: "#22c55e",
                //       secondary: "#0f172a",
                //     },
                //   },
                //   error: {
                //     style: {
                //       borderColor: "#ef4444",
                //       background:
                //         "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                //     },
                //     iconTheme: {
                //       primary: "#ef4444",
                //       secondary: "#0f172a",
                //     },
                //   },
                // }}
              />
            </LanguageProvider>
          </NetworkProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
