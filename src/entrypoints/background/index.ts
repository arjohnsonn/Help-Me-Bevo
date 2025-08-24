import { browser, defineBackground } from "#imports";

export default defineBackground(() => {

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "openWrapped") {
      const wrappedUrl = browser.runtime.getURL("/wrapped.html");
      browser.tabs.create({ url: wrappedUrl });
      sendResponse({ success: true });
      return true;
    }

    if (typeof message === "string") {
      console.log(`Analytics event: ${message}`);


      sendResponse({ received: true });
    }

    return true; // Keep the message channel open for async response
  });
});
