import { useState } from "react";
export const BRAND_NAME = "Pulse Collective";
export const LOGO_URL = "/logo.jpg";
export const primary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-700 to-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_6px_18px_-9px_#155c4f] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
export const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600 motion-reduce:transition-none";
export const input =
  "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
export const card =
  "rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_28px_-20px_#143d5040]";
export function BrandLogo({ className = "h-10 w-10" }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      aria-label="Pulse Collective"
      className={
        className +
        " inline-flex shrink-0 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white"
      }
    >
      PC
    </span>
  ) : (
    <img
      src={LOGO_URL}
      alt="Pulse Collective logo"
      onError={() => setFailed(true)}
      className={className + " shrink-0 rounded-xl object-contain"}
    />
  );
}
export function Brand({ compact = false }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandLogo />
      <span className="text-base font-bold leading-tight tracking-tight text-brand-900">
        Pulse Collective<span className="text-brand-500">.</span>
        {!compact && (
          <span className="mt-0.5 block text-[9px] font-semibold tracking-[0.2em] text-slate-500">
            CARE, MORE CONNECTED
          </span>
        )}
      </span>
    </span>
  );
}
export function Badge({ children, status }) {
  const tone =
    status === "Paid" || status === "Active"
      ? "bg-emerald-50 text-emerald-800"
      : status === "Overdue"
        ? "bg-rose-50 text-rose-800"
        : "bg-amber-50 text-amber-800";
  return (
    <span
      className={
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold " + tone
      }
    >
      {children}
    </span>
  );
}
export function Eyebrow({ children }) {
  return (
    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
      {children}
    </p>
  );
}
