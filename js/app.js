// ==========================================
// ATMOS WEATHER - MAIN APPLICATION
// ==========================================

let temperatureChart = null;

const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");

const weatherCard = document.getElementById("weatherCard");
const loading = document.getElementById("loading");
const errorBox = document.getElementById("error");


// ==========================================
// PAGE LOAD
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadRecentCities();

    const savedCity = localStorage.getItem("selectedCity");

    if (savedCity) {

        try {

            const city = JSON.parse(savedCity);

            cityInput.value = city.name;

            searchWeather(city.name);

        } catch (error) {

            console.log("No saved city.");

        }

    }

});


// ==========================================
// SEARCH FORM
// ==========================================

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) return;

    await searchWeather(city);

});


// ==========================================
// SEARCH WEATHER
// ==========================================

async function searchWeather(city) {

    showLoading();

    hideError();

    try {

        // ----------------------------------
        // CITY SEARCH
        // ----------------------------------

        const geoURL =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=" + encodeURIComponent(city) +
            "&count=1" +
            "&language=en" +
            "&format=json";

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Location search failed.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Try another city.");
        }

        const location = geoData.results[0];
        const forecastButton =
    document.getElementById("forecastButton");

if (forecastButton) {

    forecastButton.href =
        `forecast.html?city=${encodeURIComponent(location.name)}`;

}


        // ----------------------------------
        // WEATHER DATA
        // ----------------------------------

        const weather = await getWeather(
            location.latitude,
            location.longitude
        );


        // ----------------------------------
        // AQI
        // ----------------------------------

        let airQuality = null;

        try {

            airQuality = await getAirQuality(
                location.latitude,
                location.longitude
            );

        } catch (aqiError) {

            console.warn(
                "AQI unavailable:",
                aqiError
            );

        }


        // ----------------------------------
        // SAVE CITY
        // ----------------------------------

        localStorage.setItem(
            "selectedCity",
            JSON.stringify(location)
        );


        localStorage.setItem(
            "selectedWeatherCode",
            String(weather.current.weather_code)
        );


        saveRecentCity(location.name);


        // ----------------------------------
        // DISPLAY
        // ----------------------------------

        displayWeather(
            location,
            weather,
            airQuality
        );


        // ----------------------------------
        // UPDATE 3D BACKGROUND
        // ----------------------------------

        window.dispatchEvent(
            new CustomEvent(
                "weatherChanged",
                {
                    detail: {
                        code:
                            weather.current.weather_code
                    }
                }
            )
        );


    } catch (error) {

        console.error(error);

        showError(error.message);

    } finally {

        hideLoading();

    }

}


// ==========================================
// WEATHER API
// ==========================================

async function getWeather(latitude, longitude) {

    const url =
        "https://api.open-meteo.com/v1/forecast" +

        "?latitude=" + latitude +

        "&longitude=" + longitude +

        "&current=" +
        "temperature_2m," +
        "relative_humidity_2m," +
        "apparent_temperature," +
        "wind_speed_10m," +
        "weather_code," +
        "uv_index," +
        "visibility" +

        "&hourly=" +
        "temperature_2m," +
        "weather_code," +
        "precipitation_probability," +
        "visibility," +
        "uv_index" +

        "&daily=" +
        "weather_code," +
        "temperature_2m_max," +
        "temperature_2m_min," +
        "sunrise," +
        "sunset" +

        "&forecast_days=5" +

        "&timezone=auto";


    const response = await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to load weather data."
        );

    }


    return await response.json();

}


// ==========================================
// AIR QUALITY API
// ==========================================

async function getAirQuality(
    latitude,
    longitude
) {

    const url =
        "https://air-quality-api.open-meteo.com/v1/air-quality" +

        "?latitude=" + latitude +

        "&longitude=" + longitude +

        "&current=" +
        "us_aqi," +
        "european_aqi," +
        "pm2_5," +
        "pm10" +

        "&timezone=auto";


    const response = await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Air quality unavailable."
        );

    }


    return await response.json();

}


