/* =====================================================
   ATMOS WEATHER APP
   Fetch API + Open-Meteo
   ===================================================== */


/* =====================================================
   COMMON FUNCTIONS
   ===================================================== */

function getFavorites() {

    return JSON.parse(
        localStorage.getItem("favorites")
    ) || [];

}


function saveFavorites(favorites) {

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

}


function getRecentCities() {

    return JSON.parse(
        localStorage.getItem("recentCities")
    ) || [];

}


function saveRecentCity(city) {

    let cities = getRecentCities();

    cities = cities.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    cities.unshift(city);

    cities = cities.slice(0, 10);

    localStorage.setItem(
        "recentCities",
        JSON.stringify(cities)
    );

}


/* =====================================================
   WEATHER DESCRIPTION
   ===================================================== */

function getWeatherInfo(code) {

    if (code === 0) {

        return {
            text: "Clear Sky",
            icon: "☀️"
        };

    }


    if (code === 1) {

        return {
            text: "Mainly Clear",
            icon: "🌤️"
        };

    }


    if (code === 2) {

        return {
            text: "Partly Cloudy",
            icon: "⛅"
        };

    }


    if (code === 3) {

        return {
            text: "Overcast",
            icon: "☁️"
        };

    }


    if (code >= 45 && code <= 48) {

        return {
            text: "Foggy",
            icon: "🌫️"
        };

    }


    if (code >= 51 && code <= 67) {

        return {
            text: "Rainy",
            icon: "🌧️"
        };

    }


    if (code >= 71 && code <= 77) {

        return {
            text: "Snowy",
            icon: "❄️"
        };

    }


    if (code >= 80 && code <= 82) {

        return {
            text: "Rain Showers",
            icon: "🌦️"
        };

    }


    if (code >= 95) {

        return {
            text: "Thunderstorm",
            icon: "⛈️"
        };

    }


    return {
        text: "Weather",
        icon: "🌍"
    };

}


/* =====================================================
   FIND CITY
   ===================================================== */

async function findCity(city) {

    const url =
        "https://geocoding-api.open-meteo.com/v1/search" +
        "?name=" +
        encodeURIComponent(city) +
        "&count=1" +
        "&language=en" +
        "&format=json";


    const response = await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to find the city."
        );

    }


    const data = await response.json();


    if (!data.results || data.results.length === 0) {

        throw new Error(
            "City not found. Please check the spelling."
        );

    }


    return data.results[0];

}


/* =====================================================
   GET WEATHER
   ===================================================== */

async function getWeather(latitude, longitude) {

    const url =
        "https://api.open-meteo.com/v1/forecast" +
        "?latitude=" + latitude +
        "&longitude=" + longitude +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code" +
        "&hourly=temperature_2m,weather_code" +
        "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
        "&forecast_days=5" +
        "&timezone=auto";


    const response = await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Weather service is unavailable."
        );

    }


    return await response.json();

}


/* =====================================================
   HOME PAGE
   ===================================================== */

const weatherForm =
    document.getElementById("weatherForm");


if (weatherForm) {

    weatherForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            const cityInput =
                document.getElementById("cityInput");


            const city =
                cityInput.value.trim();


            if (!city) return;


            await searchWeather(city);

        }
    );


    /* Favorite button */

    const favoriteButton =
        document.getElementById(
            "favoriteButton"
        );


    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            addCurrentCityToFavorites
        );

    }


    /* Load city from URL */

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlCity =
        params.get("city");


    if (urlCity) {

        document.getElementById(
            "cityInput"
        ).value = urlCity;


        searchWeather(urlCity);

    }

}


/* =====================================================
   SEARCH WEATHER
   ===================================================== */

async function searchWeather(city) {

    const loading =
        document.getElementById("loading");


    const error =
        document.getElementById("error");


    const card =
        document.getElementById("weatherCard");


    loading.classList.remove("hidden");

    error.classList.add("hidden");

    card.classList.add("hidden");


    try {

        const location =
            await findCity(city);


        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        localStorage.setItem(
            "selectedCity",
            JSON.stringify(location)
        );


        saveRecentCity(
            location.name
        );


        displayWeather(
            location,
            weather
        );


    } catch (err) {

        error.textContent =
            err.message;

        error.classList.remove(
            "hidden"
        );

    }


    loading.classList.add(
        "hidden"
    );

}


