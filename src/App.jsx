import BookingPage from "./pages/BookingPage.jsx";
import { useEffect, useState } from "react";
import PublicLayout from "./components/PublicLayout.jsx";
import Chatbot from "./components/Chatbot.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Doctors from "./pages/Doctors.jsx";
import PublicTriage from "./pages/PublicTriage.jsx";
import Login from "./Login.jsx";
import DoctorWorkspace from "./DoctorWorkspace.jsx";
import { ApiContext } from "./api/ApiContext.jsx";
import PatientPortal from "./pages/PatientPortal.jsx";
import { login, logout, signup, restoreSession, subscribeAuth } from "./api/client.js";

const pages = ["home", "about", "doctors", "triage", "login", "portal", "booking"];
function readPage() {
  const page = window.location.hash.slice(1).split("?")[0];
  return pages.includes(page) ? page : "home";
}
function bookingReturn() {
  try {
    const next = sessionStorage.getItem("pulse-booking-return");
    sessionStorage.removeItem("pulse-booking-return");
    return next?.split("?")[0] === "booking" ? next : "portal";
  } catch {
    return "portal";
  }
}

export default function App() {
  const [page, setPage] = useState(readPage);
  const [route, setRoute] = useState(window.location.hash);
  const [auth, setAuth] = useState({ status: "loading", session: null, error: "" });
  const [notice, setNotice] = useState("");
  const session = auth.session;

  function navigate(value) {
    setPage(value.split("?")[0]);
    setRoute("#" + value);
    window.location.hash = value;
  }

  useEffect(() => {
    const change = () => {
      setPage(readPage());
      setRoute(window.location.hash);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setAuth);
    void restoreSession().catch(() => {});
    return unsubscribe;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${page === "portal" ? "Your workspace" : page === "doctors" ? "Find a doctor" : page === "triage" ? "AI triage" : page} · Pulse Collective`;
  }, [page]);

  useEffect(() => {
    if (auth.status === "ready" && session && page === "login") navigate("portal");
  }, [auth.status, session, page]);

  async function signIn(credentials) {
    setNotice("");
    await login(credentials);
    navigate(bookingReturn());
  }
  async function register(details) {
    setNotice("");
    const value = await signup(details);
    if (value.access_token) navigate(bookingReturn());
    return value;
  }
  async function signOut() {
    setNotice("");
    try {
      await logout();
    } catch {
      setNotice("Signed out in this browser. The service could not confirm server sign-out. Please retry when connected.");
    } finally {
      navigate("home");
    }
  }

    if (auth.status !== "ready") {
    const checking = auth.status === "loading";

    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#0b151c] px-6 text-slate-100"
        aria-busy={checking}
      >
        <div className="w-full max-w-sm text-center">
          <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center">
            <div
              aria-hidden="true"
              className={
                "absolute inset-0 rounded-full border-2 border-teal-400/15 border-t-teal-300 " +
                (checking ? "motion-safe:animate-spin" : "")
              }
            />

            <span
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-400/10 text-2xl text-teal-300"
            >
              ✚
            </span>
          </div>

          <p className="text-lg font-semibold tracking-tight text-teal-300">
            Pulse Collective
          </p>

          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-400">
            Care, more connected
          </p>

          <h1
            role="status"
            className="mt-8 text-2xl font-semibold tracking-tight"
          >
            {checking
              ? "Getting your workspace ready"
              : "We couldn’t reconnect"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {checking
              ? "Please wait while we securely restore your sign-in."
              : auth.error || "Please check your connection and try again."}
          </p>

          {!checking && (
            <div className="mt-7 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  void restoreSession().catch(() => {});
                }}
                className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300"
              >
                Try again
              </button>

              <button
                type="button"
                onClick={signOut}
                className="rounded-xl px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-300"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  const signed = Boolean(session);
  // Re-mount workspace data whenever the signed-in account changes.
  const accountKey = session ? `${session.profile.id}:${session.profile.role}` : "guest";
  return (
    <ApiContext.Provider value={{ profile: session?.profile || null }}>
      {notice && <p role="status" className="p-4 text-sm">{notice}</p>}
      {page === "portal" && signed ? (
        session.profile.role === "patient" ? (
          <PatientPortal key={accountKey} profile={session.profile} onLogout={signOut} />
        ) : (
          <DoctorWorkspace key={accountKey} onLogout={signOut} onPublicHome={() => navigate("home")} />
        )
      ) : (
        <PublicLayout page={page} onNavigate={navigate} hasSession={signed}>
          <div key={accountKey + page + route} className="motion-safe:animate-enter">
            {page === "home" && <Home onNavigate={navigate} />}
            {page === "about" && <About />}
            {page === "doctors" && <Doctors />}
            {page === "booking" && <BookingPage profile={session?.profile} />}
            {page === "triage" && <PublicTriage />}
            {["login", "portal"].includes(page) && <Login onLogin={signIn} onSignup={register} />}
          </div>
        </PublicLayout>
      )}
      <Chatbot key={`chat:${accountKey}`} />
    </ApiContext.Provider>
  );
}
