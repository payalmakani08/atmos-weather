/* ==========================================
   ATMOS WEATHER APP
   Open-Meteo + Fetch API
========================================== */


const API = {

    geocode:
        "https://geocoding-api.open-meteo.com/v1/search",

    weather:
        "https://api.open-meteo.com/v1/forecast",

    air:
        "https://air-quality-api.open-meteo.com/v1/air-quality"

};


/* ==========================================
   DOM
========================================== */

const searchForm =
    document.getElementById("searchForm");

const cityInput =
    document.getElementById("cityInput");

const loading =
    document.getElementById("loading");

const errorBox =
    document.getElementById("error");

const weatherCard =
    document.getElementById("weatherCard");


let currentWeatherData = null;

let temperatureChart = null;


/* ==========================================
   START
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const city =
            params.get("city");

        if (city) {

            cityInput.value = city;

            loadWeather(city);

        }

        renderRecentCities();

    }
);


/* ==========================================
   SEARCH
========================================== */

searchForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const city =
            cityInput.value.trim();

        if (!city) {
            return;
        }

        await loadWeather(city);

    }
);


/* ==========================================
   MAIN WEATHER FUNCTION
========================================== */

async function loadWeather(city) {

    showLoading(true);

    hideError();


    try {

        /* -------------------------------
           LOCATION
        -------------------------------- */

        const location =
            await getLocation(city);


        if (!location) {

            throw new Error(
                "City not found. Please try another city."
            );

        }


        /* -------------------------------
           WEATHER
        -------------------------------- */

        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        /* -------------------------------
           AIR QUALITY
        -------------------------------- */

        const air =
            await getAirQuality(
                location.latitude,
                location.longitude
            );


        currentWeatherData = {

            location,

            weather,

            air

        };


        /* -------------------------------
           RENDER
        -------------------------------- */

        renderWeather(
            location,
            weather,
            air
        );


        /* -------------------------------
           RECENT
        -------------------------------- */

        saveRecentCity(location);

        renderRecentCities();


        /* -------------------------------
           FORECAST LINK
        -------------------------------- */

        const forecastButton =
            document.getElementById(
                "forecastButton"
            );


        if (forecastButton) {

            forecastButton.href =
                `forecast.html?city=${encodeURIComponent(
                    location.name
                )}`;

        }


        /* -------------------------------
           BACKGROUND
        -------------------------------- */

        if (
            window.setWeatherScene &&
            weather.current
        ) {

            window.setWeatherScene(
                weather.current.weather_code,
                weather.current.is_day
            );

        }


    }

    catch(error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to load weather."
        );

    }

    finally {

        showLoading(false);

    }

}


/* ==========================================
   GEOCODING
========================================== */

async function getLocation(city) {

    const url =
        `${API.geocode}?name=${encodeURIComponent(city)}` +
        `&count=1&language=en&format=json`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Unable to find location."
        );

    }


    const data =
        await response.json();


    if (
        !data.results ||
        !data.results.length
    ) {

        return null;

    }


    return data.results[0];

}


/* ==========================================
   WEATHER
========================================== */

async function getWeather(
    latitude,
    longitude
) {

    const currentVariables = [

        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "is_day",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "pressure_msl",
        "surface_pressure",
        "wind_speed_10m",
        "wind_direction_10m",
        "visibility",
        "uv_index"

    ].join(",");


    const hourlyVariables = [

        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation_probability",
        "weather_code",
        "wind_speed_10m",
        "uv_index"

    ].join(",");


    const dailyVariables = [

        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
        "uv_index_max",
        "precipitation_probability_max"

    ].join(",");


    const url =

        `${API.weather}` +

        `?latitude=${latitude}` +

        `&longitude=${longitude}` +

        `&current=${currentVariables}` +

        `&hourly=${hourlyVariables}` +

        `&daily=${dailyVariables}` +

        `&timezone=auto` +

        `&forecast_days=7`;


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Weather service unavailable."
        );

    }


    return await response.json();

}


/* ==========================================
   AIR QUALITY
========================================== */

