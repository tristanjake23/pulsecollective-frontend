import { useState } from "react";
import { secondary } from "./ui.jsx";
const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export default function AppointmentCalendar({ appointments }) {
  const [mode, setMode] = useState("week"),
    [anchor, setAnchor] = useState(dayKey(new Date()));
  const date = new Date(anchor + "T12:00:00");
  let days = [];
  if (mode === "month") {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    first.setDate(first.getDate() - first.getDay());
    days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return d;
    });
  } else {
    const first = new Date(date);
    if (mode === "week") first.setDate(first.getDate() - first.getDay());
    days = Array.from({ length: mode === "week" ? 7 : 1 }, (_, i) => {
      const d = new Date(first);
      d.setDate(first.getDate() + i);
      return d;
    });
  }
  function shift(n) {
    const d = new Date(date);
    if (mode === "month") {
      d.setDate(1);
      d.setMonth(d.getMonth() + n);
    } else d.setDate(d.getDate() + n * (mode === "week" ? 7 : 1));
    setAnchor(dayKey(d));
  }
  return (
    <section className="overflow-hidden rounded-2xl border bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 p-5">
        <h2 className="font-semibold">Appointment calendar</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className={secondary}
            aria-label="Previous period"
            onClick={() => shift(-1)}
          >
            ←
          </button>
          <input
            aria-label="Calendar date"
            type="date"
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
          />
          <button
            className={secondary}
            aria-label="Next period"
            onClick={() => shift(1)}
          >
            →
          </button>
          {["day", "week", "month"].map((m) => (
            <button
              key={m}
              className={secondary + (mode === m ? " bg-brand-50" : "")}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </header>
      <div className="overflow-x-auto">
        <div
          className={
            "grid " +
            (mode === "day" ? "grid-cols-1" : "min-w-[700px] grid-cols-7")
          }
        >
          {days.map((d) => (
            <div
              key={dayKey(d)}
              className={
                "min-h-28 border-t border-r p-3 " +
                (dayKey(d) === dayKey(new Date()) ? "bg-brand-50/60" : "")
              }
            >
              <p className="text-xs font-semibold">
                {d.toLocaleDateString("en-PH", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </p>
              {appointments
                .filter((a) => dayKey(new Date(a.starts_at)) === dayKey(d))
                .map((a) => (
                  <div
                    key={a.id}
                    className={
                      "mt-2 rounded-lg p-2 text-xs " +
                      (a.status === "cancelled"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-50 text-blue-900")
                    }
                  >
                    <b>{a.patient}</b>
                    <p className="mt-1">
                      {new Date(a.starts_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p>{a.status}</p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
