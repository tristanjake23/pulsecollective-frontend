import { useState, useEffect } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import Modal from "./Modal.jsx";
import InvoiceDetails from "./InvoiceDetails.jsx";
import { input, primary, secondary } from "./ui.jsx";
import { api } from "../api/client.js";
import { invoice as mapInvoice } from "../api/mappers.js";
import { uniqueId } from "../utils/format.js";
export default function InvoiceDialog() {
  const {
    activeInvoice,
    setActiveInvoice,
    invoices,
    patients,
    setInvoices,
    canBill,
    recordPayment,
  } = useWorkspace();
  const [ready, setReady] = useState(false);
  const [pay, setPay] = useState(false),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false),
    [reference, setReference] = useState("");
  useEffect(() => {
    setPay(false);
    setReady(false);
    setError("");
    setReference(uniqueId("PAY"));
    let active = true;
    if (activeInvoice)
      api("/invoices/" + activeInvoice)
        .then((raw) => {
          if (active) {
            setReady(true);
            setInvoices((all) =>
              all.map((i) => (i.id === activeInvoice ? mapInvoice(raw) : i)),
            );
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [activeInvoice]);
  const invoice = invoices.find((i) => i.id === activeInvoice);
  if (!invoice) return null;
  async function submit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSaving(true);
    setError("");
    try {
      await recordPayment(invoice.id, {
        amount: Number(data.get("amount")),
        method: data.get("method"),
        reference,
      });
      setPay(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal
      printable
      title="Invoice details"
      onClose={() => setActiveInvoice(null)}
    >
      {!ready && !error && (
        <p role="status" className="p-5 text-sm text-slate-500 print:hidden">
          Loading invoice details…
        </p>
      )}
      <InvoiceDetails
        ready={ready}
        invoice={invoice}
        patient={
          invoice.patient_details
            ? {
                ...invoice.patient_details,
                code: invoice.patient_details.patient_code,
              }
            : patients.find((p) => p.id === invoice.patientId)
        }
        onPaid={
          !canBill || !ready
            ? undefined
            : () => {
                setPay(true);
              }
        }
      />
      {error && !pay && (
        <p role="alert" className="p-5 text-rose-700">
          {error}
        </p>
      )}
      {pay && (
        <form
          onSubmit={submit}
          className="space-y-4 border-t border-slate-100 p-6 print:hidden"
        >
          <h3 className="font-semibold">Record a received payment</h3>
          <p className="text-xs text-slate-500">
            Only record payments actually received by your clinic.
          </p>
          <label className="block text-sm">
            Amount (PHP)
            <input
              required
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              max={invoice.balanceDue}
              defaultValue={invoice.balanceDue}
              className={input + " mt-2"}
            />
          </label>
          <label className="block text-sm">
            Method
            <select name="method" className={input + " mt-2"}>
  <option value="cash">Cash</option>
  <option value="ewallet">QR / E-wallet</option>
  <option value="card">Card</option>
           </select>
          </label>
          <label className="block text-sm">
            Receipt/reference
            <input
              required
              maxLength={200}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={input + " mt-2"}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className={secondary}
              onClick={() => setPay(false)}
            >
              Cancel
            </button>
            <button disabled={saving} className={primary}>
              {saving ? "Saving…" : "Save payment"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
