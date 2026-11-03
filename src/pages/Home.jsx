import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Stethoscope,
  HeartPulse,
  CalendarDays,
  ShieldCheck,
  Users,
  ClipboardList,
} from "lucide-react";
import { api } from "../api/client.js";
import DoctorCard from "../components/DoctorCard.jsx";
import { primary, secondary, Eyebrow, card } from "../components/ui.jsx";
export default function Home({ onNavigate }) {
  const [doctors, setDoctors] = useState([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/public/doctors", { publicRequest: true })
      .then((d) => {
        if (active) setDoctors(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  function search(e) {
    e.preventDefault();
    sessionStorage.setItem("pulse-doctor-query", query);
    onNavigate("doctors");
  }
  const online = doctors.filter((d) => d.online_now),
    specialties = [...new Set(doctors.map((d) => d.specialty))].slice(0, 6);
  return (
    <>
      <section className="home-hero overflow-hidden border-b border-brand-100 bg-[#eef6f3]">
        <div className="mx-auto grid max-w-7xl items-center lg:grid-cols-[1fr_1.08fr]">
          <div className="px-5 py-12 sm:px-8 lg:py-20 lg:pr-12">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[.15em] text-brand-800">
              <HeartPulse size={15} />
              Pulse Collective · Connected care
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[1.06] tracking-[-.045em] text-brand-900 sm:text-6xl xl:text-7xl">
              Book a visit
              <br />
              with your{" "}
              <span className="font-serif italic text-brand-600">doctor.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-slate-600">
              Browse doctors, check available schedules, and request an
              appointment with your clinic.
            </p>
            <form
              onSubmit={search}
              className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-brand-100 bg-white p-2 shadow-sm"
            >
              <Search size={20} className="ml-3 shrink-0 text-brand-600" />
              <input
                aria-label="Find a doctor by name or specialty"
                className="min-w-0 flex-1 bg-transparent p-2 text-sm outline-none"
                placeholder="Doctor's name or specialty"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
              />
              <button
                className={primary + " !px-4"}
                aria-label="Search doctors"
              >
                <ArrowRight size={19} />
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-brand-800">
              <a
                href="#doctors"
                className="inline-flex items-center gap-2 hover:underline"
              >
                Find a doctor <ArrowUpRight size={15} />
              </a>
              <a
                href="#login"
                className="inline-flex items-center gap-2 hover:underline"
              >
                Patient portal <ArrowUpRight size={15} />
              </a>
            </div>
          </div>
          <figure className="relative m-0 h-80 min-w-0 sm:h-[440px] lg:h-full lg:min-h-[620px]">
            <video
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  aria-label="Pulse Collective hospital video"
  className="h-full w-full object-cover object-center"
>
  <source
    src={`${import.meta.env.BASE_URL}videodrone.mp4`}
    type="video/mp4"
  />
  Your browser does not support video playback.
</video>
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/65 via-transparent to-transparent" />
            <figcaption className="absolute bottom-7 left-6 right-6 text-white sm:left-9">
              <span className="text-[10px] uppercase tracking-[.2em] text-white/75">
                People at the heart of care
              </span>
              <p className="mt-3 max-w-sm text-2xl font-medium leading-snug">
                A more connected experience,
                <br />
                every step of the way.
              </p>
            </figcaption>
          </figure>
        </div>
      </section>
      <section className="relative mx-auto grid max-w-7xl gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-3">
        {[
          [
            CalendarDays,
            "Plan your visit",
            "View available slots and send a request.",
            "#doctors",
          ],
          [
            HeartPulse,
            "Prepare for care",
            "Organize symptoms before speaking to a clinician.",
            "#triage",
          ],
          [
            ShieldCheck,
            "Access your portal",
            "A dedicated space for your role.",
            "#login",
          ],
        ].map(([Icon, title, desc, href]) => (
          <a
            key={title}
            href={href}
            className="group flex items-center gap-4 bg-white p-6 transition hover:bg-brand-50 sm:p-8"
          >
            <Icon className="shrink-0 text-brand-600" size={27} />
            <div>
              <h2 className="font-semibold text-brand-900">{title}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-500">{desc}</p>
            </div>
            <ArrowUpRight
              size={17}
              className="ml-auto shrink-0 text-brand-600 transition group-hover:-translate-y-1 group-hover:translate-x-1"
            />
          </a>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Your care team</Eyebrow>
            <h2 className="text-3xl font-semibold tracking-tight text-brand-900 sm:text-4xl">
              {online.length ? "Doctors online now" : "Find your next doctor."}
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">
              {online.length
                ? "These doctors are currently accepting immediate consultation requests."
                : "Explore clinic profiles and choose an available time for your visit."}
            </p>
          </div>
          <a
            href="#doctors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
          >
            View all doctors <ArrowRight size={17} />
          </a>
        </div>
        {loading ? (
          <p
            role="status"
            className="rounded-2xl bg-white p-8 text-sm text-slate-500"
          >
            Loading the doctor directory…
          </p>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm leading-7 text-amber-900"
          >
            The directory could not be loaded right now.{" "}
            <a href="#doctors" className="font-semibold underline">
              Try the doctor directory
            </a>
          </div>
        ) : (online.length ? online : doctors).length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {(online.length ? online : doctors).slice(0, 4).map((d) => (
              <DoctorCard
                key={d.id}
                doctor={d}
                onView={() => {
                  sessionStorage.setItem("pulse-doctor-query", d.full_name);
                  onNavigate("doctors");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">
            Doctor profiles will appear here when the clinic makes them
            available.
          </div>
        )}
      </section>
      {specialties.length > 0 && (
        <section className="border-y border-brand-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
            <Eyebrow>Explore by specialty</Eyebrow>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {specialties.map((s) => (
                <a
                  key={s}
                  href="#doctors"
                  onClick={() => sessionStorage.setItem("pulse-specialty", s)}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-6 font-medium text-brand-900 transition hover:border-brand-500 hover:bg-brand-50"
                >
                  <span className="flex items-center gap-3">
                    <Stethoscope size={22} className="text-brand-600" />
                    {s}
                  </span>
                  <ArrowUpRight size={18} />
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2">
        <div className="rounded-3xl bg-brand-900 p-8 text-white sm:p-10">
          <ClipboardList size={34} className="text-teal-200" />
          <h2 className="mt-8 text-3xl font-semibold leading-tight sm:text-4xl">
            A little preparation.
            <br />A clearer conversation.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-8 text-white/75">
            Our AI-assisted symptom intake helps organize what you are
            experiencing for a conversation with a healthcare professional.
          </p>
          <a
            href="#triage"
            className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-900"
          >
            Open symptom intake <ArrowRight size={17} />
          </a>
          <p className="mt-6 text-xs leading-6 text-white/60">
            This tool cannot diagnose or rule out an emergency. Seek immediate
            medical help for severe, sudden or worsening symptoms.
          </p>
        </div>
        <div>
          <Eyebrow>Appointments</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-brand-900">
            How to book
            <br />
            an appointment
          </h2>
          <ol className="mt-8 space-y-7">
            {[
              [
                "Choose your doctor",
                "Explore clinic details, specialties and consultation fees.",
              ],
              [
                "Send a visit request",
                "Sign in as a patient, complete your details and choose an available time.",
              ],
              [
                "Wait for confirmation",
                "Your clinic reviews the request. Follow its status in My appointments.",
              ],
            ].map(([title, desc], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-200 text-sm font-semibold text-brand-700">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
            <div>
              <Eyebrow>One connected system</Eyebrow>
              <h2 className="text-3xl font-semibold text-brand-900">
                Your role. Your portal.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-500">
              One secure sign-in opens the portal assigned to your account.
              Public registration creates patient accounts.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                Users,
                "Patient",
                "Your details, care team and appointment requests.",
              ],
              [
                CalendarDays,
                "Staff",
                "Patient coordination, scheduling and billing.",
              ],
              [
                Stethoscope,
                "Doctor",
                "Your availability, consultations and prescriptions.",
              ],
              [
                ShieldCheck,
                "Administrator",
                "Clinic records, doctor profiles and daily operations.",
              ],
            ].map(([Icon, title, text]) => (
              <a
                key={title}
                href={"#login?portal=" + title.toLowerCase()}
                className="group rounded-2xl border border-slate-200 p-6 transition hover:border-brand-500 hover:shadow-md"
              >
                <Icon size={25} className="text-brand-600" />
                <h3 className="mt-5 font-semibold">{title} portal</h3>
                <p className="mt-3 text-xs leading-7 text-slate-500">{text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-700">
                  Sign in <ArrowUpRight size={15} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
