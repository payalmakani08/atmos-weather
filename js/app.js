
/* ==========================================
   ATMOS WEATHER
   Main JavaScript
   Features:
   - City search
   - Current weather
   - Hourly and 7-day forecast
   - Air quality
   - Sunrise and sunset
   - Weather tips
   - Favorite cities
   - Celsius / Fahrenheit
   - Wind unit settings
   - Working light / dark mode
   - NO location access
========================================== */

const API = "https://api.open-meteo.com/v1/forecast";
const GEO_API = "https://geocoding-api.open-meteo.com/v1/search";
const AIR_API = "https://air-quality-api.open-meteo.com/v1/air-quality";

const $ = id => document.getElementById(id);

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const DEFAULT_PLACE = {
  name: "Delhi",
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: "Asia/Kolkata"
};

const DEFAULT_SETTINGS = {
  temperature: "celsius",
  wind: "kmh",
  theme: "light"
};

let currentPlace = read("atmosPlace", DEFAULT_PLACE);
let currentWeather = null;

/* ==========================================
   SETTINGS
========================================== */

function preferences() {
  const stored = read("atmosSettings", {});

  // Remove the old autoLocation setting.
  // The application no longer uses device location.
  return {
    ...DEFAULT_SETTINGS,
    ...stored
  };
}


function applyTheme() {
  let settings = {};

  try {
    settings = JSON.parse(
      localStorage.getItem("atmosSettings") || "{}"
    );
  } catch (error) {
    settings = {};
  }

  const isDark = settings.theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  document.body.classList.toggle("dark", isDark);

  document.documentElement.style.colorScheme =
    isDark ? "dark" : "light";
}


function temperature(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "--°";
  }

  const settings = preferences();

  const result = settings.temperature === "fahrenheit"
    ? Number(value) * 9 / 5 + 32
    : Number(value);

  const unit = settings.temperature === "fahrenheit" ? "F" : "C";

  return `${Math.round(result)}°${unit}`;
}

function wind(value) {
  if (value == null || !Number.isFinite(Number(value))) {
    return "--";
  }

  const settings = preferences();
  let result = Number(value);
  let unit = "km/h";

  if (settings.wind === "ms") {
    result /= 3.6;
    unit = "m/s";
  } else if (settings.wind === "mph") {
    result /= 1.60934;
    unit = "mph";
  }

  return `${Math.round(result * 10) / 10} ${unit}`;
}

/* ==========================================
   WEATHER INFORMATION
========================================== */

function weatherInfo(code, isDay = true) {
  if (code === 0) {
    return {
      text: "Clear sky",
      icon: isDay ? "☀️" : "🌙"
    };
  }

  if (code === 1) {
    return {
      text: "Mainly clear",
      icon: isDay ? "🌤️" : "☁️"
    };
  }

  if (code === 2) {
    return { text: "Partly cloudy", icon: "⛅" };
  }

  if (code === 3) {
    return { text: "Overcast", icon: "☁️" };
  }

  if ([45, 48].includes(code)) {
    return { text: "Foggy", icon: "🌫️" };
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return { text: "Drizzle", icon: "🌦️" };
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: "Rain", icon: "🌧️" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snow", icon: "❄️" };
  }

  if ([95, 96, 99].includes(code)) {
    return { text: "Thunderstorm", icon: "⛈️" };
  }

  return {
    text: "Conditions unavailable",
    icon: "🌡️"
  };
}

/* ==========================================
   API REQUESTS
========================================== */

async function fetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      "Weather data could not be loaded. Please try again."
    );
  }

  return response.json();
}

async function findCity(query) {
  const url =
    `${GEO_API}?name=${encodeURIComponent(query)}` +
    "&count=1&language=en&format=json";

  const data = await fetchJSON(url);

  if (!data.results || !data.results.length) {
    throw new Error(
      "City not found. Check the spelling and try again."
    );
  }

  const place = data.results[0];

  return {
    name: [
      place.name,
      place.admin1,
      place.country
    ]
      .filter(Boolean)
      .filter((value, index, array) =>
        array.indexOf(value) === index
      )
      .join(", "),

    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "auto"
  };
}

