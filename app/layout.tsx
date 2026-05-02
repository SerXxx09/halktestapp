import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Halk Test App",
  description: "Тестовое приложение для деплоя на ONREZA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
