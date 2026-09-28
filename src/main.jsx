import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./services/testSupabase";

function getInitialTheme() {
  const savedTheme = localStorage.getItem("peerlink-theme");

  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    return "dark";
  }

  document.documentElement.classList.remove("dark");
  return "light";
}

getInitialTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);