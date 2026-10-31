import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import DoctorCard, {
  DoctorPortrait,
  OnlineStatus,
  bookingLink,
} from "../components/DoctorCard.jsx";
import Modal from "../components/Modal.jsx";
import { input, primary, secondary, Eyebrow } from "../components/ui.jsx";
export default function Doctors() {
  const [doctors, setDoctors] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [q, setQ] = useState(() => {
      const q = sessionStorage.getItem("pulse-doctor-query") || "";
      return q;
    }),
    [specialty, setSpecialty] = useState(
      () => sessionStorage.getItem("pulse-specialty") || "",
    ),
    [selected, setSelected] = useState(null);
  async function load() {
    setError("");
    try {
      setDoctors(await api("/public/doctors", { publicRequest: true }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    sessionStorage.removeItem("pulse-doctor-query");
    load();
    const timer = setInterval(load, 60000);
    return () => clearInterval(timer);
  }, []);
  const visible = doctors.filter(
    (d) =>
      (!specialty || d.specialty === specialty) &&
      [d.full_name, d.specialty, d.location]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <header className="rounded-3xl bg-brand-900 p-7 text-white sm:p-10">
        <p className="text-xs uppercase tracking-[.2em] text-teal-200">
          Find your care team
        </p>
        <h1 className="mt-4 text-4xl font-semibold">
          A doctor for your next step.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
          Explore doctor profiles, view consultation fees and request an
          appointment. Online status means the doctor is currently accepting
          immediate requests.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_230px]">
          <input
            aria-label="Search doctors"
            className={input + " bg-white"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, specialty or location"
          />
          <select
            aria-label="Specialty"
            className={input + " bg-white"}
            value={specialty}
            onChange={(e) => {
              setSpecialty(e.target.value);
              sessionStorage.removeItem("pulse-specialty");
            }}
          >
            <option value="">All specialties</option>
            {[...new Set(doctors.map((d) => d.specialty))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </header>
      {error && (
        <p
          role="alert"
          className="my-6 rounded-xl bg-rose-50 p-5 text-rose-800"
        >
          {error}{" "}
          <button onClick={load} className="underline">
            Retry
          </button>
        </p>
      )}
      {loading ? (
        <div role="status" className="grid gap-6 py-8 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-slate-200 motion-reduce:animate-none"
            />
          ))}
          <span className="sr-only">Loading doctors</span>
        </div>
      ) : (
        <>
          <div className="flex gap-5 py-6 text-sm text-slate-500">
            <span>{visible.length} profiles</span>
            <button
              onClick={() => {
                setQ("");
                setSpecialty("");
                sessionStorage.removeItem("pulse-specialty");
              }}
              className="text-brand-700 underline"
            >
              Clear filters
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {visible.map((d) => (
              <DoctorCard key={d.id} doctor={d} onView={setSelected} />
            ))}
          </div>
          {!visible.length && !error && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              No matching doctors are available in the directory. Try another
              search or check again later.
            </p>
          )}
        </>
      )}
      {selected && (
        <Modal title={selected.full_name} onClose={() => setSelected(null)}>
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-5">
              <DoctorPortrait doctor={selected} />
              <div>
                <OnlineStatus online={selected.online_now} />
                <p className="mt-2 font-semibold text-brand-700">
                  {selected.specialty}
                </p>
              </div>
            </div>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Clinic</dt>
                <dd className="mt-1">
                  {selected.clinic_name || "Not provided"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Location</dt>
                <dd className="mt-1">
                  {selected.location || "Confirm with the clinic"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Schedule</dt>
                <dd className="mt-1">
                  {selected.schedule ||
                    "Choose from available appointment slots"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Consultation fee</dt>
                <dd className="mt-1 font-semibold">
                  ₱{Number(selected.consultation_fee).toFixed(2)}
                </dd>
              </div>
            </dl>
            <p className="rounded-xl bg-brand-50 p-4 text-sm leading-6">
              Submit a visit request using your patient account. Your
              appointment is confirmed once the clinic accepts it.
            </p>
            <a href={bookingLink(selected)} className={primary}>
              {selected.online_now ? "Consult now" : "Book appointment"}
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
