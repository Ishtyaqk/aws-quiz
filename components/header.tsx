'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <Link href="/" className="logo">
          <span className="text-primary">↳</span>
          <span className="logo-text">Mirai Labs</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/quiz" className="text-text-secondary hover:text-primary transition">
            Quiz
          </Link>
          <Link href="/aggregator" className="text-text-secondary hover:text-primary transition">
            Aggregator
          </Link>
          <Link href="/results" className="text-text-secondary hover:text-primary transition">
            Results
          </Link>
        </nav>
      </div>
    </header>
  );
}
