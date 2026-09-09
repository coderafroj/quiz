export default function Footer() {
  return (
    <footer className="border-t border-border py-8 px-5 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 font-mono text-xs text-muted">
        <p>© {new Date().getFullYear()} CODARAFROJ PLAY. Built by Codarafroj.</p>
        <a href="https://coderafroj.me" className="hover:text-fg transition-colors">
          coderafroj.me
        </a>
      </div>
    </footer>
  );
}
