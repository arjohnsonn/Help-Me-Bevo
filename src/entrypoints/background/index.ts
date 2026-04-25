import { browser, defineBackground, storage } from "#imports";

interface SessionData {
  session_id: string;
  timestamp: number;
}

const MEASUREMENT_ID: string = import.meta.env.VITE_MEASUREMENT_ID;
const API_SECRET: string = import.meta.env.VITE_API_SECRET;
const GA_ENDPOINT: string = "https://www.google-analytics.com/mp/collect";

async function getOrCreateClientId(): Promise<string> {
  const clientIdStorage = storage.defineItem<string>("local:clientId");
  let clientId = await clientIdStorage.getValue();
  if (!clientId) {
    clientId = crypto.randomUUID();
    await clientIdStorage.setValue(clientId);
  }
  return clientId;
}

async function getOrCreateSessionId(): Promise<string> {
  const sessionStorage = storage.defineItem<SessionData | null>("session:sessionData", {
    fallback: null
  });
  let sessionData = await sessionStorage.getValue();
  const currentTimeInMs: number = Date.now();

  if (sessionData && sessionData.timestamp) {
    sessionData.timestamp = currentTimeInMs;
    await sessionStorage.setValue(sessionData);
  }
  if (!sessionData) {
    sessionData = {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs,
    };
    await sessionStorage.setValue(sessionData);
  }
  return sessionData.session_id;
}

async function sendToGA(event: string): Promise<void> {
  if (!MEASUREMENT_ID || !API_SECRET) {
    return;
  }

  try {
    const response = await fetch(
      `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: await getOrCreateClientId(),
          events: [
            {
              name: event,
              params: {
                session_id: await getOrCreateSessionId(),
              },
            },
          ],
        }),
      }
    );
  } catch (error) {
    // Silent fail for production
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "openWrapped") {
      const wrappedUrl = browser.runtime.getURL("/wrapped.html");
      browser.tabs.create({ url: wrappedUrl });
      sendResponse({ success: true });
      return true;
    }

    if (message === "quote") {
      // Fetch quote from the API
      (async () => {
        try {
          const response = await fetch(
            "https://www.aidenjohnson.dev/api/help-me-bevo-quotes"
          );
          const data = await response.json();
          sendResponse(data);
        } catch (err) {
          console.error("Error fetching quotes:", err);
          sendResponse("Hook 'em");
        }
      })();
      return true; // Indicate async response
    }

    if (typeof message === "string") {
      sendToGA(message);
      sendResponse({ received: true });
    }

    return true;
  });

  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      sendToGA("install");
    }
    browser.storage.local.remove("wrappedPopupVisible_S25");
  });
});
