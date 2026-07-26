import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerStyle={{ top: 24 }}
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "16px",
            background: "var(--fallback-b1,oklch(var(--b1)/1))",
            color: "var(--fallback-bc,oklch(var(--bc)/1))",
            border: "1px solid rgba(128, 128, 128, 0.2)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
            fontSize: "13px",
            fontWeight: "600",
            padding: "10px 16px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);

// Register Service Worker for PWA Standalone Support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
      .catch((err) => console.error("PWA Service Worker registration failed:", err));
  });
}



