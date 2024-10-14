const MEASUREMENT_ID = chrome.runtime.getManifest().env.measurement_id;
const API_SECRET = chrome.runtime.getManifest().env.api_secret;
const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 6000;
const SESSION_EXPIRATION_IN_MIN = 5;

async function send(request) {
  fetch(
    `${GA_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
    {
      method: "POST",
      body: JSON.stringify({
        client_id: await getOrCreateClientId(),
        events: [
          {
            name: request,
            params: {
              session_id: await getOrCreateSessionId(),
              engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
            },
          },
        ],
      }),
    }
  ).then((response) => {
    console.log(request + " " + response.ok);
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  send(request);
});

let internalUrl = chrome.runtime.getURL("html/landing.html");
chrome.runtime.onInstalled.addListener(function (object) {
  console.log(object.reason);
  send("testinstall");
  if (object.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: internalUrl }, function (tab) {
      console.log("Installation detected");
    });
  }
});

async function getOrCreateClientId() {
  const result = await chrome.storage.local.get("clientId");
  let clientId = result.clientId;
  if (!clientId) {
    // Generate a unique client ID, the actual value is not relevant
    clientId = self.crypto.randomUUID();
    await chrome.storage.local.set({ clientId });
  }

  return clientId;
}

async function getOrCreateSessionId() {
  // Store session in memory storage
  let { sessionData } = await chrome.storage.session.get("sessionData");
  // Check if session exists and is still valid
  const currentTimeInMs = Date.now();
  if (sessionData && sessionData.timestamp) {
    // Calculate how long ago the session was last updated
    const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
    // Check if last update lays past the session expiration threshold
    if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
      // Delete old session id to start a new session
      sessionData = null;
    } else {
      // Update timestamp to keep session alive
      sessionData.timestamp = currentTimeInMs;
      await chrome.storage.session.set({ sessionData });
    }
  }
  if (!sessionData) {
    // Create and store a new session
    sessionData = {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs.toString(),
    };
    await chrome.storage.session.set({ sessionData });
  }
  return sessionData.session_id;
}

console.log(
  "Vars: " +
    (MEASUREMENT_ID != null && API_SECRET != null ? "Loaded" : "Not Loaded")
);
