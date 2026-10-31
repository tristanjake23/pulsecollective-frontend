import { useEffect, useRef, useState } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { api } from "../api/client.js";
import { secondary } from "./ui.jsx";
export default function DoctorAvailability() {
  const { profile, doctorRecords } = useWorkspace();
  const doctor = doctorRecords.find((d) => d.profile_id === profile?.id);
  const [online, setOnline] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const active = useRef(false);
  useEffect(() => {
    active.current = online;
    if (!online || !doctor) return;
    let stopped = false;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        api("/doctors/" + doctor.id + "/availability", {
          method: "POST",
          body: { available: true },
        }).catch((e) => {
          if (!stopped) {
            setOnline(false);
            setError(e.message);
          }
        });
    }, 60000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [online, doctor?.id]);
  if (profile?.role !== "doctor") return null;
  async function toggle() {
    setBusy(true);
    setError("");
    try {
      await api("/doctors/" + doctor.id + "/availability", {
        method: "POST",
        body: { available: !online },
      });
      setOnline(!online);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-100 bg-white p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span
            className={
              "h-2 w-2 rounded-full " +
              (online ? "bg-emerald-500" : "bg-slate-300")
            }
          />
          {online
            ? "Online · accepting consultation requests"
            : "Not accepting immediate requests"}
        </h2>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          {doctor
            ? "Keep this portal open while available. Requests still need your confirmation."
            : "Ask your administrator to link your doctor profile to this account."}
        </p>
        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>
      <button className={secondary} disabled={!doctor || busy} onClick={toggle}>
        {busy ? "Updating…" : online ? "Go offline" : "Go online"}
      </button>
    </section>
  );
}
