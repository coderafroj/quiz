"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, profile, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-5 md:px-8 flex items-center justify-between h-16">
        <Link href="/" className="font-display font-bold text-lg tracking-tight text-fg">
          CODARAFROJ <span className="text-muted font-normal">PLAY</span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 font-mono text-[10px] sm:text-xs uppercase tracking-widest">
          <Link href="/explore" className="px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap">
            Explore
          </Link>
          <Link href="/join" className="px-2 sm:px-3 py-2 text-muted hover:text-fg transition-colors whitespace-nowrap">
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
