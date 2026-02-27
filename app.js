// --- WeatherApp Constructor Function ---
function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');
    
    // NEW: Part 4 DOM references
    this.recentSearchesSection = document.getElementById('recent-searches-section');
    this.recentSearchesContainer = document.getElementById('recent-searches-container');
    this.clearBtn = document.getElementById('clear-history-btn');

    // NEW: Part 4 State
    this.recentSearches = [];
    this.maxRecentSearches = 5;

    this.init();
}

// --- Prototype Methods ---

// 1. Initialize Event Listeners & Load Data
WeatherApp.prototype.init = function() {
    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));
    
    this.cityInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    if (this.clearBtn) {
        this.clearBtn.addEventListener('click', this.clearHistory.bind(this));
    }

    // NEW: Load saved searches and last city on startup
    this.loadRecentSearches();
    this.loadLastCity();
};

// --- Local Storage Methods (Part 4) ---

WeatherApp.prototype.loadRecentSearches = function() {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
        this.recentSearches = JSON.parse(saved);
    }
    this.displayRecentSearches();
};

WeatherApp.prototype.saveRecentSearch = function(city) {
    // Convert to Title Case for consistency
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    
    // Check if city already exists in array, remove it if it does
    const index = this.recentSearches.indexOf(cityName);
    if (index > -1) {
        this.recentSearches.splice(index, 1);
    }
    
    // Add city to the beginning of array
    this.recentSearches.unshift(cityName);
    
    // Keep only the last 5 searches
    if (this.recentSearches.length > this.maxRecentSearches) {
        this.recentSearches.pop();
    }
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    this.displayRecentSearches();
};

WeatherApp.prototype.displayRecentSearches = function() {
    this.recentSearchesContainer.innerHTML = '';
    
    // Hide section if empty
    if (this.recentSearches.length === 0) {
        this.recentSearchesSection.style.display = 'none';
        return;
    }
    
    this.recentSearchesSection.style.display = 'block';
    
    this.recentSearches.forEach(function(city) {
        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;
        
        btn.addEventListener('click', function() {
            this.cityInput.value = city;
            this.getWeather(city);
        }.bind(this));
        
        this.recentSearchesContainer.appendChild(btn);
    }.bind(this));
};

WeatherApp.prototype.loadLastCity = function() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        this.cityInput.value = lastCity;
        this.getWeather(lastCity);
    } else {
        this.showWelcome();
    }
};

WeatherApp.prototype.clearHistory = function() {
    if (confirm('Clear all recent searches?')) {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        localStorage.removeItem('lastCity');
        this.displayRecentSearches();
        this.showWelcome();
    }
};

// --- User Input Handling ---
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

// --- Fetch Weather Data ---
WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';
    this.cityInput.disabled = true;

    const currentWeatherUrl = `${this.apiUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    
    try {
        const [currentResponse, forecastResponse] = await Promise.all([
            axios.get(currentWeatherUrl),
            this.getForecast(city)
        ]);

        this.displayWeather(currentResponse.data);
        this.displayForecast(forecastResponse);
        
        // NEW: Save search to localStorage on success
        this.saveRecentSearch(city);
        localStorage.setItem('lastCity', city);
        
    } catch (error) {
        console.error('Error:', error);
        if (error.response && error.response.status === 404) {
            this.showError('City not found. Please check spelling.');
        } else {
            this.showError('Something went wrong. Please try again later.');
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = '🔍 Search';
        this.cityInput.disabled = false;
        this.cityInput.value = '';
        this.cityInput.focus();
    }
};

WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${city}&appid=${this.apiKey}&units=metric`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error; 
    }
};

WeatherApp.prototype.processForecastData = function(data) {
    const dailyForecasts = data.list.filter(function(item) {
        return item.dt_txt.includes('12:00:00');
    });
    return dailyForecasts.slice(0, 5);
};

// --- Display UI Methods ---
WeatherApp.prototype.showWelcome = function() {
    this.weatherDisplay.innerHTML = `
        <div class="welcome-message">
            <h2>🌍 Welcome to SkyFetch!</h2>
            <p>Search for a city to get started.</p>
            <br>
            <p style="font-size: 0.9em; color: #888;">Try: London, Paris, or Tokyo</p>
        </div>
    `;
};

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
    
    this.weatherDisplay.innerHTML += forecastSection;
};

// --- Status/Helper UIs ---
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
const app = new WeatherApp('1d63390750b104f4f4d9388aa9a28aa4');