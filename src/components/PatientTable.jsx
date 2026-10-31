import { Badge } from "./ui.jsx";
export default function PatientTable({ patients, onSelect }) {
  return (
    <div className="overflow-x-auto [&_table]:w-full [&_table]:min-w-[580px] [&_table]:text-left [&_table]:text-sm [&_th]:whitespace-nowrap [&_th]:bg-[#f3f7f8] [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-slate-500 [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-5 [&_td]:py-4 print:[&_table]:min-w-0 print:[&_td]:px-2">
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Patient ID</th>
            <th>Age</th>
            <th>Sex</th>
            <th>Phone</th>
            <th>Last visit</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.code || p.id}>
              <td>
                <span className="flex min-w-36 items-center gap-3 [&_i]:flex [&_i]:h-9 [&_i]:w-9 [&_i]:shrink-0 [&_i]:items-center [&_i]:justify-center [&_i]:rounded-full [&_i]:bg-brand-50 [&_i]:text-xs [&_i]:font-semibold [&_i]:not-italic [&_i]:text-brand-700 [&_b]:font-medium">
                  <i>
                    {p.name
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </i>
                  <button
                    className="text-left font-semibold text-brand-700 hover:underline"
                    onClick={() => onSelect?.(p)}
                  >
                    {p.name}
                  </button>
                </span>
              </td>
              <td className="text-slate-500">{p.code || p.id}</td>
              <td>{p.age}</td>
              <td>{p.sex || "—"}</td>
              <td>{p.phone}</td>
              <td className="text-slate-500">{p.visit}</td>
              <td>
                <Badge status={p.status}>{p.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!patients.length && (
        <div className="p-10 text-center text-sm text-slate-500">
          No matching patients.
        </div>
      )}
    </div>
  );
}
