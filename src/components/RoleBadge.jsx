export default function RoleBadge({ role }) {
  const label =
    {
      clinic_admin: "Administrator",
      doctor: "Doctor",
      staff: "Staff",
      patient: "Patient",
    }[role] || "Guest";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
      Signed in as {label}
    </span>
  );
}