// ==========================================
// DISPLAY WEATHER
// ==========================================

function displayWeather(
    location,
    weather,
    airQuality
) {

    weatherCard.classList.remove("hidden");


    const current =
        weather.current;


    // CITY
    document.getElementById(
        "cityName"
    ).textContent =
        location.name +
        ", " +
        (location.country || "");


    // DESCRIPTION
    document.getElementById(
        "description"
    ).textContent =
        getWeatherDescription(
            current.weather_code
        );


    // TEMPERATURE
    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(
            current.temperature_2m
        );


    // FEELS LIKE
    document.getElementById(
        "feelsLike"
    ).textContent =
        Math.round(
            current.apparent_temperature
        ) + "°C";


    // HUMIDITY
    document.getElementById(
        "humidity"
    ).textContent =
        current.relative_humidity_2m +
        "%";


    // WIND
    document.getElementById(
        "wind"
    ).textContent =
        Math.round(
            current.wind_speed_10m
        ) +
        " km/h";


    // WEATHER CODE
    document.getElementById(
        "pressure"
    ).textContent =
        current.weather_code;


    // ICON
    document.getElementById(
        "weatherIcon"
    ).textContent =
        getWeatherIcon(
            current.weather_code
        );


    // EXTRA INFORMATION
    updateWeatherDetails(
        weather,
        airQuality
    );


    // CHART
    createTemperatureChart(weather);


    // FAVORITE BUTTON
    updateFavoriteButton(location.name);

}


// ==========================================
// WEATHER DESCRIPTION
// ==========================================

function getWeatherDescription(code) {

    if (code === 0)
        return "Clear sky ☀️";

    if (code === 1)
        return "Mainly clear 🌤️";

    if (code === 2)
        return "Partly cloudy ⛅";

    if (code === 3)
        return "Overcast ☁️";

    if (code >= 45 && code <= 48)
        return "Foggy 🌫️";

    if (code >= 51 && code <= 55)
        return "Drizzle 🌦️";

    if (code >= 56 && code <= 57)
        return "Freezing drizzle 🧊";

    if (code >= 61 && code <= 65)
        return "Rainy 🌧️";

    if (code >= 66 && code <= 67)
        return "Freezing rain 🧊";

    if (code >= 71 && code <= 77)
        return "Snowy ❄️";

    if (code >= 80 && code <= 82)
        return "Rain showers 🌦️";

    if (code >= 85 && code <= 86)
        return "Snow showers 🌨️";

    if (code >= 95)
        return "Thunderstorm ⛈️";

    return "Weather available";

}


// ==========================================
// WEATHER ICON
// ==========================================

function getWeatherIcon(code) {

    if (code === 0)
        return "☀️";

    if (code <= 3)
        return "⛅";

    if (code <= 48)
        return "🌫️";

    if (code <= 67)
        return "🌧️";

    if (code <= 77)
        return "❄️";

    if (code <= 82)
        return "🌦️";

    if (code <= 86)
        return "🌨️";

    return "⛈️";

}


// ==========================================
// EXTRA DETAILS
// ==========================================

