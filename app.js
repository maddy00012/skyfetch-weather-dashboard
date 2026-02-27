// --- WeatherApp Constructor Function ---
function WeatherApp(apiKey) {
    // Store configurations
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // Store DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    // Initialize event listeners and welcome UI
    this.init();
}

// --- Prototype Methods ---

// 1. Initialize Event Listeners
WeatherApp.prototype.init = function() {
    // Bind 'this' so methods know which instance they belong to
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    
    this.cityInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    this.showWelcome();
};

// 2. Welcome UI
WeatherApp.prototype.showWelcome = function() {
    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h2>👋 Welcome!</h2>
            <p>Enter a city name to get current weather and a 5-day forecast.</p>
        </div>
    `;
};

// 3. User Input Handling
WeatherApp.prototype.handleSearch = function() {
    const city = this.cityInput.value.trim();

    if (!city) {
        this.showError('Please enter a city name.');
        return;
    }
    if (city.length < 2) {
        this.showError('City name is too short.');
        return;
    }

    this.getWeather(city);
};

// 4. Fetch Weather Data (Using Promise.all)
WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    
    // Disable inputs
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';
    this.cityInput.disabled = true;

    const currentWeatherUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    
    try {
        // Fetch both current weather and forecast simultaneously
        const [currentResponse, forecastResponse] = await Promise.all([
            axios.get(currentWeatherUrl),
            this.getForecast(city)
        ]);

        // Display current weather first
        this.displayWeather(currentResponse.data);
        
        // Append 5-day forecast
        this.displayForecast(forecastResponse);
        
    } catch (error) {
        console.error('Error:', error);
        if (error.response && error.response.status === 404) {
            this.showError('City not found. Please check spelling.');
        } else {
            this.showError('Something went wrong. Please try again later.');
        }
    } finally {
        // Reset inputs
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
        this.cityInput.disabled = false;
        this.cityInput.value = '';
        this.cityInput.focus();
    }
};

// 5. Fetch Forecast Data specifically
WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error; // Throw to the parent Promise.all catch block
    }
};

// 6. Process Forecast Data (Extract 1 forecast per day at noon)
WeatherApp.prototype.processForecastData = function(data) {
    const dailyForecasts = data.list.filter(function(item) {
        return item.dt_txt.includes('12:00:00');
    });
    
    return dailyForecasts.slice(0, 5); // Return only the next 5 days
};

// 7. Display Current Weather UI
WeatherApp.prototype.displayWeather = function(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    this.weatherDisplay.innerHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
};

// 8. Display Forecast UI
WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);
    
    const forecastHTML = dailyForecasts.map(function(day) {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
        
        return `
            <div class="forecast-card">
                <h4 class="forecast-day">${dayName}</h4>
                <img src="${iconUrl}" alt="${description}" class="weather-icon">
                <div class="forecast-temp">${temp}°C</div>
                <p class="forecast-desc">${description}</p>
            </div>
        `;
    }).join('');
    
    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;
    
    // Crucial: use += so we don't overwrite the current weather we just displayed!
    this.weatherDisplay.innerHTML += forecastSection;
};

// 9. Status/Helper UIs
WeatherApp.prototype.showLoading = function() {
    this.weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading">Fetching weather data...</p>
        </div>
    `;
};

WeatherApp.prototype.showError = function(message) {
    this.weatherDisplay.innerHTML = `
        <div class="error-message">
            <span>❌</span>
            <p>${message}</p>
        </div>
    `;
};

// --- Instantiate the App ---
// Create a single instance of WeatherApp (Replace with your actual API key)
const app = new WeatherApp('1d63390750b104f4f4d9388aa9a28aa4');