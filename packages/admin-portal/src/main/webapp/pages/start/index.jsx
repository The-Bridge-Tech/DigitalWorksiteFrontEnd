// src/main/webapp/pages/start/index.jsx
import React from "react";
import layout from "@splunk/react-page";
import { getUserTheme } from "@splunk/splunk-utils/themes";
import App from "./App"; // ✅ your main application component

// =======================
// Capture OAuth Hash (Google Auth / SSO flows)
// =======================
if (window.location.hash && window.location.hash.includes("access_token")) {
    console.log("index.jsx: Capturing OAuth hash before Splunk clears it");
    localStorage.setItem("authHash", window.location.hash);
    // Optionally clear the URL hash to keep it clean
    window.location.hash = "";
}

// =======================
// Mount App with Splunk Theme
// =======================
getUserTheme()
    .then((theme) => {
        layout(<App />, { theme });
    })
    .catch((err) => {
        console.error("Failed to load Splunk theme:", err);
        const errorEl = document.createElement("span");
        errorEl.innerHTML = err;
        document.body.appendChild(errorEl);
    });