async function getAirQuality(
    latitude,
    longitude
) {

    const url =

        `${API.air}` +

        `?latitude=${latitude}` +

        `&longitude=${longitude}` +

        `&current=us_aqi,pm2_5,pm10` +

        `&timezone=auto`;


    const response =
        await fetch(url);


    if (!response.ok) {

        return null;

    }


    return await response.json();

}


/* ==========================================
   RENDER WEATHER
========================================== */

function renderWeather(
    location,
    weather,
    air
) {

    const current =
        weather.current;

    const daily =
        weather.daily;


    /* LOCATION */

    document.getElementById(
        "locationName"
    ).textContent =

        `${location.name}, ${
            location.country
        }`;


    /* DESCRIPTION */

    document.getElementById(
        "weatherDescription"
    ).textContent =

        weatherDescription(
            current.weather_code
        );


    /* ICON */

    document.getElementById(
        "weatherIcon"
    ).textContent =

        weatherIcon(
            current.weather_code,
            current.is_day
        );


    /* TEMPERATURE */

    document.getElementById(
        "temperature"
    ).textContent =

        Math.round(
            current.temperature_2m
        );


    /* FEELS */

    const feels =
        Math.round(
            current.apparent_temperature
        );


    document.getElementById(
        "feelsLikeTop"
    ).textContent =
        `${feels}°C`;


    document.getElementById(
        "feelsTop"
    ).textContent =
        `${feels}°C`;


    document.getElementById(
        "feelsLike"
    ).textContent =
        `${feels}°`;


    /* HUMIDITY */

    document.getElementById(
        "humidityTop"
    ).textContent =

        `${current.relative_humidity_2m}%`;


    document.getElementById(
        "humidityValue"
    ).textContent =

        `${current.relative_humidity_2m}%`;


    /* WIND */

    document.getElementById(
        "windTop"
    ).textContent =

        `${Math.round(
            current.wind_speed_10m
        )} km/h`;


    const direction =
        windDirection(
            current.wind_direction_10m
        );


    document.getElementById(
        "windDirectionTop"
    ).textContent =
        direction;


    document.getElementById(
        "windValue"
    ).textContent =

        `${Math.round(
            current.wind_speed_10m
        )} km/h`;


    document.getElementById(
        "windDirection"
    ).textContent =
        direction;


    /* PRESSURE */

    document.getElementById(
        "pressureValue"
    ).textContent =

        `${Math.round(
            current.pressure_msl
        )} hPa`;


    /* VISIBILITY */

    document.getElementById(
        "visibilityValue"
    ).textContent =

        `${(
            current.visibility / 1000
        ).toFixed(1)} km`;


    /* UV */

    const uv =
        Number(
            daily.uv_index_max[0]
        );


    document.getElementById(
        "uvValue"
    ).textContent =
        uv.toFixed(1);


    document.getElementById(
        "uvStatus"
    ).textContent =
        uvStatus(uv);


    /* SUN */

    const sunrise =
        new Date(
            daily.sunrise[0]
        );


    const sunset =
        new Date(
            daily.sunset[0]
        );


    document.getElementById(
        "sunriseValue"
    ).textContent =
        formatTime(sunrise);


    document.getElementById(
        "sunsetValue"
    ).textContent =
        formatTime(sunset);


    document.getElementById(
        "sunriseLarge"
    ).textContent =
        formatTime(sunrise);


    document.getElementById(
        "sunsetLarge"
    ).textContent =
        formatTime(sunset);


    updateSunPosition(
        sunrise,
        sunset
    );


    /* MOON */

    updateMoon(
        location.latitude,
        location.longitude
    );


    /* AQI */

    renderAQI(air);


    /* HOURLY */

    renderHourly(weather);


    /* CHART */

    renderTemperatureChart(weather);


    /* LIFESTYLE */

    renderLifestyle(
        current,
        air
    );


    /* SHOW */

    [
        "weatherCard",
        "aqiSection",
        "detailsSection",
        "sunSection",
        "moonSection",
        "hourlySection",
        "chartSection",
        "lifestyleSection",
        "recentSection"
    ].forEach(id => {

        document.getElementById(
            id
        ).classList.remove("hidden");

    });

}


/* ==========================================
   WEATHER CODE
========================================== */

