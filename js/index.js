new p5();

function generateGreeting() {
    let greetingTextElement = document.getElementById("greeting");

    let names = ["Julia", "Jooby"];
    names = ["Julia"];

    let currentHour = new Date().getHours();
    let greetings;
    if (currentHour > 4 && currentHour < 12) {
        greetings = ["Good morning", "Wake up", "Rise and shine"];
    } else if (currentHour >= 12 && currentHour < 18) {
        greetings = ["Good afternoon", "Hello there", "Lovely day"];
    } else {
        greetings = ["Good evening", "Good night", "Sweet dreams"];
    }

    let greeting = random(greetings) + ", <b>" + random(names) + "</b>.";

    greetingTextElement.innerHTML = greeting;
}

function generateDateTime() {
    let datetimeElement = document.getElementById("datetime");

    let now = new Date();

    let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateString = now.toLocaleDateString(undefined, options);

    let hours = now.getHours();
    let minutes = now.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    let timeString = hours + ':' + minutes + ' ' + ampm;

    datetimeElement.innerHTML = "It is " + timeString + " on " + dateString + ".";

    // Add a second line if it's a special day/holiday when applicable
    let specialDays = {
        "1-1": "Happy New Year!",
        "1-6": "Happy National Bean Day!",
        "1-21": "Happy Squirrel Appreciation Day!",
        "1-25": "Happy Birthday! I love you!",
        "2-9": "Happy National Poop Day!",
        "2-14": "Happy Valentine's Day!",
        "3-8": "Happy International Women's Day!",
        "3-17": "Happy St. Patrick's Day!",
        "3-20": "Happy First Day of Spring!",
        "4-1": "Happy April Fools' Day!",
        "4-5": "Happy Easter!",
        "4-22": "Happy Earth Day!",
        "5-5": "Happy Cinco de Mayo!",
        "5-16": "Happy National Sea Monkey Day!",
        "6-4": "Happy National Hug Your Cat Day!",
        "6-15": "Happy National Lobster Day!",
        "6-18": "Happy International Sushi Day!",
        "6-21": "Happy Summer Solstice!",
        "7-4": "Happy Independence Day!",
        "7-5": "Happy Anniversary! I love you!",
        "7-17": "Happy Yellow Pig Day!",
        "8-2": "Happy Dinosaurs Day!",
        "8-8": "Happy International Cat Day!",
        "8-26": "Happy National Dog Day!",
        "9-6": "Happy Labor Day!",
        "9-22": "Happy Autumnal Equinox!",
        "10-14": "Happy Columbus Day!",
        "10-23": "It's my birthday! I love you!",
        "10-31": "Happy Halloween!",
        "11-9": "Happy Go To An Art Museum Day!",
        "11-26": "Happy Thanksgiving!",
        "12-7": "Happy National Cotton Candy Day!",
        "12-21": "Happy Winter Solstice!",
        "12-25": "Merry Christmas!",
    };

    let monthDay = (now.getMonth() + 1) + "-" + now.getDate();
    if (specialDays[monthDay]) {
        datetimeElement.innerHTML += "<br>" + specialDays[monthDay];
    }

    // Schedule the next update at the start of the next minute
    let secondsTilNextMinute = 60 - now.getSeconds();
    setTimeout(generateDateTime, secondsTilNextMinute * 1000);
}

function generateWeather() {
    let weatherElement = document.getElementById("weather");

    // Use the weather.gov API to get current weather at the user's location
    let lat, lon;
    function setLatLong(position) {
        lat = position.coords.latitude;
        lon = position.coords.longitude;

        let weatherApiUrl = `https://api.weather.gov/points/${lat},${lon}`;
        fetch(weatherApiUrl)
            .then(response => response.json())
            .then(data => {
                let forecastUrl = data.properties.forecast;
                return fetch(forecastUrl);
            })
            .then(response => response.json())
            .then(forecastData => {
                console.log(forecastData);
                let currentForecast = forecastData.properties.periods[0];

                let temperature = currentForecast.temperature;
                let unit = currentForecast.temperatureUnit;
                let conditions = currentForecast.shortForecast;

                let weatherString = temperature + "°" + unit + "&nbsp&nbsp-&nbsp&nbsp" + conditions;

                weatherElement.innerHTML = weatherString;
            })
            .catch(error => {
                console.error("Error fetching weather data:", error);
                weatherElement.innerHTML = "Unable to retrieve weather data.";
            });
    }
    navigator.geolocation.getCurrentPosition(setLatLong);
    weatherElement.innerHTML = "Unable to retrieve weather data.";
}

generateGreeting();
generateDateTime();
generateWeather();