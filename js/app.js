
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
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

let currentPlace = read("atmosPlace", {
  name: "Delhi", latitude: 28.6139, longitude: 77.2090, timezone: "auto"
});
let currentWeather = null;

function preferences() {
  return read("atmosSettings", {
    temperature: "celsius", wind: "kmh", theme: "light", autoLocation: false
  });
}

function temperature(value) {
  if (value == null || !Number.isFinite(Number(value))) return "--°";
  const settings = preferences();
  const result = settings.temperature === "fahrenheit"
    ? Number(value) * 9 / 5 + 32
    : Number(value);
  return `${Math.round(result)}°${settings.temperature === "fahrenheit" ? "F" : "C"}`;
}

function wind(value) {
  if (value == null || !Number.isFinite(Number(value))) return "--";
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

function weatherInfo(code, isDay = true) {
  if (code === 0) return { text: "Clear sky", icon: isDay ? "☀️" : "🌙" };
  if (code === 1) return { text: "Mainly clear", icon: isDay ? "🌤️" : "☁️" };
  if (code === 2) return { text: "Partly cloudy", icon: "⛅" };
  if (code === 3) return { text: "Overcast", icon: "☁️" };
  if ([45, 48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: "Rain", icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: "Snow", icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Conditions unavailable", icon: "🌡️" };
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data could not be loaded. Please try again.");
  return response.json();
}

async function findCity(query) {
  const url = `${GEO_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const data = await fetchJSON(url);
  if (!data.results?.length) throw new Error("City not found. Check the spelling and try again.");
  const p = data.results[0];
  return {
    name: [p.name, p.admin1, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", "),
    latitude: p.latitude,
    longitude: p.longitude,
    timezone: p.timezone || "auto"
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
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,relative_humidity_2m,precipitation_probability,weather_code,wind_speed_10m,visibility,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max"
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

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function setStatus(message, error = false) {
  const element = $("statusMessage");
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", error);
}

function displayTime(value) {
  if (!value) return "--:--";
  return value.slice(11, 16);
}

function localHour(value) {
  return value ? value.slice(11, 16) : "--:--";
}

function getHourlyIndices(data, limit = 6) {
  const times = data.hourly?.time || [];
  const currentTime = data.current?.time || "";
  let start = times.findIndex(time => time >= currentTime);
  if (start < 0) start = 0;
  return Array.from({ length: Math.min(limit, times.length - start) }, (_, i) => start + i);
}

function renderHourly(data) {
  const box = $("hourlyForecast");
  if (!box) return;
  const indices = getHourlyIndices(data, 24);
  if (!indices.length) {
    box.textContent = "Hourly forecast is unavailable.";
    return;
  }

  box.innerHTML = "";
  indices.forEach(i => {
    const hour = data.hourly;
    const info = weatherInfo(hour.weather_code[i]);
    const item = document.createElement("article");
    item.className = "hour-item";
    item.innerHTML = `
      <div class="hour-time">${localHour(hour.time[i])}</div>
      <div class="hour-icon">${info.icon}</div>
      <strong>${temperature(hour.temperature_2m[i])}</strong>
      <small>${hour.precipitation_probability?.[i] ?? 0}% rain</small>`;
    box.appendChild(item);
  });
}

function renderWeekly(data) {
  const box = $("weeklyPreview");
  if (!box) return;
  box.innerHTML = "";
  const daily = data.daily;
  if (!daily?.time?.length) {
    box.textContent = "Daily forecast is unavailable.";
    return;
  }

  daily.time.forEach((date, i) => {
    const info = weatherInfo(daily.weather_code[i]);
    const day = new Date(`${date}T12:00:00`).toLocaleDateString("en", { weekday: "short" });
    const item = document.createElement("article");
    item.className = "day-preview";
    item.innerHTML = `
      <div class="day-name">${i === 0 ? "Today" : day}</div>
      <div class="day-icon">${info.icon}</div>
      <strong>${temperature(daily.temperature_2m_max[i])}</strong>
      <small>${temperature(daily.temperature_2m_min[i])}</small>`;
    box.appendChild(item);
  });
}

function weatherTip(code, temp, rain, uv) {
  if ([95, 96, 99].includes(code)) return ["Stormy conditions", "Stay indoors if possible during thunderstorms and follow local weather alerts."];
  if (rain > 50 || [61, 63, 65, 80, 81, 82].includes(code)) return ["Carry an umbrella", "Rain is possible. Carry an umbrella and allow extra time for your journey."];
  if (uv >= 6) return ["Take care in the sun", "UV levels may be high. Use sun protection and take breaks in the shade."];
  if (temp >= 35) return ["Keep cool", "Drink water regularly and limit strenuous outdoor activity during the hottest hours."];
  if (temp <= 8) return ["Dress for the cold", "Consider an extra layer if you plan to spend time outside."];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["Watch for icy areas", "Dress warmly and check local travel conditions before setting out."];
  return ["A little planning goes a long way", "Check the hourly forecast before heading out and enjoy your day."];
}

async function loadPlace(place) {
  setStatus("Loading weather for " + place.name + "…");
  try {
    const data = await getWeather(place);
    currentPlace = place;
    currentWeather = data;
    save("atmosPlace", place);

    const current = data.current;
    const daily = data.daily;
    const info = weatherInfo(current.weather_code, current.is_day === 1);

    setText("cityName", place.name);
    setText("weatherDate", new Date().toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long"
    }));
    setText("temperature", temperature(current.temperature_2m).replace(/[°CF]/g, ""));
    const tempElement = $("temperature");
    if (tempElement) {
      const degree = tempElement.nextElementSibling;
      if (degree) degree.textContent = preferences().temperature === "fahrenheit" ? "°F" : "°C";
    }
    setText("condition", info.text);
    setText("weatherIcon", info.icon);
    setText("feelsLike", temperature(current.apparent_temperature));
    setText("detailFeelsLike", temperature(current.apparent_temperature));
    setText("humidity", `${current.relative_humidity_2m}%`);
    setText("windSpeed", wind(current.wind_speed_10m));
    setText("uvIndex", daily.uv_index_max?.[0] ?? "--");
    setText("sunrise", displayTime(daily.sunrise?.[0]));
    setText("sunset", displayTime(daily.sunset?.[0]));
    setText("visibility", (() => {
      const hour = getHourlyIndices(data, 1)[0];
      const value = data.hourly.visibility?.[hour];
      return value == null ? "-- km" : `${(value / 1000).toFixed(1)} km`;
    })());
    setText("highTemp", temperature(daily.temperature_2m_max?.[0]));
    setText("lowTemp", temperature(daily.temperature_2m_min?.[0]));

    const aqi = await getAirQuality(place);
    setText("airQuality", aqi == null ? "Unavailable" : String(aqi));
    setText("airQualityNote", aqi == null ? "Data not available" :
      aqi <= 50 ? "Good · US AQI" :
      aqi <= 100 ? "Moderate · US AQI" :
      aqi <= 150 ? "Unhealthy for sensitive groups" :
      aqi <= 200 ? "Unhealthy · US AQI" :
      aqi <= 300 ? "Very unhealthy · US AQI" : "Hazardous · US AQI");

    const tip = weatherTip(current.weather_code, current.temperature_2m,
      daily.precipitation_probability_max?.[0] ?? 0, daily.uv_index_max?.[0] ?? 0);
    setText("tipTitle", tip[0]);
    setText("weatherTip", tip[1]);
    renderHourly(data);
    renderWeekly(data);
    updateFavoriteButton();
    if (window.setWeatherBackground) window.setWeatherBackground(current.weather_code);
    setStatus("Weather updated successfully.");
  } catch (error) {
    setStatus(error.message || "Could not load weather. Please try again.", true);
  }
}

function savedCities() {
  return read("atmosFavorites", []);
}

function updateFavoriteButton() {
  const button = $("favoriteButton");
  if (!button) return;
  const isSaved = savedCities().some(p =>
    p.name === currentPlace.name ||
    (p.latitude === currentPlace.latitude && p.longitude === currentPlace.longitude)
  );
  button.textContent = isSaved ? "♥" : "♡";
  button.classList.toggle("saved", isSaved);
  button.setAttribute("aria-label", isSaved ? "Remove city from favorites" : "Add city to favorites");
}

function toggleFavorite() {
  let cities = savedCities();
  const exists = cities.some(p => p.name === currentPlace.name);
  cities = exists ? cities.filter(p => p.name !== currentPlace.name) : [...cities, currentPlace];
  save("atmosFavorites", cities);
  updateFavoriteButton();
  setStatus(exists ? "City removed from favorites." : "City added to favorites.");
}

async function useLocation() {
  if (!navigator.geolocation) {
    setStatus("Location is not supported by this browser. Search for a city instead.", true);
    return;
  }
  setStatus("Requesting location permission…");
  navigator.geolocation.getCurrentPosition(async position => {
    const p = {
      name: "My location",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timezone: "auto"
    };
    await loadPlace(p);
  }, () => setStatus("Location permission was denied or unavailable. You can search for a city instead.", true),
  { timeout: 10000, maximumAge: 300000 });
}

function initNavigation() {
  const toggle = $("menuToggle");
  const nav = $("navigation");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));
}

function applyTheme() {
  document.body.classList.toggle("dark", preferences().theme === "dark");
}

function initSettings() {
  const temp = $("temperatureUnit");
  if (!temp) return;
  const settings = preferences();
  temp.value = settings.temperature;
  $("windUnit").value = settings.wind;
  $("themeSelect").value = settings.theme;
  $("autoLocation").checked = settings.autoLocation;

  $("saveSettings").addEventListener("click", () => {
    save("atmosSettings", {
      temperature: temp.value,
      wind: $("windUnit").value,
      theme: $("themeSelect").value,
      autoLocation: $("autoLocation").checked
    });
    applyTheme();
    setText("settingsStatus", "Preferences saved. Weather displays will use your new units.");
  });

  $("resetSettings").addEventListener("click", () => {
    const defaults = { temperature: "celsius", wind: "kmh", theme: "light", autoLocation: false };
    save("atmosSettings", defaults);
    temp.value = defaults.temperature;
    $("windUnit").value = defaults.wind;
    $("themeSelect").value = defaults.theme;
    $("autoLocation").checked = false;
    applyTheme();
    setText("settingsStatus", "Settings have been reset.");
  });
}

async function renderFavorites() {
  const list = $("favoriteList");
  if (!list) return;
  const cities = savedCities();
  setText("favoriteCount", `${cities.length} ${cities.length === 1 ? "CITY" : "CITIES"}`);
  list.innerHTML = "";

  if (!cities.length) {
    list.innerHTML = '<div class="empty-state"><h2>No saved cities yet</h2><p>Add a city above or use the heart on the home page to save a place.</p><a class="text-link" href="index.html">Go to home →</a></div>';
    return;
  }

  for (const city of cities) {
    const card = document.createElement("article");
    card.className = "card favorite-card";
    card.innerHTML = `<div class="favorite-top"><div><h3></h3><p class="favorite-condition">Loading conditions…</p></div><span class="favorite-temp">--°</span></div><div class="favorite-actions"><button class="button" type="button">View weather</button><button class="button button-secondary" type="button">Remove</button></div>`;
    card.querySelector("h3").textContent = city.name;
    card.querySelectorAll("button")[0].addEventListener("click", () => {
      save("atmosPlace", city);
      window.location.href = "index.html";
    });
    card.querySelectorAll("button")[1].addEventListener("click", () => {
      save("atmosFavorites", savedCities().filter(p => p.name !== city.name));
      renderFavorites();
    });
    list.appendChild(card);

    try {
      const data = await getWeather(city);
      const info = weatherInfo(data.current.weather_code, data.current.is_day === 1);
      card.querySelector(".favorite-temp").textContent = temperature(data.current.temperature_2m);
      card.querySelector(".favorite-condition").textContent = `${info.icon} ${info.text}`;
    } catch {
      card.querySelector(".favorite-condition").textContent = "Weather unavailable";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  applyTheme();
  initSettings();

  if ($("searchForm")) {
    $("searchForm").addEventListener("submit", async event => {
      event.preventDefault();
      const query = $("cityInput").value.trim();
      if (!query) return;
      setStatus("Searching for " + query + "…");
      try {
        const place = await findCity(query);
        await loadPlace(place);
      } catch (error) {
        setStatus(error.message, true);
      }
    });
  }

  if ($("locationButton")) $("locationButton").addEventListener("click", useLocation);
  if ($("favoriteButton")) $("favoriteButton").addEventListener("click", toggleFavorite);

  if ($("favoriteSearchForm")) {
    $("favoriteSearchForm").addEventListener("submit", async event => {
      event.preventDefault();
      const query = $("favoriteCityInput").value.trim();
      if (!query) return;
      try {
        const place = await findCity(query);
        const cities = savedCities();
        if (cities.some(p => p.name === place.name)) {
          setText("favoriteStatus", "That city is already saved.");
          return;
        }
        save("atmosFavorites", [...cities, place]);
        $("favoriteCityInput").value = "";
        setText("favoriteStatus", `${place.name} added to favorites.`);
        renderFavorites();
      } catch (error) {
        setText("favoriteStatus", error.message);
      }
    });
  }

  if ($("favoriteList")) renderFavorites();

  if ($("temperature") || $("searchForm")) {
    const savedPlace = read("atmosPlace", currentPlace);
    currentPlace = savedPlace;
    if (preferences().autoLocation && $("searchForm")) useLocation();
    else loadPlace(savedPlace);
  }

  if ($("localTime")) {
    const updateTime = () => setText("localTime", new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    updateTime();
    setInterval(updateTime, 60000);
  }

  if ($("todayLabel")) setText("todayLabel", new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase());
});
                                                                    