function weatherDescription(code) {

    if (code === 0)
        return "Clear Sky";

    if ([1,2,3].includes(code))
        return "Partly Cloudy";

    if ([45,48].includes(code))
        return "Foggy";

    if ([51,53,55].includes(code))
        return "Drizzle";

    if ([61,63,65].includes(code))
        return "Rain";

    if ([66,67].includes(code))
        return "Freezing Rain";

    if ([71,73,75,77].includes(code))
        return "Snow";

    if ([80,81,82].includes(code))
        return "Rain Showers";

    if ([85,86].includes(code))
        return "Snow Showers";

    if ([95].includes(code))
        return "Thunderstorm";

    if ([96,99].includes(code))
        return "Thunderstorm + Hail";

    return "Unknown";

}


function weatherIcon(code,isDay=true) {

    if (!isDay)
        return "🌙";

    if (code === 0)
        return "☀️";

    if ([1,2].includes(code))
        return "🌤️";

    if (code === 3)
        return "☁️";

    if ([45,48].includes(code))
        return "🌫️";

    if ([51,53,55].includes(code))
        return "🌦️";

    if ([61,63,65].includes(code))
        return "🌧️";

    if ([66,67].includes(code))
        return "🌧️";

    if ([71,73,75,77].includes(code))
        return "❄️";

    if ([80,81,82].includes(code))
        return "🌦️";

    if ([85,86].includes(code))
        return "🌨️";

    if ([95,96,99].includes(code))
        return "⛈️";

    return "🌤️";

}


/* ==========================================
   WIND DIRECTION
========================================== */

function windDirection(degrees) {

    const directions = [

        "N",
        "NE",
        "E",
        "SE",
        "S",
        "SW",
        "W",
        "NW"

    ];

    return directions[
        Math.round(degrees / 45) % 8
    ];

}


/* ==========================================
   UV
========================================== */

function uvStatus(uv) {

    if (uv <= 2)
        return "Low";

    if (uv <= 5)
        return "Moderate";

    if (uv <= 7)
        return "High";

    if (uv <= 10)
        return "Very High";

    return "Extreme";

}


/* ==========================================
   AQI
========================================== */

function renderAQI(air) {

    if (
        !air ||
        !air.current ||
        air.current.us_aqi == null
    ) {

        return;

    }


    const aqi =
        Math.round(
            air.current.us_aqi
        );


    let label;
    let message;


    if (aqi <= 50) {

        label = "Good";

        message =
            "Air quality is good. Great conditions for outdoor activities.";

    }

    else if (aqi <= 100) {

        label = "Moderate";

        message =
            "Air quality is acceptable for most people.";

    }

    else if (aqi <= 150) {

        label = "Unhealthy for Sensitive Groups";

        message =
            "Sensitive groups should consider reducing prolonged outdoor activity.";

    }

    else if (aqi <= 200) {

        label = "Unhealthy";

        message =
            "Everyone may begin to experience health effects. Consider reducing intense outdoor activity.";

    }

    else if (aqi <= 300) {

        label = "Very Unhealthy";

        message =
            "Health alert. Avoid prolonged outdoor activity.";

    }

    else {

        label = "Hazardous";

        message =
            "Health emergency conditions. Avoid outdoor exposure.";

    }


    document.getElementById(
        "aqiNumber"
    ).textContent =
        aqi;


    document.getElementById(
        "aqiCircleValue"
    ).textContent =
        aqi;


    document.getElementById(
        "aqiLabel"
    ).textContent =
        label;


    document.getElementById(
        "aqiMessage"
    ).textContent =
        message;


    document.getElementById(
        "aqiBarFill"
    ).style.width =

        `${Math.min(
            (aqi / 300) * 100,
            100
        )}%`;

}


/* ==========================================
   HOURLY FORECAST
========================================== */

