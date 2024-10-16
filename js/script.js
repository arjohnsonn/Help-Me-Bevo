const debug = false;

/**
 * VOLUME
 */
var slider = document.getElementById("volumeSlider");
var output = document.getElementById("volumeOutput");

// Should load 0-1
load("volume", function (value) {
  if (value == null) {
    value = 0.5;
    save("volume", value);
  } else if (value > 1) {
    value = clamp(value / 100, 0, 1);
  }

  output.innerHTML = `Volume: ${value * 100}`;
  slider.value = value * 100;

  sendMessage(["updateVolume", Number(value)]);
});

slider.oninput = function () {
  output.innerHTML = `Volume: ${this.value}`;

  sendMessage(["updateVolume", Number(this.value / 100)]);
};

slider.addEventListener("mouseup", function () {
  save("volume", this.value / 100);
});

/**
 * MAIN TOGGLER
 */
var toggleButton = document.getElementById("toggle");
var enabled = true;
load("enabled", function (value) {
  if (value == null) {
    value = true;
  }

  if (debug) sendMessage(["print", value]);
  enabled = value;

  updateToggle();
});

toggleButton.addEventListener("click", () => {
  enabled = !enabled;
  save("enabled", enabled);

  updateToggle();
});

/**
 * OTHER SETTINGS
 */

const contentDiv = document.querySelectorAll("#content");
const assignmentSlider = document.getElementById("assignments");
const quizzesSlider = document.getElementById("quizzes");
const discussionsSlider = document.getElementById("discussions");
const otherSlider = document.getElementById("other");
const fullScreenSlider = document.getElementById("fullScreen");
const classroomSlider = document.getElementById("classroom");
const gradescopeSlider = document.getElementById("gradescope");
const themedSlider = document.getElementById("themedAnims");

const sliderSaveKeys = {
  [assignmentSlider]: "assignments",
  [quizzesSlider]: "quizzes",
  [discussionsSlider]: "discussions",
  [otherSlider]: "other",
  [fullScreenSlider]: "fullScreen",
  [classroomSlider]: "classroom",
  [gradescopeSlider]: "gradescope",
  [themedSlider]: "themedAnims",
};

const sliders = [
  assignmentSlider,
  quizzesSlider,
  discussionsSlider,
  otherSlider,
  fullScreenSlider,
  classroomSlider,
  gradescopeSlider,
  themedSlider,
];

sliders.forEach((settingSlider) => {
  settingSlider.addEventListener("change", () => {
    const value = settingSlider.checked;
    const saveKey = settingSlider.id;

    if (saveKey) save(saveKey, value);

    sendMessage(["changeValue", saveKey, value]);
  });
});

load("assignments", function (value) {
  if (value == null) {
    value = true;

    save("assignments", true);
  }

  updateSlider(assignmentSlider, value);
});

load("quizzes", function (value) {
  if (value == null) {
    value = false;

    save("quizzes", false);
  }

  updateSlider(quizzesSlider, value);
});

load("discussions", function (value) {
  if (value == null) {
    value = true;

    save("discussions", true);
  }

  updateSlider(discussionsSlider, value);
});

load("other", function (value) {
  if (value == null) {
    value = true;

    save("other", true);
  }

  updateSlider(otherSlider, value);
});

load("fullScreen", function (value) {
  if (value == null) {
    value = true;

    save("fullScreen", true);
  }

  updateSlider(fullScreenSlider, value);
});

load("classroom", function (value) {
  if (value == null) {
    value = true;

    save("classroom", true);
  }

  updateSlider(classroomSlider, value);
});

load("gradescope", function (value) {
  if (value == null) {
    value = true;

    save("gradescope", true);
  }

  updateSlider(gradescopeSlider, value);
});

load("themedAnims", function (value) {
  if (value == null) {
    value = true;

    save("themedAnims", true);
  }

  updateSlider(themedSlider, value);
});
/**
 * OTHER
 */

const quote = document.getElementById("random-quote");
const staticUrl = "https://aidenjohnson.dev/Hosts/help-me-bevo-quotes.json";
fetch(staticUrl)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok " + response.statusText);
    }
    return response.json();
  })
  .then((data) => {
    const quotes = data.quotes;
    quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

/**
 * EXTENSIONS
 */

const extensionButton = document.getElementById("extensionbutton");
const extensionMain = document.getElementById("extensions");
const extensionDiv = document.getElementById("extensionsdiv");
const extensionBack = document.getElementById("extensionback");
const main = document.getElementById("main");

extensionButton.addEventListener("click", () => {
  main.classList.add("animate-in");
  main.classList.remove("animate-out");
  extensionMain.classList.remove("animate-out");
  extensionMain.classList.add("animate-in");
  extensionDiv.classList.remove("pointer-events-none");
});

extensionBack.addEventListener("click", () => {
  main.classList.add("animate-out");
  main.classList.remove("animate-in");
  extensionMain.classList.remove("animate-in");
  extensionMain.classList.add("animate-out");
  extensionDiv.classList.add("pointer-events-none");
});

/**
 * FUNCTIONS
 */

function updateSlider(element, value) {
  element.checked = value;
  element.dispatchEvent(new Event("change"));

  sendMessage(["changeValue", element, value]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function updateToggle() {
  toggleButton.innerHTML = enabled ? "ON" : "OFF";
  toggleButton.style.backgroundColor = enabled ? "#22c55e" : "#f87171";

  for (const element of contentDiv) {
    element.style.opacity = enabled ? 1 : 0.5;
    element.style.pointerEvents = enabled ? "auto" : "none";
  }

  sendMessage(["toggle", enabled]);
}

function sendMessage(message) {
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });

      await chrome.tabs.sendMessage(tab.id, message);
    } catch (e) {
      if (debug) sendMessage(["print", "script.js sendMessage error: " + e]);
    }
  })();
}

function save(key, value) {
  if (key == "volume" && value > 1) {
    value = clamp(value / 100, 0, 1);
  }

  chrome.storage.local.set({ [key]: value }).then(() => {
    if (debug) sendMessage(["print", "Saved " + key + ": " + value]);
  });
}

function load(key, callback) {
  chrome.storage.local.get([key]).then((result) => {
    if (debug) sendMessage(["print", "Value of " + key + " is " + result[key]]);

    value = result[key];

    callback(value);
  });
}

// Debugging
if (debug) {
  const element = document.createElement("div");
  element.innerHTML = `<button
      id="play"
      style="background-color: #ffa600; padding: 10px 10px 10px 10px"
    >
      Submit
    </button>`;
  document.body.appendChild(element);

  const play = document.getElementById("play");

  play.addEventListener("click", () => {
    sendMessage(["play"]);
  });

  // Add Testing Submit Button
  const addSubmit = document.createElement("div");
  addSubmit.innerHTML = `<button
      id="addSubmit"
      style="padding: 10px 10px 10px 10px"
    >
      Add
    </button>`;
  document.body.appendChild(addSubmit);

  const addSubmitButton = document.getElementById("addSubmit");

  addSubmitButton.addEventListener("click", () => {
    sendMessage(["addSubmit"]);
  });
}
