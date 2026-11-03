import { useEffect, useRef, useState } from "react";
import { CreditCard, RefreshCw } from "lucide-react";
import { api } from "../api/client.js";
import { card, primary, secondary } from "./ui.jsx";
import QrPayment from "./QrPayment.jsx";
import { patientServiceError } from "../utils/patient.js";

const money = (value) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP",
}).format(Number(value || 0));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function checkoutAddress(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "checkout.paymongo.com" ||
      url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("The checkout address is invalid. Contact the clinic.");
  }
  return url.href;
}

export default function MyInvoices({ accountId }) {
  const [invoices, setInvoices] = useState([]);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const storageKey = `pulse-test-checkout:${accountId}`;

  function remember(id) {
    try { window.sessionStorage.setItem(storageKey, id); } catch { /* Return URL also retains it. */ }
  }
  async function load() {
    const result = await api("/patient/invoices");
    if (!mounted.current) return;
    setInvoices(result.invoices);
    setAvailable(result.test_checkout_available === true);
  }
  async function status(id) {
    const result = await api(`/patient/checkouts/${id}`);
    if (!mounted.current) return;
    if (result.test_mode !== true) throw new Error("Unexpected checkout mode.");
    setAttempt(result);
    remember(result.id);
  }

  useEffect(() => {
    mounted.current = true;
    let active = true;
    async function initialize() {
      try {
        await load();
        const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
        let id = params.get("checkout");
        if (!id) {
          try { id = window.sessionStorage.getItem(storageKey); } catch { /* Optional resume. */ }
        }
        if (active && id && uuid.test(id)) await status(id);
      } catch (err) {
        if (active) setError(patientServiceError(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; mounted.current = false; };
  }, [accountId]);

  async function refresh() {
    if (locked.current) return;
    locked.current = true;
    setBusy("refresh"); setError("");
    try {
      await load();
      if (attempt?.id) await status(attempt.id);
    } catch (err) {
      if (mounted.current) setError(patientServiceError(err));
    } finally {
      locked.current = false;
      if (mounted.current) { setBusy(""); setLoading(false); }
    }
  }

  async function start(invoice) {
    if (locked.current) return;
    locked.current = true;
    setBusy(invoice.id); setError("");
    try {
      const result = await api(`/patient/invoices/${invoice.id}/checkout`, {
        method: "POST", body: {},
      });
      if (!mounted.current) return;
      if (result.test_mode !== true) throw new Error("Only test checkout is supported here.");
      setAttempt(result);
      remember(result.id);
      if (result.state === "pending" && result.checkout_url) {
        window.location.assign(checkoutAddress(result.checkout_url));
      }
    } catch (err) {
      if (mounted.current) setError(patientServiceError(err));
    } finally {
      locked.current = false;
      if (mounted.current) setBusy("");
    }
  }

  return (
    <section id="my-invoices" className={card + " min-w-0 scroll-mt-5 p-5 sm:p-7"} aria-labelledby="my-invoices-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="my-invoices-heading" className="flex items-center gap-2 text-xl font-semibold">
            <CreditCard size={21} /> My invoices
          </h2>
          <p className="mt-2 text-sm text-slate-500">Invoices linked to your patient account.</p>
        </div>
        <button type="button" className={secondary} disabled={loading || Boolean(busy)} onClick={refresh}>
          <RefreshCw size={16} /> {busy === "refresh" ? "Checking…" : "Refresh invoices"}
        </button>
      </div>

      {(available || attempt) && <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        Test payments only. No real money is collected. A successful test does not settle your clinic invoice or change its balance.
      </p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {attempt && (
        <div role="status" className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm leading-6 text-teal-900">
          <p className="font-semibold">
            {attempt.state === "test_paid" ? "Test payment confirmed by PayMongo" :
              attempt.state === "pending" ? "Waiting for PayMongo confirmation" :
              attempt.state === "creating" ? "Test checkout is being prepared" : "Test checkout needs attention"}
          </p>
          <p>Test amount: {money(attempt.amount)}</p>
          {attempt.payment_reference && <p className="break-all">Test reference: {attempt.payment_reference}</p>}
          {attempt.state === "pending" && <p>Returning from checkout does not confirm payment. Refresh to check the provider notification.</p>}
          <p>Your actual invoice balance is unchanged by this test.</p>
        </div>
      )}

      {loading ? <p role="status" className="mt-5 text-sm text-slate-500">Loading your invoices…</p> :
        !invoices.length && !error ? <p className="mt-5 text-sm text-slate-500">No invoices are linked to your account yet. Contact the clinic if you expected an invoice.</p> :
        <div className="mt-5 space-y-4">
          {invoices.map(invoice => (
            <article key={invoice.id} className="min-w-0 break-words rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{invoice.invoice_no || "Invoice"}</h3>
                  <p className="mt-1 text-sm text-slate-500">{invoice.clinic_name}</p>
                  <p className="mt-1 text-xs text-slate-500">Due: {invoice.due_date || "Not specified"}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize">{invoice.status}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                {[["Invoice total", invoice.amount], ["Received by clinic", invoice.paid_amount], ["Balance due", invoice.balance_due]].map(([label, value]) => (
                  <div key={label}><dt className="text-slate-500">{label}</dt><dd className="mt-1 font-semibold">{money(value)}</dd></div>
                ))}
              </dl>
              {!available && Number(invoice.balance_due) > 0 && invoice.status !== "paid" && (
                <div className="mt-5">
                  <QrPayment invoice={{ ...invoice, number: invoice.invoice_no, balanceDue: invoice.balance_due, paidAmount: invoice.paid_amount }} />
                  <p className="mt-3 text-xs leading-6 text-slate-500">The clinic will update your balance after verifying your payment.</p>
                </div>
              )}
              {available && Number(invoice.balance_due) > 0 && invoice.status !== "paid" && (
                <div className="mt-5">
                  <button type="button" className={primary} disabled={!available || Boolean(busy)} onClick={() => start(invoice)}>
                    {busy === invoice.id ? "Opening test checkout…" : "Try PayMongo test checkout"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>}
    </section>
  );
}
