import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  UserPlus,
  LockKeyhole,
} from "lucide-react";
import { Brand, input, primary } from "./components/ui.jsx";

export default function Login({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const creating = mode === "signup";

  function switchMode(next) {
    setMode(next);
    setMessage("");
    setPassword("");
    setConfirmation("");
    setShow(false);
  }
  async function submit(event) {
    event.preventDefault();
    if (loading) return;
    setMessage("");
    if (creating && password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (creating) {
        const result = await onSignup({
          full_name: name.trim(),
          email: email.trim(),
          password,
        });
        if (!result.access_token) {
          switchMode("login");
          setMessage(
            result.message ||
              "Check your email to confirm your account, then sign in.",
          );
        }
      } else {
        await onLogin({ email: email.trim(), password });
      }
    } catch (error) {
      setMessage(error.message || "Unable to continue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <section className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="relative overflow-hidden bg-brand-900 p-8 text-white sm:p-12">
          <img
            src="/images/hospital-team.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs">
              <HeartPulse size={16} /> Pulse Collective
            </span>
            <h1 className="mt-12 max-w-sm text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Care connects us.
              <br />
              <span className="font-serif italic text-teal-200">
                One place to begin.
              </span>
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/75">
              A shared entrance, with a workspace built around your role. Find
              care as a patient or manage your clinic day.
            </p>
            <div className="mt-10 space-y-4 border-t border-white/20 pt-7 text-sm">
              <p className="flex gap-3">
                <UserPlus size={20} /> Patients can create their own account.
              </p>
              <p className="flex gap-3">
                <ShieldCheck size={20} /> Administrators, doctors and staff use
                assigned accounts.
              </p>
            </div>
            <p className="mt-10 max-w-sm text-xs leading-6 text-white/60">
              Public registration creates a patient account. Clinic permissions
              are assigned by an authorized administrator.
            </p>
          </div>
        </div>
        <div className="px-6 py-9 sm:p-12">
          <Brand />
          <div
            className="mt-8 flex rounded-xl bg-slate-100 p-1"
            role="group"
            aria-label="Account access"
          >
            {[
              ["login", "Sign in"],
              ["signup", "Create patient account"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => switchMode(value)}
                aria-pressed={mode === value}
                className={
                  "flex-1 rounded-lg px-3 py-3 text-sm font-semibold " +
                  (mode === value
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-500")
                }
              >
                {label}
              </button>
            ))}
          </div>
          <h2 className="mt-7 text-3xl font-semibold tracking-tight">
            {creating ? "Your care, connected." : "Welcome back."}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {creating
              ? "Create a patient account to keep your contact details up to date."
              : "Patient, administrator, doctor or staff—sign in here. Your approved role opens the right workspace."}
          </p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            {creating && (
              <label className="block text-sm font-medium">
                Full name
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={input + " mt-2"}
                />
              </label>
            )}
            <label className="block text-sm font-medium">
              Email address
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input + " mt-2"}
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <span className="relative mt-2 block">
                <input
                  required
                  type={show ? "text" : "password"}
                  minLength={creating ? 12 : 1}
                  maxLength={128}
                  autoComplete={creating ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={input + " pr-12"}
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 px-4 text-slate-500"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
            {creating && (
              <>
                <p className="text-xs text-slate-500">
                  Use at least 12 characters. Do not reuse another account's
                  password.
                </p>
                <label className="block text-sm font-medium">
                  Confirm password
                  <input
                    required
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className={input + " mt-2"}
                  />
                </label>
              </>
            )}
            {message && (
              <p
                role="alert"
                className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900"
              >
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className={primary + " w-full"}
              aria-busy={loading}
            >
              {loading
                ? "Please wait…"
                : creating
                  ? "Create patient account"
                  : "Sign in"}
              <ArrowRight size={17} />
            </button>
            {!creating && (
              <button
                type="button"
                onClick={() =>
                  setMessage(
                    "Contact the clinic administrator for account recovery. Never share your password in chat.",
                  )
                }
                className="block w-full text-center text-xs font-semibold text-brand-700"
              >
                Need help signing in?
              </button>
            )}
          </form>
          
          <a
            href="#doctors"
            className="mt-6 block text-sm font-semibold text-brand-700"
          >
            Explore the doctor directory →
          </a>
        </div>
      </section>
    </div>
  );
}
