import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Codarafroj Play — O Level Practice & Quizzes",
    short_name: "Codarafroj Play",
    description: "NIELIT O Level MCQ practice for all four papers, plus coding quizzes and live games.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "O Level practice", url: "/olevel" },
      { name: "Join a live game", url: "/join" },
    ],
  };
}
