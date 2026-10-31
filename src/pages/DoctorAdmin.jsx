import { useEffect, useState } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { api } from "../api/client.js";
import { card, input, primary, secondary } from "../components/ui.jsx";
import Modal from "../components/Modal.jsx";
const blank = () => ({
  profile_id: "",
  full_name: "",
  specialty: "",
  clinic_name: "",
  location: "",
  schedule: "",
  consultation_fee: 0,
  photo_url: "",
  is_sample: false,
  is_published: false,
  is_archived: false,
});
export default function DoctorAdmin() {
  const { profile, doctorRecords, reload } = useWorkspace();
  const [form, setForm] = useState(null),
    [id, setId] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [file, setFile] = useState(null),
    [accounts, setAccounts] = useState([]);
  useEffect(() => {
    if (profile?.role === "clinic_admin")
      api("/admin/doctor-accounts")
        .then(setAccounts)
        .catch((e) => setError(e.message));
  }, [profile?.role]);
  if (profile?.role !== "clinic_admin")
    return <p>Administrator access required.</p>;
  const body = (d) =>
    Object.fromEntries(
      Object.keys(blank()).map((k) => [k, d[k] ?? blank()[k]]),
    );
  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await api("/doctors" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: {
          ...form,
          profile_id: form.profile_id || null,
          photo_url: form.photo_url || null,
          consultation_fee: Number(form.consultation_fee),
        },
      });
      setId(saved.id);
      if (file)
        await api("/doctors/" + saved.id + "/photo", { method: "POST", file });
      setFile(null);
      setForm(null);
      setMessage("Doctor profile saved.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function toggle(d, key) {
    if (
      !confirm(
        key === "is_archived"
          ? "Change archive status for this doctor?"
          : "Change public visibility for this doctor?",
      )
    )
      return;
    setBusy(true);
    try {
      await api("/doctors/" + d.id, {
        method: "PUT",
        body: { ...body(d), profile_id: d.profile_id || null, [key]: !d[key] },
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
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-brand-600">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Manage doctors</h1>
        </div>
        <button
          className={primary}
          onClick={() => {
            setFile(null);
            setId(null);
            setForm(blank());
          }}
        >
          Add doctor
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {doctorRecords.map((d) => (
          <article key={d.id} className={card + " space-y-4 p-6"}>
            <h2 className="font-semibold">{d.full_name}</h2>
            <p className="text-sm text-slate-500">
              {d.specialty} ·{" "}
              {d.is_archived
                ? "Archived"
                : d.is_published
                  ? "Visible in directory"
                  : "Hidden from directory"}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className={secondary}
                onClick={() => {
                  setFile(null);
                  setId(d.id);
                  setForm(body(d));
                }}
              >
                Edit
              </button>
              <button
                disabled={busy || d.is_sample || d.is_archived}
                className={secondary}
                onClick={() => toggle(d, "is_published")}
              >
                {d.is_published ? "Hide from directory" : "Show in directory"}
              </button>
              <button
                disabled={busy}
                className={secondary}
                onClick={() => toggle(d, "is_archived")}
              >
                {d.is_archived ? "Restore" : "Archive"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!doctorRecords.length && (
        <p className={card + " p-10 text-center"}>
          No doctor profiles yet. Add your first clinic doctor.
        </p>
      )}
      {form && (
        <Modal
          title={id ? "Edit doctor" : "Add doctor"}
          onClose={() => setForm(null)}
        >
          <form className="space-y-4 p-6" onSubmit={save}>
            {[
              "full_name",
              "specialty",
              "clinic_name",
              "location",
              "schedule",
              "consultation_fee",
            ].map((k) => (
              <label key={k} className="block text-sm capitalize">
                {k.replaceAll("_", " ")}
                <input
                  className={input + " mt-2"}
                  required={["full_name", "specialty"].includes(k)}
                  maxLength={k === "full_name" ? 120 : 500}
                  type={k === "consultation_fee" ? "number" : "text"}
                  min={0}
                  step={k === "consultation_fee" ? ".01" : undefined}
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                />
              </label>
            ))}
            <label className="block text-sm">
              Doctor login account (optional)
              <select
                className={input + " mt-2"}
                value={form.profile_id || ""}
                onChange={(e) =>
                  setForm({ ...form, profile_id: e.target.value })
                }
              >
                <option value="">Not linked to a login</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs leading-6 text-slate-500">
              Link the approved doctor's account so they can manage their own
              schedule and online availability.
            </p>
            <label className="block text-sm">
              Doctor portrait (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className={input + " mt-2"}
                onChange={(e) => {
                  const image = e.target.files?.[0];
                  if (image?.size > 2097152) {
                    setError("Choose a portrait smaller than 2 MB.");
                    e.target.value = "";
                    setFile(null);
                  } else {
                    setError("");
                    setFile(image || null);
                  }
                }}
              />
            </label>
            <p className="text-xs leading-6 text-slate-500">
              Upload the actual doctor's photo with their permission. JPG, PNG
              or WebP, up to 2 MB. Initials appear when there is no photo.
            </p>
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({ ...form, is_published: e.target.checked })
                }
              />
              Show verified profile in directory
            </label>
            {error && (
              <p role="alert" className="text-rose-700">
                {error}
              </p>
            )}
            <button className={primary} disabled={busy}>
              {busy ? "Saving…" : "Save doctor"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
