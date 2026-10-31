import TriagePanel from "../components/TriagePanel.jsx";
export default function PublicTriage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-7 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-teal-700">Before your visit</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">How are you feeling?</h1>
        <p className="mt-3 text-base leading-7 text-slate-500">Tell us about your symptoms. Review your details before sending them to your clinic.</p>
      </div>
      <TriagePanel />
    </div>
  );
}
