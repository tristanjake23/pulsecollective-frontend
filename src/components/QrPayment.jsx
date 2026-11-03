import { useState } from "react";
import { peso } from "../utils/format.js";
import { primary } from "./ui.jsx";

export default function QrPayment({ invoice }) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const balance = Number(
    invoice.balanceDue ??
      Math.max(
        0,
        Number(invoice.amount) - Number(invoice.paidAmount || 0),
      ),
  );

  if (
    invoice.status === "Paid" ||
    !Number.isFinite(balance) ||
    balance <= 0
  ) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-5 print:hidden">
      <button
        type="button"
        className={primary}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide payment QR" : "Pay via QR"}
      </button>

      {open && (
        <div className="mt-5 space-y-4 text-center">
          <h3 className="text-lg font-semibold">
            Scan the clinic payment QR
          </h3>

          <p className="text-2xl font-bold text-brand-700">
            {peso(balance)}
          </p>

          {imageFailed ? (
            <p
              role="alert"
              className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
            >
              Payment QR is unavailable. Please contact the clinic.
            </p>
          ) : (
            <img
              src={`${import.meta.env.BASE_URL}clinic-payment-qr.png`}
              alt="Clinic receiving payment QR code"
              onError={() => setImageFailed(true)}
              className="mx-auto h-auto w-full max-w-72 rounded-xl border border-slate-200 bg-white p-3"
            />
          )}

          <p className="break-all text-sm text-slate-600">
            Invoice: {invoice.number || "Reference not available"}
          </p>

          <div className="rounded-xl bg-slate-50 p-4 text-left text-sm leading-6 text-slate-600">
            <p>
              Verify the receiving account with the clinic before
              paying. Enter the amount shown above in your payment app.
            </p>
            <p className="mt-2">
              Keep your transaction reference. The clinic will verify
              receipt before recording your payment.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}