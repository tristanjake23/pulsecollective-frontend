export function age(dob) {
  if (!dob) return "—";
  const birth = new Date(dob + "T00:00:00"),
    now = new Date();
  let value = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  )
    value--;
  return value;
}
export function patient(r) {
  return {
    ...r,
    id: r.id,
    code: r.patient_code,
    name: r.full_name,
    age: age(r.date_of_birth),
    sex: r.sex ? r.sex[0].toUpperCase() + r.sex.slice(1) : "",
    phone: r.phone || "",
    visit: r.last_visit || "No completed visit",
    status:
      r.status === "follow_up"
        ? "Follow-up"
        : r.status[0].toUpperCase() + r.status.slice(1),
    address: r.address || "",
  };
}
export function invoice(r) {
  return {
    ...r,
    number: r.invoice_no,
    patientId: r.patient_id,
    patient: r.patient_name,
    issued: r.issued_date,
    due: r.due_date,
    amount: Number(r.amount),
    paidAmount: Number(r.paid_amount),
    balanceDue: Number(r.balance_due),
    status: r.status[0].toUpperCase() + r.status.slice(1),
    items: (r.items || []).map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      rate: Number(i.unit_price),
    })),
  };
}
export function appointment(r) {
  return {
    ...r,
    patient: r.patient_name,
    doctor: r.doctor_name,
    date: r.starts_at?.slice(0, 10),
    type: new Date(r.starts_at).toLocaleString(),
    status: r.status,
  };
}
export function prescription(r) {
  return {
    ...r,
    patient: r.patient_name,
    patientId: r.patient_id,
    patientCode: r.patient_code,
    age: age(r.date_of_birth),
    doctor: r.doctor_name,
    date: r.issued_at?.slice(0, 10),
    notes: r.instructions || "",
    items: (r.items || []).map((i) => ({ ...i, name: i.medication_name })),
  };
}
