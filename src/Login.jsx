import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, HeartPulse, UserPlus } from "lucide-react";
import { Brand, input, primary } from "./components/ui.jsx";
import Turnstile, { TURNSTILE_SITE_KEY } from "./components/Turnstile.jsx";
import { requestPasswordReset, completePasswordReset, resendConfirmation, verifyEmail } from "./api/client.js";

export default function Login({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaEpoch, setCaptchaEpoch] = useState(0);
  const [resendUntil, setResendUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const locked = useRef(false);
  const creating = mode === "signup";
  const verifying = mode === "confirm";
  const resetting = mode === "reset";
  const codeStep = verifying || resetting;
  const needsPassword = mode === "login" || creating || resetting;
  const needsCaptcha = Boolean(TURNSTILE_SITE_KEY) && !codeStep;
  const cooldown = Math.max(0, Math.ceil((resendUntil - now) / 1000));

  useEffect(() => {
    if (!resendUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendUntil]);

  function notice(text, error = false) { setMessage(text); setHasError(error); }
  function resetCaptcha() { setCaptchaToken(""); setCaptchaEpoch((n) => n + 1); }
  function startCooldown() {
    const time = Date.now();
    setNow(time);
    setResendUntil(time + 60000);
  }
  function switchMode(next) {
    if (locked.current) return;
    setMode(next);
    notice("");
    setPassword("");
    setConfirmation("");
    setCode("");
    setShow(false);
    resetCaptcha();
  }
  function moveTo(next) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setCode("");
    setShow(false);
  }
  const normalizedEmail = () => email.trim().toLowerCase();

  async function submit(event) {
    event.preventDefault();
    if (locked.current) return;
    notice("");
    if ((creating || resetting) && password !== confirmation) {
      notice("Passwords do not match.", true); return;
    }
    if (needsCaptcha && !captchaToken) {
      notice("Complete the verification before continuing.", true); return;
    }
    locked.current = true;
    setLoading(true);
    try {
      const address = normalizedEmail();
      if (creating) {
        const result = await onSignup({ full_name: name.trim(), email: address, password, captcha_token: captchaToken || null });
        if (!result.access_token) {
          moveTo("confirm"); startCooldown();
          notice(result.message || "Check your email for the verification code.");
        }
      } else if (mode === "login") {
        await onLogin({ email: address, password, captcha_token: captchaToken || null });
      } else if (mode === "forgot") {
        const result = await requestPasswordReset({ email: address, captcha_token: captchaToken || null });
        moveTo("reset"); startCooldown(); notice(result.message);
      } else if (verifying) {
        const result = await verifyEmail({ email: address, code });
        moveTo("login"); notice(result.message);
      } else if (resetting) {
        const result = await completePasswordReset({ email: address, code, new_password: password });
        moveTo("login"); notice(result.message);
      }
    } catch (error) {
      notice(error.message || "Unable to continue. Please try again.", true);
    } finally {
      locked.current = false;
      setLoading(false);
      resetCaptcha();
    }
  }

  async function resend() {
    if (locked.current || cooldown) return;
    if (!email.trim()) { notice("Enter your email address first.", true); return; }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      notice("Complete the verification before requesting another code.", true); return;
    }
    locked.current = true;
    setLoading(true);
    startCooldown();
    try {
      const request = verifying ? resendConfirmation : requestPasswordReset;
      const result = await request({ email: normalizedEmail(), captcha_token: captchaToken || null });
      setCode(""); notice(result.message);
    } catch (error) {
      notice(error.message || "Unable to send a code. Please try again later.", true);
    } finally {
      locked.current = false;
      setLoading(false);
      resetCaptcha();
    }
  }

  const headings = { login: "Welcome back.", signup: "Your care, connected.", confirm: "Confirm your email.", forgot: "Forgot your password?", reset: "Choose a new password." };
  const descriptions = {
    login: "Patient, administrator, doctor or staff—sign in here. Your approved role opens the right workspace.",
    signup: "Create a patient account, then confirm your email using the code we send.",
    confirm: "Enter the code sent to your email. If you have not received one, request another code below.",
    forgot: "Enter your account email to request a password reset code.",
    reset: "Enter your email code and choose a new password. This does not change your account role.",
  };
  const labels = { login: "Sign in", signup: "Create patient account", confirm: "Confirm email", forgot: "Send reset code", reset: "Update password" };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
      <section className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="relative overflow-hidden bg-brand-900 p-8 text-white sm:p-12">
          <img src="/images/hospital-team.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs"><HeartPulse size={16} /> Pulse Collective</span>
            <h1 className="mt-12 max-w-sm text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Care connects us.<br /><span className="font-serif italic text-teal-200">One place to begin.</span></h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/75">A shared entrance, with a workspace built around your role. Find care as a patient or manage your clinic day.</p>
            <div className="mt-10 space-y-4 border-t border-white/20 pt-7 text-sm">
              <p className="flex gap-3"><UserPlus size={20} /> Patients can create their own account.</p>
              <p className="flex gap-3"><ShieldCheck size={20} /> Administrators, doctors and staff use assigned accounts.</p>
            </div>
            <p className="mt-10 max-w-sm text-xs leading-6 text-white/60">Public registration creates a patient account. Clinic permissions are assigned by an authorized administrator.</p>
          </div>
        </div>
        <div className="min-w-0 px-6 py-9 sm:p-12">
          <Brand />
          <div className="mt-8 flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Account access">
            {[["login", "Sign in"], ["signup", "Create patient account"]].map(([value, label]) => (
              <button key={value} type="button" disabled={loading} onClick={() => switchMode(value)} aria-pressed={mode === value} className={"flex-1 rounded-lg px-3 py-3 text-sm font-semibold " + (mode === value ? "bg-white text-brand-700 shadow-sm" : "text-slate-500")}>{label}</button>
            ))}
          </div>
          <h2 className="mt-7 text-3xl font-semibold tracking-tight">{headings[mode]}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">{descriptions[mode]}</p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <fieldset disabled={loading} className="min-w-0 space-y-5">
              {creating && <label className="block text-sm font-medium">Full name<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={input + " mt-2"} /></label>}
              <label className="block text-sm font-medium">Email address<input required type="email" maxLength={254} autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); if (codeStep) setCode(""); }} className={input + " mt-2"} placeholder="you@example.com" /></label>
              {codeStep && <label className="block text-sm font-medium">Verification code<input required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))} className={input + " mt-2 tracking-[0.2em]"} placeholder="Email code" /></label>}
              {needsPassword && <label className="block text-sm font-medium">{resetting ? "New password" : "Password"}<span className="relative mt-2 block"><input required type={show ? "text" : "password"} minLength={creating || resetting ? 12 : 1} maxLength={128} autoComplete={creating || resetting ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className={input + " pr-12"} /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-0 px-4 text-slate-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>}
              {(creating || resetting) && <><p className="text-xs text-slate-500">Use at least 12 characters. Do not reuse another account's password.</p><label className="block text-sm font-medium">Confirm password<input required type="password" autoComplete="new-password" minLength={12} maxLength={128} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className={input + " mt-2"} /></label></>}
            </fieldset>
            {message && <p role={hasError ? "alert" : "status"} className={"rounded-xl p-4 text-sm leading-6 " + (hasError ? "bg-amber-50 text-amber-900" : "bg-brand-50 text-brand-800")}>{message}</p>}
            {TURNSTILE_SITE_KEY && <div className={loading ? "pointer-events-none" : ""}>{codeStep && <p className="mb-2 text-xs text-slate-500">Verification below is needed only when requesting another code.</p>}<Turnstile onToken={setCaptchaToken} resetKey={mode + ":" + captchaEpoch} /></div>}
            <button type="submit" disabled={loading || (needsCaptcha && !captchaToken)} className={primary + " w-full"} aria-busy={loading}>{loading ? "Please wait…" : labels[mode]}<ArrowRight size={17} /></button>
            {codeStep && <><button type="button" onClick={resend} disabled={loading || cooldown > 0 || (Boolean(TURNSTILE_SITE_KEY) && !captchaToken)} className="block w-full text-center text-xs font-semibold text-brand-700">{cooldown ? `Resend code in ${cooldown}s` : "Resend code"}</button><button type="button" disabled={loading} onClick={() => switchMode(verifying ? "signup" : "forgot")} className="block w-full text-center text-xs font-semibold text-slate-500">Use a different email</button></>}
           {mode === "login" && (
  <button
    type="button"
    disabled={loading}
    onClick={() => switchMode("forgot")}
    className="block w-full text-center text-xs font-semibold text-brand-700"
  >
    Forgot password?
  </button>
)}
          </form>
          <a href="#doctors" className="mt-6 block text-sm font-semibold text-brand-700">Explore the doctor directory →</a>
        </div>
      </section>
    </div>
  );
}
