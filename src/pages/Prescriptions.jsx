import { useState } from "react";
import {
  FileHeart,
  Plus,
  Search,
  Trash2,
  Printer,
  CheckCircle2,
  Pill,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { today } from "../utils/format.js";
import {
  primary,
  secondary,
  input,
  card,
  Eyebrow,
  Brand,
} from "../components/ui.jsx";
import Modal from "../components/Modal.jsx";
const emptyItem = () => ({
  name: "",
  strength: "",
  dose: "",
  route: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
});
export default function Prescriptions() {
  const {
    patients,
    prescriptions,
    profile,
    consultations,
    createPrescription,
  } = useWorkspace();
  const [consultationId, setConsultationId] = useState(""),
    [saving, setSaving] = useState(false);
  const [query, setQuery] = useState(""),
    [editing, setEditing] = useState(false),
    [preview, setPreview] = useState(null),
    [error, setError] = useState("");
  const [patientId, setPatientId] = useState(""),
    [doctor, setDoctor] = useState(""),
    [date, setDate] = useState(today()),
    [notes, setNotes] = useState(""),
    [items, setItems] = useState([emptyItem()]);
  function start() {
    setConsultationId("");
    setPatientId(patients[0]?.id || "");
    setDoctor("");
    setDate(today());
    setNotes("");
    setItems([emptyItem()]);
    setError("");
    setEditing(true);
  }
  function update(i, key, value) {
    setItems((rows) =>
      rows.map((row, index) => (index === i ? { ...row, [key]: value } : row)),
    );
  }
  async function save(e) {
    e.preventDefault();
    const patient = patients.find((p) => p.id === patientId);
    if (
      !patient ||
      items.some(
        (i) =>
          !i.name.trim() ||
          !i.dose.trim() ||
          !i.route.trim() ||
          !i.frequency.trim() ||
          !i.duration.trim(),
      )
    ) {
      setError("Choose a patient and complete the required medication fields.");
      return;
    }
    if (!consultationId) {
      setError(
        "Select a consultation for this patient. Create one in Consultations first.",
      );
      return;
    }
    setSaving(true);
    try {
      const saved = await createPrescription({
        consultation_id: consultationId,
        instructions: notes || null,
        items: items.map((i) => ({
          medication_name: i.name,
          strength: i.strength || null,
          dose: i.dose,
          route: i.route,
          frequency: i.frequency,
          duration: i.duration,
          quantity: i.quantity ? Number(i.quantity) : null,
          instructions: i.instructions || null,
        })),
      });
      setEditing(false);
      setPreview(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  const visible = prescriptions.filter((r) =>
    `${r.patient} ${r.doctor} ${r.date}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Eyebrow>Clinical workspace</Eyebrow>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Prescriptions
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, view, and print prescriptions in one place.
          </p>
        </div>
        <button
          disabled={!["doctor", "clinic_admin"].includes(profile?.role)}
          onClick={start}
          className={primary}
        >
          <Plus size={17} />
          New prescription
        </button>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          [FileHeart, "Total prescriptions", prescriptions.length],
          [
            Pill,
            "Medication entries",
            prescriptions.reduce((s, r) => s + r.items.length, 0),
          ],
          [
            CheckCircle2,
            "Patients with prescriptions",
            new Set(prescriptions.map((r) => r.patientId)).size,
          ],
        ].map(([Icon, title, value]) => (
          <div className={card + " flex items-center gap-4 p-5"} key={title}>
            <span className="rounded-xl bg-violet-50 p-3 text-violet-600">
              <Icon size={23} />
            </span>
            <div>
              <p className="text-xs text-slate-500">{title}</p>
              <strong className="mt-1 block text-2xl">{value}</strong>
            </div>
          </div>
        ))}
      </section>
      <section className={card + " overflow-hidden"}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <h2 className="font-semibold">Prescriptions</h2>
          <label className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              aria-label="Search prescriptions"
              className={input + " max-w-xs py-2.5 pl-10"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, doctor or date"
            />
          </label>
        </div>
        {visible.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  {[
                    "Prescription",
                    "Patient",
                    "Date",
                    "Medications",
                    "Status",
                    "",
                  ].map((t, i) => (
                    <th className="px-5 py-4 font-medium" key={i}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 hover:bg-violet-50/30"
                  >
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setPreview(r)}
                        className="max-w-44 truncate font-semibold text-brand-700 underline-offset-4 hover:underline"
                      >
                        View prescription
                      </button>
                    </td>
                    <td className="px-5 py-4">{r.patient}</td>
                    <td className="px-5 py-4 text-slate-500">{r.date}</td>
                    <td className="px-5 py-4">{r.items.length}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                        Prescription
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setPreview(r)}
                        aria-label={"View prescription for " + r.patient}
                        className="rounded-lg p-2 hover:bg-white"
                      >
                        <ArrowUpRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="mb-5 rounded-2xl bg-violet-50 p-5 text-violet-500">
              <FileHeart size={32} />
            </span>
            <h3 className="text-lg font-semibold">
              {query
                ? "No matching prescriptions"
                : "Your next prescription starts here"}
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
              {query
                ? "Try another patient name or clear your search."
                : "Create a prescription with patient details and medication instructions, then open the printable preview."}
            </p>
            {!query && (
              <button
                disabled={!["doctor", "clinic_admin"].includes(profile?.role)}
                onClick={start}
                className={secondary + " mt-6"}
              >
                <Plus size={16} />
                Create first prescription
              </button>
            )}
          </div>
        )}
      </section>
      {editing && (
        <Modal title="New prescription" onClose={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-5 p-6">
            <p className="rounded-xl bg-violet-50 p-4 text-xs leading-6 text-violet-800">
              Only an authorized clinician may enter medication details. The
              system does not recommend medicines or doses.
            </p>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <label className="block text-sm font-semibold">
              Linked consultation
              <select
                required
                className={input + " mt-2"}
                value={consultationId}
                onChange={(e) => {
                  setConsultationId(e.target.value);
                  const visit = consultations.find(
                    (c) => c.id === e.target.value,
                  );
                  if (visit) setDoctor(visit.doctor_name);
                }}
              >
                <option value="">Choose consultation</option>
                {consultations
                  .filter((c) => c.patient_id === patientId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.patient_name} · {c.doctor_name} ·{" "}
                      {c.created_at?.slice(0, 10)}
                    </option>
                  ))}
              </select>
              <small className="mt-2 block font-normal text-slate-500">
                Choose an existing consultation. The prescribing doctor and
                issue date are added automatically.
              </small>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Patient
                <select
                  required
                  className={input + " mt-2"}
                  value={patientId}
                  onChange={(e) => {
                    setPatientId(e.target.value);
                    setConsultationId("");
                    setDoctor("");
                  }}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold">
                Date
                <input
                  required
                  type="date"
                  max={today()}
                  className={input + " mt-2"}
                  disabled
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              Prescribing doctor{" "}
              <span className="font-normal text-slate-400"></span>
              <select
                className={input + " mt-2"}
                disabled
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
              >
                <option>{doctor}</option>
              </select>
            </label>
            {items.map((item, i) => (
              <fieldset
                key={i}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <legend className="px-2 text-xs font-bold uppercase tracking-wider text-violet-700">
                  Medication {i + 1}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["name", "Medication name", true],
                    ["strength", "Strength", false],
                    ["dose", "Dose", true],
                    ["route", "Route", true],
                    ["frequency", "Frequency", true],
                    ["duration", "Duration", true],
                    ["quantity", "Quantity", false],
                  ].map(([key, label, required]) => (
                    <label
                      key={key}
                      className="text-xs font-semibold text-slate-600"
                    >
                      {label}
                      {required ? " *" : ""}
                      <input
                        aria-label={label + " " + (i + 1)}
                        required={required}
                        maxLength={150}
                        type={key === "quantity" ? "number" : "text"}
                        min={key === "quantity" ? "1" : undefined}
                        step={key === "quantity" ? "1" : undefined}
                        className={input + " mt-1.5"}
                        value={item[key]}
                        onChange={(e) => update(i, key, e.target.value)}
                        placeholder={key === "name" ? "Medication name" : label}
                      />
                    </label>
                  ))}
                </div>
                <label className="mt-4 block text-xs font-semibold text-slate-600">
                  Additional instructions
                  <input
                    aria-label={"Instructions " + (i + 1)}
                    maxLength={300}
                    className={input + " mt-1.5"}
                    value={item.instructions}
                    onChange={(e) => update(i, "instructions", e.target.value)}
                  />
                </label>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setItems((rows) => rows.filter((_, index) => index !== i))
                    }
                    className="mt-4 flex items-center gap-2 text-xs font-semibold text-rose-700"
                  >
                    <Trash2 size={14} />
                    Remove medication {i + 1}
                  </button>
                )}
              </fieldset>
            ))}
            <button
              type="button"
              disabled={items.length >= 10}
              className={secondary}
              onClick={() => setItems((rows) => [...rows, emptyItem()])}
            >
              <Plus size={16} />
              Add medication
            </button>
            <label className="block text-sm font-semibold">
              General notes
              <textarea
                maxLength={1000}
                className={input + " mt-2 min-h-24"}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                className={secondary}
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button disabled={saving} className={primary}>
                <FileText size={16} />
                {saving ? "Saving…" : "Save & preview"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {preview && (
        <Modal
          printable
          title="Prescription preview"
          onClose={() => setPreview(null)}
        >
          <div className="space-y-6 p-6">
            <div className="border-b-2 border-brand-700 pb-5">
              <Brand />
              <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold">Prescription</h2>
                </div>
              </div>
            </div>
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-400">Patient</p>
                <p className="mt-1 font-semibold">{preview.patient}</p>
                <p className="mt-1 text-slate-500">
                  Age: {preview.age}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Doctor / Date</p>
                <p className="mt-1 font-semibold">{preview.doctor}</p>
                <p className="mt-1 text-slate-500">{preview.date}</p>
              </div>
            </div>
            <div>
              <p className="mb-5 font-serif text-4xl text-brand-700">℞</p>
              {preview.items.map((m, i) => (
                <div key={i} className="border-b border-slate-100 py-4">
                  <h3 className="font-semibold">
                    {i + 1}. {m.name} {m.strength}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Dose: {m.dose} · Route: {m.route}
                    <br />
                    Frequency: {m.frequency} · Duration: {m.duration}
                    {m.quantity && (
                      <>
                        <br />
                        Quantity: {m.quantity}
                      </>
                    )}
                    {m.instructions && (
                      <>
                        <br />
                        Instructions: {m.instructions}
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
            {preview.notes && (
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                Notes: {preview.notes}
              </p>
            )}
            
            <div className="flex justify-end gap-3 print:hidden">
              <button className={secondary} onClick={() => setPreview(null)}>
                Close preview
              </button>
              <button className={primary} onClick={() => window.print()}>
                <Printer size={16} />
                Print / Save PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
