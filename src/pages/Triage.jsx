import TriagePanel from "../components/TriagePanel.jsx";
import { useWorkspace } from "../state/WorkspaceContext.jsx";
import { Eyebrow } from "../components/ui.jsx";
export default function Triage() {
  const { patients } = useWorkspace();
  return (
    <>
      <div>
        <Eyebrow>Guided symptom review</Eyebrow>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          AI triage
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review warning signs and organize reported symptoms for a conversation
          with a healthcare professional.
        </p>
      </div>
      <TriagePanel patients={patients} />
    </>
  );
}
