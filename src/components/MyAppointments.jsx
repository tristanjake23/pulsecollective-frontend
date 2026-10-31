import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { primary, secondary, card } from "./ui.jsx";
export default function MyAppointments() {
  const [rows, setRows] = useState([]),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function load() {
    try {
      setRows(await api("/patient/appointments"));
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);
  async function cancel(a) {
    if (!confirm("Cancel this appointment request?")) return;
    setBusy(a.id);
    setError("");
    try {
      await api("/patient/appointments/" + a.id + "/cancel", {
        method: "POST",
      });
      setMessage("Appointment cancelled.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className={card + " p-6"}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">My appointments</h2>
          <p className="mt-2 text-sm text-slate-500">
            Requested visits become confirmed after the clinic accepts them.
          </p>
        </div>
        <button
          className={secondary}
          disabled={loading || !!busy}
          onClick={load}
        >
          Refresh
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="mt-4 text-sm text-emerald-800">
          {message}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-8 text-sm">
          Loading appointments…
        </p>
      ) : !rows.length ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-200 p-7 text-center">
          <p className="mb-4 text-sm text-slate-500">
            Your appointment requests will appear here.
          </p>
          <a href="#doctors" className={primary}>
            Find a doctor
          </a>
        </div>
      ) : (
        <div className="mt-5 divide-y divide-slate-100">
          {rows.map((a) => (
            <article
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-4 py-5"
            >
              <div>
                <span
                  className={
                    "rounded-full px-3 py-1 text-xs font-semibold " +
                    (a.status === "confirmed"
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-slate-100 text-slate-600")
                  }
                >
                  {a.status === "scheduled"
                    ? "Awaiting confirmation"
                    : a.status.replaceAll("_", " ")}
                </span>
                <h3 className="mt-3 font-semibold">{a.doctor_name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {new Date(a.starts_at).toLocaleString()} · {a.clinic_name}
                </p>
              </div>
              {["scheduled", "confirmed"].includes(a.status) &&
                new Date(a.starts_at) > new Date() && (
                  <div className="flex flex-wrap gap-2">
                    <a
                      className={secondary}
                      href={
                        "#booking?doctor=" +
                        a.doctor_id +
                        "&mode=scheduled&reschedule=" +
                        a.id
                      }
                    >
                      Reschedule
                    </a>
                    <button
                      className={secondary}
                      disabled={!!busy}
                      onClick={() => cancel(a)}
                    >
                      {busy === a.id ? "Cancelling…" : "Cancel request"}
                    </button>
                  </div>
                )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
