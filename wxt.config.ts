import { defineConfig } from "wxt";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Help Me Bevo",
    version: "5.0.1",
    description: "Tired of being demotivated to get assignments done?\n",
    permissions: ["storage"],
    action: {
      default_title: "Help Me Bevo",
      default_icon: {
        "16": "/icon/16.png",
        "32": "/icon/32.png",
        "48": "/icon/48.png",
        "128": "/icon/128.png",
      },
    },
    web_accessible_resources: [
      {
        resources: ["wrapped/index.html"],
        matches: [
          "https://*.instructure.com/*",
          "https://www.gradescope.com/*",
          "https://classroom.google.com/*",
        ],
      },
    ],
    browser_specific_settings: {
      gecko: {
        id: "{aa86d078-cb8b-43cf-9b8f-55edb7afee52}",
      },
    },
    icons: {
      "16": "/icon/16.png",
      "32": "/icon/32.png",
      "48": "/icon/48.png",
      "128": "/icon/128.png",
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  }),
});
