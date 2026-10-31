import { BrandLogo, BRAND_NAME } from "./ui.jsx";
import QrPayment from "./QrPayment.jsx";
import { Badge } from "./ui.jsx";
import { peso } from "../utils/format.js";
export default function InvoiceDetails({
  invoice,
  patient,
  onPaid,
  ready = true,
}) {
  if (!ready) return null;
  return (
    <div className="space-y-5 p-6 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_input:not([type=checkbox])]:mt-2 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-xl [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-slate-300 [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-4 [&_input:not([type=checkbox])]:py-3 [&_input]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-brand-100 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 [&_textarea]:min-h-28 [&_textarea]:outline-none [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-brand-100">
      <div className="space-y-6 invoice-document">
        <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
          <BrandLogo className="h-16 w-16" />
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{BRAND_NAME}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {invoice.clinic_name || "Clinic billing"} · Invoice
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-5 [&_h2]:text-xl [&_h2]:font-semibold">
          <div>
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
              PULSE COLLECTIVE · INVOICE
            </span>
            <h2>{invoice.number || invoice.id}</h2>
          </div>
          <Badge status={invoice.status}>{invoice.status}</Badge>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 [&_small]:text-xs [&_small]:text-slate-400 [&_h3]:mt-2 [&_h3]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-slate-500">
          <div>
            <small>BILL TO</small>
            <h3>{invoice.patient}</h3>
            <p>
              {patient?.code || patient?.id}
              <br />
              {patient?.phone}
              <br />
              {patient?.address || "Address not provided"}
            </p>
          </div>
          <div>
            <p>
              Issued: {invoice.issued}
              <br />
              Due: {invoice.due}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto [&_table]:w-full [&_table]:min-w-[580px] [&_table]:text-left [&_table]:text-sm [&_th]:whitespace-nowrap [&_th]:bg-[#f3f7f8] [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-slate-500 [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-5 [&_td]:py-4 print:[&_table]:min-w-0 print:[&_td]:px-2">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{peso(item.rate)}</td>
                  <td>{peso(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-5 text-lg [&_strong]:text-brand-700">
          <span>Total (PHP)</span>
          <strong>{peso(invoice.amount)}</strong>
        </div>
        {invoice.balanceDue !== undefined && (
          <p className="text-sm font-semibold text-brand-700">
            Collected: {peso(invoice.paidAmount)} · Balance:{" "}
            {peso(invoice.balanceDue)}
          </p>
        )}
        <p className="text-xs leading-6 text-slate-500">
          Not an official tax invoice or proof of payment. No taxes or discounts
          applied.
        </p>
      </div>
      <QrPayment invoice={invoice} />
      <div className="flex flex-wrap justify-end gap-3 pt-3 print:hidden">
        {invoice.status !== "Paid" && onPaid && (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
            onClick={onPaid}
          >
            Record payment
          </button>
        )}
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          disabled={!ready}
          onClick={() => {
            if (ready) window.print();
          }}
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
