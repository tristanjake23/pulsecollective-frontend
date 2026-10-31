import { HeartPulse, Users, ClipboardList, ArrowRight } from "lucide-react";
import { Eyebrow, primary } from "../components/ui.jsx";
const photo = "/images/hospital-team.jpg";
export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <div className="max-w-3xl">
        <Eyebrow>About Pulse Collective</Eyebrow>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-brand-900 sm:text-6xl">
          Healthcare feels better
          <br />
          when it feels{" "}
          <span className="font-serif italic text-brand-600">connected.</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-500">
          Pulse Collective is our student-built smart healthcare management
          project. We bring a public doctor directory and a dedicated clinic
          workspace into one experience.
        </p>
      </div>
      <div className="mt-12 grid items-center gap-10 md:grid-cols-2">
        <img
          src={photo}
          alt="Healthcare professional, illustrative stock photo"
          className="h-96 w-full rounded-3xl object-cover object-top"
        />
        <div>
          <Eyebrow>Designed around people</Eyebrow>
          <h2 className="text-3xl font-semibold tracking-tight text-brand-900">
            Find care easily.
            <br />
            Manage it thoughtfully.
          </h2>
          <p className="mt-5 leading-8 text-slate-500">
            Visitors can explore doctors without creating an account. Patients
            can request visits through their own account, while dedicated staff,
            doctor and administrator portals support clinic operations.
          </p>
          <p className="mt-4 leading-8 text-slate-500">
            Access follows your approved role. Our AI-assisted symptom intake
            helps prepare a summary for clinician review; it does not diagnose
            or rule out an emergency.
          </p>
          <a href="#doctors" className={primary + " mt-6"}>
            Explore the directory <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          [
            Users,
            "Accessible exploration",
            "A public directory with clear specialty, schedule and fee information.",
          ],
          [
            ClipboardList,
            "Organized clinic work",
            "Patient and invoice tools grouped into an easy-to-navigate workspace.",
          ],
          [
            HeartPulse,
            "Careful triage design",
            "A symptom intake interface with clear availability and clinical boundaries.",
          ],
        ].map(([Icon, title, text]) => (
          <article
            key={title}
            className="rounded-2xl border border-slate-200 bg-white p-7"
          >
            <Icon size={25} className="mb-5 text-brand-600" />
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
