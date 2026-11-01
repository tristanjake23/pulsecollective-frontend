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
    return (
      <main className="mx-auto max-w-lg px-6 py-20" aria-busy={auth.status === "loading"}>
        <h1 className="text-2xl font-semibold">
          {auth.status === "loading" ? "Checking your session…" : "Unable to check your session"}
        </h1>
        {auth.status === "error" && (
          <>
            <p role="alert" className="mt-4 text-sm">{auth.error}</p>
            <button type="button" className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-white"
              onClick={() => { void restoreSession().catch(() => {}); }}>
              Try again
            </button>
            <button type="button" className="ml-4 mt-6 underline" onClick={signOut}>
              Sign out
            </button>
          </>
        )}
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
