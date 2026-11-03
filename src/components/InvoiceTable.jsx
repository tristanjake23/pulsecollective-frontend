import { Badge } from "./ui.jsx";
import { peso } from "../utils/format.js";
export default function InvoiceTable({ invoices, onSelect }) {
  return (
    <div className="overflow-x-auto [&_table]:w-full [&_table]:min-w-[580px] [&_table]:text-left [&_table]:text-sm [&_th]:whitespace-nowrap [&_th]:bg-[#f3f7f8] [&_th]:px-5 [&_th]:py-3 [&_th]:text-xs [&_th]:font-medium [&_th]:text-slate-500 [&_td]:border-t [&_td]:border-slate-100 [&_td]:px-5 [&_td]:py-4 print:[&_table]:min-w-0 print:[&_td]:px-2">
      <table>
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Patient</th>
            <th>Issued</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((i) => (
            <tr
              key={i.number || i.id}
              className="cursor-pointer transition hover:bg-brand-50/40"
              onClick={() => onSelect(i)}
            >
              <td className="">
                <button
                  className="font-semibold text-brand-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-brand-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(i);
                  }}
                >
                  {i.number || "View invoice"}
                </button>
              </td>
              <td>{i.patient}</td>
              <td className="text-slate-500">{i.issued}</td>
              <td>
                <b>{peso(i.amount)}</b>
              </td>
              <td>
                <Badge status={i.status}>{i.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!invoices.length && (
        <div className="p-10 text-center text-sm text-slate-500">
          No invoices found.
        </div>
      )}
    </div>
  );
}
