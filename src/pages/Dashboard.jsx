import {
  Users,
  CalendarDays,
  FileHeart,
  Receipt,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { card, primary, secondary } from "../components/ui.jsx";
import { peso } from "../utils/format.js";
export default function Dashboard() {
  const {
    profile,
    patients,
    appointments,
    prescriptions,
    invoices,
    consultations,
    collected,
    outstanding,
    setTab,
    setModal,
  } = useWorkspace();
  const doctor = profile?.role === "doctor";
  const today = new Date().toDateString();
  const upcoming = appointments
    .filter((a) => ["scheduled", "confirmed"].includes(a.status))
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const stats = [
    [
      CalendarDays,
      "Visits today",
      appointments.filter(
        (a) =>
          new Date(a.starts_at).toDateString() === today &&
          a.status !== "cancelled",
      ).length,
      "Appointments",
    ],
    [Users, "Patients", patients.length, "Patients"],
    [
      FileHeart,
      doctor ? "Open consultations" : "Awaiting confirmation",
      doctor
        ? consultations.filter((c) => !c.completed_at).length
        : appointments.filter((a) => a.status === "scheduled").length,
      doctor ? "Consultations" : "Appointments",
    ],
    [
      Receipt,
      doctor ? "Prescriptions" : "Outstanding balance",
      doctor ? prescriptions.length : peso(outstanding),
      doctor ? "Prescriptions" : "Billing & invoices",
    ],
  ];
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-700">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Your day, at a glance.
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            {doctor
              ? "Your assigned patients, visit requests and clinical work."
              : "Coordinate patient care and keep the clinic day moving."}
          </p>
        </div>
        <button className={primary} onClick={() => setModal("patient")}>
          <Plus size={17} />
          Add patient
        </button>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([Icon, label, value, target]) => (
          <button
            key={label}
            className={
              card +
              " group p-6 text-left transition hover:-translate-y-1 hover:border-brand-500 motion-reduce:transform-none"
            }
            onClick={() => setTab(target)}
          >
            <Icon size={23} className="text-brand-600" />
            <p className="mt-5 text-sm text-slate-500">{label}</p>
            <strong className="mt-2 block text-3xl font-semibold">
              {value}
            </strong>
            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-700">
              View records <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className={card + " p-6"}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Upcoming visits</h2>
            <button
              className="text-xs font-semibold text-brand-700"
              onClick={() => setTab("Appointments")}
            >
              View schedule →
            </button>
          </div>
          {upcoming.length ? (
            <div className="mt-5 divide-y divide-slate-100">
              {upcoming.slice(0, 6).map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold">{a.patient}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-500">
                      {a.doctor} · {new Date(a.starts_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-3 py-1.5 text-xs " +
                      (a.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-amber-50 text-amber-900")
                    }
                  >
                    {a.status === "scheduled" ? "Requested" : "Confirmed"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <CalendarDays size={30} className="mx-auto text-brand-500" />
              <p className="mt-5 text-sm text-slate-500">
                No upcoming visits yet.
              </p>
              <button
                className={secondary + " mt-5"}
                onClick={() => setTab("Appointments")}
              >
                Manage appointments
              </button>
            </div>
          )}
        </section>
        <aside className="rounded-2xl bg-brand-900 p-7 text-white">
          <p className="text-xs uppercase tracking-widest text-teal-200">
            {doctor ? "Clinical work" : "Clinic operations"}
          </p>
          <h2 className="mt-5 text-2xl font-semibold">Keep care moving.</h2>
          <p className="mt-4 text-sm leading-7 text-white/70">
            {doctor
              ? "Review your assigned visits, record a consultation and prepare prescriptions in one place."
              : "Review new requests, prepare available doctor slots, and record payments received."}
          </p>
          {!doctor && (
            <dl className="mt-6 space-y-3 border-t border-white/20 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/60">Payments recorded</dt>
                <dd>{peso(collected)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/60">Invoices</dt>
                <dd>{invoices.length}</dd>
              </div>
            </dl>
          )}
          <button
            onClick={() => setTab(doctor ? "Consultations" : "Appointments")}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-900"
          >
            {doctor ? "Open consultations" : "Review appointments"}
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </>
  );
}
