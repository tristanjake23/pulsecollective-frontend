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
import { login, logout, signup } from "./api/client.js";
const pages = [
  "home",
  "about",
  "doctors",
  "triage",
  "login",
  "portal",
  "booking",
];
function readPage() {
  const page = window.location.hash.slice(1).split("?")[0];
  return pages.includes(page) ? page : "home";
}
export default function App() {
  const [page, setPage] = useState(readPage),
    [session, setSession] = useState(null),
    [route, setRoute] = useState(window.location.hash);
  useEffect(() => {
    const change = () => {
      setPage(readPage());
      setRoute(window.location.hash);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = `${page === "portal" ? "Your workspace" : page === "doctors" ? "Find a doctor" : page === "triage" ? "AI triage" : page} · Pulse Collective`;
  }, [page]);
  function navigate(value) {
    setPage(value.split("?")[0]);
    setRoute("#" + value);
    window.location.hash = value;
  }
  useEffect(() => {
    const expired = () => {
      setSession(null);
      navigate("login");
    };
    const updated = (event) => setSession(event.detail);
    window.addEventListener("pulse-session-updated", updated);
    window.addEventListener("pulse-session-expired", expired);
    return () => {
      window.removeEventListener("pulse-session-updated", updated);
      window.removeEventListener("pulse-session-expired", expired);
    };
  }, []);
  async function signIn(credentials) {
    const value = await login(credentials);
    setSession(value);
    const next = sessionStorage.getItem("pulse-booking-return");
    sessionStorage.removeItem("pulse-booking-return");
    navigate(next || "portal");
  }
  async function register(details) {
    const value = await signup(details);
    if (value.access_token) {
      setSession(value);
      const next = sessionStorage.getItem("pulse-booking-return");
      sessionStorage.removeItem("pulse-booking-return");
      navigate(next || "portal");
    }
    return value;
  }
  async function signOut() {
    try {
      await logout();
    } finally {
      setSession(null);
      navigate("home");
    }
  }
  const signed = Boolean(session);
  return (
    <ApiContext.Provider value={{ profile: session?.profile || null }}>
      {page === "portal" && signed ? (
        session.profile.role === "patient" ? (
          <PatientPortal profile={session.profile} onLogout={signOut} />
        ) : (
          <DoctorWorkspace
            onLogout={signOut}
            onPublicHome={() => navigate("home")}
          />
        )
      ) : (
        <PublicLayout page={page} onNavigate={navigate} hasSession={signed}>
          <div key={page + route} className="motion-safe:animate-enter">
            {page === "home" && <Home onNavigate={navigate} />}{" "}
            {page === "about" && <About />}
            {page === "doctors" && <Doctors />}
            {page === "booking" && <BookingPage profile={session?.profile} />}
            {page === "triage" && <PublicTriage />}
            {["login", "portal"].includes(page) && (
              <Login onLogin={signIn} onSignup={register} />
            )}
          </div>
        </PublicLayout>
      )}
      <Chatbot />
    </ApiContext.Provider>
  );
}
