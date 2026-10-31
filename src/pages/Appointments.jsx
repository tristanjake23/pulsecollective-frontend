import { useState } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { api } from "../api/client.js";
import {
  input,
  primary,
  secondary,
  card,
  Eyebrow,
} from "../components/ui.jsx";
import AppointmentCalendar from "../components/AppointmentCalendar.jsx";

function localDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
}

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return localDate(date);
}

export default function Appointments() {
  const {
    profile,
    patients,
    appointments,
    doctorRecords,
    schedules,
    setSchedules,
    reload,
  } = useWorkspace();

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [noticeFor, setNoticeFor] = useState("");
  const [busy, setBusy] = useState(false);
  const [slotDate, setSlotDate] = useState(tomorrow);
  const [slotTime, setSlotTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [selectedSlot, setSelectedSlot] = useState("");

  const start = new Date(`${slotDate}T${slotTime}`);
  const end = new Date(start.getTime() + Number(duration) * 60000);
  const validTime = Number.isFinite(start.getTime());

  const manageable = doctorRecords.filter(
    (doctor) =>
      !doctor.is_archived &&
      (profile?.role !== "doctor" || doctor.profile_id === profile.id),
  );

  const available = schedules.filter(
    (slot) =>
      slot.is_available &&
      new Date(slot.starts_at) > new Date() &&
      !appointments.some(
        (appointment) =>
          appointment.schedule_id === slot.id &&
          ["scheduled", "confirmed", "completed"].includes(
            appointment.status,
          ),
      ),
  );

  function notice(target) {
    if (noticeFor !== target || (!error && !message)) return null;

    return (
      <p
        role={error ? "alert" : "status"}
        className={
          "rounded-xl p-4 text-sm " +
          (error
            ? "bg-rose-50 text-rose-800"
            : "bg-emerald-50 text-emerald-800")
        }
      >
        {error || message}
      </p>
    );
  }

  async function submit(event, path, build) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    setNoticeFor(path);
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const result = await api(path, {
        method: "POST",
        body: build(new FormData(form)),
      });

      if (path === "/schedules") {
        setSchedules((rows) => [
          ...rows.filter((row) => row.id !== result.id),
          result,
        ]);
        setSelectedSlot(result.id);
        setMessage(
          "Available slot saved. You can now select it for a booking.",
        );
      } else {
        setMessage(
          "Appointment request saved. Confirm it below when accepted by the clinic.",
        );
        form.reset();
        setSelectedSlot("");
      }

      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(id, status = "cancelled") {
    const question =
      status === "confirmed"
        ? "Confirm this appointment?"
        : status === "no_show"
          ? "Mark this visit as no-show?"
          : "Cancel this appointment?";

    if (!confirm(question)) return;

    setNoticeFor("actions");
    setMessage("");
    setError("");
    setBusy(true);

    try {
      await api(`/appointments/${id}`, {
        method: "PATCH",
        body: { status },
      });
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div>
        <Eyebrow>Clinic schedule</Eyebrow>
        <h1 className="text-3xl font-semibold">Appointments</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add an available appointment time, then book a patient.
        </p>
      </div>

      {notice("actions")}

      <AppointmentCalendar appointments={appointments} />

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <form
          noValidate
          className={card + " space-y-4 p-6"}
          onSubmit={(event) =>
            submit(event, "/schedules", (data) => {
              if (!data.get("doctor")) {
                throw new Error("Choose a doctor first.");
              }

              if (!validTime || start <= new Date()) {
                throw new Error(
                  "Choose a future date and time. Your entries have been kept.",
                );
              }

              return {
                doctor_id: data.get("doctor"),
                starts_at: start.toISOString(),
                ends_at: end.toISOString(),
              };
            })
          }
        >
          <h2 className="font-semibold">
            1. Add an available appointment
          </h2>

          <label className="block text-sm">
            Doctor
            <select name="doctor" required className={input + " mt-2"}>
              {manageable.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.full_name}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              Date
              <input
                required
                type="date"
                name="date"
                min={localDate(new Date())}
                value={slotDate}
                onChange={(event) => setSlotDate(event.target.value)}
                className={input + " mt-2"}
              />
            </label>

            <label className="block text-sm">
              Start time (local)
              <input
                required
                type="time"
                name="time"
                value={slotTime}
                onChange={(event) => setSlotTime(event.target.value)}
                className={input + " mt-2"}
              />
            </label>
          </div>

          <label className="block text-sm">
            Visit length
            <select
              name="duration"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className={input + " mt-2"}
            >
              {[15, 30, 45, 60].map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} minutes
                </option>
              ))}
            </select>
          </label>

          {validTime && (
            <p className="text-sm text-slate-600">
              Ends at {end.toLocaleString()}. Times use your device timezone.
            </p>
          )}

          {notice("/schedules")}

          {!manageable.length && (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              Add a doctor profile or ask the administrator to link your
              account before creating slots.
            </p>
          )}

          <button
            disabled={busy || !manageable.length}
            className={primary}
          >
            {busy && noticeFor === "/schedules"
              ? "Saving…"
              : "Save available slot"}
          </button>
        </form>

        <form
          className={card + " space-y-4 p-6"}
          onSubmit={(event) =>
            submit(event, "/appointments", (data) => ({
              patient_id: data.get("patient"),
              schedule_id: data.get("slot"),
              reason: data.get("reason") || null,
            }))
          }
        >
          <h2 className="font-semibold">2. Book appointment</h2>

          <label className="block text-sm">
            Patient
            <select name="patient" required className={input + " mt-2"}>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Available slot
            <select
              name="slot"
              required
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
              className={input + " mt-2"}
            >
              <option value="">Choose available slot</option>
              {available.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {
                    doctorRecords.find(
                      (doctor) => doctor.id === slot.doctor_id,
                    )?.full_name
                  }
                  {" · "}
                  {new Date(slot.starts_at).toLocaleString()}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Reason
            <input
              name="reason"
              maxLength={2000}
              className={input + " mt-2"}
            />
          </label>

          {!available.length && (
            <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
              No available times yet. Save a future appointment time using
              the first form.
            </p>
          )}

          {notice("/appointments")}

          {!patients.length && (
            <p className="text-sm text-amber-900">
              Register a patient in Patients before booking.
            </p>
          )}

          <button
            disabled={busy || !available.length || !patients.length}
            className={primary}
          >
            Book appointment
          </button>
        </form>
      </div>

      <section className={card + " p-6"}>
        <h2 className="mb-4 font-semibold">Clinic appointments</h2>

        {appointments.length ? (
          appointments.map((appointment) => {
            const active = ["scheduled", "confirmed"].includes(
              appointment.status,
            );

            return (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 py-4"
              >
                <div>
                  <b className="text-sm">{appointment.patient}</b>
                  <p className="mt-1 text-xs text-slate-500">
                    {appointment.doctor}
                    {" · "}
                    {new Date(appointment.starts_at).toLocaleString()}
                    {" · "}
                    {appointment.status}
                  </p>
                </div>

                {appointment.status === "scheduled" && (
                  <button
                    disabled={busy}
                    className={primary}
                    onClick={() =>
                      changeStatus(appointment.id, "confirmed")
                    }
                  >
                    Confirm request
                  </button>
                )}

                {active &&
                  new Date(appointment.starts_at) < new Date() && (
                    <button
                      disabled={busy}
                      className={secondary}
                      onClick={() =>
                        changeStatus(appointment.id, "no_show")
                      }
                    >
                      Mark no-show
                    </button>
                  )}

                {active && (
                  <button
                    disabled={busy}
                    className={secondary}
                    onClick={() => changeStatus(appointment.id)}
                  >
                    Cancel appointment
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <p className="py-8 text-sm text-slate-400">
            No appointments saved yet.
          </p>
        )}
      </section>
    </>
  );
}