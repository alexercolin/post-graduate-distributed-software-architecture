import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./globals.css";
import { setupRootConfig } from "./root-config";

setupRootConfig();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
