import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { patientServiceError } from "../utils/patient.js";
import { primary, secondary, card } from "./ui.jsx";
import Modal from "./Modal.jsx";
const statuses = { scheduled: "Awaiting confirmation", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", no_show: "Missed appointment" };
export default function MyAppointments() {
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState(""), [selected, setSelected] = useState(null);
  const mounted = useRef(false), locked = useRef(false), version = useRef(0);
  async function load(showLoading = false) {
    const current = ++version.current;
    if (showLoading) setLoading(true);
    try {
      const result = await api("/patient/appointments");
      if (!mounted.current || current !== version.current) return;
      setRows(result); setError("");
    } catch (err) {
      if (mounted.current && current === version.current) setError(patientServiceError(err));
    } finally {
      if (mounted.current && current === version.current) setLoading(false);
    }
  }
  useEffect(() => {
    mounted.current = true; void load();
    const timer = setInterval(() => { if (!locked.current) void load(); }, 60000);
    return () => { mounted.current = false; version.current++; clearInterval(timer); };
  }, []);
  async function refresh() {
    if (locked.current) return;
    locked.current = true; setMessage("");
    try { await load(true); } finally { locked.current = false; }
  }
  async function cancel() {
    if (!selected || locked.current) return;
    locked.current = true; version.current++;
    setBusy(selected.id); setError(""); setMessage("");
    try {
      await api(`/patient/appointments/${selected.id}/cancel`, { method: "POST" });
      if (!mounted.current) return;
      setRows(current => current.map(row => row.id === selected.id ? { ...row, status: "cancelled" } : row));
      setSelected(null); setMessage("Your appointment has been cancelled.");
      await load();
    } catch (err) {
      if (mounted.current) setError(patientServiceError(err));
    } finally {
      locked.current = false; if (mounted.current) setBusy("");
    }
  }
  return (
    <section id="my-appointments" className={card + " min-w-0 scroll-mt-5 p-5 sm:p-6"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="text-xl font-semibold">My appointments</h2><p className="mt-2 text-sm text-slate-500">Check your visit details and confirmation status.</p></div>
        <button type="button" className={secondary} disabled={loading || !!busy} onClick={refresh}>Refresh appointments</button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm text-emerald-800">{message}</p>}
      {loading ? <p role="status" className="py-8 text-sm">Loading appointments…</p> : !rows.length && !error ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-7 text-center"><p className="mb-4 text-sm text-slate-500">You have no appointments yet.</p><a href="#doctors" className={primary}>Book an appointment</a></div>
      ) : <div className="mt-5 divide-y divide-slate-100">{rows.map(a => {
        const starts = a.starts_at ? new Date(a.starts_at) : null;
        const validDate = starts && !Number.isNaN(starts.getTime());
        const canChange = ["scheduled", "confirmed"].includes(a.status) && validDate && starts > new Date();
        return <article key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="min-w-0 flex-1 basis-56 break-words">
            <span className={"inline-flex rounded-full px-3 py-1 text-xs font-semibold " + (a.status === "confirmed" ? "bg-emerald-50 text-emerald-800" : a.status === "cancelled" ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-600")}>{statuses[a.status] || "Appointment"}</span>
            <h3 className="mt-3 font-semibold">{a.doctor_name || "Doctor"}</h3>
            {a.specialty && <p className="mt-1 text-sm text-slate-500">{a.specialty}</p>}
            <p className="mt-1 text-sm text-slate-500">{validDate ? starts.toLocaleString() : "Time to be confirmed"}</p>
            <p className="mt-1 text-sm text-slate-500">{a.clinic_name || "Clinic"}{a.location ? ` · ${a.location}` : ""}</p>
            {a.reason && <p className="mt-2 whitespace-pre-wrap text-sm">Reason: {a.reason}</p>}
            {a.status === "scheduled" && <p className="mt-2 text-xs text-slate-500">The clinic has not confirmed this visit yet.</p>}
            {!canChange && ["scheduled", "confirmed"].includes(a.status) && <p className="mt-2 text-xs text-slate-500">Contact the clinic if you need to change this visit.</p>}
          </div>
          {canChange && <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-2">
            <a className={secondary + (busy ? " pointer-events-none opacity-50" : "")} aria-disabled={Boolean(busy)} href={`#booking?doctor=${a.doctor_id}&mode=scheduled&reschedule=${a.id}`}>Reschedule</a>
            <button type="button" className={secondary} disabled={!!busy} onClick={() => setSelected(a)}>Cancel appointment</button>
          </div>}
        </article>;
      })}</div>}
      {selected && <Modal title="Cancel this appointment?" onClose={() => { if (!busy) setSelected(null); }}><div className="space-y-5 p-6">
        <p className="text-sm leading-6">Cancel your visit with {selected.doctor_name || "this doctor"}? You can request another available time later.</p>
        {error && <p role="alert" className="text-sm text-rose-800">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" className={secondary} disabled={!!busy} onClick={() => setSelected(null)}>Keep appointment</button><button type="button" className={primary} disabled={!!busy} onClick={cancel}>{busy ? "Cancelling…" : "Confirm cancellation"}</button></div>
      </div></Modal>}
    </section>
  );
}
