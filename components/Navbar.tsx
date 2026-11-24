"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, profile, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5 font-display font-bold text-base sm:text-lg tracking-tight text-fg">
          <Image src="/logo-mark.svg" alt="" width={26} height={26} unoptimized priority />
          <span>
            CODARAFROJ <span className="text-muted font-normal">PLAY</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 font-mono text-[10px] sm:text-xs uppercase tracking-widest">
          <Link href="/olevel" className="px-2 sm:px-3 py-2 text-fg hover:text-fg-dim transition-colors whitespace-nowrap">
            O Level
          </Link>
          <Link href="/explore" className="hidden sm:block px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap">
            Explore
          </Link>
          <Link href="/join" className="hidden sm:block px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap">
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Join a Game</span>
          </Link>
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap"
              >
                <LayoutDashboard size={14} className="hidden sm:block" /> Dashboard
              </Link>
              {profile?.role === "admin" && (
                <Link href="/admin" className="px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap">
                  Admin
                </Link>
              )}
              <Link
                href="/profile"
                title="Your profile"
                className="w-7 h-7 rounded-full bg-fg text-bg flex items-center justify-center font-bold text-xs flex-shrink-0 hover:bg-fg-dim transition-colors"
              >
                {(profile?.displayName || "?").charAt(0).toUpperCase()}
              </Link>
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-2 border border-border hover:invert-hover transition-colors whitespace-nowrap"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 sm:px-4 py-2 bg-fg text-bg font-semibold hover:bg-fg-dim transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
