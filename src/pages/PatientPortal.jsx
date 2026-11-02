import RoleBadge from "../components/RoleBadge.jsx";
import MyAppointments from "../components/MyAppointments.jsx";
import MyInvoices from "../components/MyInvoices.jsx";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  HeartPulse,
  LogOut,
  Pencil,
  Save,
  Stethoscope,
} from "lucide-react";

import { api } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Brand, card, input, primary, secondary } from "../components/ui.jsx";

function normalizeProfile(data = {}) {
  return {
    full_name: data.full_name || "",
    contact_email: data.contact_email || "",
    sex: data.sex || "",
    date_of_birth: data.date_of_birth || "",
    phone: data.phone || "",
    address: data.address || "",
  };
}

function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  if (!value) return "Not provided";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PatientPortal({ profile, onLogout }) {
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(normalizeProfile(profile));
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const data = normalizeProfile(await api("/patient/profile"));

      setSaved(data);
      setForm(data);

      // New accounts can complete their missing contact information.
      setEditing(
        !data.full_name || !data.date_of_birth || !data.phone || !data.address,
      );
    } catch (error) {
      setError(error.message || "Unable to load your account details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const data = normalizeProfile(await api("/patient/profile"));
        if (!active) return;

        setSaved(data);
        setForm(data);
        setEditing(
          !data.full_name ||
            !data.date_of_birth ||
            !data.phone ||
            !data.address,
        );
      } catch (error) {
        if (active) {
          setError(error.message || "Unable to load your account details.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
    setError("");
  }

  function startEditing() {
    setForm({ ...saved });
    setError("");
    setMessage("");
    setEditing(true);
  }

  function cancelEditing() {
    setForm({ ...saved });
    setError("");
    setMessage("");
    setEditing(false);
  }

  async function save(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        full_name: form.full_name.trim(),
        contact_email: form.contact_email.trim() || null,
        sex: form.sex || null,
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      };

      if (payload.full_name.length < 2) {
        throw new Error("Please enter your full name.");
      }

      if (payload.date_of_birth && payload.date_of_birth > localToday()) {
        throw new Error("Date of birth cannot be in the future.");
      }

      // Only switch to saved view after the server confirms the update.
      const response = await api("/patient/profile", {
        method: "PUT",
        body: payload,
      });

      const updated = normalizeProfile(response);

      setSaved(updated);
      setForm(updated);
      setEditing(false);
      setMessage("Your details have been saved.");
    } catch (error) {
      setError(error.message || "Unable to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await onLogout();
    } catch {
      setError("Unable to finish signing out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = saved?.full_name || profile?.full_name || "Patient";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 p-5">
          <a href="#home" aria-label="Pulse Collective home">
            <Brand />
          </a>

          <div className="flex items-center gap-4">
            <RoleBadge role="patient" />

            <button
              type="button"
              onClick={() => setConfirmLogout(true)}
              className={secondary}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-7 p-5 py-10 sm:p-8">
        <section className="rounded-3xl bg-gradient-to-r from-brand-900 to-brand-600 p-8 text-white">
          <HeartPulse size={28} />

          <h1 className="mt-5 break-words text-3xl font-semibold">
            Welcome, {displayName}.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
            Manage your account details and browse the doctor directory.
          </p>
        </section>

        <div className="grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <section className={card + " p-6"}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">My contact details</h2>

                <p className="mt-2 text-sm text-slate-500">
                  {editing
                    ? "Update your information, then save your changes."
                    : "Your saved account information."}
                </p>
              </div>

              {!loading && saved && !editing && (
                <button
                  type="button"
                  onClick={startEditing}
                  className={secondary}
                >
                  <Pencil size={16} />
                  Edit details
                </button>
              )}
            </div>

            {message && (
              <p
                role="status"
                className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
              >
                <CheckCircle2 size={18} className="shrink-0" />
                {message}
              </p>
            )}

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
              >
                <p>{error}</p>

                {!saved && !loading && (
                  <button
                    type="button"
                    onClick={loadProfile}
                    className="mt-3 font-semibold underline"
                  >
                    Retry loading details
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <p role="status" className="mt-6 text-sm text-slate-500">
                Loading your details…
              </p>
            ) : saved && editing ? (
              <form onSubmit={save} className="mt-6 space-y-5">
                <label className="block text-sm font-medium">
                  Full name
                  <input
                    required
                    autoComplete="name"
                    minLength={2}
                    maxLength={120}
                    value={form.full_name}
                    onChange={(event) =>
                      updateField("full_name", event.target.value)
                    }
                    disabled={saving}
                    className={input + " mt-2"}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Date of birth
                  <input
                    type="date"
                    autoComplete="bday"
                    max={localToday()}
                    value={form.date_of_birth}
                    onChange={(event) =>
                      updateField("date_of_birth", event.target.value)
                    }
                    disabled={saving}
                    className={input + " mt-2"}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Sex
                  <select
                    className={input + " mt-2"}
                    value={form.sex}
                    onChange={(e) => updateField("sex", e.target.value)}
                    disabled={saving}
                  >
                    <option value="">Choose</option>
                    {[
                      ["female", "Female"],
                      ["male", "Male"],
                      ["other", "Other"],
                      ["prefer_not_to_say", "Prefer not to say"],
                    ].map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium">
                  Phone number
                  <input
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    disabled={saving}
                    className={input + " mt-2"}
                  />
                </label>

                <label className="block text-sm font-medium">
                  Contact email (optional)
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={254}
                    value={form.contact_email}
                    onChange={(e) =>
                      updateField("contact_email", e.target.value)
                    }
                    disabled={saving}
                    className={input + " mt-2"}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Address
                  <textarea
                    autoComplete="street-address"
                    maxLength={500}
                    value={form.address}
                    onChange={(event) =>
                      updateField("address", event.target.value)
                    }
                    disabled={saving}
                    className={input + " mt-2 min-h-24"}
                  />
                </label>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={cancelEditing}
                    className={secondary}
                  >
                    Cancel
                  </button>

                  <button type="submit" disabled={saving} className={primary}>
                    <Save size={16} />
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            ) : saved ? (
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  ["Full name", saved.full_name],
                  ["Date of birth", displayDate(saved.date_of_birth)],
                  ["Phone number", saved.phone],
                  ["Contact email", saved.contact_email],
                  ["Sex", saved.sex?.replaceAll("_", " ")],
                  ["Address", saved.address],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={
                      "rounded-2xl border border-slate-100 bg-slate-50 p-4 " +
                      (label === "Address" ? "sm:col-span-2" : "")
                    }
                  >
                    <dt className="text-xs font-medium text-slate-500">
                      {label}
                    </dt>

                    <dd className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold text-slate-800">
                      {value || "Not provided"}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>

          <aside className={card + " h-fit p-6"}>
            <Stethoscope size={30} className="text-brand-700" />

            <h2 className="mt-5 text-xl font-semibold">Find a doctor</h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Explore published doctor profiles, specialties and clinic
              information.
            </p>

            <a href="#doctors" className={primary + " mt-6"}>
              Browse doctors →
            </a>

            <a
              href="#home"
              className="mt-5 block text-sm font-semibold text-brand-700"
            >
              Back to home
            </a>
          </aside>
        </div>

        <MyAppointments />
        <MyInvoices key={profile.id} accountId={profile.id} />
        {confirmLogout && (
          <Modal
            title="Log out of your account?"
            onClose={() => {
              if (!loggingOut) setConfirmLogout(false);
            }}
          >
            <div className="space-y-5 p-6">
              <p className="text-sm leading-7 text-slate-500">
                Your saved information will remain available next time.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => setConfirmLogout(false)}
                  className={secondary}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={signOut}
                  className={primary}
                >
                  {loggingOut ? "Logging out…" : "Log out"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
