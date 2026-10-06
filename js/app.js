const form =
    document.getElementById("weatherForm");

const cityInput =
    document.getElementById("cityInput");

const weatherCard =
    document.getElementById("weatherCard");

const loading =
    document.getElementById("loading");

const error =
    document.getElementById("error");

let chart;


/* SEARCH */

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();

        const city =
            cityInput.value.trim();

        if (!city) return;

        await searchWeather(city);

    }
);


/* WEATHER SEARCH */

async function searchWeather(city) {

    loading.classList.remove("hidden");

    error.classList.add("hidden");

    weatherCard.classList.add("hidden");


    try {

        /* STEP 1:
           Find city coordinates
        */

        const geoResponse =
            await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
            );


        const geoData =
            await geoResponse.json();


        if (
            !geoData.results ||
            geoData.results.length === 0
        ) {

            throw new Error(
                "City not found."
            );

        }


        const location =
            geoData.results[0];


        /* STEP 2:
           Get weather
        */

        const weatherResponse =
            await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m&forecast_days=5&timezone=auto`
            );


        const weather =
            await weatherResponse.json();


        displayWeather(
            location,
            weather
        );


        saveRecentCity(
            location.name
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


/* DISPLAY */

function displayWeather(
    location,
    weather
) {

    weatherCard.classList.remove(
        "hidden"
    );


    document.getElementById(
        "cityName"
    ).textContent =
        `${location.name}, ${location.country}`;


    document.getElementById(
        "temperature"
    ).textContent =
        Math.round(
            weather.current.temperature_2m
        );


    document.getElementById(
        "feelsLike"
    ).textContent =
        `${Math.round(
            weather.current.apparent_temperature
        )}°C`;


    document.getElementById(
        "humidity"
    ).textContent =
        `${weather.current.relative_humidity_2m}%`;


    document.getElementById(
        "wind"
    ).textContent =
        `${weather.current.wind_speed_10m} km/h`;


    document.getElementById(
        "description"
    ).textContent =
        getWeatherDescription(
            weather.current.weather_code
        );


    createChart(
        weather
    );
}


/* WEATHER DESCRIPTION */

function getWeatherDescription(code) {

    if (code === 0)
        return "Clear sky ☀️";

    if (
        code === 1 ||
        code === 2 ||
        code === 3
    )
        return "Partly cloudy ☁️";

    if (
        code >= 51 &&
        code <= 67
    )
        return "Rainy 🌧️";

    if (
        code >= 71 &&
        code <= 77
    )
        return "Snowy ❄️";

    if (
        code >= 80 &&
        code <= 82
    )
        return "Rain showers 🌦️";

    if (
        code >= 95
    )
        return "Thunderstorm ⛈️";

    return "Weather available";
}


/* CHART */

function createChart(weather) {

    const ctx =
        document
            .getElementById(
                "temperatureChart"
            )
            .getContext("2d");


    if (chart) {

        chart.destroy();

    }


    const labels =
        weather.hourly.time
            .slice(0, 24)
            .map(time =>
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


    chart =
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
                                "rgba(103,232,249,.15)",

                            fill: true,

                            tension: .4

                        }

                    ]

                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {

                            labels: {

                                color:
                                    "white"

                            }

                        }

                    },

                    scales: {

                        x: {

                            ticks: {

                                color:
                                    "#cbd5e1"

                            }

                        },

                        y: {

                            ticks: {

                                color:
                                    "#cbd5e1"

                            }

                        }

                    }

                }

            }
        );
}


/* RECENT SEARCH */

function saveRecentCity(city) {

    let cities =
        JSON.parse(
            localStorage.getItem(
                "recentCities"
            )
        ) || [];


    cities =
        cities.filter(
            item => item !== city
        );


    cities.unshift(city);


    cities =
        cities.slice(0, 5);


    localStorage.setItem(
        "recentCities",
        JSON.stringify(cities)
    );
}


/* FAVORITES */

document
    .getElementById(
        "favoriteButton"
    )
    .addEventListener(
        "click",
        () => {

            const city =
                document
                    .getElementById(
                        "cityName"
                    )
                    .textContent
                    .split(",")[0];


            let favorites =
                JSON.parse(
                    localStorage.getItem(
                        "favorites"
                    )
                ) || [];


            if (
                !favorites.includes(city)
            ) {

                favorites.push(city);

                localStorage.setItem(
                    "favorites",
                    JSON.stringify(
                        favorites
                    )
                );

                alert(
                    `${city} added to favorites ❤️`
                );

            } else {

                alert(
                    "Already in favorites ❤️"
                );

            }

        }
    );
