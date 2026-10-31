import { useState } from "react";
import { primary, secondary, card } from "./ui.jsx";
export function DoctorPortrait({ doctor, className = "h-20 w-20" }) {
  const [failed, setFailed] = useState(false);
  return doctor.photo_url && !failed ? (
    <img
      src={doctor.photo_url}
      onError={() => setFailed(true)}
      alt={doctor.full_name}
      className={className + " shrink-0 rounded-2xl object-cover"}
    />
  ) : (
    <span
      aria-label="No portrait provided"
      className={
        className +
        " inline-flex shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-2xl font-semibold text-brand-700"
      }
    >
      {doctor.full_name
        ?.split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
export const bookingLink = (d, mode) =>
  "#booking?doctor=" +
  encodeURIComponent(d.id) +
  "&mode=" +
  (mode || (d.online_now ? "now" : "scheduled"));
export function OnlineStatus({ online }) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 text-xs font-semibold " +
        (online ? "text-emerald-700" : "text-slate-500")
      }
    >
      <span
        className={
          "h-2 w-2 rounded-full " + (online ? "bg-emerald-500" : "bg-slate-300")
        }
      />
      {online ? "Online now" : "By appointment"}
    </span>
  );
}
export default function DoctorCard({ doctor: d, onView }) {
  return (
    <article
      className={
        card +
        " flex flex-col p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none"
      }
    >
      <div className="flex items-center gap-4">
        <DoctorPortrait doctor={d} />
        <div className="min-w-0">
          <OnlineStatus online={d.online_now} />
          <h3 className="mt-2 break-words text-lg font-semibold">
            {d.full_name}
          </h3>
          <p className="mt-1 text-sm text-brand-700">{d.specialty}</p>
        </div>
      </div>
      <p className="mt-5 text-sm text-slate-500">
        {d.clinic_name || "Clinic details in profile"}
      </p>
      <p className="mt-2 text-xs text-slate-500">{d.location}</p>
      <p className="mt-5 text-sm">
        Consultation{" "}
        <b className="float-right">
          {new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
          }).format(Number(d.consultation_fee))}
        </b>
      </p>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <button className={secondary} onClick={() => onView(d)}>
          View profile
        </button>
        <a className={primary} href={bookingLink(d)}>
          {d.online_now ? "Consult now" : "Book appointment"}
        </a>
      </div>
    </article>
  );
}