function updateWeatherDetails(
    weather,
    airQuality
) {

    const current =
        weather.current;

    const daily =
        weather.daily;

    const hourly =
        weather.hourly;


    // --------------------------------------
    // AQI
    // --------------------------------------

    const aqi =
        airQuality?.current?.us_aqi;


    document.getElementById(
        "aqiValue"
    ).textContent =
        Number.isFinite(aqi)
            ? Math.round(aqi)
            : "--";


    let aqiLabel =
        "Unavailable";


    if (Number.isFinite(aqi)) {

        if (aqi <= 50)
            aqiLabel = "Good";

        else if (aqi <= 100)
            aqiLabel = "Moderate";

        else if (aqi <= 150)
            aqiLabel =
                "Unhealthy for sensitive groups";

        else if (aqi <= 200)
            aqiLabel = "Unhealthy";

        else if (aqi <= 300)
            aqiLabel = "Very unhealthy";

        else
            aqiLabel = "Hazardous";

    }


    document.getElementById(
        "aqiLabel"
    ).textContent =
        aqiLabel;


    // --------------------------------------
    // SUNRISE
    // --------------------------------------

    document.getElementById(
        "sunriseValue"
    ).textContent =
        formatLocalTime(
            daily.sunrise?.[0]
        );


    // --------------------------------------
    // SUNSET
    // --------------------------------------

    document.getElementById(
        "sunsetValue"
    ).textContent =
        formatLocalTime(
            daily.sunset?.[0]
        );


    // --------------------------------------
    // UV
    // --------------------------------------

    const uv =
        current.uv_index;


    document.getElementById(
        "uvValue"
    ).textContent =
        Number.isFinite(uv)
            ? uv.toFixed(1)
            : "--";


    let uvLabel =
        "Unavailable";


    if (Number.isFinite(uv)) {

        if (uv < 3)
            uvLabel = "Low";

        else if (uv < 6)
            uvLabel = "Moderate";

        else if (uv < 8)
            uvLabel = "High";

        else if (uv < 11)
            uvLabel = "Very high";

        else
            uvLabel = "Extreme";

    }


    document.getElementById(
        "uvLabel"
    ).textContent =
        uvLabel;


    // --------------------------------------
    // CURRENT HOUR
    // --------------------------------------

    const currentHour =
        weather.current.time.slice(0, 13);


    let hourIndex =
        hourly.time.findIndex(
            time =>
                time.slice(0, 13) ===
                currentHour
        );


    if (hourIndex < 0)
        hourIndex = 0;


    // --------------------------------------
    // RAIN PROBABILITY
    // --------------------------------------

    const rain =
        hourly
            .precipitation_probability?.[
                hourIndex
            ];


    document.getElementById(
        "rainValue"
    ).textContent =
        Number.isFinite(rain)
            ? rain + "%"
            : "--";


    // --------------------------------------
    // VISIBILITY
    // --------------------------------------

    const visibility =
        current.visibility;


    document.getElementById(
        "visibilityValue"
    ).textContent =
        Number.isFinite(visibility)
            ? (
                visibility / 1000
            ).toFixed(1) + " km"
            : "--";

}


// ==========================================
// LOCAL TIME
// ==========================================

