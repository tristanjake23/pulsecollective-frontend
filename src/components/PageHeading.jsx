import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { Plus } from "lucide-react";
export default function PageHeading() {
  const { tab, setModal, canBill } = useWorkspace();
  return (
    <div
      key={`heading-${tab}`}
      className="flex flex-wrap items-center justify-between gap-5 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-6 [&_p]:text-slate-500"
    >
      <div>
        <span className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          CLINIC MANAGEMENT
        </span>
        <h1>
          {tab === "Overview"
            ? "A clear view of your clinic."
            : tab === "Patients"
              ? "Patient records"
              : "Billing & invoices"}
        </h1>
        <p>
          {tab === "Overview"
            ? "Your patients, payments, and clinic activity in one place."
            : tab === "Patients"
              ? "Keep patient information organized and easy to find."
              : "Create invoices and review billing activity."}
        </p>
      </div>
      {(tab !== "Billing & invoices" || canBill) && (
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          onClick={() =>
            setModal(tab === "Billing & invoices" ? "invoice" : "patient")
          }
        >
          <Plus size={17} />
          {tab === "Billing & invoices" ? "Create invoice" : "Add patient"}
        </button>
      )}
    </div>
  );
}
