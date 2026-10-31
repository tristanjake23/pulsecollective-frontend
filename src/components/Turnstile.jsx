import { useEffect, useRef, useState } from "react";

export const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();
let scriptPromise;

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    const timeout = setTimeout(() => {
      script.remove();
      reject(new Error("Verification could not load."));
    }, 20000);
    script.onload = () => {
      clearTimeout(timeout);
      if (window.turnstile) resolve(window.turnstile);
      else { script.remove(); reject(new Error("Verification unavailable.")); }
    };
    script.onerror = () => {
      clearTimeout(timeout);
      script.remove();
      reject(new Error("Verification could not load."));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });
  return scriptPromise;
}

export default function Turnstile({ onToken, resetKey }) {
  const host = useRef(null);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let active = true;
    let widget;
    let api;
    onToken("");
    setError("");
    loadTurnstile().then((loaded) => {
      if (!active || !host.current) return;
      api = loaded;
      widget = api.render(host.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        size: "flexible",
        "response-field": false,
        callback: (token) => { if (active) { setError(""); onToken(token); } },
        "expired-callback": () => { if (active) onToken(""); },
        "error-callback": () => {
          if (active) { onToken(""); setError("Verification failed. Please retry."); }
          return true;
        },
        "timeout-callback": () => {
          if (active) { onToken(""); setError("Verification timed out. Please retry."); }
        },
      });
    }).catch(() => {
      if (active) setError("Verification could not load. Check your connection and retry.");
    });
    return () => {
      active = false;
      onToken("");
      if (api && widget !== undefined) api.remove(widget);
    };
  }, [theme, attempt, resetKey, onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div className="min-w-0 space-y-2">
      <div ref={host} className="min-h-[65px]" />
      {error && <p role="alert" className="text-xs text-amber-900">{error} <button type="button" onClick={() => setAttempt((n) => n + 1)} className="font-semibold underline">Retry verification</button></p>}
    </div>
  );
}
