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
var classroom = true;
var gradescope = true;
var playing = false;

/**
 * LOAD SETTINGS
 */

load("enabled", true, function (value) {
  enabled = value;
});
load("assignments", true, function (value) {
  assignments = value;
});
load("quizzes", false, function (value) {
  quizzes = value;
});
load("other", true, function (value) {
  other = value;
});
load("fullScreen", true, function (value) {
  fullScreen = value;
});
// Should load 0-1
load("volume", null, function (value) {
  if (value == null) {
    value = volume;
    save("volume", volume);
  }

  value = clamp(value, 0, 1);

  updateVolume([null, value]);
});
load("classroom", true, function (value) {
  classroom = value;
});
load("gradescope", true, function (value) {
  gradescope = value;
});
load("playing", null, function (value) {
  if (value == null) return;

  const time = value[0];
  const wasPlaying = value[1];
  const type = value[2];

  if (wasPlaying && Date.now() / 1000 - time < 4) {
    video.muted = true;
    displayBevo(type);
  } else if (wasPlaying) {
    save("playing", null);
  }
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

document.addEventListener("click", () => {
  if (!playing) return;

  video.muted = false;
});

video.addEventListener("ended", () => {
  videoOverlay.classList.remove("show");
  setPlaying(false);

  video.muted = false;
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
          if (node.id == "submit-button") {
            initButton(node, "assignments");
          } else {
            if (isSubmitButton(node, true, "other")) initButton(node, "other");
          }
        } else if (node.nodeType === 1) {
          // nodeType 1 is an Element

          const buttons = node.querySelectorAll("button");

          buttons.forEach((button) => {
            if (button.id == "submit-button") {
              initButton(button, "assignments");
            } else if (isSubmitButton(button, true, "other")) {
              initButton(button, "other");
            }
          });

          const buttonDivs = document.querySelectorAll('div[role="button"]');
          buttonDivs.forEach((button) => {
            if (isSubmitButton(button, "other")) {
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
    case "classroom":
      classroom = value;
    case "gradescope":
      gradescope = value;
  }
}

const submitTexts = ["Submit", "Upload"];
const classroomText = ["Turn in", "Mark as done"];
const exceptions = ["Submit file using Canvas Files"];
function isSubmitButton(element, isButton, type) {
  if (element.textContent == null || element.id == "submit_quiz_button")
    return false;

  const textContent = element.textContent.trim();

  for (const text of exceptions) {
    if (textContent.includes(text)) return false;
  }

  // Check settings
  for (const text of submitTexts) {
    if (type != "gradescope" && text == "Upload") continue;

    if (textContent.includes(text) && !textContent.includes("Quiz"))
      return true;
  }

  if (!isButton && classroom) {
    for (const text of classroomText) {
      if (element.textContent.trim() == text) return true;
    }
  }

  return false;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function displayBevo(type) {
  if (!enabled || playing) return;
  if (type == "assignments" && !assignments) return;
  if (type == "quizzes" && !quizzes) return;
  if (type == "other" && !other) return;

  video.style.width = fullScreen ? "100%" : "90%";

  video.src = fullScreen ? fullVideoURL : videoURL;
  video.pause();

  setPlaying(true, type);

  setTimeout(() => {
    videoOverlay.classList.add("show");
    video.play();

    analyticSend("bevo");
    analyticSend(type);
  }, 100);
}

function setPlaying(value, type) {
  playing = value;

  save("playing", [Date.now() / 1000, value, type]);
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
    button.addEventListener("click", () => {
      console.log("click");
      displayBevo(type);
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
  if (key == "volume" && value > 1) {
    value = clamp(value / 100, 0, 1);

    // Debugging
    console.log(value);
    console.trace();
  }

  chrome.storage.local.set({ [key]: value }).then(() => {
    if (debug) console.log("Saved " + key + ": " + value);
  });
}

function load(key, defaultValue, callback) {
  chrome.storage.local.get([key]).then((result) => {
    value = result[key];

    if (value == null) {
      value = defaultValue;
    }

    callback(value);
  });
}

function analyticSend(data) {
  chrome.runtime.sendMessage(data);
}

function addSubmit() {
  // For debugging
  addDiv(`<button
    id="submit_quiz_button"
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

console.log("content.js loaded");