async function getWeather(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "auto",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",

    current:
      "temperature_2m,relative_humidity_2m," +
      "apparent_temperature,is_day,precipitation," +
      "weather_code,wind_speed_10m",

    hourly:
      "temperature_2m,relative_humidity_2m," +
      "precipitation_probability,weather_code," +
      "wind_speed_10m,visibility,uv_index",

    daily:
      "weather_code,temperature_2m_max," +
      "temperature_2m_min,sunrise,sunset," +
      "uv_index_max,precipitation_probability_max," +
      "wind_speed_10m_max"
  });

  return fetchJSON(`${API}?${params}`);
}

async function getAirQuality(place) {
  try {
    const params = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone || "auto",
      current: "us_aqi"
    });

    const data = await fetchJSON(`${AIR_API}?${params}`);

    return data.current?.us_aqi ?? null;
  } catch {
    return null;
  }
}

/* ==========================================
   PAGE HELPERS
========================================== */

function setText(id, value) {
  const element = $(id);

  if (element) {
    element.textContent = value;
  }
}

function setStatus(message, error = false) {
  const element = $("statusMessage");

  if (!element) return;

  element.textContent = message;
  element.classList.toggle("error", error);
}

function displayTime(value) {
  return value ? value.slice(11, 16) : "--:--";
}

function localHour(value) {
  return value ? value.slice(11, 16) : "--:--";
}

function getHourlyIndices(data, limit = 6) {
  const times = data.hourly?.time || [];
  const currentTime = data.current?.time || "";

  let start = times.findIndex(time => time >= currentTime);

  if (start < 0) start = 0;

  return Array.from(
    { length: Math.min(limit, times.length - start) },
    (_, index) => start + index
  );
}

/* ==========================================
   HOURLY FORECAST
========================================== */

function renderHourly(data) {
  const box = $("hourlyForecast");

  if (!box) return;

  const indices = getHourlyIndices(data, 24);

  if (!indices.length) {
    box.textContent = "Hourly forecast is unavailable.";
    return;
  }

  box.innerHTML = "";

  indices.forEach(index => {
    const hour = data.hourly;
    const info = weatherInfo(hour.weather_code[index]);

    const item = document.createElement("article");
    item.className = "hour-item";

    item.innerHTML = `
      <div class="hour-time">
        ${localHour(hour.time[index])}
      </div>

      <div class="hour-icon">${info.icon}</div>

      <strong>
        ${temperature(hour.temperature_2m[index])}
      </strong>

      <small>
        ${hour.precipitation_probability?.[index] ?? 0}% rain
      </small>
    `;

    box.appendChild(item);
  });
}

/* ==========================================
   WEEKLY FORECAST PREVIEW
========================================== */

function renderWeekly(data) {
  const box = $("weeklyPreview");

  if (!box) return;

  box.innerHTML = "";

  const daily = data.daily;

  if (!daily?.time?.length) {
    box.textContent = "Daily forecast is unavailable.";
    return;
  }

  daily.time.forEach((date, index) => {
    const info = weatherInfo(daily.weather_code[index]);

    const day = new Date(`${date}T12:00:00`)
      .toLocaleDateString("en", {
        weekday: "short"
      });

    const item = document.createElement("article");
    item.className = "day-preview";

    item.innerHTML = `
      <div class="day-name">
        ${index === 0 ? "Today" : day}
      </div>

      <div class="day-icon">${info.icon}</div>

      <strong>
        ${temperature(daily.temperature_2m_max[index])}
      </strong>

      <small>
        ${temperature(daily.temperature_2m_min[index])}
      </small>
    `;

    box.appendChild(item);
  });
}

/* ==========================================
   WEATHER TIPS
========================================== */