function formatLocalTime(value) {

    if (!value)
        return "--";


    const date =
        new Date(value);


    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// ==========================================
// TEMPERATURE CHART
// ==========================================

function createTemperatureChart(
    weather
) {

    const canvas =
        document.getElementById(
            "temperatureChart"
        );


    if (!canvas)
        return;


    const ctx =
        canvas.getContext("2d");


    if (temperatureChart) {

        temperatureChart.destroy();

    }


    const labels =
        weather.hourly.time
            .slice(0, 24)
            .map(time => {

                return new Date(
                    time
                ).toLocaleTimeString(
                    [],
                    {
                        hour: "2-digit"
                    }
                );

            });


    const temperatures =
        weather.hourly
            .temperature_2m
            .slice(0, 24);


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            350
        );


    gradient.addColorStop(
        0,
        "rgba(103,232,249,0.30)"
    );


    gradient.addColorStop(
        1,
        "rgba(103,232,249,0.01)"
    );


    temperatureChart =
        new Chart(
            ctx,
            {
                type: "line",

                data: {

                    labels,

                    datasets: [

                        {
                            label:
                                "Temperature °C",

                            data:
                                temperatures,

                            borderColor:
                                "#67e8f9",

                            backgroundColor:
                                gradient,

                            fill: true,

                            tension: 0.45,

                            pointRadius: 3,

                            pointHoverRadius: 7,

                            pointBackgroundColor:
                                "#67e8f9",

                            borderWidth: 2

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    interaction: {
                        intersect: false,
                        mode: "index"
                    },


                    plugins: {

                        legend: {

                            labels: {
                                color: "#dbeafe"
                            }

                        }

                    },


                    scales: {

                        x: {

                            grid: {
                                color:
                                    "rgba(255,255,255,0.05)"
                            },

                            ticks: {
                                color:
                                    "#94a3b8"
                            }

                        },


                        y: {

                            grid: {
                                color:
                                    "rgba(255,255,255,0.05)"
                            },

                            ticks: {

                                color:
                                    "#94a3b8",

                                callback:
                                    value =>
                                        value + "°"

                            }

                        }

                    }

                }

            }
        );

}


// ==========================================
// FAVORITES
// ==========================================

const favoriteButton =
    document.getElementById(
        "favoriteButton"
    );


if (favoriteButton) {

    favoriteButton.addEventListener(
        "click",
        () => {

            const saved =
                localStorage.getItem(
                    "selectedCity"
                );


            if (!saved)
                return;


            const city =
                JSON.parse(saved);


            let favorites =
                JSON.parse(
                    localStorage.getItem(
                        "favorites"
                    )
                ) || [];


            const exists =
                favorites.some(
                    item =>
                        item.name === city.name
                );


            if (exists) {

                favorites =
                    favorites.filter(
                        item =>
                            item.name !==
                            city.name
                    );

            } else {

                favorites.push({
                    name: city.name,
                    latitude:
                        city.latitude,
                    longitude:
                        city.longitude,
                    country:
                        city.country || ""
                });

            }


            localStorage.setItem(
                "favorites",
                JSON.stringify(
                    favorites
                )
            );


            updateFavoriteButton(
                city.name
            );

        }
    );

}


// ==========================================
// FAVORITE BUTTON UI
// ==========================================

function updateFavoriteButton(
    cityName
) {

    if (!favoriteButton)
        return;


    const favorites =
        JSON.parse(
            localStorage.getItem(
                "favorites"
            )
        ) || [];


    const exists =
        favorites.some(
            item =>
                item.name === cityName
        );


    if (exists) {

        favoriteButton.innerHTML =
            "💖 Remove from Favorites";

    } else {

        favoriteButton.innerHTML =
            "❤️ Add to Favorites";

    }

}


// ==========================================
// RECENT SEARCHES
// ==========================================

function saveRecentCity(city) {

    let cities =
        JSON.parse(
            localStorage.getItem(
                "recentCities"
            )
        ) || [];


    cities =
        cities.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    cities.unshift(city);


    cities =
        cities.slice(0, 6);


    localStorage.setItem(
        "recentCities",
        JSON.stringify(cities)
    );


    loadRecentCities();

}


function loadRecentCities() {

    const container =
        document.getElementById(
            "recentCities"
        );


    if (!container)
        return;


    const cities =
        JSON.parse(
            localStorage.getItem(
                "recentCities"
            )
        ) || [];


    container.innerHTML = "";


    if (cities.length === 0) {

        container.innerHTML =
            "<p class='muted'>No recent searches yet.</p>";

        return;

    }


    cities.forEach(city => {

        const button =
            document.createElement(
                "button"
               );


        button.className =
            "recent-city";


        button.textContent =
            "📍 " + city;


        button.addEventListener(
            "click",
            () => {

                cityInput.value =
                    city;

                searchWeather(city);

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );


        container.appendChild(button);

    });

}


// ==========================================
// LOADING
// ==========================================

function showLoading() {

    loading.classList.remove(
        "hidden"
    );

}


function hideLoading() {

    loading.classList.add(
        "hidden"
    );

}


// ==========================================
// ERRORS
// ==========================================

function showError(message) {

    errorBox.textContent =
        "⚠️ " + message;


    errorBox.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );

}