/* =====================================================
   DISPLAY WEATHER
   ===================================================== */

function displayWeather(
    location,
    weather
) {

    const current =
        weather.current;


    const info =
        getWeatherInfo(
            current.weather_code
        );


    document.getElementById(
        "cityName"
    ).textContent =
        location.name +
        ", " +
        (location.country || "");


    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(
            current.temperature_2m
        );


    document.getElementById(
        "description"
    ).textContent =
        info.text;


    document.getElementById(
        "weatherIcon"
    ).textContent =
        info.icon;


    document.getElementById(
        "humidity"
    ).textContent =
        current.relative_humidity_2m +
        "%";


    document.getElementById(
        "wind"
    ).textContent =
        Math.round(
            current.wind_speed_10m
        ) +
        " km/h";


    document.getElementById(
        "feelsLike"
    ).textContent =
        Math.round(
            current.apparent_temperature
        ) +
        "°C";


    document.getElementById(
        "weatherCard"
    ).classList.remove(
        "hidden"
    );


    /* Connect Forecast page */

    const forecastLink =
        document.getElementById(
            "forecastLink"
        );


    if (forecastLink) {

        forecastLink.href =
            "forecast.html?city=" +
            encodeURIComponent(
                location.name
            );

    }


    createTemperatureChart(
        weather
    );


    updateFavoriteButton(
        location.name
    );

}


/* =====================================================
   TEMPERATURE CHART
   ===================================================== */

let temperatureChart = null;


function createTemperatureChart(
    weather
) {

    const canvas =
        document.getElementById(
            "temperatureChart"
        );


    if (!canvas) return;


    if (temperatureChart) {

        temperatureChart.destroy();

    }


    const labels =
        weather.hourly.time
        .slice(0, 24)
        .map(
            time =>
                new Date(time)
                .toLocaleTimeString(
                    [],
                    {
                        hour: "numeric"
                    }
                )
        );


    const temperatures =
        weather.hourly.temperature_2m
        .slice(0, 24);


    temperatureChart =
        new Chart(
            canvas.getContext("2d"),
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Temperature °C",

                            data:
                                temperatures,

                            borderColor:
                                "#67e8f9",

                            backgroundColor:
                                "rgba(103,232,249,0.12)",

                            fill: true,

                            tension: 0.4,

                            pointRadius: 4,

                            pointBackgroundColor:
                                "#67e8f9"

                        }

                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: true,

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#ffffff"

                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#94a3b8"

                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            }

                        },

                        y: {

                            ticks: {

                                color:
                                    "#94a3b8"

                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.05)"

                            }

                        }

                    }

                }

            }
        );

}


/* =====================================================
   FAVORITES
   ===================================================== */

function addCurrentCityToFavorites() {

    const selectedCity =
        JSON.parse(
            localStorage.getItem(
                "selectedCity"
            )
        );


    if (!selectedCity) return;


    let favorites =
        getFavorites();


    const city =
        selectedCity.name;


    if (
        !favorites.some(
            item =>
                item.toLowerCase() ===
                city.toLowerCase()
        )
    ) {

        favorites.push(city);

        saveFavorites(
            favorites
        );

        alert(
            city +
            " added to favorites ❤️"
        );

    } else {

        alert(
            city +
            " is already in favorites ❤️"
        );

    }


    updateFavoriteButton(
        city
    );

}


/* =====================================================
   UPDATE FAVORITE BUTTON
   ===================================================== */

function updateFavoriteButton(city) {

    const button =
        document.getElementById(
            "favoriteButton"
        );


    if (!button) return;


    const favorites =
        getFavorites();


    const exists =
        favorites.some(
            item =>
                item.toLowerCase() ===
                city.toLowerCase()
        );


    if (exists) {

        button.textContent =
            "❤️ Saved to Favorites";

    } else {

        button.textContent =
            "❤️ Add to Favorites";

    }

}


/* =====================================================
   FAVORITES PAGE
   ===================================================== */

const favoritesList =
    document.getElementById(
        "favoritesList"
    );


if (favoritesList) {

    displayFavorites();

}


