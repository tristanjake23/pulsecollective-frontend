import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { api } from "../api/client.js";
import { useApi } from "../api/ApiContext.jsx";
import { input, primary, secondary } from "./ui.jsx";

const flags = [
  ["breathing", "Severe difficulty breathing or choking"],
  ["chest", "New or severe chest pain or pressure"],
  ["stroke", "Sudden facial droop, arm weakness or trouble speaking"],
  ["bleeding", "Heavy bleeding that will not stop"],
  ["unconscious", "Unconsciousness, ongoing seizure or sudden severe confusion"],
  ["allergy", "Severe allergic reaction with swelling or breathing difficulty"],
  ["harm", "Immediate risk of self-harm or harm to another person"],
];
const warningText = "Possible emergency warning signs: seek emergency medical help now. Do not wait for an AI summary, clinic acknowledgment or appointment.";
const warningPattern = /chest pain|pananakit ng dibdib|hindi makahinga|can.?t breathe|unconscious|uncontrolled bleeding|face droop|suicid|kill myself/i;

export default function TriagePanel() {
  const { profile } = useApi();
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("Today");
  const [selected, setSelected] = useState([]);
  const [screened, setScreened] = useState(false);
  const [pain, setPain] = useState("");
  const [progression, setProgression] = useState("Not sure");
  const [callbackPhone, setCallbackPhone] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [directoryError, setDirectoryError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [questions, setQuestions] = useState([]);
  const [saved, setSaved] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const requestKey = useRef(null);
  const lock = useRef(false);
  const screeningInput = useRef(null);
  const symptomInput = useRef(null);
  const selectedDoctor = doctors.find((doctor) => doctor.id === doctorId);
  const hasWarning = selected.length > 0 || warningPattern.test(symptoms);

  useEffect(() => {
    let active = true;
    api("/public/doctors", { publicRequest: true }).then((rows) => {
      if (active) { setDoctors(rows); setDirectoryError(""); }
    }).catch((err) => { if (active) setDirectoryError(err.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    setHistory([]); setHistoryError("");
    if (profile?.role === "patient") {
      api("/intake-reports?status=all").then((data) => { if (active) setHistory(data.reports); })
        .catch((err) => { if (active) setHistoryError(err.message); });
    }
    return () => { active = false; };
  }, [profile?.id, profile?.role]);
  async function refreshHistory() {
    try { const data = await api("/intake-reports?status=all"); setHistory(data.reports); setHistoryError(""); }
    catch (err) { setHistoryError(err.message); }
  }
  function edited() { setSaved(null); requestKey.current = null; setError(""); }
  function inputChanged() { edited(); setSummary(""); setQuestions([]); setSource(""); }
  function validate() {
    if (!screened) { setError("Choose any warning signs that apply, or select “None of these.”"); screeningInput.current?.focus(); return false; }
    if (symptoms.trim().length < 5) { setError("Describe your symptoms using at least 5 characters."); symptomInput.current?.focus(); return false; }
    return true;
  }
  function ownSummary() {
    return [symptoms.trim(), `Duration: ${duration}.`, pain !== "" ? `Pain reported: ${pain}/10.` : "", `Progression: ${progression}.`, selected.length ? "Warning signs reported: " + flags.filter(([key]) => selected.includes(key)).map(([, label]) => label).join("; ") : ""].filter(Boolean).join("\n");
  }
  async function prepare(event, useAI = false) {
    event.preventDefault();
    if (lock.current || !validate()) return;
    edited(); setSummary(ownSummary()); setQuestions([]); setSource("Your summary");
    if (hasWarning || !useAI) return;
    lock.current = true; setBusy("ai");
    try {
      const result = await api("/public/triage", {
        method: "POST", publicRequest: true,
        body: { symptoms, duration, red_flags: selected, warning_screen_complete: screened, consent: true },
      });
      // Independent warning screen always remains visible; AI cannot remove it.
      if (!result.emergency) { setSummary(result.summary); setQuestions(result.questions || []); setSource("AI summary"); }
    } catch (err) {
      setError("We could not prepare an AI summary. You can still edit your details below and send them. " + err.message);
    } finally { lock.current = false; setBusy(""); }
  }
  async function sendReport() {
    if (lock.current || saved || !validate()) return;
    const guest = profile?.role !== "patient";
    if (guest && !hasWarning) return setError("You can notify the clinic without an account when warning signs are reported. Sign in to send other reports.");
    if (!selectedDoctor) return setError("Choose the clinic doctor who should receive this report.");
    if (summary.trim().length < 5) return setError("Review or write your symptom summary first.");
    if (!requestKey.current) requestKey.current = crypto.randomUUID();
    lock.current = true; setBusy("send"); setError("");
    try {
      const report = await api(guest ? "/intake-reports/guest" : "/intake-reports", {
        method: "POST", publicRequest: guest,
        body: { doctor_id: doctorId, request_key: requestKey.current, symptoms, duration,
          red_flags: selected, warning_screen_complete: screened, summary,
          pain_score: pain === "" ? null : Number(pain), progression, share_with_clinic: true,
          ...(guest ? { callback_phone: callbackPhone.trim() || null } : {}) },
      });
      setSaved(report);
      if (!guest) setHistory((rows) => [report, ...rows.filter((row) => row.id !== report.id)]);
    } catch (err) { setError("Report not confirmed as saved. Your entries are still here; retry without changing them if the connection failed. " + err.message); }
    finally { lock.current = false; setBusy(""); }
  }
  async function refreshStatus() {
    if (!saved || lock.current) return;
    lock.current = true; setBusy("status");
    try { setSaved(await api(`/intake-reports/${saved.id}`)); setError(""); }
    catch (err) { setError("Could not refresh clinic status. " + err.message); }
    finally { lock.current = false; setBusy(""); }
  }
  function clear() {
    setSymptoms(""); setDuration("Today"); setSelected([]); setScreened(false); setPain("");
    setProgression("Not sure"); setDoctorId(""); setCallbackPhone("");
    setSummary(""); setQuestions([]); setSource(""); edited();
  }
  function chooseFlag(key) {
    inputChanged();
    const next = selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key];
    setSelected(next);
    setScreened(next.length > 0);
  }
  const stepLabel = "mb-4 flex items-center gap-3 text-lg font-semibold text-slate-900";
  const stepNumber = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm text-teal-800";
  const warningLabels = {
    breathing: "Severe trouble breathing or choking",
    chest: "New or severe chest pain",
    stroke: "Sudden face droop, arm weakness or trouble speaking",
    bleeding: "Heavy bleeding that will not stop",
    unconscious: "Unconscious, ongoing seizure or sudden severe confusion",
    allergy: "Severe allergic reaction with swelling or breathing trouble",
    harm: "Immediate risk of hurting yourself or someone else",
  };
  return (
    <div className="space-y-6">
      {hasWarning && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold leading-7 text-rose-900">{warningText}</div>}
      {profile?.role !== "patient" && <p className="text-sm leading-6 text-slate-600">{hasWarning ? "You can notify the clinic without an account. Do not wait for a portal response in an emergency." : <>No account is needed for emergency guidance or warning-sign alerts. To send other reports, <a href="#login" className="font-semibold text-teal-800 underline underline-offset-4">sign in</a>.</>}</p>}
      <form noValidate onSubmit={(event) => prepare(event, false)} className="space-y-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <fieldset disabled={Boolean(busy)} className="min-w-0 space-y-5">
          <legend className={stepLabel}><span className={stepNumber}>1</span>Tell us what is bothering you</legend>
          <label className="block text-sm font-medium text-slate-700">What symptoms do you have?
            <textarea ref={symptomInput} minLength={5} maxLength={2000} value={symptoms} onChange={(event) => { inputChanged(); setSymptoms(event.target.value); }} className={input + " mt-2 min-h-32"} placeholder="Describe what you are feeling and when it started. Leave out names and contact details." />
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">When did this start?
              <select value={duration} onChange={(event) => { inputChanged(); setDuration(event.target.value); }} className={input + " mt-2"}>
                <option value="Today">Today</option><option value="1–3 days">1–3 days ago</option><option value="More than 3 days">More than 3 days ago</option><option value="Ongoing">It has been ongoing</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">Is it getting better or worse?
              <select value={progression} onChange={(event) => { inputChanged(); setProgression(event.target.value); }} className={input + " mt-2"}>
                <option value="Not sure">Not sure</option><option value="Improving">Getting better</option><option value="Unchanged">About the same</option><option value="Worsening">Getting worse</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">How much pain are you in? <span className="font-normal text-slate-400">(optional)</span>
            <select value={pain} onChange={(event) => { inputChanged(); setPain(event.target.value); }} className={input + " mt-2"}>
              <option value="">Choose a pain level</option>{Array.from({ length: 11 }, (_, value) => <option key={value} value={value}>{value === 0 ? "0 — No pain" : value === 10 ? "10 — Worst pain" : value + " / 10"}</option>)}
            </select>
          </label>
          <div role="group" aria-label="Warning signs" tabIndex={-1} ref={screeningInput} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 sm:p-5">
            <p className="font-semibold text-slate-900">Are any of these happening right now?</p><p className="mt-1 text-sm leading-6 text-slate-500">Select all that apply, or choose None of these.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {flags.map(([key]) => <button key={key} type="button" aria-pressed={selected.includes(key)} onClick={() => chooseFlag(key)} className={"flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 " + (selected.includes(key) ? "border-rose-400 bg-rose-50 font-medium text-rose-900" : "border-slate-200 bg-white text-slate-700 hover:border-teal-400")}><span>{warningLabels[key]}</span>{selected.includes(key) && <Check size={18} className="shrink-0" aria-hidden="true" />}</button>)}
            </div>
            <button type="button" aria-pressed={screened && selected.length === 0} onClick={() => { inputChanged(); setSelected([]); setScreened(true); }} className={"mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 " + (screened && !selected.length ? "border-teal-600 bg-teal-50 text-teal-900" : "border-slate-200 bg-white text-slate-700 hover:border-teal-400")}>None of these</button>
          </div>
        </fieldset>
        <div className="space-y-3 border-t border-slate-100 pt-5">
          {!hasWarning && <p className="text-xs leading-6 text-slate-500">Create AI summary sends your symptom text to Gemini. You can review without AI instead.</p>}
          <div className="flex flex-wrap gap-3">
            {hasWarning ? <button disabled={Boolean(busy)} className={primary}>Review my details <ArrowRight size={17} /></button> : <><button type="button" disabled={Boolean(busy)} className={primary} onClick={(event) => prepare(event, true)}>{busy === "ai" ? "Preparing summary…" : "Create AI summary"}<ArrowRight size={17} /></button><button disabled={Boolean(busy)} className={secondary}>Review without AI</button></>}
            <button type="button" disabled={Boolean(busy)} onClick={clear} className="px-3 py-2 text-sm text-slate-500 underline underline-offset-4">Clear form</button>
          </div>
        </div>
        {summary && <section className="space-y-5 border-t border-slate-100 pt-6">
          <h2 className={stepLabel}><span className={stepNumber}>2</span>Check your details</h2>
          <label className="block text-sm font-medium text-slate-700">Your summary <span className="font-normal text-slate-400">· {source}</span><textarea value={summary} maxLength={4000} disabled={Boolean(busy)} onChange={(event) => { edited(); setSummary(event.target.value); }} className={input + " mt-2 min-h-40"} /></label>
          <p className="text-sm text-slate-500">Change anything that does not look right. This is a symptom summary, not a diagnosis.</p>
          {questions.length > 0 && <details className="rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-medium">Details you may want to discuss with your doctor</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">{questions.map((question, index) => <li key={index}>{question}</li>)}</ul></details>}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h2 className={stepLabel}><span className={stepNumber}>3</span>Send to your clinic</h2>
            {profile?.role === "patient" || hasWarning ? <>
              {directoryError && <p role="alert" className="text-sm text-rose-800">The doctor list could not load. Refresh the page or contact the clinic directly. {directoryError}</p>}
              <label className="block text-sm font-medium text-slate-700">Who would you like to send this to?<select className={input + " mt-2"} value={doctorId} disabled={Boolean(busy)} onChange={(event) => { edited(); setDoctorId(event.target.value); }}><option value="">Choose a doctor and clinic</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.full_name} · {doctor.clinic_name || "Clinic"}</option>)}</select></label>
              {profile?.role !== "patient" && <label className="block text-sm font-medium text-slate-700">Callback number <span className="font-normal text-slate-400">(optional)</span><input type="tel" maxLength={30} value={callbackPhone} disabled={Boolean(busy)} onChange={(event) => { edited(); setCallbackPhone(event.target.value); }} className={input + " mt-2"} placeholder="A number the clinic can use to contact you" /></label>}
              <p className="text-xs leading-6 text-slate-500">{profile?.role === "patient" ? "Sending shares and saves this report, your account name and contact phone" : "Notifying shares and saves this report and any callback number you provide"} with the selected clinic's administrator, staff and assigned doctor. {profile?.role !== "patient" && "No account is required. Without a callback number, the clinic may be unable to contact you."}</p>
              <button type="button" className={primary} disabled={Boolean(busy) || Boolean(saved)} onClick={sendReport}>{busy === "send" ? "Sending report…" : saved ? "Report saved" : profile?.role === "patient" ? "Send report to clinic" : "Notify the clinic"}<ArrowUpRight size={17} /></button>
            </> : <div className="space-y-3"><p className="text-sm text-slate-600">Sign in with a patient account to send your report. Signing in clears this unsaved draft.</p><a href="#login" className={primary}>Sign in to send <ArrowUpRight size={17} /></a></div>}
            {saved && <div role="status" className="space-y-2 rounded-xl bg-teal-50 p-4 text-sm text-teal-900"><p className="font-semibold">Your report has been saved.</p><p>{saved.workflow_status === "new" ? "Waiting for the clinic to acknowledge it." : "Status: " + saved.workflow_status}</p>{saved.acknowledged_at && <p>Acknowledged by {saved.acknowledged_name} · {new Date(saved.acknowledged_at).toLocaleString()}</p>}{saved.reviewed_at && <p>Reviewed by {saved.reviewer_name} · {new Date(saved.reviewed_at).toLocaleString()}</p>}{profile?.role === "patient" ? <button type="button" disabled={Boolean(busy)} onClick={refreshStatus} className={secondary}>Check report status</button> : <p>No staff response is guaranteed. Seek emergency care now; contact the clinic directly to confirm receipt.</p>}</div>}
          </div>
        </section>}
        {error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm leading-7 text-rose-800">{error}</p>}
        <p className="flex items-start gap-2 border-t border-slate-100 pt-5 text-xs leading-6 text-slate-500"><ShieldCheck size={17} className="mt-1 shrink-0" />For severe, sudden or worsening symptoms, seek medical help. Do not wait for a reply from this form. It cannot rule out an emergency.</p>
      </form>
      {profile?.role === "patient" && <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Your reports</h3><button type="button" onClick={refreshHistory} className={secondary}>Refresh</button></div>{historyError && <p role="alert" className="text-sm text-rose-800">Could not load your reports: {historyError}</p>}{history.map((report) => <article key={report.id} className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm"><p className="font-semibold">{report.doctor_name} · {report.workflow_status}</p><p className="text-slate-500">{new Date(report.created_at).toLocaleString()}</p>{report.acknowledged_name && <p>Acknowledged by {report.acknowledged_name}</p>}{report.reviewer_name && <p>Reviewed by {report.reviewer_name}</p>}</article>)}</section>}
    </div>
  );
}
