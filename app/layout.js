import { LanguageProvider } from "./Context/LanguageContext";
import "./globals.css";

export const metadata = {
  title: "Sol tool",
  description: "Developed by Zakki",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
