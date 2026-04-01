import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

declare global {
  interface Window {
    __VITE_API_URL__?: string;
  }

  var __VITE_API_URL__: string | undefined;
}

function exposeRuntimeApiUrl() {
  const fromVite =
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "http://localhost:3001/api";

  window.__VITE_API_URL__ = fromVite;
  globalThis.__VITE_API_URL__ = fromVite;
}

async function enableA11yChecksInDev() {
  if (!import.meta.env.DEV) return;

  const [{ default: ReactAxe }, ReactDOMClient] = await Promise.all([
    import("@axe-core/react"),
    import("react-dom"),
  ]);

  ReactAxe(React, ReactDOMClient, 1000, {
    rules: [
      // Keep all default rules enabled; this array is here if you want to tune later.
    ],
  });
}

async function bootstrap() {
  exposeRuntimeApiUrl();
  await enableA11yChecksInDev();

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element '#root' not found.");
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

bootstrap();
