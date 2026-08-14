import type { Metadata } from "next";
import "@fontsource-variable/nunito";
import "./globals.css";

export const metadata: Metadata = {
  title: "matchin — Meet your match",
  description: "Meet someone who matches your vibe with matchin.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
