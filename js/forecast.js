/* ==========================================
   ATMOS FORECAST
========================================== */


const API = {

    geocode:
        "https://geocoding-api.open-meteo.com/v1/search",

    weather:
        "https://api.open-meteo.com/v1/forecast"

};


document.addEventListener(
    "DOMContentLoaded",
    loadForecast
);


async function loadForecast() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const city =
        params.get("city") ||
        localStorage.getItem(
            "lastAtmosCity"
        ) ||
        "Delhi";


    try {

        const location =
            await getLocation(city);


        const weather =
            await getWeather(
                location.latitude,
                location.longitude
            );


        document.getElementById(
            "forecastLocation"
        ).textContent =

            `${location.name}, ${location.country}`;


        renderForecast(
            weather
        );


        if (
            window.setWeatherScene
        ) {

            window.setWeatherScene(
                weather.current.weather_code,
                weather.current.is_day
            );

        }

    }

    catch(error) {

        console.error(error);

        document.getElementById(
            "forecastLocation"
        ).textContent =
            "Unable to load forecast.";

    }

}


async function getLocation(city) {

    const url =

        `${API.geocode}` +

        `?name=${encodeURIComponent(city)}` +

        `&count=1` +

        `&language=en` +

        `&format=json`;


    const response =
        await fetch(url);


    const data =
        await response.json();


    if (
        !data.results ||
        !data.results.length
    ) {

        throw new Error(
            "Location not found"
        );

    }


    return data.results[0];

}


async function getWeather(
    latitude,
    longitude
) {

    const url =

        `${API.weather}` +

        `?latitude=${latitude}` +

        `&longitude=${longitude}` +

        `&current=weather_code,is_day` +

        `&daily=` +

        `weather_code,` +
        `temperature_2m_max,` +
        `temperature_2m_min,` +
        `precipitation_probability_max,` +
        `uv_index_max` +

        `&timezone=auto` +

        `&forecast_days=7`;


    const response =
        await fetch(url);


    return await response.json();

}


function renderForecast(weather) {

    const table =
        document.getElementById(
            "forecastTable"
        );


    table.innerHTML = "";


    const daily =
        weather.daily;


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        const date =
            new Date(
                daily.time[i]
            );


        const tr =
            document.createElement(
                "tr"
            );


        const icon =
            weatherIcon(
                daily.weather_code[i]
            );


        const condition =
            weatherDescription(
                daily.weather_code[i]
            );


        const day =
            i === 0
            ? "Today"
            : date.toLocaleDateString(
                [],
                {
                    weekday:
                        "short"
                }
            );


        const dateText =
            date.toLocaleDateString(
                [],
                {
                    day:
                        "numeric",

                    month:
                        "short"
                }
            );


        tr.innerHTML = `

            <td>

                <div class="forecast-date">

                    ${day}

                    <small>
                        ${dateText}
                    </small>

                </div>

            </td>


            <td>

                <div class="forecast-weather">

                    <span class="forecast-weather-icon">
                        ${icon}
                    </span>

                </div>

            </td>


            <td>
                ${condition}
            </td>


            <td>

                <span class="max-temp">
                    ${Math.round(
                        daily.temperature_2m_max[i]
                    )}°
                </span>

                <span class="min-temp">
                    /
                    ${Math.round(
                        daily.temperature_2m_min[i]
                    )}°
                </span>

            </td>


            <td>

                <span class="rain-chance">

                    💧 ${
                        daily.precipitation_probability_max[i] ?? 0
                    }%

                </span>

            </td>


            <td>

                ☀️ ${
                    daily.uv_index_max[i]?.toFixed(1) ?? "--"
                }

            </td>

        `;


        table.appendChild(tr);

    }

}


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

    if ([71,73,75,77].includes(code))
        return "Snow";

    if ([80,81,82].includes(code))
        return "Rain Showers";

    if ([95,96,99].includes(code))
        return "Thunderstorm";

    return "Unknown";

}


function weatherIcon(code) {

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

    if ([71,73,75,77].includes(code))
        return "❄️";

    if ([80,81,82].includes(code))
        return "🌦️";

    if ([95,96,99].includes(code))
        return "⛈️";

    return "🌤️";

}