function renderHourly(weather) {

    const container =
        document.getElementById(
            "hourlyForecast"
        );


    container.innerHTML = "";


    const now =
        new Date();


    let startIndex = 0;


    for (
        let i = 0;
        i < weather.hourly.time.length;
        i++
    ) {

        const hour =
            new Date(
                weather.hourly.time[i]
            );


        if (
            hour >= now
        ) {

            startIndex = i;

            break;

        }

    }


    for (
        let i = startIndex;
        i < startIndex + 12;
        i++
    ) {

        if (
            i >= weather.hourly.time.length
        ) {

            break;

        }


        const time =
            new Date(
                weather.hourly.time[i]
            );


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "hourly-card";


        card.innerHTML = `

            <span class="time">
                ${
                    i === startIndex
                    ? "NOW"
                    : formatHour(time)
                }
            </span>

            <span class="icon">
                ${weatherIcon(
                    weather.hourly.weather_code[i],
                    time.getHours() >= 6 &&
                    time.getHours() < 18
                )}
            </span>

            <strong>
                ${Math.round(
                    weather.hourly.temperature_2m[i]
                )}°
            </strong>

            <small>
                💧 ${
                    weather.hourly.precipitation_probability[i] ?? 0
                }%
            </small>

        `;


        container.appendChild(card);

    }

}


/* ==========================================
   CHART
========================================== */

function renderTemperatureChart(weather) {

    const canvas =
        document.getElementById(
            "temperatureChart"
        );


    if (temperatureChart) {

        temperatureChart.destroy();

    }


    const now =
        new Date();


    let startIndex = 0;


    for (
        let i = 0;
        i < weather.hourly.time.length;
        i++
    ) {

        if (
            new Date(
                weather.hourly.time[i]
            ) >= now
        ) {

            startIndex = i;

            break;

        }

    }


    const times = [];
    const temperatures = [];


    for (
        let i = startIndex;
        i < startIndex + 24;
        i++
    ) {

        if (
            i >= weather.hourly.time.length
        ) {

            break;

        }


        times.push(
            formatHour(
                new Date(
                    weather.hourly.time[i]
                )
            )
        );


        temperatures.push(
            weather.hourly.temperature_2m[i]
        );

    }


    temperatureChart =
        new Chart(
            canvas,
            {

                type:
                    "line",

                data: {

                    labels:
                        times,

                    datasets: [

                        {

                            label:
                                "Temperature °C",

                            data:
                                temperatures,

                            borderColor:
                                "#67e8f9",

                            backgroundColor:
                                "rgba(103,232,249,.12)",

                            fill:
                                true,

                            tension:
                                .4,

                            pointRadius:
                                3,

                            pointBackgroundColor:
                                "#67e8f9"

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "#cbd5e1"

                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#8190a8"

                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,.05)"

                            }

                        },

                        y: {
                             ticks: {

                                color:
                                    "#8190a8"

                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,.05)"

                            }

                        }

                    }

                }

            }

        );

}


/* ==========================================
   SUN POSITION
========================================== */

function updateSunPosition(
    sunrise,
    sunset
) {

    const now =
        new Date();


    const total =
        sunset - sunrise;


    const elapsed =
        now - sunrise;


    let percentage =
        (elapsed / total) * 100;


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    document.getElementById(
        "sunPosition"
    ).style.left =
        `${percentage}%`;

}


/* ==========================================
   MOON
========================================== */

function updateMoon(
    latitude,
    longitude
) {

    if (
        typeof SunCalc ===
        "undefined"
    ) {

        return;

    }


    const date =
        new Date();


    const times =
        SunCalc.getMoonTimes(
            date,
            latitude,
            longitude
        );


    const illumination =
        SunCalc.getMoonIllumination(
            date
        );


    document.getElementById(
        "moonrise"
    ).textContent =

        times.rise
        ? formatTime(times.rise)
        : "--";


    document.getElementById(
        "moonset"
    ).textContent =

        times.set
        ? formatTime(times.set)
        : "--";


    const phase =
        moonPhase(
            illumination.phase
        );


    document.getElementById(
        "moonPhase"
    ).textContent =
        `🌙 ${phase}`;


    document.getElementById(
        "moonVisual"
    ).textContent =
        moonEmoji(
            illumination.phase
        );

}


/* ==========================================
   MOON PHASE
========================================== */

function moonPhase(phase) {

    if (phase < .03)
        return "New Moon";

    if (phase < .22)
        return "Waxing Crescent";

    if (phase < .28)
        return "First Quarter";

    if (phase < .47)
        return "Waxing Gibbous";

    if (phase < .53)
        return "Full Moon";

    if (phase < .72)
        return "Waning Gibbous";

    if (phase < .78)
        return "Last Quarter";

    if (phase < .97)
        return "Waning Crescent";

    return "New Moon";

}


