import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";
import { WavesBackground } from "@/components/ui/waves-background";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stabilium — AI Agent Reliability Platform",
  description:
    "Measure, benchmark, and certify the reliability of your AI agents before they reach production. The enterprise compliance platform for LLM-powered systems.",
  openGraph: {
    title: "Stabilium — AI Agent Reliability Platform",
    description:
      "One score. Actionable insights. Enterprise compliance ready.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${plexMono.variable} antialiased`}>
        <WavesBackground />
        {children}
      </body>
    </html>
  );
}
