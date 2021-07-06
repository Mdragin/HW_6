var owmAPI = "788d5638d7c8e354a162d6c9747d1bdf";
var currentCity = "";
var lastCity = "";


var handleErrors = (response) => {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}

// Function to get and display the current conditions on Open Weather Maps
var getCurrentConditions = (event) => {

    let city = $('#city-search').val();
    currentCity = $('#city-search').val();
    // Set the queryURL
    let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial" + "&APPID=" + owmAPI;
    fetch(queryURL)
        .then(handleErrors)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            // Save city to local storage
            saveCity(city);
            $('#city-error').text("");

            let currentWeatherIcon = "https://openweathermap.org/img/w/" + response.weather[0].icon + ".png";

            let currentTimeUTC = response.dt;
            let currentTimeZoneOffset = response.timezone;
            let currentTimeZoneOffsetHours = currentTimeZoneOffset / 60 / 60;
            let currentMoment = moment.unix(currentTimeUTC).utc().utcOffset(currentTimeZoneOffsetHours);

            renderCities();

            getFiveDayForecast(event);

            $('#header').text(response.name);

            let currentWeatherHTML = `
            <h3>${response.name} ${currentMoment.format("(MM/DD/YY)")}<img src="${currentWeatherIcon}"></h3>
            <ul class="list-unstyled">
                <li>Temperature: ${response.main.temp}&#8457;</li>
                <li>Humidity: ${response.main.humidity}%</li>
                <li>Wind Speed: ${response.wind.speed} mph</li>
                <li id="uvIndex">UV Index:</li>
            </ul>`;

            $('#weather-current').html(currentWeatherHTML);
            // Get the latitude and longitude
            let latitude = response.coord.lat;
            let longitude = response.coord.lon;
            let uvQueryURL = "api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&APPID=" + owmAPI;

            uvQueryURL = "https://cors-anywhere.herokuapp.com/" + uvQueryURL;

            fetch(uvQueryURL)
                .then(handleErrors)
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    let uvIndex = response.value;
                    $('#uvIndex').html(`UV Index: <span id="uvVal"> ${uvIndex}</span>`);
                    if (uvIndex >= 0 && uvIndex < 3) {
                        $('#uvVal').attr("class", "uv-favorable");
                    } else if (uvIndex >= 3 && uvIndex < 8) {
                        $('#uvVal').attr("class", "uv-moderate");
                    } else if (uvIndex >= 8) {
                        $('#uvVal').attr("class", "uv-severe");
                    }
                });
        })
}

// Function to obtain the five day forecast
var getFiveDayForecast = (event) => {
    let city = $('#city-search').val();
    // Set up URL for API
    let queryURL = "https://api.openweathermap.org/data/2.5/forecast?q=" + city + "&units=imperial" + "&APPID=" + owmAPI;
    // API
    fetch(queryURL)
        .then(handleErrors)
        .then((response) => {
            return response.json();
        })
        .then((response) => {

            let fiveDayForecastHTML = `
        <h2>5-Day Forecast:</h2>
        <div id="fiveDayForecastUl" class="d-inline-flex flex-wrap ">`;

            for (let i = 0; i < response.list.length; i++) {
                let dayData = response.list[i];
                let dayTimeUTC = dayData.dt;
                let timeZoneOffset = response.city.timezone;
                let timeZoneOffsetHours = timeZoneOffset / 60 / 60;
                let thisMoment = moment.unix(dayTimeUTC).utc().utcOffset(timeZoneOffsetHours);
                let iconURL = "https://openweathermap.org/img/w/" + dayData.weather[0].icon + ".png";

                if (thisMoment.format("HH:mm:ss") === "11:00:00" || thisMoment.format("HH:mm:ss") === "12:00:00" || thisMoment.format("HH:mm:ss") === "13:00:00") {
                    fiveDayForecastHTML += `
                <div class="weather-card card m-2 p0">
                    <ul class="list-unstyled p-3">
                        <li>${thisMoment.format("MM/DD/YY")}</li>
                        <li class="weather-icon"><img src="${iconURL}"></li>
                        <li>Temp: ${dayData.main.temp}&#8457;</li>
                        <br>
                        <li>Humidity: ${dayData.main.humidity}%</li>
                    </ul>
                </div>`;
                }
            }

            fiveDayForecastHTML += `</div>`;
            // Append the five-day forecast
            $('#five-day-forecast').html(fiveDayForecastHTML);
        })
}

// Function to save the city
var saveCity = (newCity) => {
    let cityExists = false;

    for (let i = 0; i < localStorage.length; i++) {
        if (localStorage["cities" + i] === newCity) {
            cityExists = true;
            break;
        }
    }
    // Save to localStorage
    if (cityExists === false) {
        localStorage.setItem('cities' + localStorage.length, newCity);
    }
}

// Render the list cities
var renderCities = () => {
    $('#results-city').empty();

    if (localStorage.length === 0) {
        if (lastCity) {
            $('#city-search').attr("value", lastCity);
        } else {
            $('#city-search').attr("value", "Austin");
        }
    } else {
        // Build key
        let lastCityKey = "cities" + (localStorage.length - 1);
        lastCity = localStorage.getItem(lastCityKey);
        // Set search
        $('#city-search').attr("value", lastCity);
        // Append stored cities
        for (let i = 0; i < localStorage.length; i++) {
            let city = localStorage.getItem("cities" + i);
            let cityEl;
            // Set to lastCity
            if (currentCity === "") {
                currentCity = lastCity;
            }
            // Set button class to active
            if (city === currentCity) {
                cityEl = `<button type="button" class="list-group-item list-group-item-action active">${city}</button></li>`;
            } else {
                cityEl = `<button type="button" class="list-group-item list-group-item-action">${city}</button></li>`;
            }
            // Append city
            $('#results-city').prepend(cityEl);
        }
        // Add a "clear" button
        if (localStorage.length > 0) {
            $('#storage-clear').html($('<a id="clear-storage" href="#">clear</a>'));
        } else {
            $('#storage-clear').html('');
        }
    }

}

// New city search
$('#search-button').on("click", (event) => {
    event.preventDefault();
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// Old searched cities
$('#results-city').on("click", (event) => {
    event.preventDefault();
    $('#search-city').val(event.target.textContent);
    currentCity = $('#search-city').val();
    getCurrentConditions(event);
});

// Clear old searched cities
$("#storage-clear").on("click", (event) => {
    localStorage.clear();
    renderCities();
});

// Render cities
renderCities();

// current conditions 
getCurrentConditions();