function moonEmoji(phase) {

    if (phase < .03)
        return "🌑";

    if (phase < .25)
        return "🌒";

    if (phase < .5)
        return "🌔";

    if (phase < .75)
        return "🌖";

    if (phase < .97)
        return "🌘";

    return "🌑";

}


/* ==========================================
   LIFESTYLE
========================================== */

function renderLifestyle(
    current,
    air
) {

    const temp =
        current.temperature_2m;


    const rain =
        current.precipitation;


    const wind =
        current.wind_speed_10m;


    const aqi =
        air?.current?.us_aqi ?? 0;


    document.getElementById(
        "outdoorTip"
    ).textContent =

        rain > 1
        ? "Not ideal because of rain"
        : temp > 35
        ? "Avoid prolonged outdoor activity"
        : "Good for outdoor activities";


    document.getElementById(
        "carWashTip"
    ).textContent =

        rain > 1
        ? "Not suitable"
        : "Good conditions";


    document.getElementById(
        "workoutTip"
    ).textContent =

        temp > 35 || aqi > 150
        ? "Indoor workout recommended"
        : "Good for outdoor exercise";


    document.getElementById(
        "mosquitoTip"
    ).textContent =

        current.relative_humidity_2m > 70
        ? "Higher mosquito activity"
        : "Lower mosquito activity";


    document.getElementById(
        "travelTip"
    ).textContent =

        rain > 5 || wind > 40
        ? "Use extra caution"
        : "Good travel conditions";


    document.getElementById(
        "airTip"
    ).textContent =

        aqi > 150
        ? "Poor air quality"
        : "Air quality looks acceptable";

}


/* ==========================================
   FAVORITES
========================================== */

document.getElementById(
    "favoriteButton"
).addEventListener(
    "click",
    () => {

        if (
            !currentWeatherData
        ) {

            return;

        }


        const location =
            currentWeatherData.location;


        let favorites =
            JSON.parse(
                localStorage.getItem(
                    "atmosFavorites"
                )
            ) || [];


        const exists =
            favorites.some(
                item =>
                    item.name ===
                    location.name
            );


        if (!exists) {

            favorites.push({

                name:
                    location.name,

                country:
                    location.country,

                latitude:
                    location.latitude,

                longitude:
                    location.longitude

            });

            localStorage.setItem(
                "atmosFavorites",
                JSON.stringify(
                    favorites
                )
            );

            document.getElementById(
                "favoriteButton"
            ).textContent =
                "❤️ Added to Favorites";

        }

    }
);


/* ==========================================
   RECENT SEARCHES
========================================== */

function saveRecentCity(location) {

    let cities =
        JSON.parse(
            localStorage.getItem(
                "atmosRecent"
            )
        ) || [];


    cities =
        cities.filter(
            city =>
                city.name !==
                location.name
        );


    cities.unshift({

        name:
            location.name,

        country:
            location.country,

        latitude:
            location.latitude,

        longitude:
            location.longitude

    });


    cities =
        cities.slice(0,6);


    localStorage.setItem(
        "atmosRecent",
        JSON.stringify(
            cities
        )
    );

}


function renderRecentCities() {

    const container =
        document.getElementById(
            "recentCities"
        );


    const section =
        document.getElementById(
            "recentSection"
        );


    const cities =
        JSON.parse(
            localStorage.getItem(
                "atmosRecent"
            )
        ) || [];


    if (!cities.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML = "";


    cities.forEach(city => {

        const button =
            document.createElement(
                "button"
            );


        button.className =
            "recent-city";


        button.textContent =
            `${city.name}, ${city.country}`;


        button.onclick = () => {

            cityInput.value =
                city.name;

            loadWeather(
                city.name
            );

        };


        container.appendChild(
            button
        );

    });

}


/* ==========================================
   HELPERS
========================================== */

function formatTime(date) {

    return date.toLocaleTimeString(
        [],
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


function formatHour(date) {

    return date.toLocaleTimeString(
        [],
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


function showLoading(show) {

    loading.classList.toggle(
        "hidden",
        !show
    );

}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );

}


function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}
