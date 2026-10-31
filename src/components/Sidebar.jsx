import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  LogOut,
  ArrowUpRight,
  FileHeart,
  Stethoscope,
  Menu,
  X,
} from "lucide-react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { Brand } from "./ui.jsx";
const menu = [
  ["Overview", LayoutDashboard],
  ["Patients", Users],
  ["Manage doctors", Stethoscope],
  ["Appointments", CalendarDays],
  ["Consultations", Stethoscope],
  ["Prescriptions", FileHeart],
  ["Billing & invoices", Receipt],
];
export default function Sidebar({ onPublicHome }) {
  const { tab, setTab, setModal, profile } = useWorkspace();
  const [open, setOpen] = useState(false);
  const drawer = useRef(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector("button")?.focus();
    const keys = (e) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const nodes = [
            ...drawer.current.querySelectorAll("button,a[href]"),
          ].filter((n) => n.getClientRects().length),
          first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [open]);
  const items = menu
    .filter(([n]) => n !== "Manage doctors" || profile?.role === "clinic_admin")
    .filter(
      ([n]) =>
        !["Consultations", "Prescriptions"].includes(n) ||
        ["doctor", "clinic_admin"].includes(profile?.role),
    )
    .filter(([n]) => n !== "Billing & invoices" || profile?.role !== "doctor");
  const content = (
    <>
      <a href="#home" onClick={onPublicHome}>
        <Brand />
      </a>
      <p className="mb-4 mt-10 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">
        Your portal
      </p>
      <nav aria-label="Portal navigation" className="space-y-1.5">
        {items.map(([name, Icon]) => (
          <button
            key={name}
            onClick={() => {
              setTab(name);
              setOpen(false);
            }}
            aria-current={tab === name ? "page" : undefined}
            className={
              "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition " +
              (tab === name
                ? "bg-brand-700 text-white shadow-sm"
                : "text-slate-500 hover:bg-brand-50 hover:text-brand-700")
            }
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </nav>
      <div className="mt-8 space-y-2 border-t border-slate-100 pt-5">
        <button
          onClick={onPublicHome}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-slate-500 hover:bg-slate-50"
        >
          <ArrowUpRight size={17} />
          Public website
        </button>
        <button
          onClick={() => {
            setModal("logout");
            setOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-sm text-rose-700 hover:bg-rose-50"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </>
  );
  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white p-4 lg:hidden">
        <a href="#home">
          <Brand compact />
        </a>
        <button
          aria-label="Open portal navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="rounded-xl border border-slate-200 p-3"
        >
          <Menu size={20} />
        </button>
      </div>
      <aside className="hidden w-64 shrink-0 self-stretch border-r border-slate-200/70 bg-white p-5 lg:block">
        <div className="sticky top-5">{content}</div>
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-[80] lg:hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            ref={drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Portal navigation"
            className="relative h-full w-[min(320px,88vw)] overflow-y-auto bg-white p-5 motion-safe:animate-drawer"
          >
            <button
              autoFocus
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white p-2"
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
