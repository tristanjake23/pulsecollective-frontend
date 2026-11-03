import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { DoctorPortrait, OnlineStatus } from "../components/DoctorCard.jsx";
import { Brand, input, primary, secondary, card } from "../components/ui.jsx";
import RoleBadge from "../components/RoleBadge.jsx";
import { today } from "../utils/format.js";
import { birthDateError, minimumBirthDate, phoneError, patientServiceError } from "../utils/patient.js";
export default function BookingPage({ profile }) {
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const doctorId = params.get("doctor"),
    reschedule = params.get("reschedule");
  const [mode, setMode] = useState(
      params.get("mode") === "now" ? "now" : "scheduled",
    ),
    [doctor, setDoctor] = useState(null),
    [slots, setSlots] = useState([]),
    [details, setDetails] = useState({
      contact_email: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      date_of_birth: "",
      sex: "",
      phone: "",
      address: "",
    }),
    [slot, setSlot] = useState(""),
    [reason, setReason] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [doctors, all, own] = await Promise.all([
          api("/public/doctors", { publicRequest: true }),
          api("/public/schedules", { publicRequest: true }),
          profile?.role === "patient"
            ? api("/patient/profile")
            : Promise.resolve(null),
        ]);
        if (!active) return;
        const d = doctors.find((d) => d.id === doctorId);
        if (!d)
          throw Error(
            "This doctor is no longer available in the directory. Choose another doctor.",
          );
        setDoctor(d);
        setSlots(all.filter((s) => s.doctor_id === doctorId));
        if (own)
          setDetails(
            Object.fromEntries(
              Object.keys(details).map((k) => [k, own[k] || ""]),
            ),
          );
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [doctorId, profile?.id]);
  function field(k, v) {
    setDetails((d) => ({ ...d, [k]: v }));
  }
  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!doctor || profile?.role !== "patient") throw new Error("Sign in with a patient account to book a visit.");
      const invalid = birthDateError(details.date_of_birth, true) || phoneError(details.phone, true);
      if (invalid) throw new Error(invalid);
      if (!details.first_name.trim() || !details.last_name.trim()) throw new Error("Enter your first and last name.");
      if (!details.address.trim()) throw new Error("Enter your address.");
      if (mode === "scheduled" && !slot) throw new Error("Choose an available time.");
      if (reason.trim().length < 2) throw new Error("Enter a reason for your visit.");
      await api("/patient/profile", {
        method: "PUT",
        body: {
          ...details,
          full_name: [
            details.first_name,
            details.middle_name,
            details.last_name,
          ]
            .filter(Boolean)
            .join(" "),
        },
      });
      const result = await api(
        "/patient/appointments" +
          (reschedule ? "/" + reschedule + "/reschedule" : ""),
        {
          method: "POST",
          body: {
            doctor_id: doctor.id,
            mode,
            schedule_id: mode === "scheduled" ? slot : null,
            reason: reason.trim(),
          },
        },
      );
      setSuccess(result);
    } catch (e) {
      setError(patientServiceError(e));
      if (/booked|overlap|conflict|available/i.test(e.message)) {
        try {
          setSlots(
            (await api("/public/schedules", { publicRequest: true })).filter(
              (s) => s.doctor_id === doctorId,
            ),
          );
          setSlot("");
        } catch {}
      }
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <p role="status" className="mx-auto max-w-6xl p-10">
        Loading appointment details…
      </p>
    );
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <a href="#doctors" className="text-sm font-semibold text-brand-700">
        ← Back to doctors
      </a>
      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[300px_1fr]">
        {doctor && (
          <aside className={card + " p-7 lg:sticky lg:top-28"}>
            <DoctorPortrait doctor={doctor} className="h-28 w-28" />
            <h1 className="mt-5 text-2xl font-semibold">{doctor.full_name}</h1>
            <p className="mt-2 text-brand-700">{doctor.specialty}</p>
            <p className="mt-4 text-sm text-slate-500">
              {doctor.clinic_name} · {doctor.location}
            </p>
            <p className="my-5 font-semibold">
              ₱{Number(doctor.consultation_fee).toFixed(2)} consultation fee
            </p>
            <OnlineStatus online={doctor.online_now} />
            <p className="mt-5 text-xs leading-6 text-slate-500">
              Submitting a request does not start a video call or confirm a
              visit. The clinic must accept your request and contact you about
              the consultation.
            </p>
          </aside>
        )}
        <section className={card + " p-6 sm:p-8"}>
          {error && (
            <p
              role="alert"
              className="mb-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
            >
              {error}
            </p>
          )}
          {success ? (
            <div role="status" className="space-y-5 py-8">
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
                Request submitted
              </span>
              <h2 className="pt-4 text-3xl font-semibold">
                Your appointment request was sent.
              </h2>
              <p className="text-sm leading-7 text-slate-500">
                Your request for {success.doctor_name} is awaiting clinic
                confirmation. Check My appointments for its status.
              </p>
              <a href="#portal" className={primary}>
                View my appointments
              </a>
            </div>
          ) : profile?.role !== "patient" ? (
            <div className="space-y-5">
              <h2 className="text-2xl font-semibold">
                Continue with a patient account
              </h2>
              <p className="text-sm leading-7 text-slate-500">
                Sign in or create your own patient account to request this
                visit. Staff and doctor accounts manage clinic visits in their
                portal.
              </p>
              <a
                href="#login"
                className={primary}
                onClick={() =>
                  sessionStorage.setItem(
                    "pulse-booking-return",
                    window.location.hash.slice(1),
                  )
                }
              >
                Sign in / Create account
              </a>
              {profile && (
                <a href="#portal" className={secondary}>
                  Open my portal
                </a>
              )}
            </div>
          ) : (
            doctor && (
              <form onSubmit={submit} className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold">
                      {reschedule
                        ? "Reschedule appointment"
                        : "Patient details"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Your information will be saved to your account for this
                      request.
                    </p>
                  </div>
                  <RoleBadge role="patient" />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    ["first_name", "First name", "given-name"],
                    [
                      "middle_name",
                      "Middle name (optional)",
                      "additional-name",
                    ],
                    ["last_name", "Last name", "family-name"],
                    ["date_of_birth", "Date of birth", "bday"],
                    ["phone", "Mobile number", "tel"],
                    ["contact_email", "Email (optional)", "email"],
                  ].map(([k, l, a]) => (
                    <label key={k} className="block text-sm font-medium">
                      {l}
                      <input
                        className={input + " mt-2"}
                        required={!["middle_name", "contact_email"].includes(k)}
                        autoComplete={a}
                        type={
                          k === "date_of_birth"
                            ? "date"
                            : k === "contact_email"
                              ? "email"
                              : k === "phone"
                                ? "tel"
                                : "text"
                        }
                        max={
                          k === "date_of_birth"
                            ? today()
                            : undefined
                        }
                        min={k === "date_of_birth" ? minimumBirthDate() : undefined}
                        maxLength={
                          k === "contact_email" ? 254 : k === "phone" ? 30 : 60
                        }
                        value={details[k]}
                        onChange={(e) => field(k, e.target.value)}
                        disabled={busy}
                      />
                    </label>
                  ))}
                  <label className="block text-sm font-medium">
                    Sex
                    <select
                      required
                      className={input + " mt-2"}
                      value={details.sex}
                      onChange={(e) => field("sex", e.target.value)}
                      disabled={busy}
                    >
                      <option value="">Choose</option>
                      {[
                        ["female", "Female"],
                        ["male", "Male"],
                        ["other", "Other"],
                        ["prefer_not_to_say", "Prefer not to say"],
                      ].map(([v, l]) => (
                        <option value={v} key={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-sm font-medium">
                  Address
                  <textarea
                    required
                    maxLength={500}
                    autoComplete="street-address"
                    className={input + " mt-2"}
                    value={details.address}
                    onChange={(e) => field("address", e.target.value)}
                    disabled={busy}
                  />
                </label>
                <fieldset className="space-y-3 border-t border-slate-100 pt-5">
                  <legend className="pt-5 font-semibold">
                    Appointment request
                  </legend>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="mode"
                        checked={mode === "scheduled"}
                        onChange={() => setMode("scheduled")}
                      />
                      Choose a time
                    </label>
                    {doctor.online_now && (
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="mode"
                          checked={mode === "now"}
                          onChange={() => setMode("now")}
                        />
                        Request immediate consultation
                      </label>
                    )}
                  </div>
                  {mode === "scheduled" ? (
                    <>
                      <label className="block text-sm">
                        Available time (your local time)
                        <select
                          required
                          className={input + " mt-2"}
                          value={slot}
                          onChange={(e) => setSlot(e.target.value)}
                          disabled={busy}
                        >
                          <option value="">Choose a time</option>
                          {slots.map((s) => (
                            <option key={s.id} value={s.id}>
                              {new Date(s.starts_at).toLocaleString()} –{" "}
                              {new Date(s.ends_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </option>
                          ))}
                        </select>
                      </label>
                      {!slots.length && (
                        <p
                          role="status"
                          className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"
                        >
                          No future slots are available. Check again later or
                          contact the clinic for its schedule.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="rounded-xl bg-brand-50 p-4 text-sm leading-6">
                      The doctor is accepting immediate requests. Availability
                      can change before submission. Please wait for the clinic
                      to confirm your visit.
                    </p>
                  )}
                  <label className="block text-sm">
                    Reason for visit
                    <textarea
                      required
                      minLength={2}
                      maxLength={2000}
                      className={input + " mt-2 min-h-24"}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      disabled={busy}
                    />
                  </label>
                </fieldset>
                <p className="text-xs leading-6 text-slate-500">
                  For severe or urgent symptoms, seek emergency care. Do not
                  wait for an appointment request.
                </p>
                <button
                  className={primary}
                  disabled={
                    busy ||
                    (mode === "scheduled" && !slot) ||
                    (mode === "now" && !doctor.online_now)
                  }
                >
                  {busy
                    ? "Submitting request…"
                    : reschedule
                      ? "Request new time"
                      : "Submit appointment request"}
                </button>
              </form>
            )
          )}
        </section>
      </div>
    </main>
  );
}
