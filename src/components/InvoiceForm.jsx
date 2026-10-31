import { useWorkspace } from "../state/WorkspaceContext.jsx";
import Modal from "./Modal.jsx";
import { today, peso } from "../utils/format.js";
export default function InvoiceForm() {
  const {
    modal,
    setModal,
    addInvoice,
    formError,
    saving,
    invoicePatient,
    setInvoicePatient,
    patients,
    invoiceDescription,
    setInvoiceDescription,
    invoiceQuantity,
    setInvoiceQuantity,
    invoiceAmount,
    setInvoiceAmount,
    invoiceDue,
    setInvoiceDue,
  } = useWorkspace();
  return (
    modal === "invoice" && (
      <Modal title="Create invoice" onClose={() => setModal("")}>
        <form
          className="space-y-5 p-6 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_input:not([type=checkbox])]:mt-2 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-xl [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-slate-300 [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-4 [&_input:not([type=checkbox])]:py-3 [&_input]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-brand-100 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 [&_textarea]:min-h-28 [&_textarea]:outline-none [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-brand-100"
          onSubmit={addInvoice}
        >
          {formError && <p role="alert">{formError}</p>}
          <label>
            Patient
            <select
              value={invoicePatient}
              onChange={(e) => setInvoicePatient(e.target.value)}
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Service description
            <input
              required
              maxLength={200}
              value={invoiceDescription}
              onChange={(e) => setInvoiceDescription(e.target.value)}
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              Quantity
              <input
                required
                type="number"
                min="1"
                max="999"
                step="1"
                value={invoiceQuantity}
                onChange={(e) => setInvoiceQuantity(e.target.value)}
              />
            </label>
            <label>
              Unit price (₱)
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
              />
            </label>
          </div>
          <label>
            Due date
            <input
              required
              type="date"
              min={today()}
              value={invoiceDue}
              onChange={(e) => setInvoiceDue(e.target.value)}
            />
          </label>
          <strong>
            Total: {peso(Number(invoiceAmount) * Number(invoiceQuantity))}
          </strong>
          <p className="text-xs leading-6 text-slate-500">
            this invoice is not sent or saved to a server.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
              type="button"
              onClick={() => setModal("")}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              disabled={saving}
              type="submit"
            >
              Create invoice
            </button>
          </div>
        </form>
      </Modal>
    )
  );
}
