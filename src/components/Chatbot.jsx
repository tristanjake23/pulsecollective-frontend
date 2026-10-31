import { useEffect, useRef, useState } from "react";
import { API_BASE } from "../api/client.js";
import { Send, X } from "lucide-react";

const GREETING = {
  role: "assistant",
  text:
    "Hi! I can help you find published doctors and navigate Pulse Collective. " +
    "Each question is handled separately. Messages are sent to Gemini; " +
    "do not include patient details. For symptom intake, use the separate AI triage page.",
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState([GREETING]);

  const bottom = useRef(null);
  const input = useRef(null);
  const locked = useRef(false);
  const activeRequest = useRef(null);

  useEffect(() => {
    return () => activeRequest.current?.abort();
  }, []);

  useEffect(() => {
    if (!open) return;

    bottom.current?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches
        ? "auto"
        : "smooth",
    });
  }, [open, messages, pending]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  async function send(event) {
    event.preventDefault();

    const text = value.trim();
    if (!text || locked.current) return;

    locked.current = true;
    setPending(true);
    setValue("");

    setMessages((previous) => [
      ...previous.slice(-38),
      { role: "user", text },
    ]);

    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : "Hindi makakuha ng sagot. Subukan ulit.",
        );
      }

      if (typeof data?.reply !== "string") {
        throw new Error("Invalid chatbot response.");
      }

      setMessages((previous) => [
        ...previous.slice(-39),
        {
          role: "assistant",
          text: data.reply,
          source: data.source,
        },
      ]);
    } catch (error) {
      const errorText =
        error.name === "AbortError"
          ? "Matagal sumagot ang AI. Subukan ulit."
          : error instanceof TypeError
            ? "Hindi makonekta sa serbisyo. Subukan ulit o gamitin ang Find a doctor."
            : error.message;

      setMessages((previous) => [
        ...previous.slice(-39),
        {
          role: "assistant",
          text: errorText,
        },
      ]);
    } finally {
      clearTimeout(timeout);
      activeRequest.current = null;
      locked.current = false;
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-50 sm:right-7 print:hidden">
      {open && (
        <section
          role="dialog"
          aria-label="Blastoise directory assistant"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
          className="mb-3 flex h-[min(540px,75dvh)] w-[min(380px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl motion-safe:animate-chat"
        >
          <header className="flex items-center justify-between bg-gradient-to-r from-teal-900 to-teal-600 p-4 text-white">
            <div className="flex items-center gap-3">
              <img
                src="/images/blastoise.png"
                alt=""
                className="h-10 w-10 object-contain"
              />

              <div>
                <p className="font-semibold">Blastoise</p>
                <p className="text-xs text-teal-100">
                  Your AI chatbot
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </header>

          <div
            role="log"
            aria-live="polite"
            aria-busy={pending}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  "max-w-[92%] whitespace-pre-wrap break-words rounded-2xl p-3 text-sm leading-6 motion-safe:animate-enter " +
                  (message.role === "user"
                    ? "ml-auto bg-teal-700 text-white"
                    : "border border-slate-200 bg-white text-slate-700")
                }
              >
                {message.source && (
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                    {message.source}
                  </span>
                )}

                {message.text}
              </div>
            ))}

            {pending && (
              <div
                role="status"
                className="flex w-fit gap-1 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className="sr-only">Preparing a reply</span>

                {[0, 1, 2].map((number) => (
                  <span
                    key={number}
                    aria-hidden="true"
                    style={{
                      animationDelay: `${number * 150}ms`,
                    }}
                    className="h-2 w-2 rounded-full bg-teal-600 motion-safe:animate-bounce"
                  />
                ))}
              </div>
            )}

            <div ref={bottom} />
          </div>

          <p className="px-4 pt-3 text-[11px] text-slate-500">
            AI can make mistakes. Verify doctor details with the clinic.
          </p>

          <form onSubmit={send} className="flex gap-2 p-3">
            <input
              ref={input}
              aria-label="Message"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              maxLength={500}
              placeholder="Ask about doctors or the website…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-teal-600"
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={pending || !value.trim()}
              className="rounded-xl bg-teal-700 px-4 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        aria-label={open ? "Close chatbot" : "Open chatbot"}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-900 text-white shadow-xl transition duration-200 hover:scale-105 motion-reduce:transform-none"
      >
        {open ? (
          <X size={24} />
        ) : (
          <img
            src="/images/blastoise.png"
            alt="Blastoise"
            className="h-12 w-12 object-contain"
          />
        )}
      </button>
    </div>
  );
}