function weatherTip(code, temp, rain, uv) {
  if ([95, 96, 99].includes(code)) {
    return [
      "Stormy conditions",
      "Stay indoors if possible during thunderstorms " +
      "and follow local weather alerts."
    ];
  }

  if (
    rain > 50 ||
    [61, 63, 65, 80, 81, 82].includes(code)
  ) {
    return [
      "Carry an umbrella",
      "Rain is possible. Carry an umbrella and allow " +
      "extra time for your journey."
    ];
  }

  if (uv >= 6) {
    return [
      "Take care in the sun",
      "UV levels may be high. Use sun protection " +
      "and take breaks in the shade."
    ];
  }

  if (temp >= 35) {
    return [
      "Keep cool",
      "Drink water regularly and limit strenuous " +
      "outdoor activity during the hottest hours."
    ];
  }

  if (temp <= 8) {
    return [
      "Dress for the cold",
      "Consider an extra layer if you plan to " +
      "spend time outside."
    ];
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return [
      "Watch for icy areas",
      "Dress warmly and check local travel " +
      "conditions before setting out."
    ];
  }

  return [
    "A little planning goes a long way",
    "Check the hourly forecast before heading " +
    "out and enjoy your day."
  ];
}

/* ==========================================
   LOAD AND DISPLAY WEATHER
========================================== */

async function loadPlace(place) {
  if (!place) place = DEFAULT_PLACE;

  setStatus(`Loading weather for ${place.name}…`);

  try {
    const data = await getWeather(place);

    currentPlace = place;
    currentWeather = data;

    save("atmosPlace", place);

    const current = data.current;
    const daily = data.daily;

    const info = weatherInfo(
      current.weather_code,
      current.is_day === 1
    );

    setText("cityName", place.name);

    setText(
      "weatherDate",
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long"
      })
    );

    const displayedTemp = temperature(current.temperature_2m);
    setText(
      "temperature",
      displayedTemp.replace(/[°CF]/g, "")
    );

    const tempElement = $("temperature");

    if (tempElement?.nextElementSibling) {
      tempElement.nextElementSibling.textContent =
        preferences().temperature === "fahrenheit"
          ? "°F"
          : "°C";
    }

    setText("condition", info.text);
    setText("weatherIcon", info.icon);

    setText(
      "feelsLike",
      temperature(current.apparent_temperature)
    );

    setText(
      "detailFeelsLike",
      temperature(current.apparent_temperature)
    );

    setText(
      "humidity",
      `${current.relative_humidity_2m}%`
    );

    setText(
      "windSpeed",
      wind(current.wind_speed_10m)
    );

    setText(
      "uvIndex",
      daily.uv_index_max?.[0] ?? "--"
    );

    setText(
      "sunrise",
      displayTime(daily.sunrise?.[0])
    );

    setText(
      "sunset",
      displayTime(daily.sunset?.[0])
    );

    const hourIndex = getHourlyIndices(data, 1)[0];
    const visibility = data.hourly.visibility?.[hourIndex];

    setText(
      "visibility",
      visibility == null
        ? "-- km"
        : `${(visibility / 1000).toFixed(1)} km`
    );

    setText(
      "highTemp",
      temperature(daily.temperature_2m_max?.[0])
    );

    setText(
      "lowTemp",
      temperature(daily.temperature_2m_min?.[0])
    );

    // Air quality
    const aqi = await getAirQuality(place);

    setText(
      "airQuality",
      aqi == null ? "Unavailable" : String(aqi)
    );

    let aqiNote = "Data not available";

    if (aqi != null) {
      if (aqi <= 50) {
        aqiNote = "Good · US AQI";
      } else if (aqi <= 100) {
        aqiNote = "Moderate · US AQI";
      } else if (aqi <= 150) {
        aqiNote = "Unhealthy for sensitive groups";
      } else if (aqi <= 200) {
        aqiNote = "Unhealthy · US AQI";
      } else if (aqi <= 300) {
        aqiNote = "Very unhealthy · US AQI";
      } else {
        aqiNote = "Hazardous · US AQI";
      }
    }

    setText("airQualityNote", aqiNote);

    // Weather advice
    const tip = weatherTip(
      current.weather_code,
      current.temperature_2m,
      daily.precipitation_probability_max?.[0] ?? 0,
      daily.uv_index_max?.[0] ?? 0
    );

    setText("tipTitle", tip[0]);
    setText("weatherTip", tip[1]);

    // Forecast sections
    renderHourly(data);
    renderWeekly(data);

    // Favorite button
    updateFavoriteButton();

    // Weather-based background
    if (window.setWeatherBackground) {
      window.setWeatherBackground(current.weather_code);
    }

    setStatus("Weather updated successfully.");
  } catch (error) {
    setStatus(
      error.message || "Could not load weather. Please try again.",
      true
    );
  }
}

