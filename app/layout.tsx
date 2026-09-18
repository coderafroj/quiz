import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://play.coderafroj.me";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Codarafroj Quiz — Python, Java, C++ & GK Quizzes | Play or Create",
    template: "%s | Codarafroj Play",
  },
  description:
    "Free coding and general knowledge quizzes — Python, C, C++, Java and more, organized by difficulty. Play solo or host a live real-time game with a join code. Build and share your own quiz in any language.",
  keywords: [
    "coderafroj quiz",
    "codarafroj quiz",
    "python quiz",
    "c programming quiz",
    "c++ quiz",
    "java quiz",
    "coding quiz online",
    "programming quiz for beginners",
    "live quiz game",
    "create a quiz online free",
    "quiz with join code",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Codarafroj Play",
    title: "Codarafroj Quiz — Python, Java, C++ & GK Quizzes",
    description:
      "Free coding and general knowledge quizzes organized by topic and difficulty. Play solo or host a live game with a join code.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Codarafroj Quiz — Python, Java, C++ & GK Quizzes",
    description: "Play free coding quizzes solo or live with friends. Build your own in minutes.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-bg text-fg`}
      >
        <div className="grain-bg" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
