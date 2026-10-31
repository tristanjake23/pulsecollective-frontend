import { ArrowUpRight } from "lucide-react";
export default function PanelHead({ title, subtitle, action, onAction }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-6 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:font-semibold [&_p]:mt-2 [&_p]:text-sm [&_p]:leading-6 [&_p]:text-slate-500">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <button
        className="flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
        onClick={onAction}
      >
        {action}
        <ArrowUpRight size={15} />
      </button>
    </div>
  );
}