/* ==========================================
   FAVORITE CITIES
========================================== */

function savedCities() {
  return read("atmosFavorites", []);
}

function updateFavoriteButton() {
  const button = $("favoriteButton");

  if (!button) return;

  const isSaved = savedCities().some(place =>
    place.name === currentPlace.name ||
    (
      place.latitude === currentPlace.latitude &&
      place.longitude === currentPlace.longitude
    )
  );

  button.textContent = isSaved ? "♥" : "♡";

  button.classList.toggle("saved", isSaved);

  button.setAttribute(
    "aria-label",
    isSaved
      ? "Remove city from favorites"
      : "Add city to favorites"
  );
}

function toggleFavorite() {
  let cities = savedCities();

  const exists = cities.some(place =>
    place.latitude === currentPlace.latitude &&
    place.longitude === currentPlace.longitude
  );

  cities = exists
    ? cities.filter(place =>
        !(
          place.latitude === currentPlace.latitude &&
          place.longitude === currentPlace.longitude
        )
      )
    : [...cities, currentPlace];

  save("atmosFavorites", cities);

  updateFavoriteButton();

  setStatus(
    exists
      ? "City removed from favorites."
      : "City added to favorites."
  );
}

async function renderFavorites() {
  const list = $("favoriteList");

  if (!list) return;

  const cities = savedCities();

  setText(
    "favoriteCount",
    `${cities.length} ${cities.length === 1 ? "CITY" : "CITIES"}`
  );

  list.innerHTML = "";

  if (!cities.length) {
    list.innerHTML = `
      <div class="empty-state">
        <h2>No saved cities yet</h2>
        <p>
          Add a city above or use the heart on the
          home page to save a place.
        </p>
        <a class="text-link" href="index.html">
          Go to home →
        </a>
      </div>
    `;

    return;
  }

  for (const city of cities) {
    const card = document.createElement("article");

    card.className = "card favorite-card";

    card.innerHTML = `
      <div class="favorite-top">
        <div>
          <h3></h3>
          <p class="favorite-condition">
            Loading conditions…
          </p>
        </div>

        <span class="favorite-temp">--°</span>
      </div>

      <div class="favorite-actions">
        <button class="button" type="button">
          View weather
        </button>

        <button class="button button-secondary" type="button">
          Remove
        </button>
      </div>
    `;

    card.querySelector("h3").textContent = city.name;

    card.querySelectorAll("button")[0].addEventListener(
      "click",
      () => {
        save("atmosPlace", city);
        window.location.href = "index.html";
      }
    );

    card.querySelectorAll("button")[1].addEventListener(
      "click",
      () => {
        save(
          "atmosFavorites",
          savedCities().filter(place =>
            !(
              place.latitude === city.latitude &&
              place.longitude === city.longitude
            )
          )
        );

        renderFavorites();
      }
    );

    list.appendChild(card);

    try {
      const data = await getWeather(city);

      const info = weatherInfo(
        data.current.weather_code,
        data.current.is_day === 1
      );

      card.querySelector(".favorite-temp").textContent =
        temperature(data.current.temperature_2m);

      card.querySelector(".favorite-condition").textContent =
        `${info.icon} ${info.text}`;
    } catch {
      card.querySelector(".favorite-condition").textContent =
        "Weather unavailable";
    }
  }
}

