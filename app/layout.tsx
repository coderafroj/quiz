import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import MobileTabBar from "@/components/MobileTabBar";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_URL = "https://play.coderafroj.me";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Codarafroj Play — NIELIT O Level Practice, Python Quizzes & Live Quiz Games",
    template: "%s | Codarafroj Play",
  },
  description:
    "Free NIELIT O Level MCQ practice for all four papers (IT Tools, Web Design, Python, IoT) with mock tests and progress tracking, plus coding quizzes in Python, C, C++ and Java. Play solo or host a live game with a join code.",
  keywords: [
    "NIELIT O Level mock test",
    "O Level python quiz",
    "O Level MCQ practice",
    "O Level web designing quiz",
    "O Level IoT questions",
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
  applicationName: "Codarafroj Play",
  category: "education",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
  colorScheme: "dark",
};

const SITE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Codarafroj Play",
    url: SITE_URL,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Codarafroj Play",
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    sameAs: ["https://coderafroj.me"],
  },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" crossOrigin="" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }} />
      </head>
      <body
        className={`${bricolage.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-bg text-fg`}
      >
        <div className="grain-bg" />
        <AuthProvider>
          {children}
          <MobileTabBar />
        </AuthProvider>
      </body>
    </html>
  );
}
