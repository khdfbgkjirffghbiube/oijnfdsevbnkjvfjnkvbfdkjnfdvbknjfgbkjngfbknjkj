import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskDrop — задания для стримеров",
  description:
    "Отправляйте задания любимым стримерам, следите за выполнением и получайте эмоции в прямом эфире.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

