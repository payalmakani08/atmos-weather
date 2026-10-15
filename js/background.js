
/* ==========================================
   ATMOS WEATHER
   Background, Theme & Navigation Controller
========================================== */

(function () {
  "use strict";

  /* ==========================================
     READ SAVED SETTINGS
  ========================================== */

  function getSettings() {
    try {
      const saved = localStorage.getItem("atmosSettings");

      if (!saved) {
        return {
          temperature: "celsius",
          wind: "kmh",
          theme: "light"
        };
      }

      const settings = JSON.parse(saved);

      return {
        temperature: "celsius",
        wind: "kmh",
        theme: "light",
        ...settings
      };
    } catch (error) {
      return {
        temperature: "celsius",
        wind: "kmh",
        theme: "light"
      };
    }
  }

  /* ==========================================
     APPLY LIGHT / DARK MODE
  ========================================== */

  function applyAtmosTheme() {
    const settings = getSettings();
    const isDark = settings.theme === "dark";

    // Apply theme classes to both HTML and BODY.
    document.documentElement.classList.toggle(
      "dark",
      isDark
    );

    document.body.classList.toggle(
      "dark",
      isDark
    );

    // Tell the browser which color scheme is active.
    document.documentElement.style.colorScheme =
      isDark ? "dark" : "light";

    // Update theme selector if it exists on this page.
    const themeSelect =
      document.getElementById("themeSelect");

    if (
      themeSelect &&
      themeSelect.value !== settings.theme
    ) {
      themeSelect.value = settings.theme;
    }
  }

  // Make this function available to app.js.
  window.applyAtmosTheme = applyAtmosTheme;

  /* ==========================================
     WEATHER-BASED BACKGROUNDS
  ========================================== */

  window.setWeatherBackground = function (code) {
    const body = document.body;

    body.classList.remove(
      "weather-sunny",
      "weather-cloudy",
      "weather-rainy"
    );

    if ([0, 1].includes(code)) {
      body.classList.add("weather-sunny");
    } else if ([2, 3, 45, 48].includes(code)) {
      body.classList.add("weather-cloudy");
    } else if (
      [
        51, 53, 55, 56, 57,
        61, 63, 65, 66, 67,
        71, 73, 75, 77,
        80, 81, 82, 85, 86,
        95, 96, 99
      ].includes(code)
    ) {
      body.classList.add("weather-rainy");
    }
  };

  /* ==========================================
     MOBILE NAVIGATION MENU
  ========================================== */

  function initNavigation() {
    const toggle =
      document.getElementById("menuToggle");

    const navigation =
      document.getElementById("navigation");

    if (!toggle || !navigation) {
      return;
    }

    // Prevent duplicate click handlers.
    if (toggle.dataset.atmosMenuReady === "true") {
      return;
    }

    toggle.dataset.atmosMenuReady = "true";

    toggle.addEventListener("click", function () {
      const isOpen = navigation.classList.toggle("open");

      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    // Close the mobile menu after choosing a link.
    navigation.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", function () {
        navigation.classList.remove("open");

        toggle.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });
  }

  /* ==========================================
     INITIALIZE
  ========================================== */

  function initializeAtmos() {
    applyAtmosTheme();
    initNavigation();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeAtmos
    );
  } else {
    initializeAtmos();
  }

})();
