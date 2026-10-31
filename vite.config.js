import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.API_PROXY_TARGET || "http://127.0.0.1:8000";
  if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(target)) {
    throw new Error("API_PROXY_TARGET must be a local HTTP backend URL.");
  }
  return {
    plugins: [tailwindcss()],
    server: {
      host: "127.0.0.1",
      allowedHosts: ["localhost", "127.0.0.1", "terminal.local"],
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          timeout: 90000,
          proxyTimeout: 90000,
        },
      },
    },
    preview: { host: "127.0.0.1" },
    build: { sourcemap: false },
  };
});
