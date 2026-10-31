import Modal from "../components/Modal.jsx";
import { useState } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { api } from "../api/client.js";
import { input, primary, secondary, card, Eyebrow } from "../components/ui.jsx";
export default function Consultations() {
  const { appointments, consultations, reload } = useWorkspace();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const eligible = appointments.filter(
    (a) =>
      ["scheduled", "confirmed"].includes(a.status) &&
      !consultations.some((c) => c.appointment_id === a.id),
  );
  const [editing, setEditing] = useState(null);
  async function edit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/consultations/" + editing.id, {
        method: "PUT",
        body: {
          diagnosis: editing.diagnosis || null,
          clinical_notes: editing.clinical_notes || null,
        },
      });
      setEditing(null);
      setMessage("Consultation notes updated.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget,
      d = new FormData(form);
    try {
      await api("/consultations", {
        method: "POST",
        body: {
          appointment_id: d.get("appointment"),
          clinical_notes: d.get("notes") || null,
          diagnosis: d.get("diagnosis") || null,
        },
      });
      setMessage(
        "Consultation saved. You can continue recording notes or complete the visit after it starts.",
      );
      form.reset();
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function complete(c) {
    if (!window.confirm("Complete this visit and lock its clinical notes?"))
      return;
    setError("");
    setBusy(true);
    try {
      await api("/consultations/" + c.id + "/complete", {
        method: "POST",
        body: { diagnosis: c.diagnosis, clinical_notes: c.clinical_notes },
      });
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div>
        <Eyebrow>Clinical care</Eyebrow>
        <h1 className="text-3xl font-semibold">Consultations</h1>
        <p className="mt-2 text-sm text-slate-500">
          Appointment → consultation → prescription. Complete a visit to update
          the patient's last visit.
        </p>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {message}
        </p>
      )}
      <form onSubmit={create} className={card + " space-y-4 p-6"}>
        <h2 className="font-semibold">Start consultation</h2>
        <label className="block text-sm">
          Appointment
          <select required name="appointment" className={input + " mt-2"}>
            <option value="">Choose appointment</option>
            {appointments
              .filter(
                (a) =>
                  ["scheduled", "confirmed"].includes(a.status) &&
                  !consultations.some((c) => c.appointment_id === a.id),
              )
              .map((a) => (
                <option value={a.id} key={a.id}>
                  {a.patient} · {a.doctor} · {a.date}
                </option>
              ))}
          </select>
        </label>
        <label className="block text-sm">
          Clinical notes
          <textarea
            maxLength={10000}
            name="notes"
            className={input + " mt-2 min-h-24"}
          />
        </label>
        <label className="block text-sm">
          Diagnosis / clinician assessment
          <input
            maxLength={2000}
            name="diagnosis"
            className={input + " mt-2"}
          />
        </label>
        {!eligible.length && (
          <p
            role="status"
            className="rounded-xl bg-brand-50 p-4 text-sm leading-7 text-brand-900"
          >
            There are no appointments ready to start a consultation. Book a
            visit in Appointments first. Visits with an existing consultation
            appear in the records below.
          </p>
        )}
        <button disabled={busy || !eligible.length} className={primary}>
          Save consultation
        </button>
      </form>
      <section className={card + " p-6"}>
        <h2 className="mb-4 font-semibold">Consultation records</h2>
        {!consultations.length && (
          <p className="py-6 text-sm text-slate-500">
            No consultations recorded yet.
          </p>
        )}
        {consultations.map((c) => (
          <article key={c.id} className="border-t border-slate-100 py-5">
            <h3 className="font-semibold">
              {c.patient_name} · {c.doctor_name}
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-500">
              {c.clinical_notes || "No clinical notes"}
            </p>
            <p className="mt-2 text-sm">
              {c.diagnosis || "Assessment not entered"}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {c.completed_at
                ? "Completed " + new Date(c.completed_at).toLocaleString()
                : "Open consultation"}
            </p>
            {!c.completed_at && (
              <button
                className={secondary + " mt-4 mr-3"}
                disabled={busy}
                onClick={() => setEditing({ ...c })}
              >
                Edit notes
              </button>
            )}
            {!c.completed_at && (
              <button
                disabled={busy}
                onClick={() => complete(c)}
                className={secondary + " mt-4"}
              >
                Complete visit
              </button>
            )}
          </article>
        ))}
      </section>
      {editing && (
        <Modal
          title="Edit consultation notes"
          onClose={() => {
            if (!busy) setEditing(null);
          }}
        >
          <form onSubmit={edit} className="space-y-5 p-6">
            <label className="block text-sm">
              Clinical notes
              <textarea
                className={input + " mt-2 min-h-40"}
                value={editing.clinical_notes || ""}
                maxLength={10000}
                onChange={(e) =>
                  setEditing({ ...editing, clinical_notes: e.target.value })
                }
              />
            </label>
            <label className="block text-sm">
              Diagnosis / clinician assessment
              <input
                className={input + " mt-2"}
                value={editing.diagnosis || ""}
                maxLength={2000}
                onChange={(e) =>
                  setEditing({ ...editing, diagnosis: e.target.value })
                }
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <button className={primary} disabled={busy}>
              {busy ? "Saving…" : "Save notes"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
