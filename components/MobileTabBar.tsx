"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, GraduationCap, Compass, Users, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Hidden on full-screen game/auth flows so it never covers a question.
const HIDDEN_PREFIXES = ["/play", "/live", "/host", "/login", "/signup", "/forgot-password"];

export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
    { href: "/olevel", label: "O Level", icon: GraduationCap, match: (p: string) => p.startsWith("/olevel") },
    { href: "/explore", label: "Explore", icon: Compass, match: (p: string) => p.startsWith("/explore") },
    { href: "/join", label: "Join", icon: Users, match: (p: string) => p.startsWith("/join") },
    {
      href: user ? "/dashboard" : "/login",
      label: user ? "Account" : "Sign in",
      icon: User,
      match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/profile"),
    },
  ];

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg/90 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="grid grid-cols-5">
          {tabs.map((t) => {
            const active = t.match(pathname);
            return (
              <li key={t.label}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center justify-center gap-1 h-16 text-[10px] font-mono uppercase tracking-wider transition-colors ${
                    active ? "text-fg" : "text-muted"
                  }`}
                >
                  <t.icon size={19} strokeWidth={active ? 2.2 : 1.6} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
