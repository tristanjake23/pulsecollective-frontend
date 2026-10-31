import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "pulse-collective-theme";
const ThemeContext = createContext(null);

function initialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Theme switching still works when browser storage is blocked.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function initializeTheme() {
  applyTheme(initialTheme());
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    function syncTheme(event) {
      if (event.key === STORAGE_KEY || event.key === null) {
        setTheme(initialTheme());
      }
    }

    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";

    applyTheme(next);
    setTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the selected theme for the current visit.
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function ThemeToggle({ floating = false }) {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("ThemeToggle must be inside ThemeProvider.");
  }

  const { theme, toggleTheme } = context;
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      data-theme-toggle={floating ? "floating" : "header"}
      className={
        "theme-toggle print:hidden" +
        (floating ? " theme-toggle-floating" : "")
      }
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <Sun size={20} aria-hidden="true" />
      ) : (
        <Moon size={20} aria-hidden="true" />
      )}
    </button>
  );
}