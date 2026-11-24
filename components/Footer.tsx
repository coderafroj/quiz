import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-5 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs text-muted">
        <p>© {new Date().getFullYear()} CODARAFROJ PLAY. Built by Codarafroj.</p>
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          <Link href="/olevel" className="hover:text-fg transition-colors">O Level</Link>
          <Link href="/olevel/m3" className="hover:text-fg transition-colors">Python (M3)</Link>
          <Link href="/explore" className="hover:text-fg transition-colors">Explore</Link>
          <Link href="/join" className="hover:text-fg transition-colors">Join</Link>
        </nav>
        <a href="https://coderafroj.me" className="hover:text-fg transition-colors">
          coderafroj.me
        </a>
      </div>
    </footer>
  );
}