/* ==========================================
   SETTINGS PAGE
========================================== */

function initSettings() {
  const temp = $("temperatureUnit");

  // Settings controls only exist on settings.html.
  if (!temp) return;

  const windSelect = $("windUnit");
  const themeSelect = $("themeSelect");
  const status = $("settingsStatus");

  const settings = preferences();

  if (windSelect) windSelect.value = settings.wind;
  if (themeSelect) themeSelect.value = settings.theme;

  temp.value = settings.temperature;

  const saveButton = $("saveSettings");
  const resetButton = $("resetSettings");

  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const updated = {
        temperature: temp.value,
        wind: windSelect?.value || "kmh",
        theme: themeSelect?.value || "light"
      };

      save("atmosSettings", updated);

      applyTheme();

      // Refresh the current weather with the new units.
      if (currentWeather && currentPlace) {
        loadPlace(currentPlace);
      }

      if (status) {
        status.textContent =
          "Your preferences have been saved.";
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      save("atmosSettings", DEFAULT_SETTINGS);

      temp.value = DEFAULT_SETTINGS.temperature;

      if (windSelect) {
        windSelect.value = DEFAULT_SETTINGS.wind;
      }

      if (themeSelect) {
        themeSelect.value = DEFAULT_SETTINGS.theme;
      }

      applyTheme();

      if (currentWeather && currentPlace) {
        loadPlace(currentPlace);
      }

      if (status) {
        status.textContent = "Settings have been reset.";
      }
    });
  }
}

/* ==========================================
   INITIALIZE THE APPLICATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Apply the stored theme on every page.
  applyTheme();

  // Initialize settings if this is settings.html.
  initSettings();

  /*
    Navigation:
    background.js handles the mobile menu toggle.
    Do not add a second menu listener here.
  */

  // City search — no device location access.
  const searchForm = $("searchForm");

  if (searchForm) {
    searchForm.addEventListener("submit", async event => {
      event.preventDefault();

      const input = $("cityInput");
      const query = input?.value.trim();

      if (!query) {
        setStatus("Please enter a city name.", true);
        return;
      }

      setStatus(`Searching for ${query}…`);

      try {
        const place = await findCity(query);
        await loadPlace(place);
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }
const favoriteButton = $("favoriteButton");

  if (favoriteButton) {
    favoriteButton.addEventListener(
      "click",
      toggleFavorite
    );
  }

  // Add a city to favorites from the favorites page.
  const favoriteSearchForm = $("favoriteSearchForm");

  if (favoriteSearchForm) {
    favoriteSearchForm.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        const input = $("favoriteCityInput");
        const query = input?.value.trim();

        if (!query) return;

        try {
          const place = await findCity(query);
          const cities = savedCities();

          const alreadySaved = cities.some(city =>
            city.latitude === place.latitude &&
            city.longitude === place.longitude
          );

          if (alreadySaved) {
            setText(
              "favoriteStatus",
              "That city is already saved."
            );
            return;
          }
          save("atmosFavorites", [...cities, place]);

          input.value = "";

          setText(
            "favoriteStatus",
            `${place.name} added to favorites.`
          );

          renderFavorites();
        } catch (error) {
          setText(
            "favoriteStatus",
            error.message
          );
        }
      }
    );
  }

  // Render favorites page.
  if ($("favoriteList")) {
    renderFavorites();
  }

  /*
    Load the last searched city or Delhi by default.
    This does not request or access device location.
  */
  if ($("temperature") || $("searchForm")) {
    const savedPlace = read("atmosPlace", DEFAULT_PLACE);

    currentPlace = savedPlace;

    loadPlace(savedPlace);
  }

  // Local clock, if the page contains it.
  if ($("localTime")) {
    const updateTime = () => {
      setText(
        "localTime",
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      );
    };
    updateTime();
    setInterval(updateTime, 60000);
  }

  // Today's date label, if present.
  if ($("todayLabel")) {
    setText(
      "todayLabel",
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).toUpperCase()
    );
  }
});

