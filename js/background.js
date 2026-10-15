
(function () {
  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem("atmosSettings")) || {};
    } catch {
      return {};
    }
  }

  function applyTheme() {
    const settings = getSettings();
    document.body.classList.toggle("dark", settings.theme === "dark");
  }

  window.applyAtmosTheme = applyTheme;

  window.setWeatherBackground = function (code) {
    const body = document.body;

    body.classList.remove(
      "weather-sunny",
      "weather-cloudy",
      "weather-rainy"
    );

    if (code === 0 || code === 1) {
      body.classList.add("weather-sunny");
    } else if ([2, 3, 45, 48].includes(code)) {
      body.classList.add("weather-cloudy");
    } else if (
      [51, 53, 55, 56, 57, 61, 63, 65, 66, 67,
       71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(code)
    ) {
      body.classList.add("weather-rainy");
    }
  };

  function start() {
    applyTheme();

    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("navigation");

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        nav.classList.toggle("open");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
