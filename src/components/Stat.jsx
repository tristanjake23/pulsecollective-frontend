export default function Stat({ icon: Icon, title, value, note }) {
  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_28px_-20px_#143d5040] p-6 [&>strong]:mt-5 [&>strong]:block [&>strong]:text-2xl [&>strong]:font-semibold [&>strong]:tracking-tight [&>strong]:text-brand-900 [&>small]:mt-2 [&>small]:block [&>small]:text-xs [&>small]:text-slate-400">
      <div className="flex items-center justify-between gap-2 text-sm text-slate-500 [&_i]:rounded-xl [&_i]:bg-brand-50 [&_i]:p-2 [&_i]:text-brand-600">
        <span>{title}</span>
        <i>
          <Icon size={17} />
        </i>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
