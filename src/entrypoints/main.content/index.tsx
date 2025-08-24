import {
  createShadowRootUi,
  defineContentScript,
  type ContentScriptContext,
} from "#imports";
import React from "react";
import ReactDOM from "react-dom/client";
import "~/assets/tailwind.css";
import "./styles.css";
import App from "./App";

export default defineContentScript({
  matches: [
    "https://*.instructure.com/*",
    "https://www.gradescope.com/*", 
    "https://classroom.google.com/*"
  ],
  cssInjectionMode: "ui",

  async main(ctx) {
    // The App component will create shadow roots for video overlay and wrapped popup
    const app = <App ctx={ctx} />;
    
    // Create a container div for the app logic (not visible)
    const container = document.createElement("div");
    container.style.display = "none";
    document.body.appendChild(container);
    
    // Mount the app
    ReactDOM.createRoot(container).render(
      <React.StrictMode>
        {app}
      </React.StrictMode>
    );
  },
});
