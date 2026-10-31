import { useState } from "react";
import { ArrowUpRight, Menu, X, Stethoscope } from "lucide-react";
import { Brand, primary } from "./ui.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
export default function PublicLayout({
  children,
  page,
  onNavigate,
  hasSession,
}) {
  const [open, setOpen] = useState(false);
  const links = [
    ["home", "Home"],
    ["about", "About"],
    ["doctors", "Find a doctor"],
    ["triage", "AI triage"],
  ];
  const go = (target) => {
    setOpen(false);
    onNavigate(target);
  };
  return (
    <div className="min-h-screen bg-[#f7fafb] font-sans text-slate-800 antialiased">
      <a
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
        className="sr-only z-50 rounded bg-white p-3 focus:not-sr-only focus:absolute"
      >
        Skip to content
      </a>
      
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-22 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a
            href="#home"
            onClick={() => go("home")}
            aria-label="Pulse Collective home"
          >
            <Brand />
          </a>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-6 lg:flex"
          >
            {links.map(([target, label]) => (
              <a
                key={target}
                href={"#" + target}
                onClick={() => go(target)}
                aria-current={page === target ? "page" : undefined}
                className={
                  "border-b-2 py-3 text-sm font-semibold transition hover:text-brand-700 " +
                  (page === target
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500")
                }
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a
              className={primary.replace(
                "inline-flex",
                "hidden sm:inline-flex",
              )}
              href={hasSession ? "#portal" : "#login"}
              onClick={() => go(hasSession ? "portal" : "login")}
            >
              <Stethoscope size={16} />
              {hasSession ? "My portal" : "Sign in / Register"}
              <ArrowUpRight size={16} />
            </a>
            <button
              className="rounded-lg p-3 hover:bg-brand-50 lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-nav"
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="space-y-1 border-t border-slate-100 p-4 lg:hidden"
          >
            {[
              ...links,
              [
                hasSession ? "portal" : "login",
                hasSession ? "My portal" : "Sign in / Register",
              ],
            ].map(([target, label]) => (
              <a
                key={target}
                href={"#" + target}
                onClick={() => go(target)}
                className="block rounded-xl px-4 py-3 font-medium hover:bg-brand-50"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="mt-16 border-t border-slate-200 bg-white px-5 py-10 sm:px-8 print:hidden">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <Brand />
            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
              A simpler way to explore care and organize your clinic day.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-bold">Explore Pulse Collective</h2>
            <div className="flex flex-wrap gap-5 text-sm text-slate-600">
              {links.map(([target, label]) => (
                <a
                  className="hover:text-brand-700"
                  key={target}
                  href={"#" + target}
                  onClick={() => go(target)}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <div className="text-xs leading-6 text-slate-500">
            <b className="text-slate-700">Pulse Collective · Connected care</b>
            <p>
              Browse published clinic profiles. Contact the clinic to confirm
              availability.
            </p>
          </div>
        </div>
        <p className="mx-auto mt-9 max-w-7xl border-t border-slate-100 pt-5 text-xs text-slate-400">
          © {new Date().getFullYear()} Pulse Collective · Smart Healthcare
          Management
        </p>
      </footer>
    </div>
  );
}
