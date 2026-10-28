import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { TypographyProvider } from "./components/TypographyProvider";
import "./style.css";

// 管理端固定深色，但强调色跟随 C 端最后一次选择的主题预设。
type AdminPreset = "ocean" | "violet";

function readPresetCookie(): AdminPreset {
  const match = document.cookie.match(/(?:^|;\s*)theme-preset=(ocean|violet)(?:;|$)/);
  return match?.[1] === "violet" ? "violet" : "ocean";
}

function applyPreset() {
  document.documentElement.dataset.adminPreset = readPresetCookie();
}

applyPreset();
window.addEventListener("focus", applyPreset);
window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") applyPreset();
});
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TypographyProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </TypographyProvider>
  </React.StrictMode>
);
