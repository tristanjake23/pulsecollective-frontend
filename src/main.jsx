import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import DevToolsWarning from "./components/DevToolsWarning.jsx";
import ThemeToggle, {
  initializeTheme,
  ThemeProvider,
} from "./components/ThemeToggle.jsx";
import "./styles.css";

initializeTheme();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
      <ThemeToggle floating />
      <DevToolsWarning />
    </ThemeProvider>
  </React.StrictMode>,
);