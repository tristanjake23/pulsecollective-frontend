import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { api } from "../api/client.js";
import { primary, secondary, input } from "./ui.jsx";

export default function TriageNotifications({ role }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("active");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState({ reports: [], new_count: 0, warning_count: 0 });
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [updated, setUpdated] = useState(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  const sequence = useRef(0);
  const locked = useRef(false);
  const canReview = ["clinic_admin", "doctor"].includes(role);
  const load = useCallback(async () => {
    const current = ++sequence.current;
    try {
      const result = await api(`/intake-reports?status=${status}&offset=${offset}`);
      if (!active.current || current !== sequence.current) return;
      setData(result); setLoaded(true); setUpdated(new Date()); setError("");
    } catch (err) {
      if (active.current && current === sequence.current) setError(err.message);
    }
  }, [status, offset]);
  useEffect(() => {
    active.current = true;
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, 15000);
    const visible = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", visible);
    return () => { active.current = false; ++sequence.current; clearInterval(timer); document.removeEventListener("visibilitychange", visible); };
  }, [load]);
  async function change(id, next) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try {
      await api(`/intake-reports/${id}`, { method: "PATCH", body: { status: next } });
      await load();
    } catch (err) { if (active.current) setError(err.message); }
    finally { locked.current = false; if (active.current) setBusy(false); }
  }
  return (
    <div className="print:hidden">
      <button type="button" aria-label="Intake notifications" aria-expanded={open}
        onClick={() => setOpen((value) => !value)} className="relative flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold">
        <Bell size={19} /> Intake reports
        {data.new_count > 0 && <span className={(data.warning_count ? "bg-rose-600" : "bg-amber-600") + " rounded-full px-2 py-0.5 text-xs text-white"}>{data.new_count}</span>}
        {error && <span className="text-rose-700" aria-label="Notifications unavailable">!</span>}
      </button>
      <span role="status" className="sr-only">{error ? "Intake notifications could not refresh." : `${data.new_count} reports awaiting acknowledgment. ${data.warning_count} include reported warning signs.`}</span>
      {open && createPortal(
        <section aria-label="Clinic intake reports" className="print:hidden fixed right-3 top-24 z-[65] max-h-[80dvh] w-[calc(100vw-1.5rem)] max-w-xl space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:right-8">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Clinic intake reports</h2><button type="button" aria-label="Close intake reports" onClick={() => setOpen(false)}><X /></button></div>
          <p className="text-xs leading-5 text-slate-500">Includes administrator, staff and the assigned doctor in this clinic. Refreshes every 15 seconds while this tab is visible. This is not a continuously monitored emergency service.</p>
          <div className="flex gap-2"><label className="min-w-0 flex-1 text-sm">Show
            <select value={status} onChange={(e) => { setStatus(e.target.value); setOffset(0); }} className={input + " mt-1"}>
              <option value="active">New and acknowledged</option><option value="reviewed">Reviewed</option><option value="all">All reports</option>
            </select></label><button type="button" onClick={load} className={secondary}>Refresh</button></div>
          {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Could not refresh reports: {error}. Displayed reports may be out of date.</p>}
          {updated && <p className="text-xs text-slate-500">Last updated: {updated.toLocaleTimeString()}</p>}
          {!loaded && !error && <p role="status">Loading reports…</p>}
          {loaded && !data.reports.length && <p className="rounded-xl bg-slate-50 p-4 text-sm">No reports in this view.</p>}
          {data.reports.map((report) => (
            <article key={report.id} className={"space-y-3 rounded-xl border p-4 " + (report.has_warning_signs ? "border-rose-300 bg-rose-50/50" : "border-slate-200")}>
              <p className={"text-sm font-bold " + (report.has_warning_signs ? "text-rose-800" : "text-brand-800")}>{report.has_warning_signs ? "Emergency warning signs reported — needs immediate review" : "Symptom report for clinical review"}</p>
              <p className="text-sm font-semibold">{report.patient_name || "Patient"} · {report.workflow_status}</p>
              <p className="text-xs text-slate-600">Submitted {new Date(report.created_at).toLocaleString()} · Doctor: {report.doctor_name}</p>
              {report.patient_phone && <p className="text-sm">Contact supplied by patient: {report.patient_phone}</p>}
              <p className="text-xs text-slate-600">Duration: {report.duration} · Pain reported: {report.pain_score ?? "Not supplied"} · {report.progression}</p>
              {report.red_flags?.length > 0 && <p className="text-sm text-rose-800">Reported warning signs: {report.red_flags.join(", ")}</p>}
              <details><summary className="cursor-pointer text-sm font-semibold">Original symptoms</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{report.symptoms}</p></details>
              <p className="text-xs font-semibold uppercase text-slate-500">Patient-reviewed summary — not a diagnosis</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-6">{report.report_summary}</p>
              {report.acknowledged_at && <p className="text-xs text-slate-600">Acknowledged by {report.acknowledged_name} · {new Date(report.acknowledged_at).toLocaleString()}</p>}
              {report.reviewed_at && <p className="text-xs text-slate-600">Reviewed by {report.reviewer_name} · {new Date(report.reviewed_at).toLocaleString()}</p>}
              {report.workflow_status === "new" && <button type="button" disabled={busy} className={primary} onClick={() => change(report.id, "acknowledged")}>Acknowledge report</button>}
              {report.workflow_status === "acknowledged" && canReview && <button type="button" disabled={busy} className={primary} onClick={() => change(report.id, "reviewed")}>Mark reviewed after clinical review</button>}
            </article>
          ))}
          <div className="flex justify-between gap-2"><button type="button" className={secondary} disabled={!offset} onClick={() => setOffset((value) => Math.max(0, value - 20))}>Previous</button><button type="button" className={secondary} disabled={data.reports.length < 20} onClick={() => setOffset((value) => value + 20)}>Next</button></div>
        </section>, document.body
      )}
    </div>
  );
}
