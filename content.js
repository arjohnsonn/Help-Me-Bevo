const videoURL = "https://aidenjohnson.dev/Images/Bevo.mp4";
const fullVideoURL = "https://aidenjohnson.dev/Images/BevoCrop.mp4";
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
var assignments = true;
var quizzes = false;
var other = true;
var fullScreen = true;

/**
 * LOAD SETTINGS
 */

load("enabled", function (value) {
  if (value == null) {
    value = true;
  }

  enabled = value;
});

load("assignments", function (value) {
  if (value == null) {
    value = true;
  }

  assignments = value;
});

load("quizzes", function (value) {
  if (value == null) {
    value = true;
  }

  quizzes = value;
});

load("other", function (value) {
  if (value == null) {
    value = true;
  }

  other = value;
});

load("fullScreen", function (value) {
  if (value == null) {
    value = true;
  }

  fullScreen = value;
});

load("volume", function (value) {
  if (value == null) {
    value = volume;
    save("volume", volume);
  }

  value = clamp(value, 0, 1);

  updateVolume([null, value]);
});

/**
 * EVENTS & LISTENERS
 */

const listenerFuncs = {
  play: displayBevo,
  print: log,
  updateVolume: updateVolume,
  toggle: toggle,
  addSubmit: addSubmit,
  changeValue: changeValue,
};

video.addEventListener("ended", () => {
  videoOverlay.classList.remove("show");
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request == null) return;

  console.log(request);
  const action = request[0];
  if (listenerFuncs[action]) {
    listenerFuncs[action](request);
  } else {
    console.log(request);
  }
});

/**
 * ATTACHING TO BUTTONS
 */

// Regular Assignments
waitForElm("#submit-button").then((elm) => {
  initButton(elm, "assignments");
});

// Quizzes
waitForElm("#submit_quiz_button").then((elm) => {
  initButton(elm, "quizzes");
});

// Dynamically loaded Submit buttons
const bodyElement = document.body;
const config = { childList: true, subtree: true };

const callback = (mutationList, observer) => {
  for (const mutation of mutationList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "BUTTON") {
          if (isSubmitButton(node)) initButton(node, "other");
        } else if (node.nodeType === 1) {
          // nodeType 1 is an Element

          const buttons = node.querySelectorAll("button");

          buttons.forEach((button) => {
            if (isSubmitButton(button)) {
              initButton(button, "other");
            }
          });
        }
      });
    }
  }
};

const observer = new MutationObserver(callback);
observer.observe(bodyElement, config);

/**
 * FUNCTIONS
 */

function changeValue(data) {
  variable = data[1];
  value = data[2];

  switch (variable) {
    case "assignments":
      assignments = value;
    case "quizzes":
      quizzes = value;
    case "other":
      other = value;
    case "fullScreen":
      fullScreen = value;
  }
}

function isSubmitButton(element) {
  if (element.textContent == null) return false;

  return element.textContent.trim().includes("Submit");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function displayBevo(type) {
  if (!enabled) return;
  if (type == "assignments" && !assignments) return;
  if (type == "quizzes" && !quizzes) return;
  if (type == "other" && !other) return;

  video.style.width = fullScreen ? "100%" : "90%";

  video.src = fullScreen ? fullVideoURL : videoURL;
  video.pause();

  setTimeout(() => {
    videoOverlay.classList.add("show");
    video.play();
  }, 100);
}

function log(message) {
  console.log(message[1]);
}

function updateVolume(value) {
  value = value[1];
  volume = clamp(value, 0, 1);

  video.volume = volume;
}

function toggle(value) {
  value = value[1];

  enabled = value;
}

function initButton(button, type) {
  if (button != null) {
    document.removeEventListener("mousemove", initButton);

    button.addEventListener("click", () => {
      if (!button.disabled) {
        // Action to be performed when the button is clicked
        displayBevo(type);
      }
    });
  }

  if (debug) console.log(`Initiated ${type}`);
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
  chrome.storage.local.set({ [key]: value }).then(() => {
    if (debug) console.log("Saved " + key + ": " + value);
  });
}

function load(key, callback) {
  chrome.storage.local.get([key]).then((result) => {
    value = result[key];

    callback(value);
  });
}

if (debug) {
  function addSubmit() {
    // For debugging
    addDiv(`<button
      id="play"
      style="z-index:99999; padding: 10px 10px 10px 10px; position: absolute"
    >
      Submit
    </button>`);
  }

  function addDiv(overlayHTML) {
    // For debugging
    const innerHTML = overlayHTML;

    const overlayElement = document.createElement("div");
    overlayElement.innerHTML = innerHTML;
    document.body.appendChild(overlayElement);
  }
}

console.log("content.js loaded");
