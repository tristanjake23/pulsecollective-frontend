import { today } from "../utils/format.js";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import Modal from "./Modal.jsx";

export default function PatientForm() {
  const {
    modal,
    setModal,
    addPatient,
    formError,
    saving,
    patientForm,
    updatePatient,
  } = useWorkspace();

  return (
    modal === "patient" && (
      <Modal title="Register patient" onClose={() => setModal("")}>
        <form
          className="space-y-5 p-6 [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_input:not([type=checkbox])]:mt-2 [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:rounded-xl [&_input:not([type=checkbox])]:border [&_input:not([type=checkbox])]:border-slate-300 [&_input:not([type=checkbox])]:bg-white [&_input:not([type=checkbox])]:px-4 [&_input:not([type=checkbox])]:py-3 [&_input]:outline-none [&_input:focus]:ring-2 [&_input:focus]:ring-brand-100 [&_select]:mt-2 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-4 [&_select]:py-3 [&_textarea]:mt-2 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-4 [&_textarea]:min-h-28 [&_textarea]:outline-none [&_textarea:focus]:ring-2 [&_textarea:focus]:ring-brand-100"
          onSubmit={addPatient}
        >
          <div className="border-b border-slate-100 pb-3 pt-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            Basic information
          </div>
          {formError && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800"
            >
              {formError}
            </p>
          )}
          <label>
            <span>
              Full name <b className="text-rose-600">*</b>
            </span>
            <input
              autoFocus
              required
              maxLength={120}
              value={patientForm.name}
              onChange={(e) => updatePatient("name", e.target.value)}
              placeholder="First and last name"
            />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              <span>
                Date of birth <b className="text-rose-600">*</b>
              </span>
              <input
                required
                type="date"
                max={today()}
                value={patientForm.dateOfBirth}
                onChange={(e) => updatePatient("dateOfBirth", e.target.value)}
              />
            </label>
            <label>
              <span>
                Sex{" "}
                <i className="ml-2 text-xs font-normal normal-case not-italic text-slate-400">
                  optional
                </i>
              </span>
              <select
                value={patientForm.sex}
                onChange={(e) => updatePatient("sex", e.target.value)}
              >
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </label>
          </div>
          <div className="border-b border-slate-100 pb-3 pt-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            Contact details
          </div>
          <label>
            <span>
              Cellphone number <b className="text-rose-600">*</b>
            </span>
            <input
              required
              type="tel"
              maxLength={11}
              pattern="[0-9]{11}"
              value={patientForm.phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                updatePatient("phone", val);
              }}
              placeholder="09123456789"
              title="Enter an 11-digit mobile number"
            />
          </label>
          <label>
            <span>
              Email{" "}
              <i className="ml-2 text-xs font-normal normal-case not-italic text-slate-400">
                optional
              </i>
            </span>
            <input
              type="email"
              maxLength={160}
              value={patientForm.email}
              onChange={(e) => updatePatient("email", e.target.value)}
              placeholder="patient@example.com"
            />
          </label>
          <label>
            <span>
              Address{" "}
              <i className="ml-2 text-xs font-normal normal-case not-italic text-slate-400">
                optional
              </i>
            </span>
            <input
              maxLength={200}
              value={patientForm.address}
              onChange={(e) => updatePatient("address", e.target.value)}
              placeholder="City or full address"
            />
          </label>
          <div className="border-b border-slate-100 pb-3 pt-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            Health information{" "}
            <i className="ml-2 text-xs font-normal normal-case not-italic text-slate-400">
              optional
            </i>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              Blood type
              <select
                value={patientForm.bloodType}
                onChange={(e) => updatePatient("bloodType", e.target.value)}
              >
                <option value="">Unknown / not provided</option>
                {["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Known allergies
              <input
                maxLength={300}
                value={patientForm.allergies}
                onChange={(e) => updatePatient("allergies", e.target.value)}
                placeholder="If any"
              />
            </label>
          </div>
          <label>
            Emergency contact name
            <input
              maxLength={120}
              value={patientForm.emergencyName}
              onChange={(e) => updatePatient("emergencyName", e.target.value)}
              placeholder="Contact person"
            />
          </label>
          <label>
            Emergency contact cellphone
            <input
              type="tel"
              maxLength={11}
              pattern="[0-9]{11}"
              value={patientForm.emergencyPhone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                updatePatient("emergencyPhone", val);
              }}
              placeholder="09123456789"
              title="Enter an 11-digit mobile number"
            />
          </label>
          <label>
            Medical notes
            <textarea
              rows="3"
              maxLength={1000}
              value={patientForm.notes}
              onChange={(e) => updatePatient("notes", e.target.value)}
              placeholder="Relevant information for the clinic team"
            />
          </label>
          <p className="text-xs leading-6 text-slate-500">
            Required: full name, date of birth, and cellphone. Optional health
            details are sensitive; collect only what your clinic needs.
          </p>
          <div className="flex flex-wrap justify-end gap-3 pt-3">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-700"
              type="button"
              onClick={() => setModal("")}
            >
              Cancel
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              disabled={saving}
              type="submit"
            >
              Save patient
            </button>
          </div>
        </form>
      </Modal>
    )
  );
}
