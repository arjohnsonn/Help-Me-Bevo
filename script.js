const debug = false;

/**
 * VOLUME
 */
var slider = document.getElementById("volumeSlider");
var output = document.getElementById("volumeOutput");

load("volume", function (value) {
  if (value == null || !value) {
    value = 0.5;
    save("volume", value);
  }

  sendMessage(["print", value]);
  output.innerHTML = `Volume: ${value}`;
  slider.value = value;

  sendMessage(["updateVolume", Number(value)]);
});

slider.oninput = function () {
  output.innerHTML = `Volume: ${this.value}`;

  sendMessage(["updateVolume", Number(this.value / 100)]);
};

slider.addEventListener("mouseup", function () {
  save("volume", this.value);
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
const assignmentSlider = document.getElementById("assignments");
const quizzesSlider = document.getElementById("quizzes");
const otherSlider = document.getElementById("other");

const sliderSaveKeys = {
  [assignmentSlider]: "assignments",
  [quizzesSlider]: "quizzes",
  [otherSlider]: "other",
};

const sliders = [assignmentSlider, quizzesSlider, otherSlider];
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
  toggleButton.innerHTML = `<b> Extension: ${enabled ? "ON" : "OFF"}</b>`;
  toggleButton.style.backgroundColor = enabled ? "#8aff88" : "#ff8888";

  const addition = enabled ? "show" : "hidden";
  const remove = !enabled ? "show" : "hidden";

  settingsDivs.forEach((element) => {
    element.classList.add(addition);
    element.classList.remove(remove);
  });

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
