import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const GIF_URL = `${import.meta.env.BASE_URL}security-warning.gif`;

let gifPromise;

function loadConsoleGif() {
  if (!gifPromise) {
    gifPromise = fetch(GIF_URL)
      .then((response) => {
        if (!response.ok) throw new Error("GIF unavailable");
        return response.blob();
      })
      .then((blob) => {
        if (blob.type !== "image/gif" || blob.size > 3 * 1024 * 1024) {
          throw new Error("Console GIF must be a GIF under 3 MB");
        }

        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .catch(() => null);
  }

  return gifPromise;
}

function printWarning() {
  // Keep existing errors and logs visible.
  console.log(
    "%cPAUSE. PROTECT YOUR ACCOUNT.",
    [
      "color:#ff5252",
      "background:#080808",
      "font-size:38px",
      "font-weight:900",
      "padding:18px",
    ].join(";"),
  );

  console.log(
    "%cPULSE COLLECTIVE\n\n" +
      "Never paste code here that you do not understand.\n" +
      "It could expose your account or private information.\n" +
      "Unauthorized access or changes to clinic records are prohibited.",
    [
      "color:#f5f5f5",
      "background:#080808",
      "font-size:16px",
      "line-height:1.8",
      "padding:18px",
    ].join(";"),
  );

  void loadConsoleGif().then((dataUrl) => {
    if (!dataUrl) {
      console.info("Security reminder GIF:", GIF_URL);
      return;
    }

    console.log(
      "%c ",
      [
        "font-size:1px",
        "padding:120px 160px",
        "background-color:#080808",
        `background-image:url("${dataUrl}")`,
        "background-size:contain",
        "background-position:center",
        "background-repeat:no-repeat",
      ].join(";"),
    );
  });
}

export default function DevToolsWarning() {
  const [open, setOpen] = useState(false);
  const printed = useRef(false);
  const dismissButton = useRef(null);

  useEffect(() => {
    if (!printed.current) {
      printed.current = true;
      printWarning();
    }

    function handleKeyDown(event) {
      const key = event.key.toLowerCase();

      const shortcut =
        key === "f12" ||
        ((event.ctrlKey || event.metaKey) &&
          event.shiftKey &&
          ["i", "j", "c"].includes(key)) ||
        (event.metaKey &&
          event.altKey &&
          ["i", "j", "c"].includes(key));

      if (shortcut && !event.repeat) {
        setOpen(true);
        printWarning();
      }

      if (key === "escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dismissButton.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected
      ) {
        previousFocus.focus();
      }
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-warning-title"
      aria-describedby="security-warning-description"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          dismissButton.current?.focus();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        overflowY: "auto",
        background: "#080808",
        color: "#ffffff",
        colorScheme: "dark",
      }}
    >
      <div
        style={{
          minHeight: "100dvh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "clamp(24px, 5vw, 64px)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#a3a3a3",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "4px",
          }}
        >
          PULSE COLLECTIVE · SECURITY REMINDER
        </p>

        <h2
          id="security-warning-title"
          style={{
            margin: 0,
            maxWidth: "1100px",
            color: "#ff5252",
            fontSize: "clamp(38px, 7vw, 100px)",
            fontWeight: 900,
            lineHeight: 1.05,
            overflowWrap: "anywhere",
          }}
        >
          PAUSE.
          <br />
          PROTECT YOUR ACCOUNT.
        </h2>

        <img
          src={GIF_URL}
          alt=""
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
          style={{
            width: "min(100%, 460px)",
            height: "clamp(150px, 28dvh, 300px)",
            objectFit: "contain",
            borderRadius: "16px",
          }}
        />

        <p
          id="security-warning-description"
          style={{
            margin: 0,
            maxWidth: "760px",
            color: "#d4d4d4",
            fontSize: "clamp(16px, 2vw, 22px)",
            lineHeight: 1.7,
          }}
        >
          Never paste code you do not understand into the browser
          console. It could expose your account or private information.
          Unauthorized access or changes to clinic records are prohibited.
        </p>

        <button
          ref={dismissButton}
          type="button"
          onClick={() => setOpen(false)}
          style={{
            minHeight: "52px",
            padding: "14px 32px",
            border: "2px solid #ffffff",
            borderRadius: "999px",
            background: "#ffffff",
            color: "#080808",
            fontSize: "16px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Understood, continue
        </button>
      </div>
    </div>,
    document.body,
  );
}