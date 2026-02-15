import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Companion - 여행 기록 공유",
  description: "사진으로 여행 경로를 시각화하고 공유하는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
