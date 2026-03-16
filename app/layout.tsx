import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_NAME } from "@/lib/config";
import SessionRefresher from "@/components/SessionRefresher";

export const metadata: Metadata = {
  title: `${APP_NAME} - 여행 기록 공유`,
  description: "사진으로 여행 경로를 시각화하고 공유하는 앱",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased">
        <SessionRefresher />
        {children}
        <div id="modal-root" />
      </body>
    </html>
  );
}
