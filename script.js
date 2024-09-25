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

const settingsDivs = document.querySelectorAll(".settings");
const contentDiv = document.getElementById("content");
const assignmentSlider = document.getElementById("assignments");
const quizzesSlider = document.getElementById("quizzes");
const otherSlider = document.getElementById("other");
const fullScreenSlider = document.getElementById("fullScreen");
const classroomSlider = document.getElementById("classroom");
const gradescopeSlider = document.getElementById("gradescope");

const sliderSaveKeys = {
  [assignmentSlider]: "assignments",
  [quizzesSlider]: "quizzes",
  [otherSlider]: "other",
  [fullScreenSlider]: "fullScreen",
  [classroomSlider]: "classroom",
  [gradescopeSlider]: "gradescope",
};

const sliders = [
  assignmentSlider,
  quizzesSlider,
  otherSlider,
  fullScreenSlider,
  classroomSlider,
  gradescopeSlider,
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
/**
 * OTHER
 */

const quote = document.getElementById("random-quote");
const quotes = [
  "Hook 'Em!",
  "UT > A&M",
  "OU still sucks btw",
  "can we please pet bevo",
  "natty bounddd",
  "what is an aggie?😭",
  "fix the big ticket system pls",
];

quote.textContent = quotes[Math.floor(Math.random() * quotes.length)];

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
  toggleButton.innerHTML = `${enabled ? "ON" : "OFF"}`;
  toggleButton.style.backgroundColor = enabled ? "#22c55e" : "#f87171";

  settingsDivs.forEach((element) => {
    if (enabled) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });

  contentDiv.style.opacity = enabled ? 1 : 0.5;

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

    // Debugging
    console.log(value);
    console.trace();
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
