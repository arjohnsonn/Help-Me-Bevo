const videoURL = "https://aidenjohnson.dev/Images/Bevo.mp4";
const name = "Help Me Bevo"; // Name of Extension
const debug = false;
var volume = 0.5;

// Init Video Element
const overlayHTML = `
  <div id="video-overlay">
    <video id="video" volume="${volume}">
      <source src="${videoURL}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </div>
`;

const overlayElement = document.createElement("div");
overlayElement.innerHTML = overlayHTML;
document.body.appendChild(overlayElement);

const videoDiv = document.getElementById("volumeDiv");
const videoOverlay = document.getElementById("video-overlay");
const video = document.getElementById("video");
var enabled = true;

load("enabled", function (value) {
  enabled = value;

  debug ? console.log(`${name}: ${value}`) : null;
});

load("volume", function (value) {
  value = clamp(value, 0, 1);

  updateVolume([null, value]);
});

// Events

const listenerFuncs = {
  play: displayBevo,
  print: log,
  updateVolume: updateVolume,
  toggle: toggle,
};

video.addEventListener("ended", () => {
  videoOverlay.classList.remove("show");
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == null) return;

  const action = request[0];
  if (listenerFuncs[action]) {
    listenerFuncs[action](request);
  } else {
    console.log(request);
  }
});

waitForElm("#submit-button").then((elm) => {
  initButton();
});

// Functions
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function displayBevo() {
  if (!enabled) return;

  videoOverlay.classList.add("show");
  video.play();
}

function log(message) {
  console.log(message[1]);
}

function updateVolume(value) {
  value = value[1];
  volume = clamp(value / 100, 0, 1);

  video.volume = volume;

  debug ? console.log(video.volume) : null;
  debug ? console.log("Updated volume to " + volume) : null;
}

function toggle(value) {
  value = value[1];

  enabled = value;
}

function initButton() {
  button = document.getElementById("submit-button");

  if (button != null) {
    debug ? console.log(`${name}: Button Found & Loaded`) : null;

    document.removeEventListener("mousemove", initButton);

    button.addEventListener("click", () => {
      console.log(`${name}: Submit clicked!`);
      if (!button.disabled) {
        // Action to be performed when the button is clicked
        displayBevo();
      }
    });
  }
}

// Credits to this post for this function: https://stackoverflow.com/a/61511955
function waitForElm(selector) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function save(key, value) {
  chrome.storage.sync.set({ [key]: value }).then(() => {
    console.log("Saved " + key + ": " + value);
  });
}

function load(key, callback) {
  chrome.storage.sync.get([key]).then((result) => {
    value = result[key];

    callback(value);
  });
}

// -------

debug ? console.log(`${name}: content.js loaded`) : null;
