import { useState } from "react";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import PageHeading from "../components/PageHeading.jsx";
import SearchBox from "../components/SearchBox.jsx";
import PatientTable from "../components/PatientTable.jsx";
import Modal from "../components/Modal.jsx";
import { secondary } from "../components/ui.jsx";
import { peso } from "../utils/format.js";
export default function Patients() {
  const {
    patients,
    query,
    setQuery,
    visiblePatients,
    appointments,
    consultations,
    prescriptions,
    invoices,
    profile,
  } = useWorkspace();
  const [selected, setSelected] = useState(null),
    [tab, setTab] = useState("Details");
  const clinical = ["clinic_admin", "doctor"].includes(profile?.role);
  return (
    <>
      <PageHeading />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6">
          <h2 className="font-semibold">Patients · {patients.length}</h2>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Name, patient code or phone"
          />
        </div>
        <PatientTable
          patients={visiblePatients}
          onSelect={(p) => {
            setSelected(p);
            setTab("Details");
          }}
        />
      </section>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="space-y-5 p-6">
            <nav
              aria-label="Patient profile"
              className="flex gap-2 overflow-auto"
            >
              {[
                "Details",
                "Appointments",
                ...(clinical ? ["Consultations", "Prescriptions"] : []),
                ...(profile?.role !== "doctor" ? ["Billing"] : []),
              ].map((t) => (
                <button
                  className={secondary + (tab === t ? " bg-brand-50" : "")}
                  key={t}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </nav>
            {tab === "Details" ? (
              <dl className="grid gap-5 sm:grid-cols-2">
                {[
                  ["Patient code", selected.code],
                  ["Date of birth", selected.date_of_birth],
                  ["Age", selected.age],
                  ["Sex", selected.sex],
                  ["Phone", selected.phone],
                  ["Email", selected.email],
                  ["Address", selected.address],
                  ["Emergency contact", selected.emergency_contact_name],
                  ["Emergency phone", selected.emergency_contact_phone],
                  ["Allergies", selected.allergies],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-slate-500">{k}</dt>
                    <dd className="mt-1 text-sm">{v || "Not recorded"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const rows =
                    tab === "Appointments"
                      ? appointments.filter((x) => x.patient_id === selected.id)
                      : tab === "Consultations"
                        ? consultations.filter(
                            (x) => x.patient_id === selected.id,
                          )
                        : tab === "Prescriptions"
                          ? prescriptions.filter(
                              (x) => x.patientId === selected.id,
                            )
                          : invoices.filter((x) => x.patientId === selected.id);
                  return rows.length ? (
                    rows.map((x) => (
                      <article
                        key={x.id}
                        className="rounded-xl border p-4 text-sm"
                      >
                        <b>
                          {x.number || x.doctor || x.doctor_name ||
                            (tab === "Appointments" ? "Appointment" :
                              tab === "Consultations" ? "Consultation" :
                                tab === "Prescriptions" ? "Prescription" : "Invoice")}
                        </b>
                        <p className="mt-2 text-slate-500">
                          {x.starts_at
                            ? new Date(x.starts_at).toLocaleString()
                            : x.date ||
                              x.issued ||
                              x.created_at?.slice(0, 10)}{" "}
                          · {x.status || ""}
                        </p>
                        {tab === "Consultations" && (
                          <p className="mt-2 whitespace-pre-wrap">
                            {x.clinical_notes || "No notes recorded"}
                          </p>
                        )}
                        {tab === "Prescriptions" && (
                          <p className="mt-2">
                            {x.items.map((i) => i.name).join(", ")}
                          </p>
                        )}
                        {tab === "Billing" && (
                          <p className="mt-2">
                            Total {peso(x.amount)} · Balance{" "}
                            {peso(x.balanceDue)}
                          </p>
                        )}
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                      No {tab.toLowerCase()} recorded for this patient.
                    </p>
                  );
                })()}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
