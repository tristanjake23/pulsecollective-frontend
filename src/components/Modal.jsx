import { useRef, useId, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
export default function Modal({ title, onClose, children, printable = false }) {
  const ref = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector("input,button,select,textarea")?.focus();
    function keys(e) {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = [
          ...ref.current.querySelectorAll(
            "button:not([disabled]), input:not([disabled]), select, textarea, a[href]",
          ),
        ].filter((n) => n.getClientRects().length);
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      data-modal-layer="true"
      data-printable={printable ? "true" : "false"}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm print:static print:block print:overflow-visible print:bg-white print:p-0 print:backdrop-blur-none"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        className="my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl motion-safe:animate-enter print:max-h-none print:max-w-none print:overflow-visible print:shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white p-6 [&_small]:text-[10px] [&_small]:font-bold [&_small]:tracking-widest [&_small]:text-brand-600 [&_h2]:mt-1 [&_h2]:text-xl [&_h2]:font-semibold print:hidden">
          <div>
            <small>PULSE COLLECTIVE CLINIC</small>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>,
    document.body,
  );
}
