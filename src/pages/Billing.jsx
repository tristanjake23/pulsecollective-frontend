import { useWorkspace } from "../state/WorkspaceContext.jsx";
import PageHeading from "../components/PageHeading.jsx";
import { peso } from "../utils/format.js";
import SearchBox from "../components/SearchBox.jsx";
import InvoiceTable from "../components/InvoiceTable.jsx";
export default function Billing() {
  const {
    totalBilled,
    collected,
    outstanding,
    invoices,
    query,
    setQuery,
    visibleInvoices,
    setActiveInvoice,
  } = useWorkspace();
  return (
    <>
      <PageHeading />
      <>
        <div className="grid gap-4 sm:grid-cols-3 [&>div]:rounded-2xl [&>div]:border [&>div]:border-slate-200 [&>div]:bg-white [&>div]:p-6 [&_small]:text-sm [&_small]:text-slate-500 [&_strong]:mt-3 [&_strong]:block [&_strong]:text-2xl [&_strong]:text-brand-900">
          <div>
            <small>Total billed</small>
            <strong>{peso(totalBilled)}</strong>
          </div>
          <div>
            <small>Collected</small>
            <strong>{peso(collected)}</strong>
          </div>
          <div>
            <small>Outstanding</small>
            <strong>{peso(outstanding)}</strong>
          </div>
        </div>
        <section className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_28px_-20px_#143d5040] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 [&_h2]:font-semibold">
            <h2>
              Invoices{" "}
              <span className="ml-2 rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
                {invoices.length}
              </span>
            </h2>
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Search invoices"
            />
          </div>
          <InvoiceTable
            invoices={visibleInvoices}
            onSelect={(i) => setActiveInvoice(i.id)}
          />
        </section>
      </>
    </>
  );
}
