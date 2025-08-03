import { browser, defineBackground } from "#imports";

export default defineBackground(() => {
  console.log("Help Me Bevo background script loaded", { id: browser.runtime.id });

  // Handle messages from content script for analytics and wrapped page
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle opening wrapped page
    if (message === "openWrapped") {
      const wrappedUrl = browser.runtime.getURL("wrapped.html");
      browser.tabs.create({ url: wrappedUrl });
      sendResponse({ success: true });
      return true;
    }
    
    // Log analytics events
    if (typeof message === "string") {
      console.log(`Analytics event: ${message}`);
      
      // You can add actual analytics implementation here
      // For example, sending to Google Analytics, Mixpanel, etc.
      
      // Acknowledge the message
      sendResponse({ received: true });
    }
    
    return true; // Keep the message channel open for async response
  });
});
