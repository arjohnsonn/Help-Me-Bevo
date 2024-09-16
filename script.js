const debug = false;

// Init play button
if (debug) {
  const play = document.getElementById("play");

  play.addEventListener("click", () => {
    debug ? sendMessage(["play"]) : null;
  });
}
// Volume Slider
var slider = document.getElementById("volumeSlider");
var output = document.getElementById("volumeOutput");

load("volume", function (value) {
  sendMessage(["print", value]);
  output.innerHTML = `Volume: ${value}`;
  slider.value = value;

  debug ? sendMessage(["updateVolume", Number(value)]) : null;
});

slider.oninput = function () {
  output.innerHTML = `Volume: ${this.value}`;

  debug ? sendMessage(["updateVolume", Number(this.value)]) : null;
};

slider.addEventListener("mouseup", function () {
  save("volume", this.value);
});

// Toggle

var toggleButton = document.getElementById("toggle");
var enabled = true;
load("enabled", function (value) {
  if (!value || value == null) {
    enabled = true;
  }

  debug ? sendMessage(["print", value]) : null;
  enabled = value;

  updateToggle();
});

toggleButton.addEventListener("click", () => {
  enabled = !enabled;
  save("enabled", enabled);

  updateToggle();
});

debug ? sendMessage(["print", "script.js loaded"]) : null;

// Functions
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function updateToggle() {
  toggleButton.innerHTML = `<b> Extension: ${enabled ? "ON" : "OFF"}</b>`;
  toggleButton.style.backgroundColor = enabled ? "#8aff88" : "#ff8888";

  debug ? sendMessage(["toggle", enabled]) : null;
}

function sendMessage(message) {
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const response = await chrome.tabs.sendMessage(tab.id, message);
    } catch (e) {
      debug
        ? sendMessage(["print", "script.js sendMessage error: " + e])
        : null;
    }
  })();
}

function save(key, value) {
  chrome.storage.sync.set({ [key]: value }).then(() => {
    debug ? sendMessage(["print", "Saved " + key + ": " + value]) : null;
  });
}

function load(key, callback) {
  chrome.storage.sync.get([key]).then((result) => {
    debug
      ? sendMessage(["print", "Value of " + key + " is " + result[key]])
      : null;

    value = result[key];

    callback(value);
  });
}
