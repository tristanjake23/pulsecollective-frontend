import TriageNotifications from "./components/TriageNotifications.jsx";
import RoleBadge from "./components/RoleBadge.jsx";
import DoctorAvailability from "./components/DoctorAvailability.jsx";
import { WorkspaceProvider, useWorkspace } from "./state/WorkspaceContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Patients from "./pages/Patients.jsx";
import Billing from "./pages/Billing.jsx";
import Consultations from "./pages/Consultations.jsx";
import Prescriptions from "./pages/Prescriptions.jsx";
import DoctorAdmin from "./pages/DoctorAdmin.jsx";
import Appointments from "./pages/Appointments.jsx";
import LogoutDialog from "./components/LogoutDialog.jsx";
import InvoiceDialog from "./components/InvoiceDialog.jsx";
import PatientForm from "./components/PatientForm.jsx";
import InvoiceForm from "./components/InvoiceForm.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
const pages = {
  Overview: Dashboard,
  "Manage doctors": DoctorAdmin,
  Patients,
  Appointments,
  Prescriptions,
  Consultations,
  "Billing & invoices": Billing,
};
function Workspace({ onPublicHome }) {
  const { tab, profile, loading, apiError, reload } = useWorkspace();
  const clinicalAllowed = ["doctor", "clinic_admin"].includes(profile?.role);
  const denied =
    (tab === "Billing & invoices" && profile?.role === "doctor") ||
    (tab === "Manage doctors" && profile?.role !== "clinic_admin") ||
    (["Consultations", "Prescriptions"].includes(tab) && !clinicalAllowed);
  const Page = denied
    ? () => (
        <p role="alert" className="rounded-xl bg-amber-50 p-5 text-amber-900">
          Oops, this page requires an authorized clinic role.
        </p>
      )
    : pages[tab] || Dashboard;
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,#e2f3ef_0%,#f4f7fb_45%)] font-sans text-slate-800 lg:flex print:hidden">
      <Sidebar onPublicHome={onPublicHome} />
      <main className="min-w-0 flex-1 print:hidden">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 bg-white/80 px-5 py-5 backdrop-blur-xl sm:px-8">
          <p className="text-sm font-semibold text-brand-800">
            {profile?.role === "clinic_admin"
              ? "Administrator"
              : profile?.role === "doctor"
                ? "Doctor"
                : "Staff"}{" "}
            portal
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ThemeToggle /> 
            <TriageNotifications role={profile?.role} />
            <RoleBadge role={profile?.role} />
          </div>
        </header>
        <div
          key={tab}
          className="mx-auto max-w-7xl space-y-6 p-5 motion-safe:animate-enter sm:p-8"
        >
          {loading && (
            <p
              role="status"
              className="rounded-xl bg-blue-50 p-4 text-sm text-blue-800"
            >
              Loading clinic records…
            </p>
          )}
          {apiError && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800"
            >
              {apiError}
              <button onClick={reload} className="ml-3 font-semibold underline">
                Retry
              </button>
            </div>
          )}
          <DoctorAvailability />
          <Page />
          <footer className="mt-10 text-xs leading-6 text-slate-400">
            Pulse Collective
          </footer>
        </div>
      </main>
      <LogoutDialog />
      <InvoiceDialog />
      <PatientForm />
      <InvoiceForm />
    </div>
  );
}
export default function DoctorWorkspace({ onLogout, onPublicHome }) {
  return (
    <WorkspaceProvider onLogout={onLogout}>
      <Workspace onPublicHome={onPublicHome} />
    </WorkspaceProvider>
  );
}
