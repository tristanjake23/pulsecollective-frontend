import { Search } from "lucide-react";
export default function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-400 [&_input]:min-w-0 [&_input]:text-sm [&_input]:text-slate-700 [&_input]:outline-none focus-within:ring-2 focus-within:ring-brand-100">
      <Search size={17} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
