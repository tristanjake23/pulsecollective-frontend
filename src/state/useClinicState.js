import { useEffect, useMemo, useState } from "react";
import { today } from "../utils/format.js";
import { useApi } from "../api/ApiContext.jsx";
import { api } from "../api/client.js";
import * as map from "../api/mappers.js";
import { birthDateError, phoneError } from "../utils/patient.js";
const blankPatient = () => ({
  name: "",
  dateOfBirth: "",
  sex: "",
  phone: "",
  email: "",
  address: "",
  emergencyName: "",
  emergencyPhone: "",
  bloodType: "",
  allergies: "",
  notes: "",
});
export default function useClinicState() {
  const { profile } = useApi();
  const [tab, setTab] = useState("Overview"),
    [patients, setPatients] = useState([]),
    [invoices, setInvoices] = useState([]),
    [appointments, setAppointments] = useState([]),
    [prescriptions, setPrescriptions] = useState([]),
    [consultations, setConsultations] = useState([]),
    [doctorRecords, setDoctorRecords] = useState([]),
    [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true),
    [apiError, setApiError] = useState(""),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(""),
    [formError, setFormError] = useState(""),
    [saving, setSaving] = useState(false),
    [activeInvoice, setActiveInvoice] = useState(null),
    [patientForm, setPatientForm] = useState(blankPatient),
    [invoicePatient, setInvoicePatient] = useState(""),
    [invoiceAmount, setInvoiceAmount] = useState("750"),
    [invoiceDescription, setInvoiceDescription] = useState("Consultation"),
    [invoiceQuantity, setInvoiceQuantity] = useState("1"),
    [invoiceDue, setInvoiceDue] = useState(today());
  const canBill = ["clinic_admin", "staff"].includes(profile?.role);
  async function reload() {
    setLoading(true);
    setApiError("");
    try {
      const [p, i, a, r, c, d, s] = await Promise.all(
        [
          "/patients",
          "/invoices",
          "/appointments",
          "/prescriptions",
          "/consultations",
          "/doctors",
          "/schedules?upcoming=true&limit=200",
        ].map((path) =>
          path === "/invoices" && profile?.role === "doctor"
            ? Promise.resolve([])
            : ["/prescriptions", "/consultations"].includes(path) &&
                !["doctor", "clinic_admin"].includes(profile?.role)
              ? Promise.resolve([])
              : api(path),
        ),
      );
      setPatients(p.map(map.patient));
      setInvoices(i.map(map.invoice));
      setAppointments(a.map(map.appointment));
      setPrescriptions(r.map(map.prescription));
      setConsultations(c);
      setDoctorRecords(d);
      setSchedules(s);
      setInvoicePatient((current) => current || p[0]?.id || "");
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, [profile?.role, profile?.clinic_id]);
  useEffect(() => setFormError(""), [modal, tab]);
  async function addPatient(e) {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    setSaving(true);
    try {
      if (!patientForm.name.trim() || !patientForm.dateOfBirth)
        throw new Error("Full name and date of birth are required.");
      const invalid = birthDateError(patientForm.dateOfBirth, true) || phoneError(patientForm.phone, true);
      if (invalid) throw new Error(invalid);
      let record;
      const raw = await api("/patients", {
        method: "POST",
        body: {
          full_name: patientForm.name,
          date_of_birth: patientForm.dateOfBirth,
          sex: patientForm.sex ? patientForm.sex.toLowerCase() : null,
          phone: patientForm.phone || null,
          email: patientForm.email || null,
          address: patientForm.address || null,
          emergency_contact_name: patientForm.emergencyName || null,
          emergency_contact_phone: patientForm.emergencyPhone || null,
          allergies: patientForm.allergies || null,
          medical_notes:
            [
              patientForm.notes,
              patientForm.bloodType
                ? "Reported blood type: " + patientForm.bloodType
                : "",
            ]
              .filter(Boolean)
              .join("\n") || null,
        },
      });
      record = map.patient(raw);
      setPatients((p) => [record, ...p]);
      setPatientForm(blankPatient());
      setModal("");
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function addInvoice(e) {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    setSaving(true);
    try {
      const patient = patients.find((p) => p.id === invoicePatient);
      if (!patient) throw new Error("Register or select a patient first.");
      let record;
      record = map.invoice(
        await api("/invoices", {
          method: "POST",
          body: {
            patient_id: invoicePatient,
            due_date: invoiceDue,
            items: [
              {
                description: invoiceDescription,
                quantity: Number(invoiceQuantity),
                unit_price: Number(invoiceAmount),
              },
            ],
          },
        }),
      );
      setInvoices((all) => [record, ...all]);
      setModal("");
      setActiveInvoice(record.id);
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  }
  async function recordPayment(id, body) {
    const record = map.invoice(
      await api("/invoices/" + id + "/payments", { method: "POST", body }),
    );
    setInvoices((all) => all.map((i) => (i.id === id ? record : i)));
    return record;
  }
  async function createPrescription(body) {
    const record = map.prescription(
      await api("/prescriptions", { method: "POST", body }),
    );
    setPrescriptions((all) => [record, ...all]);
    return record;
  }
  const updatePatient = (key, value) =>
    setPatientForm((p) => ({ ...p, [key]: value }));
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0),
    collected = invoices.reduce(
      (s, i) => s + (i.paidAmount ?? (i.status === "Paid" ? i.amount : 0)),
      0,
    ),
    outstanding = totalBilled - collected;
  return {
    profile,
    canBill,
    tab,
    setTab,
    patients,
    setPatients,
    invoices,
    setInvoices,
    appointments,
    setAppointments,
    prescriptions,
    setPrescriptions,
    consultations,
    doctorRecords,
    schedules,
    setSchedules,
    reload,
    loading,
    apiError,
    saving,
    query,
    setQuery,
    modal,
    setModal,
    formError,
    setFormError,
    activeInvoice,
    setActiveInvoice,
    patientForm,
    setPatientForm,
    updatePatient,
    invoicePatient,
    setInvoicePatient,
    invoiceAmount,
    setInvoiceAmount,
    invoiceDescription,
    setInvoiceDescription,
    invoiceQuantity,
    setInvoiceQuantity,
    invoiceDue,
    setInvoiceDue,
    addPatient,
    addInvoice,
    createPrescription,
    recordPayment,
    totalBilled,
    collected,
    outstanding,
    visiblePatients: patients.filter((p) =>
      `${p.name} ${p.code || p.id} ${p.phone}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
    visibleInvoices: invoices.filter((i) =>
      `${i.number || i.id} ${i.patient}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  };
}
