"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Accueil", icon: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" },
  { href: "/alphabet", label: "Alphabet", icon: "M4 19 9 5h2l5 14M6 14h8M17 9h4M17 13h4M17 17h4" },
  { href: "/quiz", label: "Quiz", icon: "M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" },
  { href: "/revisions", label: "Révisions", icon: "M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0 0 12.6 2M18.5 9A7 7 0 0 0 5.9 7" },
  { href: "/aide", label: "Aide", icon: "M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .8-1 1.5V14M12 18h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop : barre en haut */}
      <header className="sticky top-0 z-20 hidden border-b border-line bg-background/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="hy grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-lg text-white">Ա</span>
            Armenkyo
          </Link>
          <nav className="ml-auto flex gap-1">
            {ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  isActive(pathname, it.href) ? "bg-brand-100 text-brand-700 dark:bg-brand-700/30 dark:text-brand-200" : "text-muted hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Mobile : barre en bas */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {ITEMS.map((it) => {
            const active = isActive(pathname, it.href);
            return (
              <Link key={it.href} href={it.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-brand-600" : "text-muted"}`}>
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={it.icon} />
                </svg>
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
