import React from "react";
import ReactDOM from "react-dom/client";
import { initI18n } from "./i18n/index.js";
import App from "./App.js";
import "./styles.css";

await initI18n();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
