// Weather API Project - Final Submission
const API_KEY = '1d63390750b104f4f4d9388aa9a28aa4'; 
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');

// --- Helper Functions ---

// 1. Show Loading State
function showLoading() {
    weatherDisplay.innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p class="loading">Fetching weather data...</p>
        </div>
    `;
}

// 2. Show Error Messages
function showError(message) {
    weatherDisplay.innerHTML = `
        <div class="error-message">
            <span>❌</span>
            <p>${message}</p>
        </div>
    `;
}

// --- Main Weather Fetch Logic ---

// Refactored to Async/Await
async function getWeather(city) {
    showLoading();
    
    // Disable search UI during the request
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    cityInput.disabled = true;

    const url = `${API_URL}?q=${city}&appid=${API_KEY}&units=metric`;
    
    try {
        const response = await axios.get(url);
        console.log('Weather Data:', response.data);
        displayWeather(response.data);
    } catch (error) {
        console.error('Error fetching weather:', error);
        
        // Handle specific 404 errors vs general errors
        if (error.response && error.response.status === 404) {
            showError('City not found. Please check the spelling and try again.');
        } else {
            showError('Something went wrong. Please try again later.');
        }
    } finally {
        // Always reset UI state after success OR failure
        searchBtn.disabled = false;
        searchBtn.textContent = '🔍 Search';
        cityInput.disabled = false;
        cityInput.value = ''; // Clear input field
        cityInput.focus(); // Focus back on input
    }
}

// --- Display Logic ---
function displayWeather(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    
    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;
    
    weatherDisplay.innerHTML = weatherHTML;
}

// --- Event Listeners & Interactions ---

// Centralized search execution with validation
function handleSearch() {
    const city = cityInput.value.trim();

    // Validations
    if (!city) {
        showError('Please enter a city name.');
        return;
    }
    if (city.length < 2) {
        showError('City name is too short.');
        return;
    }

    getWeather(city);
}

// Button Click
searchBtn.addEventListener('click', handleSearch);

// Enter Key Press
cityInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
});

// --- Initial Page Load ---
// Replaced hardcoded getWeathers with a nice welcome prompt!
weatherDisplay.innerHTML = `
    <div class="welcome-message">
        <p>👋 Enter a city name to get started!</p>
    </div>
`;