function displayFavorites() {

    const favorites =
        getFavorites();


    if (favorites.length === 0) {

        favoritesList.innerHTML = `

            <div class="empty-state">

                <div>❤️</div>

                <h3>No favorite cities</h3>

                <p>
                    Search a city and add it
                    to your favorites.
                </p>

                <br>

                <a
                    href="index.html"
                    class="primary-btn"
                >
                    🔍 Search City
                </a>

            </div>

        `;

        return;

    }


    favoritesList.innerHTML = "";


    favorites.forEach(
        city => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "favorite-item";


            item.innerHTML = `

                <div>

                    <div class="favorite-city">
                        ❤️ ${city}
                    </div>

                </div>

                <div class="favorite-actions">

                    <a
                        href="index.html?city=${encodeURIComponent(city)}"
                        class="small-button"
                    >
                        🌤️ Weather
                    </a>

                    <button
                        class="small-button"
                        onclick="removeFavorite('${city.replace(/'/g, "\\'")}')"
                    >
                        🗑️ Remove
                    </button>

                </div>

            `;


            favoritesList.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   REMOVE FAVORITE
   ===================================================== */

function removeFavorite(city) {

    let favorites =
        getFavorites();


    favorites =
        favorites.filter(
            item =>
                item.toLowerCase() !==
                city.toLowerCase()
        );


    saveFavorites(
        favorites
    );


    displayFavorites();

}


/* =====================================================
   FORECAST PAGE
   ===================================================== */

const forecastList =
    document.getElementById(
        "forecastList"
    );


if (forecastList) {

    loadForecastPage();

}


async function loadForecastPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    let city =
        params.get("city");


    if (!city) {

        const selected =
            JSON.parse(
                localStorage.getItem(
                    "selectedCity"
                )
            );


        if (selected) {

            city =
                selected.name;

        }

    }


    if (!city) return;


    const loading =
        document.getElementById(
            "forecastLoading"
        );


    const error =
        document.getElementById(
            "forecastError"
        );


    loading.classList.remove(
        "hidden"
    );


    try {

        const location =
            await findCity(city);


        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        document.getElementById(
            "forecastCity"
        ).textContent =
            "📍 " +
            location.name +
            ", " +
            (location.country || "");


        document.getElementById(
            "forecastSubtitle"
        ).textContent =
            "5-day forecast for " +
            location.name;


        displayForecast(
            weather
        );


    } catch (err) {

        error.textContent =
            err.message;

        error.classList.remove(
            "hidden"
        );

    }


    loading.classList.add(
        "hidden"
    );

}


/* =====================================================
   DISPLAY FORECAST
   ===================================================== */

function displayForecast(
    weather
) {

    const daily =
        weather.daily;


    forecastList.innerHTML =
        `<div class="forecast-grid"></div>`;


    const grid =
        forecastList.querySelector(
            ".forecast-grid"
        );


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        const date =
            new Date(
                daily.time[i] +
                "T12:00:00"
            );


        const day =
            date.toLocaleDateString(
                "en-US",
                {
                    weekday: "short"
                }
            );


        const info =
            getWeatherInfo(
                daily.weather_code[i]
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "forecast-day";


        card.innerHTML = `

            <h3>${day}</h3>

            <div class="forecast-icon">
                ${info.icon}
            </div>

            <p>
                ${info.text}
            </p>

            <br>

            <div class="forecast-temp">
                ${Math.round(
                    daily.temperature_2m_max[i]
                )}°C
            </div>

            <div class="forecast-min">
                Low:
                ${Math.round(
                    daily.temperature_2m_min[i]
                )}°C
            </div>

        `;


        grid.appendChild(
            card
        );

    }

}


/* =====================================================
   SETTINGS
   ===================================================== */

function clearFavorites() {

    localStorage.removeItem(
        "favorites"
    );


    alert(
        "All favorite cities have been cleared."
    );

}


function clearRecent() {

    localStorage.removeItem(
        "recentCities"
    );


    alert(
        "Search history has been cleared."
    );

}


function resetApp() {

    const confirmed =
        confirm(
            "Are you sure you want to reset Atmos?"
        );


    if (!confirmed) return;


    localStorage.clear();


    alert(
        "Atmos has been reset."
    );


    window.location.href =
        "index.html";

                }
