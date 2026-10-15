
const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const FORECAST_GEO = "https://geocoding-api.open-meteo.com/v1/search";

const byId = id => document.getElementById(id);
const getSaved = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};

function forecastSettings() {
  return getSaved("atmosSettings", {
    temperature: "celsius", wind: "kmh", theme: "light"
  });
}

function fmtTemp(value) {
  if (value == null) return "--";
  const s = forecastSettings();
  const n = s.temperature === "fahrenheit" ? value * 9 / 5 + 32 : value;
  return `${Math.round(n)}°${s.temperature === "fahrenheit" ? "F" : "C"}`;
}

function fmtWind(value) {
  if (value == null) return "--";
  const s = forecastSettings();
  if (s.wind === "ms") return `${(value / 3.6).toFixed(1)} m/s`;
  if (s.wind === "mph") return `${(value / 1.60934).toFixed(1)} mph`;
  return `${Math.round(value)} km/h`;
}

function forecastWeather(code) {
  if (code === 0) return ["Clear sky", "☀️"];
  if (code === 1) return ["Mainly clear", "🌤️"];
  if (code === 2) return ["Partly cloudy", "⛅"];
  if (code === 3) return ["Overcast", "☁️"];
  if ([45, 48].includes(code)) return ["Fog", "🌫️"];
  if ([51, 53, 55, 56, 57].includes(code)) return ["Drizzle", "🌦️"];
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return ["Rain", "🌧️"];
  if ([71, 73, 75, 77, 85, 86].includes(code)) return ["Snow", "❄️"];
  if ([95, 96, 99].includes(code)) return ["Thunderstorm", "⛈️"];
  return ["Unavailable", "🌡️"];
}

async function requestForecast(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not retrieve weather data. Please try again.");
  return response.json();
}

async function forecastFindCity(query) {
  const data = await requestForecast(`${FORECAST_GEO}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
  if (!data.results?.length) throw new Error("City not found. Please check the spelling.");
  const p = data.results[0];
  return {
    name: [p.name, p.admin1, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", "),
    latitude: p.latitude,
    longitude: p.longitude,
    timezone: p.timezone || "auto"
  };
}

async function forecastGetData(place) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "auto",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    current: "temperature_2m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset",
    hourly: "temperature_2m,weather_code,precipitation_probability,wind_speed_10m"
  });
  return requestForecast(`${FORECAST_API}?${params}`);
}

function forecastStatus(message, error = false) {
  const el = byId("statusMessage");
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", error);
}

function buildDailyTable(data) {
  const body = byId("forecastTableBody");
  const d = data.daily;
  body.innerHTML = "";

  d.time.forEach((date, i) => {
    const [condition, icon] = forecastWeather(d.weather_code[i]);
    const day = i === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${day}</strong><br><small class="muted">${date}</small></td>
      <td><div class="table-weather"><span>${icon}</span><span>${condition}</span></div></td>
      <td><strong>${fmtTemp(d.temperature_2m_max[i])}</strong> / ${fmtTemp(d.temperature_2m_min[i])}</td>
      <td>${d.precipitation_probability_max?.[i] ?? "--"}%</td>
      <td>${fmtWind(d.wind_speed_10m_max?.[i])}</td>`;
    body.appendChild(row);
  });
}

function buildHourlyTable(data) {
  const body = byId("hourlyTableBody");
  const h = data.hourly;
  body.innerHTML = "";
  let start = h.time.findIndex(t => t >= data.current.time);
  if (start < 0) start = 0;

  for (let i = start; i < Math.min(start + 24, h.time.length); i++) {
    const [condition, icon] = forecastWeather(h.weather_code[i]);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${h.time[i].slice(11, 16)}</td>
      <td><div class="table-weather"><span>${icon}</span><span>${condition}</span></div></td>
      <td><strong>${fmtTemp(h.temperature_2m[i])}</strong></td>
      <td>${h.precipitation_probability?.[i] ?? "--"}%</td>
      <td>${fmtWind(h.wind_speed_10m[i])}</td>`;
    body.appendChild(row);
  }
}

function buildTemperatureChart(data) {
  const chart = byId("temperatureChart");
  const highs = data.daily.temperature_2m_max;
  const lows = data.daily.temperature_2m_min;
  const dates = data.daily.time;
  const all = [...highs, ...lows].filter(Number.isFinite);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = Math.max(1, max - min);

  chart.innerHTML = "";
  dates.forEach((date, i) => {
    const day = i === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
    const left = ((lows[i] - min) / range) * 75;
    const width = Math.max(8, ((highs[i] - lows[i]) / range) * 75);

    const row = document.createElement("div");
    row.className = "chart-row";
    row.innerHTML = `
      <span>${day}</span>
      <div class="chart-bar-track" title="Low ${fmtTemp(lows[i])}, high ${fmtTemp(highs[i])}">
        <div class="chart-bar" style="margin-left:${left}%;width:${Math.min(width, 100 - left)}%"></div>
      </div>
      <span class="chart-range">${fmtTemp(highs[i])} / ${fmtTemp(lows[i])}</span>`;
    chart.appendChild(row);
  });
}

async function loadForecast(place) {
  forecastStatus(`Loading forecast for ${place.name}…`);
  try {
    const data = await forecastGetData(place);
    byId("cityName").textContent = place.name;
    byId("summaryIcon").textContent = forecastWeather(data.current.weather_code)[1];
    byId("summaryTemp").textContent = fmtTemp(data.current.temperature_2m);
    byId("forecastSummary").textContent = forecastWeather(data.current.weather_code)[0] +
      " · Updated " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    buildDailyTable(data);
    buildHourlyTable(data);
    buildTemperatureChart(data);

    localStorage.setItem("atmosPlace", JSON.stringify(place));
    if (window.setWeatherBackground) window.setWeatherBackground(data.current.weather_code);
    forecastStatus("Forecast updated successfully.");
  } catch (error) {
    forecastStatus(error.message || "Unable to load the forecast.", true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.toggle("dark", forecastSettings().theme === "dark");

  const toggle = byId("menuToggle");
  const nav = byId("navigation");
  if (toggle && nav) toggle.addEventListener("click", () => nav.classList.toggle("open"));

  let place = getSaved("atmosPlace", {
    name: "Delhi", latitude: 28.6139, longitude: 77.2090, timezone: "Asia/Kolkata"
  });
  loadForecast(place);

  byId("searchForm").addEventListener("submit", async event => {
    event.preventDefault();
    const query = byId("cityInput").value.trim();
    if (!query) return;
    try {
      place = await forecastFindCity(query);
      await loadForecast(place);
    } catch (error) {
      forecastStatus(error.message, true);
    }
  });

  byId("locationButton").addEventListener("click", () => {
    if (!navigator.geolocation) {
      forecastStatus("Location is not supported by your browser.", true);
      return;
    }
    forecastStatus("Requesting location permission…");
    navigator.geolocation.getCurrentPosition(async position => {
      place = {
        name: "My location",
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timezone: "auto"
      };
      await loadForecast(place);
    }, () => forecastStatus("Location permission was denied or unavailable.", true), { timeout: 10000 });
  });
});
       
